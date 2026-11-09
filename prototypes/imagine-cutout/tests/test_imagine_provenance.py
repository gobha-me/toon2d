"""Controls for authenticated sources, source traces and explicit fallbacks."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

from body_driver import read_manifest
from driver import PROTOTYPE
from imagine_fixture import make_fixture
from imagine_provenance import confined, provenance_suite, read_contract, source_errors


def edit_json(path, edit):
    data = json.loads(path.read_text())
    edit(data)
    path.write_text(json.dumps(data, indent=2) + "\n")


class ImagineProvenanceControls(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory(dir=os.environ["TMPDIR"])
        self.addCleanup(self.scratch.cleanup)
        self.root = Path(self.scratch.name)
        self.manifest = make_fixture(PROTOTYPE, self.root, read_manifest(PROTOTYPE, "char2"))
        self.subject = self.root / self.manifest["_character"]["subject"]
        self.images = self.root / "characters/char2/imagine-source"
        self.parts = self.root / "characters/char2/parts"

    def failures(self):
        result = provenance_suite(self.root, self.manifest)
        self.assertFalse(result["passed"])
        return {error["case_id"] for error in result["errors"]}

    def test_complete_declared_source_chain_and_flagged_fallback(self):
        result = provenance_suite(self.root, self.manifest)
        self.assertTrue(result["passed"], result["errors"])
        self.assertEqual(result["authenticated_source_files"], 15)
        self.assertEqual(result["slot_tally"], {"Segments-usable": 0, "Segments-merged": 4,
                                              "Segments-split": 9, "SCRIPTED (flagged)": 1})

    def test_committed_source_inventory_and_verbatim_sidecars(self):
        contract = read_contract(PROTOTYPE, self.manifest)
        self.assertEqual(source_errors(PROTOTYPE, contract), [])
        tracked = set(subprocess.check_output(["git", "ls-files", "--", contract["source_directory"]],
                                             cwd=PROTOTYPE, text=True).splitlines())
        for filename in contract["sources"]:
            image = Path(contract["source_directory"]) / filename
            self.assertIn(image.as_posix(), tracked)
            self.assertIn(image.with_suffix(".gen.json").as_posix(), tracked)

    def test_deleted_source_and_sidecar_are_rejected(self):
        (self.images / "call1-base-best.jpg").unlink()
        (self.images / "seg-be6a-red-hair.gen.json").unlink()
        ids = self.failures()
        self.assertIn("source/call1-base-best.jpg/image", ids)
        self.assertIn("source/seg-be6a-red-hair.png/sidecar", ids)
        self.assertEqual(provenance_suite(self.root, self.manifest)["authenticated_source_files"], 13)

    def test_tampered_source_bytes_and_derived_output_hash_are_rejected(self):
        with (self.images / "call1-base-best.jpg").open("ab") as stream:
            stream.write(b"tampered")
        with (self.parts / "head.png").open("ab") as stream:
            stream.write(b"tampered")
        ids = self.failures()
        self.assertIn("source/call1-base-best.jpg/hash", ids)
        self.assertIn("provenance/part/head/metadata/output_sha256", ids)

    def test_approximate_call_time_cannot_be_presented_as_exact(self):
        edit_json(self.images / "seg-be6a-red-hair.gen.json", lambda d: d.pop("utc_time_is_approximate"))
        self.assertIn("source/seg-be6a-red-hair.png/approximate", self.failures())

    def test_prompt_post_time_license_and_credit_are_authenticated(self):
        for field in ("prompt", "post_id", "post_url", "utc_time", "license", "credit"):
            with self.subTest(field=field):
                path = self.images / "call1-base-best.gen.json"
                original = path.read_text()
                edit_json(path, lambda d: d.update({field: "unrecorded"}))
                self.assertIn("source/call1-base-best.jpg/metadata/" + field, self.failures())
                path.write_text(original)

    def test_non_scripted_slot_cannot_drop_trace_or_claim_unknown_source(self):
        edit_json(self.parts / "head.gen.json", lambda d: d.update(imagine_sources=[]))
        edit_json(self.parts / "shin_left.gen.json",
                  lambda d: d["imagine_sources"][0].update(file="uncommitted.png"))
        ids = self.failures()
        self.assertIn("provenance/part/head/required-sources", ids)
        self.assertIn("provenance/part/shin_left/source-hash", ids)

    def test_scripted_fallback_requires_flag_and_reason_in_both_records(self):
        edit_json(self.subject, lambda d: d["parts"][-1].update(scripted_fallback=False, fallback_reason=""))
        ids = self.failures()
        self.assertIn("provenance/part/satchel/flag", ids)
        self.assertIn("provenance/part/satchel/fallback-reason", ids)

    def test_missing_slot_duplicate_slot_and_unclassified_extra_part_are_rejected(self):
        edit_json(self.subject, lambda d: d["parts"].pop(0))
        edit_json(self.subject, lambda d: d["parts"].append(dict(d["parts"][0])))
        edit_json(self.subject, lambda d: d["parts"].append({"id": "extra_backing"}))
        ids = self.failures()
        self.assertIn("provenance/slot/head_face", ids)
        self.assertIn("provenance/slot/upper_arm_left", ids)
        self.assertIn("provenance/part/extra_backing/classification", ids)

    def test_available_imagine_slots_cannot_be_replaced_with_scripted_fallbacks(self):
        edit_json(self.subject, lambda d: d["parts"][0].update(classification="SCRIPTED (flagged)", scripted_fallback=True))
        self.assertIn("provenance/part/head/slot-class", self.failures())

    def test_unknown_source_hash_and_missing_derived_sidecar_are_rejected(self):
        edit_json(self.parts / "head.gen.json", lambda d: d["imagine_sources"][0].update(sha256="0" * 64))
        (self.parts / "left_hand.gen.json").unlink()
        ids = self.failures()
        self.assertIn("provenance/part/head/source-hash", ids)
        self.assertIn("provenance/part/left_hand/sidecar", ids)

    def test_paths_are_confined_before_reading(self):
        for value in ("../outside.png", "/outside.png", "parts/../outside.png", "./outside.png"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                confined(self.root, value)
        outside = self.root / "outside"
        outside.mkdir()
        (self.parts / "escape").symlink_to(outside, target_is_directory=True)
        with self.assertRaises(ValueError):
            confined(self.parts, "escape/outside.png")
        edit_json(self.subject, lambda d: d["parts"][0].update(texture_hd="../outside.png"))
        self.assertIn("provenance/part/head/sidecar", self.failures())

    def test_bad_json_and_non_object_sidecars_fail_acceptance(self):
        (self.parts / "head.gen.json").write_text("[")
        (self.parts / "left_hand.gen.json").write_text("[]")
        ids = self.failures()
        self.assertIn("provenance/part/head/sidecar", ids)
        self.assertIn("provenance/part/left_hand/sidecar", ids)

    def test_scripted_fallback_cannot_claim_an_imagine_source(self):
        source = json.loads((self.parts / "head.gen.json").read_text())["imagine_sources"]
        edit_json(self.parts / "satchel.gen.json", lambda d: d.update(imagine_sources=source))
        self.assertIn("provenance/part/satchel/scripted-source", self.failures())

    def test_merged_slot_cannot_silently_lose_one_of_its_inputs(self):
        edit_json(self.parts / "left_hand.gen.json", lambda d: d["imagine_sources"].pop())
        ids = self.failures()
        self.assertIn("provenance/part/left_hand/required-sources", ids)
        self.assertIn("provenance/part/left_hand/class-sources", ids)

    def test_source_symlink_cannot_escape_the_committed_source_directory(self):
        image = self.images / "call1-base-best.jpg"
        outside = self.root / "unrelated-image.jpg"
        image.rename(outside)
        image.symlink_to(outside)
        self.assertIn("source/call1-base-best.jpg/image", self.failures())

    def test_existing_character_has_no_new_provenance_requirement(self):
        self.assertIsNone(provenance_suite(PROTOTYPE, read_manifest(PROTOTYPE, "trenchcoat")))


if __name__ == "__main__":
    unittest.main(verbosity=2)
