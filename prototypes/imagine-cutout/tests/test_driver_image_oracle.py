"""Exercise the documented joint-gap rules through actual PNG capture files.

TESTS.md freezes alpha >=128, RGB magenta within three channels, a zero-gap
allowance and an empty-stencil exception only for the root. These controls use
new 72-pixel captures, never committed character art or cached render evidence.
"""
import json
import os
from pathlib import Path
import tempfile
import unittest

from PIL import Image

from driver import image_oracle


class CaptureOracleControls(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory(dir=os.environ["TMPDIR"])
        self.addCleanup(self.scratch.cleanup)
        self.root = Path(self.scratch.name)
        self.record = {"mode": "hd", "joint": "head", "limit": "min",
                       "prefix": "joint", "radius": 32, "root": False}
        self.parent = Image.new("RGBA", (72, 72), (0, 0, 0, 255))
        self.child = self.parent.copy()
        self.actual = self.parent.copy()

    def capture(self):
        for role in ("parent", "child", "actual"):
            getattr(self, role).save(self.root / f"joint-{role}.png")
        (self.root / "captures.json").write_text(json.dumps({"captures": [self.record]}))
        return image_oracle(self.root)[0]

    def test_real_png_capture_with_covered_joint_passes(self):
        result = self.capture()
        self.assertTrue(result["passed"])
        self.assertEqual(result["gap_pixels"], 0)
        self.assertGreater(result["stencil_pixels"], 0)
        for field in ("mode", "joint", "limit", "prefix"):
            self.assertEqual(result[field], self.record[field])

    def test_one_interior_magenta_pixel_rejects_the_capture(self):
        self.assertTrue(self.capture()["passed"], "green control must cover the joint")
        self.actual.putpixel((36, 36), (255, 0, 255, 255))
        result = self.capture()
        self.assertFalse(result["passed"])
        self.assertEqual(result["gap_pixels"], 1)

    def test_magenta_colour_tolerance_is_inclusive_at_three(self):
        for colour, expected in (((252, 3, 252, 255), 1), ((251, 4, 251, 255), 0)):
            with self.subTest(colour=colour):
                self.actual.putpixel((36, 36), colour)
                result = self.capture()
                self.assertEqual(result["gap_pixels"], expected)
                self.assertEqual(result["passed"], expected == 0)

    def test_reference_alpha_threshold_is_inclusive_at_128(self):
        for alpha in (127, 128):
            with self.subTest(alpha=alpha):
                self.parent.putalpha(alpha)
                self.child.putalpha(alpha)
                result = self.capture()
                self.assertEqual(result["passed"], alpha == 128)
                self.assertEqual(result["stencil_pixels"] > 0, alpha == 128)

    def test_empty_stencil_is_allowed_only_for_the_root(self):
        self.parent.putalpha(0)
        self.child.putalpha(0)
        self.assertFalse(self.capture()["passed"])
        self.record["root"] = True
        result = self.capture()
        self.assertTrue(result["passed"])
        self.assertEqual(result["stencil_pixels"], 0)

    def test_background_outside_the_joint_disk_is_not_a_gap(self):
        self.actual.putpixel((0, 0), (255, 0, 255, 255))
        result = self.capture()
        self.assertTrue(result["passed"])
        self.assertEqual(result["gap_pixels"], 0)

    def test_missing_capture_file_is_not_certified(self):
        self.assertTrue(self.capture()["passed"])
        (self.root / "joint-actual.png").unlink()
        with self.assertRaises(FileNotFoundError):
            image_oracle(self.root)

    def test_malformed_capture_manifest_is_not_certified(self):
        (self.root / "captures.json").write_text("{")
        with self.assertRaises(json.JSONDecodeError):
            image_oracle(self.root)


if __name__ == "__main__":
    unittest.main(verbosity=2)
