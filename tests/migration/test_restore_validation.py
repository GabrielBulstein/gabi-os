import importlib.util
import io
import json
from pathlib import Path
import tempfile
import tarfile
import unittest

source=Path(__file__).resolve().parents[2]/"scripts"/"verify-staged-memory.py"
spec=importlib.util.spec_from_file_location("staged_memory",source)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class StagedMemoryTests(unittest.TestCase):
    def scenario(self,broken=False):
        temporary=module.native_path(tempfile.gettempdir())
        with tempfile.TemporaryDirectory(dir=str(temporary),prefix="gabi-restore-test-") as directory:
            folder=Path(directory)
            target=folder/"restored"
            files={name:b"fixture identity" for name in module.IDENTITY}
            files.update({"memory/day.txt":b"daily text","memory/day.md":b"daily markdown",
                          "media/inbound/"+("a"*100)+"/"+("b"*100)+".ogg":b"fixture attachment"})
            archive_path=folder/"backup.tar.gz"
            with tarfile.open(archive_path,"w:gz") as archive:
                for name,data in files.items():
                    relative="backup/payload/posix/home/test/.openclaw/workspace/"+name
                    info=tarfile.TarInfo(relative);info.size=len(data)
                    archive.addfile(info,io.BytesIO(data))
                    output=module.native_path(target/relative)
                    output.parent.mkdir(parents=True,exist_ok=True)
                    output.write_bytes(data)
            with archive_path.open("rb") as stream:sha=module.digest(stream)
            (folder/"staging-plan.json").write_text(json.dumps({"archive":str(archive_path),"target":str(target),"sha256":sha}))
            (folder/"restore-result.json").write_text(json.dumps({"ok":True,"sqliteInventoryVerified":True,"runtimeVersion":"fixture"}))
            if broken:
                module.native_path(target/"backup/payload/posix/home/test/.openclaw/workspace/MEMORY.md").write_bytes(b"changed")
                with self.assertRaises(RuntimeError):module.verify(folder)
                return json.loads((folder/"validation.json").read_text())
            return module.verify(folder)

    def test_all_memory_formats_and_long_attachment_paths_match(self):
        result=self.scenario()
        self.assertEqual(result["workspaceFilesMatched"],8)
        self.assertEqual(result["dailyMemoryFilesMatched"],2)
        self.assertEqual(len(result["identityFilesMatched"]),5)
        self.assertFalse(result["activated"])

    def test_changed_memory_is_not_accepted(self):
        result=self.scenario(True)
        self.assertEqual(len(result["failures"]),1)

if __name__=="__main__":unittest.main()
