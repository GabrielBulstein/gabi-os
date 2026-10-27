import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

source = Path(__file__).resolve().parents[2] / "scripts" / "inventory-openclaw.py"
spec = importlib.util.spec_from_file_location("inventory", source)
inventory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inventory)


class InventoryTests(unittest.TestCase):
    def test_report_counts_memory_and_sessions_without_disclosing_text_or_secrets(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "MEMORY.md").write_text("PRIVATE_MEMORY_EXAMPLE", encoding="utf-8")
            (root / "openclaw.json").write_text('{"token":"PRIVATE_TOKEN_EXAMPLE"}', encoding="utf-8")
            (root / "memory").mkdir()
            (root / "memory" / "day.md").write_text("daily fact", encoding="utf-8")
            (root / "conversation.jsonl").write_text('{"message":"private"}', encoding="utf-8")
            report = inventory.workspace_summary(root)
            serialized = json.dumps(report)
            self.assertEqual(report["files"], 4)
            self.assertEqual(report["jsonl_files"], 1)
            self.assertEqual(report["daily_memory"]["files"], 1)
            self.assertEqual(len(report["identity_files"]["MEMORY.md"]["sha256"]), 64)
            self.assertNotIn("PRIVATE_MEMORY_EXAMPLE", serialized)
            self.assertNotIn("PRIVATE_TOKEN_EXAMPLE", serialized)
            self.assertEqual((root / "MEMORY.md").read_text(), "PRIVATE_MEMORY_EXAMPLE")

    def test_scan_limit_and_missing_roots_are_explicit(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for index in range(4):
                (root / str(index)).write_text("data")
            report = inventory.inspect_tree(root, limit=2)
            self.assertTrue(report["truncated"])
            self.assertEqual(report["files"], 2)
            self.assertFalse(inventory.inspect_tree(root / "missing")["exists"])


if __name__ == "__main__":
    unittest.main()
