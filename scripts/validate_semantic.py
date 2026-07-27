from __future__ import annotations

import json
import sys
from collections.abc import Callable
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
EXERCISE = ROOT / "exercises" / "TR-UVOF-001" / "semantic.json"
SCHEMA = ROOT / "schema" / "traca.semantic.schema.v1.0.json"
OUTPUT = ROOT / "exercises" / "TR-UVOF-001" / "validation.json"

Document = dict[str, Any]
Check = Callable[[Document], bool]


def _item(items: list[Document], item_id: str) -> Document:
    return next((item for item in items if item.get("id") == item_id), {})


def _step(document: Document, subaction_id: str, index: int) -> Document:
    subactions = document.get("model_exercici", {}).get("subaccions", [])
    sequence = _item(subactions, subaction_id).get("sequencia_obligatoria", [])
    return sequence[index] if len(sequence) > index else {}


def _sa1_starts_at_int_1(document: Document) -> bool:
    step = _step(document, "SA1", 0)
    return (
        step.get("ordre") == 1
        and step.get("accio") == "rebre_en_carrera"
        and step.get("destinacio") == "INT_1"
    )


def _finta_goes_from_int_1_to_int_2(document: Document) -> bool:
    step = _step(document, "SA1", 1)
    return (
        step.get("accio") == "finta_canvi_direccio"
        and step.get("des_de") == "INT_1"
        and step.get("cap_a") == "INT_2"
    )


def _int_2_is_contiguous(document: Document) -> bool:
    model = document.get("model_exercici", {})
    sa1 = _item(model.get("subaccions", []), "SA1")
    interval = _item(model.get("espais_i_intervals", []), "INT_2")
    return (
        sa1.get("interval_inicial") == "INT_1"
        and sa1.get("interval_contigu") == "INT_2"
        and interval.get("tipus") == "interval_contigu"
        and interval.get("relacio") == "interior_de_REF_1X1"
    )


def _finta_is_u_shaped(document: Document) -> bool:
    return _step(document, "SA1", 1).get("forma_funcional") == "U"


def _sa1_ends_with_resolution(document: Document) -> bool:
    subactions = document.get("model_exercici", {}).get("subaccions", [])
    sequence = _item(subactions, "SA1").get("sequencia_obligatoria", [])
    return bool(sequence) and sequence[-1].get("accio") == "resoldre"


def _bench_substitutes_direct_defender(document: Document) -> bool:
    references = document.get("model_exercici", {}).get(
        "referencies_oposicionals", []
    )
    reference = _item(references, "REF_1X1")
    return (
        reference.get("tipus_real") == "defensor_directe"
        and reference.get("tipus_utilitzat_exercici") == "banc"
        and reference.get("equivalencia") == "substitut_de_defensor_directe"
    )


def _sa2_recovers_without_ball(document: Document) -> bool:
    subactions = document.get("model_exercici", {}).get("subaccions", [])
    sa2 = _item(subactions, "SA2")
    step = _step(document, "SA2", 0)
    return (
        sa2.get("recuperacio", {}).get("amb_pilota") is False
        and step.get("accio") == "recuperar_sense_pilota"
    )


def _wing_pass_is_short_and_without_bounce(document: Document) -> bool:
    subactions = document.get("model_exercici", {}).get("subaccions", [])
    sa2 = _item(subactions, "SA2")
    conditions = _step(document, "SA2", 1).get("condicions", [])
    return (
        sa2.get("passador") == "EXT"
        and _step(document, "SA2", 1).get("origen_passada") == "EXT"
        and "passada_curta" in conditions
        and "sense_bot" in conditions
    )


def _int_4_is_between_defender_and_cone(document: Document) -> bool:
    intervals = document.get("model_exercici", {}).get("espais_i_intervals", [])
    interval = _item(intervals, "INT_4")
    return (
        interval.get("tipus") == "interval_contigu"
        and interval.get("relacio") == "entre_D_Z2_i_C3"
    )


SEMANTIC_RULES: tuple[tuple[str, str, str, Check], ...] = (
    (
        "VAL-1X1-01",
        "model_exercici/subaccions/SA1/sequencia_obligatoria/0",
        "SA1 ha de començar amb recepció en carrera a INT_1",
        _sa1_starts_at_int_1,
    ),
    (
        "VAL-1X1-02",
        "model_exercici/subaccions/SA1/sequencia_obligatoria/1",
        "La finta ha d'anar d'INT_1 a INT_2",
        _finta_goes_from_int_1_to_int_2,
    ),
    (
        "VAL-1X1-03",
        "model_exercici/espais_i_intervals/INT_2",
        "INT_2 ha de ser l'interval contigu a INT_1",
        _int_2_is_contiguous,
    ),
    (
        "VAL-1X1-04",
        "model_exercici/subaccions/SA1/sequencia_obligatoria/1/forma_funcional",
        "La forma funcional de la finta ha de ser U",
        _finta_is_u_shaped,
    ),
    (
        "VAL-1X1-05",
        "model_exercici/subaccions/SA1/sequencia_obligatoria",
        "SA1 ha de finalitzar amb una resolució posterior",
        _sa1_ends_with_resolution,
    ),
    (
        "VAL-1X1-06",
        "model_exercici/referencies_oposicionals/REF_1X1",
        "El banc ha de substituir semànticament el defensor directe",
        _bench_substitutes_direct_defender,
    ),
    (
        "VAL-SA2-01",
        "model_exercici/subaccions/SA2/recuperacio",
        "La recuperació de SA2 ha de ser sense pilota",
        _sa2_recovers_without_ball,
    ),
    (
        "VAL-SA2-02",
        "model_exercici/subaccions/SA2/sequencia_obligatoria/1/condicions",
        "La passada de l'extrem ha de ser curta i sense bot",
        _wing_pass_is_short_and_without_bounce,
    ),
    (
        "VAL-SA2-03",
        "model_exercici/espais_i_intervals/INT_4/relacio",
        "INT_4 ha de quedar entre D_Z2 i C3",
        _int_4_is_between_defender_and_cone,
    ),
)


def validate_document(document: Document, schema: Document) -> Document:
    validator = Draft202012Validator(schema)
    structural = sorted(
        validator.iter_errors(document), key=lambda error: list(error.absolute_path)
    )
    errors = [
        {
            "code": "SCHEMA_ERROR",
            "path": "/".join(str(part) for part in error.absolute_path),
            "message": error.message,
        }
        for error in structural
    ]

    if not structural:
        errors.extend(
            {"code": code, "path": path, "message": message}
            for code, path, message, check in SEMANTIC_RULES
            if not check(document)
        )

    structural_count = len(structural)
    semantic_count = len(errors) - structural_count
    return {
        "exercise": document.get("identificacio", {}).get("id"),
        "schema": schema.get("$id"),
        "valid": not errors,
        "errors": errors,
        "warnings": [],
        "summary": {
            "error_count": len(errors),
            "warning_count": 0,
            "structural_error_count": structural_count,
            "semantic_error_count": semantic_count,
            "semantic_checks_run": 0 if structural else len(SEMANTIC_RULES),
        },
        "geometry_generated": False,
        "render_generated": False,
    }


def validate(
    exercise_path: Path = EXERCISE,
    schema_path: Path = SCHEMA,
    output_path: Path = OUTPUT,
) -> Document:
    document = json.loads(exercise_path.read_text(encoding="utf-8"))
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    report = validate_document(document, schema)
    output_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return report


def main() -> int:
    report = validate()
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    sys.exit(main())
