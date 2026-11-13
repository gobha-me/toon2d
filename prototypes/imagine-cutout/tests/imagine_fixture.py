"""Disposable provenance-only subjects; never substitutes for rig evidence."""
import copy
import json
from pathlib import Path
import shutil

from PIL import Image

from imagine_provenance import SCRIPTED, digest, read_contract


def make_fixture(source: Path, destination: Path, manifest: dict) -> dict:
    """Use real supplied output bytes and small derivatives to exercise links.

    No bones, scenes, joint geometry or facing are fabricated here. The fixture
    can establish validator sensitivity only, never character acceptance.
    """
    manifest = copy.deepcopy(manifest)
    config = manifest["_character"]
    contract_path = config["imagine_contract"]
    (destination / contract_path).parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source / contract_path, destination / contract_path)
    contract = read_contract(source, manifest)
    source_directory = contract["source_directory"]
    shutil.copytree(source / source_directory, destination / source_directory)
    parts = []
    for slot, rule in contract["slots"].items():
        part_id = rule["part"]
        texture = destination / "characters/char2/parts" / (part_id + ".png")
        texture.parent.mkdir(parents=True, exist_ok=True)
        scripted = rule["classification"] == SCRIPTED
        if scripted:
            Image.new("RGBA", (16, 16), (120, 80, 40, 255)).save(texture)
        else:
            # Small image derivatives exercise byte hashes, not cutout quality.
            image = Image.open(destination / source_directory / rule["required_sources"][0])
            image.convert("RGBA").resize((16, 16)).save(texture)
        part = {"id": part_id, "texture_hd": texture.relative_to(destination).as_posix(),
                "classification": rule["classification"], "scripted_fallback": scripted}
        sidecar = {**part, "derived_from": "Provenance-only fixture: resize of the first declared source; not rig artwork.",
                   "output_sha256": digest(texture),
                   "imagine_sources": [{"file": name, "sha256": contract["sources"][name]["sha256"]}
                                       for name in rule["required_sources"]],
                   **{field: contract[field] for field in ("license", "credit", "rights")}}
        if scripted:
            part["fallback_reason"] = rule["reason"]
            sidecar["fallback_reason"] = rule["reason"]
        texture.with_suffix(".gen.json").write_text(json.dumps(sidecar, indent=2) + "\n")
        parts.append(part)
    (destination / config["subject"]).write_text(json.dumps({"parts": parts}, indent=2) + "\n")
    return manifest
