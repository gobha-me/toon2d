"""Small oracle controls: a one-pixel gap and omitted extremes must be caught."""
import itertools
import unittest

import numpy as np

from body_driver import (COMBINED_RANDOM_N, JOINT_NAMES, TILE, pose_plan,
                         read_manifest, tile_oracle)
from driver import PROTOTYPE


class GapOracleControls(unittest.TestCase):
    def setUp(self):
        self.parent = np.full((TILE, TILE, 4), 255, dtype=np.uint8)
        self.child = self.parent.copy()
        self.actual = np.zeros((TILE, TILE, 4), dtype=np.uint8)
        self.actual[:, :, 3] = 255

    def test_single_native_pixel_is_rejected(self):
        self.assertTrue(tile_oracle(self.parent, self.child, self.actual, root=False)["passed"])
        self.actual[TILE // 2, TILE // 2] = [255, 0, 255, 255]
        result = tile_oracle(self.parent, self.child, self.actual, root=False)
        self.assertFalse(result["passed"])
        self.assertEqual(result["gap_pixels"], 1)

    def test_reference_alpha_and_key_colour_boundaries(self):
        self.parent[:, :, 3] = 127
        self.assertFalse(tile_oracle(self.parent, self.child, self.actual, root=False)["passed"])
        self.parent[:, :, 3] = 128
        self.actual[TILE // 2, TILE // 2] = [252, 3, 252, 255]
        self.assertEqual(tile_oracle(self.parent, self.child, self.actual, root=False)["gap_pixels"], 1)
        self.actual[TILE // 2, TILE // 2] = [251, 4, 251, 255]
        self.assertEqual(tile_oracle(self.parent, self.child, self.actual, root=False)["gap_pixels"], 0)

    def test_empty_non_root_cannot_pass(self):
        self.parent[:, :, 3] = 0
        self.assertFalse(tile_oracle(self.parent, self.child, self.actual, root=False)["passed"])
        self.assertTrue(tile_oracle(self.parent, self.child, self.actual, root=True)["passed"])

    def test_exterior_pixel_does_not_define_a_joint_gap(self):
        self.actual[0, 0] = [255, 0, 255, 255]
        self.assertTrue(tile_oracle(self.parent, self.child, self.actual, root=False)["passed"])


class PoseCoverageControls(unittest.TestCase):
    def test_every_pair_at_every_extreme_plus_random_sample(self):
        manifest = read_manifest(PROTOTYPE)
        poses = pose_plan(manifest)
        self.assertEqual(poses, pose_plan(manifest), "pose generation must be reproducible")
        self.assertEqual(sum(p["kind"] == "random" for p in poses), COMBINED_RANDOM_N)
        pairs = {p["id"]: p for p in poses if p["kind"] == "pair"}
        self.assertEqual(len(pairs), 840)
        for left, right in itertools.combinations(manifest["joints"], 2):
            for a, b in itertools.product(range(2), repeat=2):
                pose = pairs[f"pair/{left['name']}/{a}/{right['name']}/{b}"]
                self.assertEqual(set(pose["angles"]), set(JOINT_NAMES))
                self.assertEqual(pose["angles"][left["name"]], left["rotation_limits_deg"][a])
                self.assertEqual(pose["angles"][right["name"]], right["rotation_limits_deg"][b])
        for pose in poses:
            for joint in manifest["joints"]:
                self.assertGreaterEqual(pose["angles"][joint["name"]], joint["rotation_limits_deg"][0])
                self.assertLessEqual(pose["angles"][joint["name"]], joint["rotation_limits_deg"][1])


if __name__ == "__main__":
    unittest.main()
