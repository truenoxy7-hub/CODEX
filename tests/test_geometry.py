from __future__ import annotations

import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

from scripts.resolve_geometry import resolve_uvof015_geometry


ROOT = Path(__file__).resolve().parents[1]
SPATIAL_PATH = ROOT / "exercises/TR-UVOF-015/spatial-relations.json"
COURT_PATH = ROOT / "config/handball-court.ihf-2025.json"
GEOMETRY_PATH = ROOT / "exercises/TR-UVOF-015/geometry.json"
SCHEMA_PATH = ROOT / "schema/traca.geometry.schema.v0.1.json"
BUNDLE_PATH = ROOT / "interface/data/uvof015.geometry.js"


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def test_geometry_schema_and_committed_artifact_are_valid() -> None:
    schema = _load(SCHEMA_PATH)
    geometry = _load(GEOMETRY_PATH)

    Draft202012Validator.check_schema(schema)
    errors = sorted(Draft202012Validator(schema).iter_errors(geometry), key=str)

    assert errors == []


def test_uvof015_geometry_is_reproducible_from_ready_relations() -> None:
    spatial = _load(SPATIAL_PATH)
    court = _load(COURT_PATH)

    assert resolve_uvof015_geometry(spatial, court) == _load(GEOMETRY_PATH)


def test_ihf_court_profile_preserves_regulation_dimensions() -> None:
    profile = _load(COURT_PATH)

    assert profile["court"] == {
        "length_m": 40.0,
        "width_m": 20.0,
        "half_length_m": 20.0,
        "line_width_m": 0.05,
        "goal_line_width_m": 0.08,
    }
    assert profile["goal"]["width_m"] == 3.0
    assert profile["goal"]["height_m"] == 2.0
    assert profile["markings"]["goal_area_radius_m"] == 6.0
    assert profile["markings"]["free_throw_distance_m"] == 9.0
    assert profile["markings"]["free_throw_segment_m"] == 0.15
    assert profile["markings"]["free_throw_gap_m"] == 0.15


def test_uvof015_keeps_three_independent_branches_and_all_alternatives() -> None:
    geometry = _load(GEOMETRY_PATH)

    assert len(geometry["zones"]) == 3
    assert len(geometry["spaces"]) == 6
    assert len(geometry["branches"]) == 3
    assert all(len(branch["alternatives"]) == 4 for branch in geometry["branches"])
    assert not any(
        "selected" in alternative
        for branch in geometry["branches"]
        for alternative in branch["alternatives"]
    )


def test_every_duel_path_crosses_its_defensive_line_and_respects_space_change() -> None:
    geometry = _load(GEOMETRY_PATH)
    zones = {zone["id"]: zone for zone in geometry["zones"]}

    for branch in geometry["branches"]:
        defensive_y = zones[branch["zone_ref"]]["defensive_line"][0][1]
        for alternative in branch["alternatives"]:
            ys = [point[1] for point in alternative["points"]]
            assert max(ys) > defensive_y > min(ys)
            if alternative["kind"] == "feint":
                assert alternative["initial_space_ref"] != alternative["target_space_ref"]
            else:
                assert alternative["initial_space_ref"] == alternative["target_space_ref"]
            assert "sense_bot" in alternative["qualifiers"]


def test_geometry_resolver_rejects_a_non_ready_input() -> None:
    spatial = _load(SPATIAL_PATH)
    spatial["operator_frames"][0]["status"] = "unresolved"

    with pytest.raises(ValueError, match="GEOMETRY_INPUT_NOT_READY"):
        resolve_uvof015_geometry(spatial, _load(COURT_PATH))


def test_browser_bundle_is_an_exact_derived_copy() -> None:
    payload = BUNDLE_PATH.read_text(encoding="utf-8")
    prefix = "window.TRACA_UVOF015_GEOMETRY = "

    assert payload.startswith(prefix)
    assert payload.endswith(";\n")
    assert json.loads(payload[len(prefix) : -2]) == _load(GEOMETRY_PATH)
