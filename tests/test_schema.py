from __future__ import annotations

import json
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]


def test_current_exercise_matches_schema() -> None:
    document = json.loads(
        (ROOT / "exercises" / "TR-UVOF-001" / "semantic.json").read_text(encoding="utf-8")
    )
    schema = json.loads(
        (ROOT / "schema" / "traca.semantic.schema.v1.0.json").read_text(encoding="utf-8")
    )
    errors = list(Draft202012Validator(schema).iter_errors(document))
    assert errors == []


def test_no_geometry_or_render_is_present() -> None:
    document = json.loads(
        (ROOT / "exercises" / "TR-UVOF-001" / "semantic.json").read_text(encoding="utf-8")
    )
    separation = document["meta"]["separacio_capes"]
    assert separation["geometria_resolta"] == "no_inclosa"
    assert separation["renderitzat"] == "no_generat"
