"""Read-only source inventory. Never emit config values, credentials or memory text."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess


def command(args):
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=12)
        return result.stdout.strip()
    except (OSError, subprocess.TimeoutExpired):
        return ""


def inspect_tree(root, limit=20000):
    summary = {"path": str(root), "exists": root.is_dir(), "files": 0,
               "bytes": 0, "symlinks": 0, "sqlite_files": 0,
               "jsonl_files": 0, "unreadable": 0, "truncated": False}
    if not summary["exists"]:
        return summary

    def on_error(_):
        summary["unreadable"] += 1

    for directory, dirs, files in os.walk(root, followlinks=False, onerror=on_error):
        summary["symlinks"] += sum(Path(directory, name).is_symlink() for name in dirs)
        for name in files:
            path = Path(directory, name)
            if path.is_symlink():
                summary["symlinks"] += 1
                continue
            try:
                summary["bytes"] += path.stat().st_size
                summary["files"] += 1
                summary["sqlite_files"] += int(path.suffix in (".sqlite", ".db"))
                summary["jsonl_files"] += int(path.suffix == ".jsonl")
            except OSError:
                summary["unreadable"] += 1
            if summary["files"] >= limit:
                summary["truncated"] = True
                return summary
    return summary


def workspace_summary(root):
    result = inspect_tree(root)
    # Hashes help compare a later restored copy without exposing its contents.
    result["identity_files"] = {}
    for name in ("MEMORY.md", "USER.md", "SOUL.md", "IDENTITY.md", "AGENTS.md", "TOOLS.md"):
        path = root / name
        if path.is_file() and not path.is_symlink():
            try:
                if path.stat().st_size > 4 * 1024 * 1024:
                    result["identity_files"][name] = {"present": True, "hash_skipped": "size"}
                else:
                    result["identity_files"][name] = {"present": True, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
            except OSError:
                result["unreadable"] += 1
    result["daily_memory"] = inspect_tree(root / "memory")
    result["skills"] = inspect_tree(root / "skills")
    return result


def main():
    home = Path.home()
    service = "openclaw-gateway.service"
    raw_env = command(["systemctl", "--user", "show", service, "-p", "Environment", "--value"])
    try:
        environment = dict(item.split("=", 1) for item in shlex.split(raw_env) if "=" in item)
    except ValueError:
        environment = {}
    start = command(["systemctl", "--user", "show", service, "-p", "ExecStart", "--value"])
    profile = re.search(r"--profile(?:=|\s+)([a-zA-Z0-9_-]+)", start)
    default_state = home / (".openclaw-" + profile.group(1) if profile else ".openclaw")
    state = Path(environment.get("OPENCLAW_STATE_DIR", str(default_state))).expanduser()
    config_path = Path(environment.get("OPENCLAW_CONFIG_PATH", str(state / "openclaw.json"))).expanduser()
    config = {}
    config_status = "missing"
    if config_path.is_file():
        try:
            config = json.loads(config_path.read_text(encoding="utf-8"))
            if not isinstance(config, dict):
                raise ValueError("not an object")
            config_status = "parsed"
        except (OSError, ValueError):
            config = {}
            config_status = "unreadable-or-not-json"
    workspaces = {str(state / "workspace")}
    agents = config.get("agents", {})
    if isinstance(agents, dict):
        defaults = agents.get("defaults", {})
        if isinstance(defaults, dict) and isinstance(defaults.get("workspace"), str):
            workspaces.add(defaults["workspace"])
        for agent in agents.get("list", []) if isinstance(agents.get("list"), list) else []:
            if isinstance(agent, dict) and isinstance(agent.get("workspace"), str):
                workspaces.add(agent["workspace"])
    cwd = command(["systemctl", "--user", "show", service, "-p", "WorkingDirectory", "--value"])
    roots = []
    for value in sorted(workspaces):
        root = Path(value).expanduser()
        roots.append(root if root.is_absolute() else Path(cwd or home) / root)
    cli = shutil.which("openclaw")
    if not cli:
        cli = next((str(p) for p in [home / ".npm-global/bin/openclaw", home / ".local/bin/openclaw"] if p.is_file()), None)
    version = command([cli, "--version"]) if cli else "unavailable-in-ssh-path"
    print(json.dumps({
        "schema": 1, "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "read_only": True, "version": re.sub(r"\x1b\[[0-9;]*m", "", version)[:120],
        "service": command(["systemctl", "--user", "is-active", service]) or "unknown",
        "state_path_basis": "service-environment" if "OPENCLAW_STATE_DIR" in environment else "profile-or-default-candidate",
        "state": inspect_tree(state), "config_path": str(config_path), "config_status": config_status,
        "workspaces": [workspace_summary(root) for root in roots],
        "limitations": ["No backup created", "No database opened", "Symlink targets not inventoried", "Confirm custom roots, JSON5 config and additional profiles before backup"],
    }, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
