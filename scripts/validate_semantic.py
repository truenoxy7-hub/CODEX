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
CORPUS = ROOT / "corpus" / "uvof.semantic.json"
CORPUS_SCHEMA = ROOT / "schema" / "traca.exercise-corpus.schema.v1.1.json"
CORPUS_OUTPUT = ROOT / "corpus" / "uvof.validation.json"

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
        interval.get("tipus") == "interval_atac_directe"
        and interval.get("relacio") == "entre_D_Z2_i_C3"
    )


def _sa1_uses_canonical_intervals(document: Document) -> bool:
    model = document.get("model_exercici", {})
    intervals = model.get("espais_i_intervals", [])
    reference = _item(model.get("referencies_oposicionals", []), "REF_1X1")
    return (
        reference.get("rol_defensiu_simulat") == "segon_defensor"
        and _item(intervals, "INT_1").get("nom_canonic") == "interval_1-2"
        and _item(intervals, "INT_2").get("nom_canonic") == "interval_2-3"
        and _item(intervals, "INT_2").get("defensor_compartit") == "REF_1X1"
    )


def _sa2_is_direct_attack_not_feint(document: Document) -> bool:
    subactions = document.get("model_exercici", {}).get("subaccions", [])
    sa2 = _item(subactions, "SA2")
    attack_step = _step(document, "SA2", 2)
    return (
        "finta" in sa2.get("contingut_exclos", [])
        and sa2.get("lectura_tactica", {}).get("superioritat")
        == "preparada_per_la_tasca"
        and attack_step.get("accio") == "atacar_carril_1-2"
        and attack_step.get("es_finta") is False
    )


def _materials_have_distinct_functions(document: Document) -> bool:
    materials = document.get("model_exercici", {}).get("materials", [])
    return (
        _item(materials, "C1").get("classe_funcional") == "limit_espacial"
        and _item(materials, "C2").get("classe_funcional") == "limit_espacial"
        and _item(materials, "C3").get("classe_funcional")
        == "referencia_posicional_passiva"
        and _item(materials, "C3").get("rol_defensiu_representat")
        == "segon_defensor"
        and _item(materials, "C3").get("participa_com_a_defensor") is False
    )


def _wing_preserves_width(document: Document) -> bool:
    intervals = document.get("model_exercici", {}).get("espais_i_intervals", [])
    space = _item(intervals, "ESPAI_EXTREM_Z2")
    principles = space.get("principis", [])
    return (
        space.get("tipus") == "espai_finalitzacio_extrem"
        and space.get("relacio") == "entre_linia_de_fons_i_D_Z2"
        and space.get("ocupant") == "EXT"
        and "mantenir_amplitud" in principles
        and "saltar_cap_al_centre" in principles
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
    (
        "VAL-KNOW-01",
        "model_exercici/espais_i_intervals",
        "SA1 ha de representar una finta d'1–2 a 2–3 contra el segon defensor",
        _sa1_uses_canonical_intervals,
    ),
    (
        "VAL-KNOW-02",
        "model_exercici/subaccions/SA2",
        "SA2 ha de ser un atac directe del carril 1–2 i no una finta",
        _sa2_is_direct_attack_not_feint,
    ),
    (
        "VAL-KNOW-03",
        "model_exercici/materials",
        "C1 i C2 han de ser límits; C3 ha de representar passivament el segon defensor absent",
        _materials_have_distinct_functions,
    ),
    (
        "VAL-KNOW-04",
        "model_exercici/espais_i_intervals/ESPAI_EXTREM_Z2",
        "L'extrem ha de mantenir amplitud dins el seu espai de finalització",
        _wing_preserves_width,
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


def _corpus_exercise(document: Document, exercise_id: str) -> Document:
    exercises = document.get("exercicis", [])
    return next(
        (exercise for exercise in exercises if exercise.get("id") == exercise_id),
        {},
    )


def _corpus_actions(exercise: Document) -> list[Document]:
    return [
        action
        for phase in exercise.get("fases", [])
        for action in phase.get("accions", [])
    ]


def _corpus_decisions(exercise: Document) -> list[Document]:
    return [
        decision
        for phase in exercise.get("fases", [])
        for decision in phase.get("decisions", [])
    ]


def _corpus_ball_flows(exercise: Document) -> list[Document]:
    return [
        flow
        for phase in exercise.get("fases", [])
        for flow in phase.get("fluxos_pilota", [])
    ]


def _contains_forbidden_geometry(value: Any) -> bool:
    forbidden_keys = {
        "coordinates",
        "coordenades",
        "geometry",
        "geometria",
        "geometria_resolta",
        "svg",
        "path_d",
    }
    if isinstance(value, dict):
        if forbidden_keys.intersection(value):
            return True
        return any(_contains_forbidden_geometry(item) for item in value.values())
    if isinstance(value, list):
        return any(_contains_forbidden_geometry(item) for item in value)
    return False


def _corpus_custom_errors(document: Document) -> list[Document]:
    errors: list[Document] = []
    exercises = document.get("exercicis", [])
    expected_ids = [f"TR-UVOF-{index:03d}" for index in range(1, 16)]
    actual_ids = [exercise.get("id") for exercise in exercises]

    if actual_ids != expected_ids:
        errors.append(
            {
                "code": "CORPUS_IDS",
                "path": "exercicis",
                "message": "El corpus ha de contenir TR-UVOF-001..015, en ordre i sense duplicats.",
            }
        )

    for exercise_index, exercise in enumerate(exercises):
        exercise_id = exercise.get("id", f"index_{exercise_index}")
        if _contains_forbidden_geometry(exercise):
            errors.append(
                {
                    "code": "CORPUS_NO_GEOMETRY",
                    "path": f"exercicis/{exercise_index}",
                    "message": f"{exercise_id} no pot contenir geometria ni render.",
                }
            )

        for action_index, action in enumerate(_corpus_actions(exercise)):
            if action.get("accio") != "permuta":
                continue
            if action.get("receptor_despres_permuta") != action.get(
                "primer_jugador"
            ):
                errors.append(
                    {
                        "code": "CORPUS_PERMUTA_RECEIVER",
                        "path": (
                            f"exercicis/{exercise_index}/accions/{action_index}"
                        ),
                        "message": (
                            f"{exercise_id}: el primer jugador ha de rebre "
                            "després de la permuta."
                        ),
                    }
                )

        declared_balls = {
            ball.get("id"): ball.get("posseidor_inicial")
            for ball in exercise.get("pilotes", [])
        }
        for flow_index, flow in enumerate(_corpus_ball_flows(exercise)):
            ball_id = flow.get("pilota_id")
            if ball_id not in declared_balls:
                errors.append(
                    {
                        "code": "CORPUS_BALL_UNDECLARED",
                        "path": (
                            f"exercicis/{exercise_index}/fluxos_pilota/{flow_index}"
                        ),
                        "message": f"{exercise_id}: la pilota {ball_id} no està declarada.",
                    }
                )
            elif flow.get("posseidor_inicial") != declared_balls[ball_id]:
                errors.append(
                    {
                        "code": "CORPUS_BALL_INITIAL_HOLDER",
                        "path": (
                            f"exercicis/{exercise_index}/fluxos_pilota/{flow_index}"
                        ),
                        "message": (
                            f"{exercise_id}: el posseïdor inicial de {ball_id} "
                            "no coincideix amb la declaració."
                        ),
                    }
                )

    uvof_006 = _corpus_exercise(document, "TR-UVOF-006")
    switch_decision = next(
        (
            decision
            for decision in _corpus_decisions(uvof_006)
            if decision.get("id") == "D_CANVI_BANDA"
        ),
        {},
    )
    if switch_decision.get("caracter") != "preferent":
        errors.append(
            {
                "code": "UVOF006_SWITCH_PREFERRED",
                "path": "TR-UVOF-006/D_CANVI_BANDA",
                "message": "El canvi de banda ha de ser preferent i no obligatori.",
            }
        )

    uvof_009 = _corpus_exercise(document, "TR-UVOF-009")
    balls_009 = {
        ball.get("id"): ball.get("posseidor_inicial")
        for ball in uvof_009.get("pilotes", [])
    }
    if balls_009 != {"B1": "PV", "B2": "EXT_2"}:
        errors.append(
            {
                "code": "UVOF009_TWO_BALLS",
                "path": "TR-UVOF-009/pilotes",
                "message": "TR-UVOF-009 ha de declarar B1 amb PV i B2 amb EXT_2.",
            }
        )

    uvof_010 = _corpus_exercise(document, "TR-UVOF-010")
    closed_decision = next(
        (
            decision
            for decision in _corpus_decisions(uvof_010)
            if decision.get("id") == "D_2X1_TANCAT"
        ),
        {},
    )
    expected_options_010 = {
        "llancament_exterior_si_defensor_pla_a_6m",
        "passada_pivot_si_defensor_puja",
    }
    if (
        closed_decision.get("caracter") != "obligatori"
        or set(closed_decision.get("opcions", [])) != expected_options_010
    ):
        errors.append(
            {
                "code": "UVOF010_CLOSED_OPTIONS",
                "path": "TR-UVOF-010/D_2X1_TANCAT",
                "message": "TR-UVOF-010 només admet les dues opcions tancades validades.",
            }
        )

    for exercise_id in ("TR-UVOF-012", "TR-UVOF-013", "TR-UVOF-014"):
        exercise = _corpus_exercise(document, exercise_id)
        if "lateral-central" not in exercise.get("organitzacio", {}).values():
            errors.append(
                {
                    "code": "UVOF_PERMUTA_CORRECTED",
                    "path": f"{exercise_id}/organitzacio",
                    "message": f"{exercise_id} ha d'utilitzar la permuta lateral-central.",
                }
            )

    return errors


def validate_corpus_document(document: Document, schema: Document) -> Document:
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
        errors.extend(_corpus_custom_errors(document))

    return {
        "corpus": document.get("familia", {}).get("id"),
        "schema": schema.get("$id"),
        "valid": not errors,
        "errors": errors,
        "warnings": [],
        "summary": {
            "exercise_count": len(document.get("exercicis", [])),
            "error_count": len(errors),
            "structural_error_count": len(structural),
            "semantic_error_count": len(errors) - len(structural),
        },
        "geometry_generated": False,
        "render_generated": False,
    }


def validate_corpus(
    corpus_path: Path = CORPUS,
    schema_path: Path = CORPUS_SCHEMA,
    output_path: Path = CORPUS_OUTPUT,
) -> Document:
    document = json.loads(corpus_path.read_text(encoding="utf-8"))
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    report = validate_corpus_document(document, schema)
    output_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return report


def main() -> int:
    exercise_report = validate()
    corpus_report = validate_corpus()
    combined = {
        "valid": exercise_report["valid"] and corpus_report["valid"],
        "reports": [exercise_report, corpus_report],
    }
    print(json.dumps(combined, ensure_ascii=False, indent=2))
    return 0 if combined["valid"] else 1


if __name__ == "__main__":
    sys.exit(main())
