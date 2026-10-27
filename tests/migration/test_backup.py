import importlib.util
import json
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch

source = Path(__file__).resolve().parents[2] / "scripts" / "backup-openclaw.py"
spec = importlib.util.spec_from_file_location("backup_launcher", source)
launcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)


class BackupTests(unittest.TestCase):
    def scenario(self, failure=None):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory) / "job"
            folder.mkdir()
            (folder / "plan.json").write_text(json.dumps({"cli": "fake-openclaw", "environment": {}}))
            original = Path(directory) / "original-memory.md"
            original.write_text("PRIVATE_MEMORY_DO_NOT_CHANGE")
            calls = []
            active = True

            def run(args, **kwargs):
                nonlocal active
                calls.append(args)
                if args[:3] == ["systemctl", "--user", "is-active"]:
                    return types.SimpleNamespace(returncode=0 if active else 3, stdout="active" if active else "inactive")
                if args[:3] == ["systemctl", "--user", "stop"]:
                    active = False
                elif args[:3] == ["systemctl", "--user", "start"]:
                    active = True
                elif "--dry-run" in args and failure == "preflight":
                    return types.SimpleNamespace(returncode=1)
                elif "--output" in args:
                    if failure == "create":
                        return types.SimpleNamespace(returncode=1)
                    (folder / "gabito-full.tar.gz").write_bytes(b"archive-fixture")
                elif "verify" in args and failure == "verify":
                    return types.SimpleNamespace(returncode=1)
                return types.SimpleNamespace(returncode=0)

            namespace = {"__name__": "backup_job_test"}
            shim = types.SimpleNamespace(flock=lambda *args: None, LOCK_EX=1, LOCK_NB=2)
            with patch.dict("sys.modules", {"fcntl": shim}):
                exec(compile(launcher.JOB, "backup-job", "exec"), namespace)
            with patch.object(namespace["subprocess"], "run", side_effect=run):
                result = namespace["run_job"](folder)
            self.assertEqual(original.read_text(), "PRIVATE_MEMORY_DO_NOT_CHANGE")
            self.assertNotIn("PRIVATE_MEMORY_DO_NOT_CHANGE", json.dumps(result))
            self.assertEqual(json.loads((folder / "result.json").read_text()), result)
            return result, calls, (folder / "restart-required").exists()

    def test_success_requires_verified_archive_and_restarted_source(self):
        result, calls, marker = self.scenario()
        self.assertTrue(result["success"])
        self.assertEqual(len(result["sha256"]), 64)
        self.assertTrue(marker)
        start = next(i for i, call in enumerate(calls) if call[:3] == ["systemctl", "--user", "start"])
        verify = next(i for i, call in enumerate(calls) if "verify" in call)
        self.assertLess(start, verify)

    def test_creation_failure_still_restarts_source(self):
        result, calls, marker = self.scenario("create")
        self.assertFalse(result["success"])
        self.assertEqual(result["error"], "backup-create-failed")
        self.assertEqual(result["service_after"], "active")
        self.assertTrue(marker)

    def test_preflight_failure_never_stops_source_or_arms_recovery(self):
        result, calls, marker = self.scenario("preflight")
        self.assertFalse(result["verified"])
        self.assertFalse(marker)
        self.assertFalse(any(call[:3] == ["systemctl", "--user", "stop"] for call in calls))

    def test_verification_failure_is_not_reported_as_success(self):
        result, calls, marker = self.scenario("verify")
        self.assertFalse(result["success"])
        self.assertEqual(result["service_after"], "active")
        self.assertEqual(result["error"], "backup-verification-failed")


if __name__ == "__main__":
    unittest.main()
