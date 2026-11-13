"""Independent source/sidecar acceptance for the supplied char2 Imagine kit.

This checks declared provenance, not artistic quality or pixel genealogy. Rig
geometry, rendered gaps and facing remain the existing independent observers.
"""
from __future__ import annotations

from collections import Counter
import hashlib
import json
from pathlib import Path


SCRIPTED = "SCRIPTED (flagged)"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def confined(root: Path, value: str) -> Path:
    """Reject unsafe names before touching any subject-selected file."""
    if not isinstance(value, str):
        raise ValueError("path must be a relative string")
    path = Path(value)
    if path.is_absolute() or not path.parts or ".." in path.parts or str(path) != value:
        raise ValueError("path must be canonical and relative")
    resolved = (root / path).resolve()
    if not resolved.is_relative_to(root.resolve()):
        raise ValueError("path escapes its declared directory")
    return resolved


def read_contract(source: Path, manifest: dict) -> dict | None:
    name = manifest["_character"].get("imagine_contract")
    if name is None:
        return None
    contract = json.loads(confined(source, name).read_text())
    assert contract["schema_version"] == 1
    assert set(contract["slots"]) == {slot["slot"] for slot in manifest["slots"]}
    for slot in manifest["slots"]:
        rule = contract["slots"][slot["slot"]]
        assert rule["part"] == slot["part"]
        assert rule["classification"] in contract["classifications"]
        assert set(rule["required_sources"]) <= contract["sources"].keys()
        assert bool(rule["required_sources"]) == (rule["classification"] != SCRIPTED)
        assert rule["reason"]
    confined(source, contract["source_directory"])
    return contract


def source_errors(source: Path, contract: dict) -> list[dict]:
    errors = []

    def reject(key, message):
        errors.append({"case_id": key, "error": message})

    directory = confined(source, contract["source_directory"])
    for filename, record in contract["sources"].items():
        key = "source/" + filename
        assert Path(filename).name == filename, "source contract must use file names only"
        try:
            image = confined(directory, filename)
        except ValueError:
            reject(key + "/image", "Imagine source path escapes its declared directory")
            continue
        if not image.is_file():
            reject(key + "/image", "committed Imagine source is missing")
            continue
        if digest(image) != record["sha256"]:
            reject(key + "/hash", "Imagine source bytes differ from the authenticated output")
        sidecar = image.with_suffix(".gen.json")
        # Apply confinement to sidecars too, including symlinks.
        try:
            sidecar = confined(directory, sidecar.name)
            data = json.loads(sidecar.read_text())
            if not isinstance(data, dict):
                raise ValueError("sidecar must be an object")
        except (OSError, ValueError):
            reject(key + "/sidecar", "Imagine source sidecar missing, unsafe or invalid")
            continue
        call = contract["calls"][str(record["call"])]
        expected = {field: call[field] for field in ("prompt", "post_id", "post_url", "utc_time", "action", "date_source")}
        expected.update(source=call["post_id"], source_post_url=call["post_url"],
                        date=call["utc_time"], source_date=call["utc_time"],
                        call_number=record["call"], output_sha256=record["sha256"],
                        tool="Grok Imagine (SpaceXAI)", model="not disclosed",
                        feature="Image" if record["call"] == 1 else "Segments",
                        **{field: contract[field] for field in ("license", "credit", "rights")})
        for field, value in expected.items():
            if type(data.get(field)) is not type(value) or data.get(field) != value:
                reject(key + "/metadata/" + field, "source sidecar differs from recorded " + field)
        if "utc_time_is_approximate" in call:
            if data.get("utc_time_is_approximate") is not True:
                reject(key + "/approximate", "approximate call time must remain explicitly approximate")
        elif "utc_time_is_approximate" in data:
            reject(key + "/approximate", "exact recorded call must not gain an approximate flag")
    return errors


def provenance_suite(source: Path, manifest: dict) -> dict | None:
    contract = read_contract(source, manifest)
    if contract is None:
        return None
    errors = source_errors(source, contract)
    authenticated = sum(not any(error["case_id"].startswith("source/" + filename + "/")
                                for error in errors) for filename in contract["sources"])

    def reject(key, message):
        errors.append({"case_id": key, "error": message})

    config = manifest["_character"]
    try:
        subject = json.loads(confined(source, config["subject"]).read_text())
        parts = subject["parts"]
        if not isinstance(parts, list) or not all(isinstance(p, dict) for p in parts):
            raise ValueError("parts must be objects")
    except (OSError, ValueError, KeyError, TypeError):
        reject("provenance/required-subject", "missing or invalid char2 part declarations; Imagine-derived parts are required")
        parts = []
    ids = [p.get("id") for p in parts]
    required = {rule["part"]: (slot, rule) for slot, rule in contract["slots"].items()}
    for part_id, (slot, _) in required.items():
        if ids.count(part_id) != 1:
            reject("provenance/slot/" + slot, "required Imagine/scripted part missing or duplicated")
    classes = Counter()
    used_sources = set()
    for part in parts:
        part_id = part.get("id")
        if not isinstance(part_id, str) or not part_id or ids.count(part_id) != 1:
            reject("provenance/part-inventory", "part ids must be unique nonempty strings")
            continue
        key = "provenance/part/" + part_id
        classification = part.get("classification")
        if classification not in contract["classifications"]:
            reject(key + "/classification", "part must use one of the four disclosed source classes")
        if part_id in required:
            _, rule = required[part_id]
            if classification != rule["classification"]:
                reject(key + "/slot-class", "slot classification differs from the reviewed source map")
            if isinstance(classification, str):
                classes[classification] += 1
        else:
            rule = None  # Additional torso/hair/backing parts still require provenance.
        scripted = classification == SCRIPTED
        if part.get("scripted_fallback") is not scripted:
            reject(key + "/flag", "scripted_fallback must explicitly match the classification")
        if scripted and not isinstance(part.get("fallback_reason"), str):
            reject(key + "/fallback-reason", "scripted fallback must explain the missing Imagine source")
        elif scripted and not part["fallback_reason"].strip():
            reject(key + "/fallback-reason", "scripted fallback reason must be nonempty")
        try:
            texture = confined(source, part["texture_hd"])
            runtime_dir = confined(source, "characters/char2")
            source_dir = confined(source, contract["source_directory"])
            if not texture.is_relative_to(runtime_dir) or texture.is_relative_to(source_dir) or texture.suffix != ".png":
                raise ValueError("texture must be a derived char2 PNG")
            sidecar = confined(source, str(texture.with_suffix(".gen.json").relative_to(source.resolve())))
            data = json.loads(sidecar.read_text())
            if not isinstance(data, dict):
                raise ValueError("sidecar must be an object")
            output_hash = digest(texture)
        except (OSError, ValueError, KeyError, TypeError):
            reject(key + "/sidecar", "derived PNG or sidecar missing, unsafe or invalid")
            continue
        for field, value in (("classification", classification), ("scripted_fallback", scripted),
                             ("output_sha256", output_hash),
                             *((field, contract[field]) for field in ("license", "credit", "rights"))):
            if type(data.get(field)) is not type(value) or data.get(field) != value:
                reject(key + "/metadata/" + field, "derived sidecar differs from declared " + field)
        if not isinstance(data.get("derived_from"), str) or not data["derived_from"].strip():
            reject(key + "/derivation", "derived sidecar must describe the scripted split/merge/matte or fallback")
        if scripted and data.get("fallback_reason") != part.get("fallback_reason"):
            reject(key + "/metadata/fallback_reason", "fallback reason must agree in part and sidecar")
        refs = data.get("imagine_sources")
        if not isinstance(refs, list) or not all(isinstance(ref, dict) for ref in refs):
            reject(key + "/sources", "imagine_sources must list authenticated source file/hash records")
            continue
        names = [ref.get("file") for ref in refs]
        if not all(isinstance(name, str) for name in names) or len(set(names)) != len(names):
            reject(key + "/sources", "source references must have unique file names")
            continue
        if scripted:
            if refs:
                reject(key + "/scripted-source", "wholly scripted fallback must not claim an Imagine source")
        elif not refs:
            reject(key + "/sources", "non-scripted part must trace to an authenticated Imagine source")
        if classification == "Segments-usable" and (len(refs) != 1 or
                contract["sources"].get(names[0], {}).get("call") != 2):
            reject(key + "/class-sources", "directly usable Segments part requires one Segments output")
        if classification == "Segments-merged" and len(refs) < 2:
            reject(key + "/class-sources", "merged part requires at least two disclosed Imagine sources")
        if rule and not set(rule["required_sources"]) <= set(names):
            reject(key + "/required-sources", "slot does not trace to all reviewed Imagine inputs")
        for ref in refs:
            record = contract["sources"].get(ref["file"])
            if record is None or ref.get("sha256") != record["sha256"]:
                reject(key + "/source-hash", "unknown source or mismatched authenticated hash")
            else:
                used_sources.add(ref["file"])
    return {"name": "Imagine source provenance and flagged scripted fallbacks",
            "passed": not errors, "errors": errors,
            "slot_tally": {label: classes[label] for label in contract["classifications"]},
            "distinct_imagine_sources": sorted(used_sources),
            "required_slots": len(required), "expected_source_files": len(contract["sources"]),
            "authenticated_source_files": authenticated}
