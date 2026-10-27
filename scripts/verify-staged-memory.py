import argparse
import hashlib
import json
import os
import tarfile
from pathlib import Path, PurePosixPath

IDENTITY = {"MEMORY.md", "SOUL.md", "USER.md", "AGENTS.md", "IDENTITY.md"}

def native_path(value):
    text = os.path.abspath(value)
    if os.name == "nt" and not text.startswith("\\\\?\\"):
        text = "\\\\?\\" + text
    return Path(text)

def digest(stream):
    result = hashlib.sha256()
    for data in iter(lambda: stream.read(1024 * 1024), b""):
        result.update(data)
    return result.hexdigest()

def verify(folder):
    folder = native_path(folder)
    plan = json.loads((folder / "staging-plan.json").read_text(encoding="utf-8-sig"))
    restore = json.loads((folder / "restore-result.json").read_text(encoding="utf-8-sig"))
    if not restore.get("ok") or not restore.get("sqliteInventoryVerified"):
        raise RuntimeError("Restoration is not verified")
    archive_path = native_path(plan["archive"])
    with archive_path.open("rb") as stream:
        if digest(stream) != plan["sha256"]:
            raise RuntimeError("The source archive hash changed")
    identities = {}
    matched = expected = daily = daily_expected = 0
    failures = []
    with tarfile.open(archive_path, "r:gz") as archive:
        for member in archive.getmembers():
            if not member.isfile() or "/workspace/" not in member.name:
                continue
            parts = PurePosixPath(member.name).parts
            if ".." in parts or PurePosixPath(member.name).is_absolute() or "\\" in member.name:
                raise RuntimeError("Unsafe member")
            target = native_path(Path(plan["target"]).joinpath(*parts))
            if any(parent.is_symlink() for parent in [target, *target.parents]):
                raise RuntimeError("Unexpected link")
            expected += 1
            relative = member.name.split("/workspace/", 1)[1]
            is_memory = relative.startswith("memory/")
            daily_expected += int(is_memory)
            source_hash = digest(archive.extractfile(member))
            if not target.is_file():
                failures.append({"path": relative, "reason": "missing"})
                continue
            with target.open("rb") as stream:
                target_hash = digest(stream)
            if source_hash != target_hash:
                failures.append({"path": relative, "reason": "hash"})
                continue
            matched += 1
            daily += int(is_memory)
            if relative in IDENTITY:
                identities[relative] = {"sha256": source_hash, "matches": True}
    result = {"schema": 1, "restoredInStaging": True, "activated": False,
              "workspaceFilesExpected": expected, "workspaceFilesMatched": matched,
              "dailyMemoryFilesExpected": daily_expected, "dailyMemoryFilesMatched": daily,
              "identityFilesMatched": identities, "sqliteInventoryVerified": True,
              "sourceRuntimeVersion": restore.get("runtimeVersion"), "failures": failures}
    (folder / "validation.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    if failures or len(identities) != len(IDENTITY):
        raise RuntimeError("Incomplete workspace validation")
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("folder")
    result = verify(parser.parse_args().folder)
    print(json.dumps({**result, "identityFilesMatched": len(result["identityFilesMatched"])}))
