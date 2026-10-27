"""Start a private, one-shot backup job on the source Linux host. No model calls."""
import base64
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
import uuid

JOB = r'''
import fcntl
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

SERVICE = "openclaw-gateway.service"

def run_job(folder):
    folder = Path(folder)
    plan = json.loads((folder / "plan.json").read_text())
    env = dict(os.environ, **plan["environment"])
    result = {"schema": 1, "kind": "source-backup", "verified": False,
              "service_after": "unknown", "phase": "preflight", "archive": str(folder / "gabito-full.tar.gz"),
              "plaintext_private_archive": True, "restored": False}
    log = open(folder / "private-job.log", "ab", buffering=0)
    lock = open(folder.parent / "backup.lock", "a")
    restart_required = False

    def run(args, timeout=60):
        return subprocess.run(args, env=env, stdout=log, stderr=log, timeout=timeout).returncode

    def active():
        return subprocess.run(["systemctl", "--user", "is-active", SERVICE],
                              capture_output=True, text=True, timeout=15).stdout.strip()

    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        # Check supported flags and config ownership before interrupting the service.
        if active() != "active":
            raise RuntimeError("source-not-active")
        if run([plan["cli"], "backup", "create", "--dry-run", "--json"], 120) != 0:
            raise RuntimeError("backup-preflight-failed")
        (folder / "restart-required").write_text("Restart only the service paused by this backup job.\n")
        restart_required = True
        result["phase"] = "stopping-source"
        if run(["systemctl", "--user", "stop", SERVICE], 60) != 0 or active() == "active":
            raise RuntimeError("source-stop-failed")
        result["phase"] = "creating-archive"
        try:
            if run([plan["cli"], "backup", "create", "--output", result["archive"], "--json"], 1200) != 0:
                raise RuntimeError("backup-create-failed")
        finally:
            # Restore operation before lengthy archive verification.
            run(["systemctl", "--user", "start", SERVICE], 60)
        result["phase"] = "verifying-archive"
        if run([plan["cli"], "backup", "verify", result["archive"], "--json"], 600) != 0:
            raise RuntimeError("backup-verification-failed")
        archive = Path(result["archive"])
        if not archive.is_file() or archive.is_symlink() or archive.stat().st_size == 0:
            raise RuntimeError("missing-archive")
        archive.chmod(0o600)
        digest = hashlib.sha256()
        with archive.open("rb") as source:
            for chunk in iter(lambda: source.read(1024 * 1024), b""):
                digest.update(chunk)
        result.update(verified=True, bytes=archive.stat().st_size, sha256=digest.hexdigest(), phase="complete")
    except Exception as error:
        # Controlled codes only; do not export private CLI logs or config values.
        allowed = {"source-not-active", "backup-preflight-failed", "source-stop-failed",
                   "backup-create-failed", "backup-verification-failed", "missing-archive"}
        result["error"] = str(error) if str(error) in allowed else type(error).__name__
    finally:
        if restart_required:
            try:
                if active() != "active":
                    run(["systemctl", "--user", "start", SERVICE], 60)
            except Exception:
                result["restart_error"] = True
        try:
            result["service_after"] = active()
        except Exception:
            result["service_after"] = "unknown"
        result["success"] = result["verified"] and result["service_after"] == "active"
        temporary = folder / "result.pending.json"
        temporary.write_text(json.dumps(result, indent=2))
        temporary.replace(folder / "result.json")
        log.close()
        lock.close()
    return result

if __name__ == "__main__":
    os.umask(0o077)
    if sys.argv[1] == "--recover":
        if (Path(sys.argv[2]) / "restart-required").is_file():
            subprocess.run(["systemctl", "--user", "start", SERVICE], timeout=90, check=True)
    else:
        run_job(sys.argv[1])
'''


def capture(args, timeout=20):
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        raise RuntimeError("preflight-command-failed")
    return result.stdout.strip()


def main():
    os.umask(0o077)
    home = Path.home().resolve()
    service = "openclaw-gateway.service"
    if capture(["systemctl", "--user", "is-active", service]) != "active":
        raise RuntimeError("source-must-be-active")
    pid = int(capture(["systemctl", "--user", "show", service, "-p", "MainPID", "--value"]))
    process_env = dict(entry.split("=", 1) for entry in Path(f"/proc/{pid}/environ").read_text().split("\0") if "=" in entry)
    args = Path(f"/proc/{pid}/cmdline").read_bytes().split(b"\0")
    if any(arg == b"--profile" or arg.startswith(b"--profile=") for arg in args) or process_env.get("OPENCLAW_PROFILE"):
        raise RuntimeError("custom-profile-needs-review")
    expected = home / ".openclaw"
    state = Path(process_env.get("OPENCLAW_STATE_DIR", str(expected))).expanduser().resolve()
    config = Path(process_env.get("OPENCLAW_CONFIG_PATH", str(state / "openclaw.json"))).expanduser().resolve()
    if state != expected.resolve() or config != (state / "openclaw.json").resolve():
        raise RuntimeError("source-paths-differ-from-inventory")
    if not config.is_file():
        raise RuntimeError("source-config-missing")
    search_path = process_env.get("PATH", os.environ.get("PATH", ""))
    cli = shutil.which("openclaw", path=search_path)
    if not cli:
        cli = next((str(p) for p in [home / ".npm-global/bin/openclaw", home / ".local/bin/openclaw"] if p.is_file()), None)
    if not cli:
        raise RuntimeError("openclaw-not-found")
    # No automatic upgrades or config repair on the source machine.
    env = dict(os.environ, PATH=search_path, OPENCLAW_STATE_DIR=str(state), OPENCLAW_CONFIG_PATH=str(config))
    for command in ([cli, "backup", "create", "--help"], [cli, "backup", "verify", "--help"]):
        help_result = subprocess.run(command, env=env, capture_output=True, text=True, timeout=40)
        if help_result.returncode or "backup" not in help_result.stdout.lower():
            raise RuntimeError("installed-backup-command-unavailable")
    parent = home / "Backups" / "GabiOS"
    if parent.is_symlink() or (home / "Backups").is_symlink():
        raise RuntimeError("backup-root-symlink-needs-review")
    parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    parent.chmod(0o700)
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + uuid.uuid4().hex[:8]
    folder = parent / stamp
    folder.mkdir(mode=0o700)
    if shutil.disk_usage(folder).free < 5 * 1024 * 1024 * 1024:
        raise RuntimeError("less-than-5GB-free-on-source")
    (folder / "job.py").write_text(JOB, encoding="utf-8")
    (folder / "plan.json").write_text(json.dumps({"cli": cli, "environment": {
        "PATH": search_path, "OPENCLAW_STATE_DIR": str(state), "OPENCLAW_CONFIG_PATH": str(config)}}), encoding="utf-8")
    unit = "gabi-os-backup-" + stamp.lower()
    systemctl = shutil.which("systemctl")
    if not systemctl:
        raise RuntimeError("systemctl-unavailable")
    subprocess.run(["systemd-run", "--user", "--collect", "--unit=" + unit,
                    "--property=Type=exec", "--property=UMask=0077", "--property=RuntimeMaxSec=2100",
                    "--property=ExecStopPost=/usr/bin/python3 -B " + str(folder / "job.py") + " --recover " + str(folder),
                    "/usr/bin/python3", "-B", str(folder / "job.py"), str(folder)],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30)
    print("Trabajo iniciado. Si se corta SSH, el respaldo sigue en la Philco y systemd intenta reiniciar Gabito.", file=__import__("sys").stderr, flush=True)
    for _ in range(720):
        result_file = folder / "result.json"
        if result_file.exists():
            result = json.loads(result_file.read_text())
            result.update(remote_folder=str(folder), unit=unit)
            result["ssh_service"] = capture(["systemctl", "is-active", "ssh"])
            print(json.dumps(result))
            return
        time.sleep(3)
    print(json.dumps({"schema": 1, "kind": "source-backup", "success": False, "verified": False,
                      "error": "result-pending-check-remote-job", "remote_folder": str(folder), "unit": unit}))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Avoid exposing command output that could contain private settings.
        allowed = {"source-must-be-active", "custom-profile-needs-review", "source-paths-differ-from-inventory",
                   "source-config-missing", "openclaw-not-found", "installed-backup-command-unavailable",
                   "backup-root-symlink-needs-review", "less-than-5GB-free-on-source", "systemctl-unavailable"}
        print(json.dumps({"schema": 1, "kind": "source-backup", "success": False, "verified": False,
                          "error": str(error) if str(error) in allowed else type(error).__name__}))
