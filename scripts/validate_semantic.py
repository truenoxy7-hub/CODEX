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
SPATIAL_RELATIONS = (
    ROOT / "exercises" / "TR-UVOF-001" / "spatial-relations.json"
)
SPATIAL_RELATIONS_SCHEMA = (
    ROOT / "schema" / "traca.spatial-relations.schema.v0.2.json"
)
SPATIAL_RELATIONS_OUTPUT = (
    ROOT / "exercises" / "TR-UVOF-001" / "spatial-relations.validation.json"
)

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
        "x",
        "y",
        "x1",
        "x2",
        "y1",
        "y2",
        "cx",
        "cy",
        "points",
        "vertices",
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

        organization = exercise.get("organitzacio", {})
        numeric_relation = (
            organization.get("relacio")
            or organization.get("relacio_numerica")
        )
        if (
            numeric_relation == "6x6"
            and exercise.get("tipus_exercici") != "situacio_partit"
        ):
            errors.append(
                {
                    "code": "CORPUS_6X6_SITUATION_GAME",
                    "path": f"exercicis/{exercise_index}/tipus_exercici",
                    "message": (
                        f"{exercise_id}: tot exercici 6x6 s'ha de "
                        "categoritzar com a situacio_partit."
                    ),
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
        flow_groups: dict[tuple[str, str], list[tuple[int, Document]]] = {}
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
                continue
            trajectory_id = flow.get("trajectoria_id", "FLUX_UNIC")
            flow_groups.setdefault((ball_id, trajectory_id), []).append(
                (flow_index, flow)
            )

        for (ball_id, trajectory_id), indexed_flows in flow_groups.items():
            ordered_flows = sorted(
                indexed_flows,
                key=lambda item: (item[1].get("ordre", item[0] + 1), item[0]),
            )
            first_index, first_flow = ordered_flows[0]
            if first_flow.get("posseidor_inicial") != declared_balls[ball_id]:
                errors.append(
                    {
                        "code": "CORPUS_BALL_INITIAL_HOLDER",
                        "path": (
                            f"exercicis/{exercise_index}/fluxos_pilota/{first_index}"
                        ),
                        "message": (
                            f"{exercise_id}: el posseïdor inicial de {ball_id} "
                            f"a {trajectory_id} no coincideix amb la declaració."
                        ),
                    }
                )
            previous_final = first_flow.get("posseidor_final")
            for flow_index, flow in ordered_flows[1:]:
                if flow.get("posseidor_inicial") != previous_final:
                    errors.append(
                        {
                            "code": "CORPUS_BALL_FLOW_DISCONNECTED",
                            "path": (
                                f"exercicis/{exercise_index}/fluxos_pilota/"
                                f"{flow_index}"
                            ),
                            "message": (
                                f"{exercise_id}: el flux de {ball_id} a "
                                f"{trajectory_id} no conserva la possessió."
                            ),
                        }
                    )
                previous_final = flow.get("posseidor_final")

    uvof_002 = _corpus_exercise(document, "TR-UVOF-002")
    defenders_002 = {
        participant.get("id")
        for participant in uvof_002.get("participants", [])
        if participant.get("equip") == "defensa"
    }
    if defenders_002 != {"D1", "D2", "D3_LOCAL", "D3_OPOSAT"}:
        errors.append(
            {
                "code": "UVOF002_ACTIVE_DEFENDERS",
                "path": "TR-UVOF-002/participants",
                "message": (
                    "TR-UVOF-002 ha de declarar D1, D2 i els dos D3 com a "
                    "defensors reals i actius."
                ),
            }
        )

    balls_002 = {
        ball.get("id"): ball.get("posseidor_inicial")
        for ball in uvof_002.get("pilotes", [])
    }
    if balls_002 != {"B1": "L"}:
        errors.append(
            {
                "code": "UVOF002_INITIAL_BALL",
                "path": "TR-UVOF-002/pilotes",
                "message": "TR-UVOF-002 ha de començar amb B1 en possessió de L.",
            }
        )

    flows_002 = _corpus_ball_flows(uvof_002)
    returns_002 = {
        (
            flow.get("trajectoria_id"),
            flow.get("posseidor_inicial"),
            flow.get("posseidor_final"),
            flow.get("accio"),
        )
        for flow in flows_002
        if flow.get("ordre") in (1, 2)
    }
    expected_returns_002 = {
        ("FINTA_12_23", "L", "EXT", "passada_inicial"),
        ("FINTA_12_23", "EXT", "L", "devolucio_a_inici_canvi_direccio"),
        ("FINTA_23_12", "L", "CE", "passada_inicial"),
        ("FINTA_23_12", "CE", "L", "devolucio_a_inici_canvi_direccio"),
    }
    if returns_002 != expected_returns_002:
        errors.append(
            {
                "code": "UVOF002_PASS_RETURN",
                "path": "TR-UVOF-002/fluxos_pilota",
                "message": (
                    "La passada inicial i la devolució de TR-UVOF-002 han de "
                    "respectar el costat de l'interval inicial."
                ),
            }
        )

    uvof_003 = _corpus_exercise(document, "TR-UVOF-003")
    attackers_003 = {
        participant.get("id")
        for participant in uvof_003.get("participants", [])
        if participant.get("equip") == "atac"
    }
    defenders_003 = {
        participant.get("id")
        for participant in uvof_003.get("participants", [])
        if participant.get("equip") == "defensa"
    }
    expected_attackers_003 = {
        "EXT_LOCAL",
        "L_LOCAL",
        "CE",
        "PV",
        "L_OPOSAT",
        "EXT_OPOSAT",
    }
    expected_defenders_003 = {
        "D1_LOCAL",
        "D2_LOCAL",
        "D3_LOCAL",
        "D3_OPOSAT",
        "D2_OPOSAT",
        "D1_OPOSAT",
    }
    organization_003 = uvof_003.get("organitzacio", {})
    if (
        attackers_003 != expected_attackers_003
        or defenders_003 != expected_defenders_003
        or organization_003.get("sistema_defensiu") != "6-0"
        or organization_003.get("relacio_numerica") != "6x6"
        or uvof_003.get("tipus_exercici") != "situacio_partit"
    ):
        errors.append(
            {
                "code": "UVOF003_FULL_6X6",
                "path": "TR-UVOF-003/participants",
                "message": (
                    "TR-UVOF-003 ha de declarar un atac 6x6 complet contra "
                    "els sis defensors reals del 6:0."
                ),
            }
        )

    balls_003 = {
        ball.get("id"): ball.get("posseidor_inicial")
        for ball in uvof_003.get("pilotes", [])
    }
    if balls_003 != {"B1": "L_LOCAL"}:
        errors.append(
            {
                "code": "UVOF003_INITIAL_BALL",
                "path": "TR-UVOF-003/pilotes",
                "message": "TR-UVOF-003 ha de començar amb B1 en possessió de L_LOCAL.",
            }
        )

    decisions_003 = {
        decision.get("id"): decision
        for decision in _corpus_decisions(uvof_003)
    }
    mandatory_pivot_003 = decisions_003.get("D_PASSADA_PIVOT", {})
    mandatory_wing_003 = decisions_003.get("D_PASSADA_EXTREM", {})
    mandatory_switch_003 = decisions_003.get("D_CANVI_BANDA", {})
    if mandatory_pivot_003.get("caracter") != "obligatori":
        errors.append(
            {
                "code": "UVOF003_PIVOT_PASS_TASK_RULE",
                "path": "TR-UVOF-003/D_PASSADA_PIVOT",
                "message": (
                    "La passada al pivot quan D3 ajuda ha de ser obligatòria "
                    "com a condició pedagògica de TR-UVOF-003."
                ),
            }
        )
    if mandatory_wing_003.get("caracter") != "obligatori":
        errors.append(
            {
                "code": "UVOF003_WING_PASS_GAME_RULE",
                "path": "TR-UVOF-003/D_PASSADA_EXTREM",
                "message": (
                    "La passada a l'extrem quan D1 tanca ha de ser "
                    "obligatòria com a principi general de joc."
                ),
            }
        )
    if mandatory_switch_003.get("caracter") != "obligatori":
        errors.append(
            {
                "code": "UVOF003_SWITCH_TASK_RULE",
                "path": "TR-UVOF-003/D_CANVI_BANDA",
                "message": (
                    "El canvi de banda després d'un encreuament sense "
                    "avantatge ha de ser obligatori dins TR-UVOF-003."
                ),
            }
        )

    wing_pass_003 = next(
        (
            flow
            for flow in _corpus_ball_flows(uvof_003)
            if flow.get("trajectoria_id") == "SUPERA_12_AMB_AJUDA"
        ),
        {},
    )
    if (
        wing_pass_003.get("posseidor_inicial") != "L_LOCAL"
        or wing_pass_003.get("posseidor_final") != "EXT_LOCAL"
        or wing_pass_003.get("accio") != "passada_obligatoria_extrem"
        or wing_pass_003.get("condicio") != "D1_LOCAL_ajuda"
    ):
        errors.append(
            {
                "code": "UVOF003_WING_PASS_FLOW",
                "path": "TR-UVOF-003/fluxos_pilota/SUPERA_12_AMB_AJUDA",
                "message": (
                    "Quan D1 ajuda, B1 ha de passar obligatòriament de "
                    "L_LOCAL a EXT_LOCAL."
                ),
            }
        )

    actions_003 = {
        action.get("accio")
        for phase in uvof_003.get("fases", [])
        for action in phase.get("accions", [])
    }
    if (
        "mantenir_amplitud_anticipar_passada_i_finalitzar_a_espai_exterior"
        not in actions_003
    ):
        errors.append(
            {
                "code": "UVOF003_WING_ANTICIPATION",
                "path": "TR-UVOF-003/accions",
                "message": (
                    "EXT_LOCAL ha d'anticipar la passada mantenint "
                    "l'amplitud i finalitzar a l'espai exterior."
                ),
            }
        )

    exercise_conditions_003 = set(uvof_003.get("condicions_tasca", []))
    expected_conditions_003 = {
        "passada_pivot_obligatoria_si_D3_ajuda",
        "canvi_banda_obligatori_si_encreuament_sense_avantatge",
    }
    if not expected_conditions_003 <= exercise_conditions_003:
        errors.append(
            {
                "code": "UVOF003_TASK_CONDITIONS",
                "path": "TR-UVOF-003/condicions_tasca",
                "message": (
                    "Les dues obligacions pedagògiques de TR-UVOF-003 han "
                    "d'estar separades dels principis generals."
                ),
            }
        )

    uvof_004 = _corpus_exercise(document, "TR-UVOF-004")
    materials_004 = {
        material.get("id"): material.get("funcio")
        for material in uvof_004.get("materials", [])
    }
    if materials_004 != {
        "CON_EXT": "handicap_de_recorregut_exterior_del_segon_defensor",
        "CON_CE": "handicap_de_recorregut_interior_del_segon_defensor",
    }:
        errors.append(
            {
                "code": "UVOF004_D2_CONE_HANDICAP",
                "path": "TR-UVOF-004/materials",
                "message": (
                    "TR-UVOF-004 ha de declarar els cons com a handicaps "
                    "de recorregut de D2, mai com a defensors."
                ),
            }
        )

    flows_004 = _corpus_ball_flows(uvof_004)
    returns_004 = {
        (
            flow.get("trajectoria_id"),
            flow.get("posseidor_inicial"),
            flow.get("posseidor_final"),
        )
        for flow in flows_004
        if flow.get("ordre") in (1, 2)
        and flow.get("trajectoria_id") in {"PASSADA_EXT_12", "PASSADA_CE_23"}
    }
    if returns_004 != {
        ("PASSADA_EXT_12", "L", "EXT"),
        ("PASSADA_EXT_12", "EXT", "L"),
        ("PASSADA_CE_23", "L", "CE"),
        ("PASSADA_CE_23", "CE", "L"),
    }:
        errors.append(
            {
                "code": "UVOF004_PASS_RETURN",
                "path": "TR-UVOF-004/fluxos_pilota",
                "message": (
                    "TR-UVOF-004 ha de conservar la passada i devolució "
                    "que activen 1-2 amb EXT i 2-3 amb CE."
                ),
            }
        )

    uvof_005 = _corpus_exercise(document, "TR-UVOF-005")
    attackers_005 = {
        participant.get("id")
        for participant in uvof_005.get("participants", [])
        if participant.get("equip") == "atac"
    }
    defenders_005 = {
        participant.get("id")
        for participant in uvof_005.get("participants", [])
        if participant.get("equip") == "defensa"
    }
    if (
        attackers_005
        != {"EXT_LOCAL", "L_LOCAL", "CE", "L_OPOSAT", "EXT_OPOSAT", "PV"}
        or defenders_005
        != {
            "D1_LOCAL",
            "D2_LOCAL",
            "D3_CENTRAL",
            "D2_OPOSAT",
            "D1_OPOSAT",
            "DAV",
        }
        or uvof_005.get("tipus_exercici") != "situacio_partit"
    ):
        errors.append(
            {
                "code": "UVOF005_FULL_6X6_51",
                "path": "TR-UVOF-005/participants",
                "message": (
                    "TR-UVOF-005 ha de declarar els sis atacants i els sis "
                    "rols defensius del 5:1, inclòs l'avançat."
                ),
            }
        )

    uvof_006 = _corpus_exercise(document, "TR-UVOF-006")
    defenders_006 = {
        participant.get("id")
        for participant in uvof_006.get("participants", [])
        if participant.get("equip") == "defensa"
    }
    materials_006 = {
        material.get("id"): material.get("funcio")
        for material in uvof_006.get("materials", [])
    }
    if not {"D1_LOCAL", "D2_LOCAL", "D3_LOCAL", "D3_OPOSAT"} <= defenders_006:
        errors.append(
            {
                "code": "UVOF006_ACTIVE_DEFENDERS",
                "path": "TR-UVOF-006/participants",
                "message": (
                    "TR-UVOF-006 ha de conservar D1, D2 i D3 com a "
                    "defensors reals i actius."
                ),
            }
        )
    if materials_006 != {
        "CIL_D2_LOCAL": "handicap_sostingut_pel_segon_defensor_local",
        "CIL_D3_OPOSAT": "handicap_sostingut_pel_tercer_defensor_oposat",
    }:
        errors.append(
            {
                "code": "UVOF006_CYLINDER_HANDICAPS",
                "path": "TR-UVOF-006/materials",
                "message": (
                    "TR-UVOF-006 ha d'explicitar els dos cilindres com a "
                    "handicaps sostinguts per defensors reals."
                ),
            }
        )
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


def _duplicate_ids(items: list[Document]) -> set[str]:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for item in items:
        item_id = item.get("id")
        if not isinstance(item_id, str):
            continue
        if item_id in seen:
            duplicates.add(item_id)
        seen.add(item_id)
    return duplicates


def _spatial_relations(document: Document) -> list[Document]:
    relations = [
        relation
        for state in document.get("estats", [])
        for relation in state.get("relacions", [])
    ]
    relations.extend(
        relation
        for branch in document.get("branques_decisionals", [])
        for alternative in branch.get("alternatives", [])
        for relation in alternative.get("efectes_espacials", [])
    )
    return relations


def _semantic_exercise_id(document: Document) -> str | None:
    return (
        document.get("identificacio", {}).get("id")
        or document.get("id")
    )


def _semantic_collections(document: Document) -> dict[str, list[Document]]:
    model = document.get("model_exercici")
    if isinstance(model, dict):
        return {
            "participants": model.get("participants_plantilla", []),
            "materials": model.get("materials", []),
            "pilotes": model.get("pilotes", []),
            "espais": model.get("espais_i_intervals", []),
            "fases": model.get("subaccions", []),
            "decisions": model.get("situacions_decisionals", []),
        }
    return {
        "participants": document.get("participants", []),
        "materials": document.get("materials", []),
        "pilotes": document.get("pilotes", []),
        "espais": document.get("espais_i_intervals", []),
        "fases": document.get("fases", []),
        "decisions": _corpus_decisions(document),
    }


def _spatial_custom_errors(
    document: Document,
    semantic_document: Document,
) -> list[Document]:
    errors: list[Document] = []

    relational_content = {
        key: value for key, value in document.items() if key != "meta"
    }
    if _contains_forbidden_geometry(relational_content):
        errors.append(
            {
                "code": "SPATIAL_NO_GEOMETRY",
                "path": "",
                "message": (
                    "El contracte relacional no pot contenir coordenades, "
                    "geometria resolta ni instruccions SVG."
                ),
            }
        )

    exercise_id = _semantic_exercise_id(semantic_document)
    if document.get("font_semantica", {}).get("exercici_id") != exercise_id:
        errors.append(
            {
                "code": "SPATIAL_SOURCE_EXERCISE",
                "path": "font_semantica/exercici_id",
                "message": "L'exercici font no coincideix amb el document semàntic.",
            }
        )

    collections = {
        "nodes": document.get("nodes", []),
        "espais": document.get("espais", []),
        "estats": document.get("estats", []),
        "transicions": document.get("transicions", []),
        "fluxos_pilota": document.get("fluxos_pilota", []),
        "branques_decisionals": document.get("branques_decisionals", []),
    }
    for path, items in collections.items():
        for duplicate_id in sorted(_duplicate_ids(items)):
            errors.append(
                {
                    "code": "SPATIAL_DUPLICATE_ID",
                    "path": path,
                    "message": f"L'identificador {duplicate_id} està duplicat.",
                }
            )

    nodes = document.get("nodes", [])
    spaces = document.get("espais", [])
    node_ids = {node.get("id") for node in nodes}
    space_ids = {space.get("id") for space in spaces}
    all_reference_ids = node_ids | space_ids

    semantic = _semantic_collections(semantic_document)
    semantic_participant_ids = {
        participant.get("id")
        for participant in semantic["participants"]
    }
    semantic_material_ids = {
        material.get("id") for material in semantic["materials"]
    }
    semantic_ball_holders = {
        ball.get("id"): ball.get("posseidor_inicial")
        for ball in semantic["pilotes"]
    }
    semantic_space_ids = {
        space.get("id")
        for space in semantic["espais"]
    }
    semantic_phase_ids = {
        phase.get("id") for phase in semantic["fases"]
    }
    semantic_decision_ids = {
        decision.get("id") for decision in semantic["decisions"]
    }

    for index, node in enumerate(nodes):
        node_id = node.get("id")
        if (
            node.get("classe") == "participant"
            and node_id not in semantic_participant_ids
        ):
            errors.append(
                {
                    "code": "SPATIAL_UNKNOWN_PARTICIPANT",
                    "path": f"nodes/{index}/id",
                    "message": f"El participant {node_id} no existeix a la font.",
                }
            )
        if (
            node.get("classe") == "material"
            and node_id not in semantic_material_ids
        ):
            errors.append(
                {
                    "code": "SPATIAL_UNKNOWN_MATERIAL",
                    "path": f"nodes/{index}/id",
                    "message": f"El material {node_id} no existeix a la font.",
                }
            )
        if (
            node.get("classe") == "pilota"
            and node_id not in semantic_ball_holders
        ):
            errors.append(
                {
                    "code": "SPATIAL_UNKNOWN_BALL",
                    "path": f"nodes/{index}/id",
                    "message": f"La pilota {node_id} no existeix a la font.",
                }
            )

    spaces_by_id = {space.get("id"): space for space in spaces}
    for index, space in enumerate(spaces):
        definitions = [space.get("definicio", {})] + space.get(
            "restriccions", []
        )
        for definition_index, definition in enumerate(definitions):
            definition_path = (
                "definicio"
                if definition_index == 0
                else f"restriccions/{definition_index - 1}"
            )
            for argument in definition.get("arguments", []):
                if argument not in node_ids:
                    errors.append(
                        {
                            "code": "SPATIAL_UNKNOWN_BOUNDARY",
                            "path": (
                                f"espais/{index}/{definition_path}/arguments"
                            ),
                            "message": (
                                f"El referent {argument} que defineix "
                                f"{space.get('id')} no existeix."
                            ),
                        }
                    )

        semantic_reference = space.get("referencia_semantica")
        if semantic_reference:
            referenced_id = semantic_reference.rsplit("/", 1)[-1]
            if referenced_id not in semantic_space_ids:
                errors.append(
                    {
                        "code": "SPATIAL_UNKNOWN_SEMANTIC_SPACE",
                        "path": f"espais/{index}/referencia_semantica",
                        "message": (
                            f"L'espai semàntic {referenced_id} no existeix "
                            "a la font."
                        ),
                    }
                )

        current_arguments = set(
            space.get("definicio", {}).get("arguments", [])
        )
        for adjacency_index, adjacency in enumerate(
            space.get("contiguitats", [])
        ):
            adjacent_id = adjacency.get("espai")
            shared_id = adjacency.get("referent_compartit")
            adjacent = spaces_by_id.get(adjacent_id)
            if adjacent is None:
                errors.append(
                    {
                        "code": "SPATIAL_UNKNOWN_ADJACENT_SPACE",
                        "path": (
                            f"espais/{index}/contiguitats/{adjacency_index}/espai"
                        ),
                        "message": f"L'espai contigu {adjacent_id} no existeix.",
                    }
                )
                continue

            reverse = {
                (
                    item.get("espai"),
                    item.get("referent_compartit"),
                )
                for item in adjacent.get("contiguitats", [])
            }
            if (space.get("id"), shared_id) not in reverse:
                errors.append(
                    {
                        "code": "SPATIAL_ASYMMETRIC_ADJACENCY",
                        "path": f"espais/{index}/contiguitats/{adjacency_index}",
                        "message": (
                            f"La contigüitat {space.get('id')}–{adjacent_id} "
                            "ha de declarar-se als dos espais."
                        ),
                    }
                )

            adjacent_arguments = set(
                adjacent.get("definicio", {}).get("arguments", [])
            )
            if (
                shared_id not in node_ids
                or shared_id not in current_arguments
                or shared_id not in adjacent_arguments
            ):
                errors.append(
                    {
                        "code": "SPATIAL_INVALID_SHARED_REFERENCE",
                        "path": (
                            f"espais/{index}/contiguitats/"
                            f"{adjacency_index}/referent_compartit"
                        ),
                        "message": (
                            f"{shared_id} ha de definir tots dos espais "
                            "contigus."
                        ),
                    }
                )

        for phase_id in space.get("fases_actives", []):
            if phase_id not in semantic_phase_ids:
                errors.append(
                    {
                        "code": "SPATIAL_UNKNOWN_PHASE",
                        "path": f"espais/{index}/fases_actives",
                        "message": f"La fase {phase_id} no existeix a la font.",
                    }
                )

    for collection_name in ("estats", "transicions", "branques_decisionals"):
        for index, item in enumerate(document.get(collection_name, [])):
            phase_id = item.get("fase_ref")
            if phase_id not in semantic_phase_ids:
                errors.append(
                    {
                        "code": "SPATIAL_UNKNOWN_PHASE",
                        "path": f"{collection_name}/{index}/fase_ref",
                        "message": f"La fase {phase_id} no existeix a la font.",
                    }
                )

    for index, flow in enumerate(document.get("fluxos_pilota", [])):
        phase_id = flow.get("fase_ref")
        if phase_id not in semantic_phase_ids:
            errors.append(
                {
                    "code": "SPATIAL_UNKNOWN_PHASE",
                    "path": f"fluxos_pilota/{index}/fase_ref",
                    "message": f"La fase {phase_id} no existeix a la font.",
                }
            )

    for index, branch in enumerate(document.get("branques_decisionals", [])):
        decision_refs = branch.get("decisions_semantiques_ref") or [
            branch.get("decisio_semantica_ref")
        ]
        for decision_ref in decision_refs:
            decision_id = str(decision_ref).rsplit("/", 1)[-1]
            if semantic_decision_ids and decision_id not in semantic_decision_ids:
                errors.append(
                    {
                        "code": "SPATIAL_UNKNOWN_DECISION",
                        "path": f"branques_decisionals/{index}",
                        "message": (
                            f"La decisió {decision_id} no existeix a la font."
                        ),
                    }
                )

    for index, relation in enumerate(_spatial_relations(document)):
        subject = relation.get("subjecte")
        if subject not in node_ids:
            errors.append(
                {
                    "code": "SPATIAL_UNKNOWN_RELATION_SUBJECT",
                    "path": f"relacions/{index}/subjecte",
                    "message": f"El subjecte relacional {subject} no existeix.",
                }
            )
        for object_id in relation.get("objectes", []):
            if object_id not in all_reference_ids:
                errors.append(
                    {
                        "code": "SPATIAL_UNKNOWN_RELATION_OBJECT",
                        "path": f"relacions/{index}/objectes",
                        "message": f"L'objecte relacional {object_id} no existeix.",
                    }
                )

    transitions = document.get("transicions", [])
    for index, transition in enumerate(transitions):
        actor = transition.get("actor")
        if actor not in node_ids:
            errors.append(
                {
                    "code": "SPATIAL_UNKNOWN_TRANSITION_ACTOR",
                    "path": f"transicions/{index}/actor",
                    "message": f"L'actor {actor} no existeix.",
                }
            )
        for field in ("des_de", "cap_a"):
            space_id = transition.get(field)
            if space_id is not None and space_id not in space_ids:
                errors.append(
                    {
                        "code": "SPATIAL_UNKNOWN_TRANSITION_SPACE",
                        "path": f"transicions/{index}/{field}",
                        "message": f"L'espai {space_id} no existeix.",
                    }
                )
        for space_id in transition.get("via", []):
            if space_id not in space_ids:
                errors.append(
                    {
                        "code": "SPATIAL_UNKNOWN_TRANSITION_SPACE",
                        "path": f"transicions/{index}/via",
                        "message": f"L'espai de pas {space_id} no existeix.",
                    }
                )
        reference = transition.get("referencia_oposicional")
        if reference is not None and reference not in node_ids:
            errors.append(
                {
                    "code": "SPATIAL_UNKNOWN_OPPOSITION_REFERENCE",
                    "path": f"transicions/{index}/referencia_oposicional",
                    "message": f"La referència {reference} no existeix.",
                }
            )

    transition_groups: dict[tuple[str, str], list[tuple[int, Document]]] = {}
    for index, transition in enumerate(transitions):
        actor = transition.get("actor")
        trajectory_id = transition.get("trajectoria_id", "LEGACY")
        transition_groups.setdefault((trajectory_id, actor), []).append(
            (index, transition)
        )
    for (trajectory_id, actor), indexed_transitions in transition_groups.items():
        if trajectory_id == "LEGACY":
            ordered_transitions = indexed_transitions
        else:
            ordered_transitions = sorted(
                indexed_transitions,
                key=lambda item: (item[1].get("ordre", item[0] + 1), item[0]),
            )
        previous: Document | None = None
        for index, transition in ordered_transitions:
            if (
                previous
                and transition.get("des_de") is not None
                and previous.get("cap_a") != transition.get("des_de")
            ):
                errors.append(
                    {
                        "code": "SPATIAL_DISCONNECTED_TRANSITION",
                        "path": f"transicions/{index}/des_de",
                        "message": (
                            f"La trajectòria {trajectory_id} de {actor} comença "
                            f"a {transition.get('des_de')}, però el tram anterior "
                            f"acabava a {previous.get('cap_a')}."
                        ),
                    }
                )
            previous = transition

    participant_node_ids = {
        node.get("id") for node in nodes if node.get("classe") == "participant"
    }
    ball_node_ids = {
        node.get("id") for node in nodes if node.get("classe") == "pilota"
    }
    ball_flow_groups: dict[tuple[str, str], list[tuple[int, Document]]] = {}
    for index, flow in enumerate(document.get("fluxos_pilota", [])):
        ball_id = flow.get("pilota_id")
        if ball_id not in ball_node_ids:
            errors.append(
                {
                    "code": "SPATIAL_UNKNOWN_BALL",
                    "path": f"fluxos_pilota/{index}/pilota_id",
                    "message": f"La pilota {ball_id} no existeix com a node.",
                }
            )
        for holder_field in ("posseidor_inicial", "posseidor_final"):
            holder = flow.get(holder_field)
            if holder not in participant_node_ids:
                errors.append(
                    {
                        "code": "SPATIAL_UNKNOWN_BALL_HOLDER",
                        "path": f"fluxos_pilota/{index}/{holder_field}",
                        "message": f"El posseïdor {holder} no és un participant.",
                    }
                )
        trajectory_id = flow.get("trajectoria_id")
        ball_flow_groups.setdefault((trajectory_id, ball_id), []).append(
            (index, flow)
        )

    for (trajectory_id, ball_id), indexed_flows in ball_flow_groups.items():
        ordered_flows = sorted(
            indexed_flows,
            key=lambda item: (item[1].get("ordre", item[0] + 1), item[0]),
        )
        first_index, first_flow = ordered_flows[0]
        expected_holder = semantic_ball_holders.get(ball_id)
        if first_flow.get("posseidor_inicial") != expected_holder:
            errors.append(
                {
                    "code": "SPATIAL_BALL_INITIAL_HOLDER",
                    "path": f"fluxos_pilota/{first_index}/posseidor_inicial",
                    "message": (
                        f"El flux {trajectory_id} de {ball_id} no comença amb "
                        "el posseïdor declarat a la font."
                    ),
                }
            )
        previous_final = first_flow.get("posseidor_final")
        for index, flow in ordered_flows[1:]:
            if flow.get("posseidor_inicial") != previous_final:
                errors.append(
                    {
                        "code": "SPATIAL_BALL_FLOW_DISCONNECTED",
                        "path": f"fluxos_pilota/{index}/posseidor_inicial",
                        "message": (
                            f"El flux {trajectory_id} de {ball_id} no conserva "
                            "la possessió entre passades."
                        ),
                    }
                )
            previous_final = flow.get("posseidor_final")

    invariant_operators = {
        invariant.get("operador") for invariant in document.get("invariants", [])
    }
    for required_operator in (
        "sense_coordenades",
        "identitat_persistent",
        "decisio_no_predeterminada",
    ):
        if required_operator not in invariant_operators:
            errors.append(
                {
                    "code": "SPATIAL_REQUIRED_INVARIANT",
                    "path": "invariants",
                    "message": (
                        f"Falta l'invariant relacional {required_operator}."
                    ),
                }
            )

    return errors


def validate_spatial_relations_document(
    document: Document,
    schema: Document,
    semantic_document: Document,
) -> Document:
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
        errors.extend(_spatial_custom_errors(document, semantic_document))

    return {
        "exercise": document.get("font_semantica", {}).get("exercici_id"),
        "schema": schema.get("$id"),
        "valid": not errors,
        "errors": errors,
        "warnings": [],
        "summary": {
            "node_count": len(document.get("nodes", [])),
            "space_count": len(document.get("espais", [])),
            "state_count": len(document.get("estats", [])),
            "transition_count": len(document.get("transicions", [])),
            "ball_flow_count": len(document.get("fluxos_pilota", [])),
            "branch_count": len(document.get("branques_decisionals", [])),
            "error_count": len(errors),
            "structural_error_count": len(structural),
            "relational_error_count": len(errors) - len(structural),
        },
        "geometry_generated": False,
        "render_generated": False,
    }


def validate_spatial_relations(
    spatial_path: Path = SPATIAL_RELATIONS,
    schema_path: Path = SPATIAL_RELATIONS_SCHEMA,
    semantic_path: Path = EXERCISE,
    output_path: Path = SPATIAL_RELATIONS_OUTPUT,
) -> Document:
    document = json.loads(spatial_path.read_text(encoding="utf-8"))
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    semantic_document = json.loads(semantic_path.read_text(encoding="utf-8"))
    report = validate_spatial_relations_document(
        document,
        schema,
        semantic_document,
    )
    output_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return report


def validate_all_spatial_relations(
    corpus_path: Path = CORPUS,
) -> list[Document]:
    corpus_document = json.loads(corpus_path.read_text(encoding="utf-8"))
    reports: list[Document] = []
    for spatial_path in sorted(
        (ROOT / "exercises").glob("TR-*/spatial-relations.json")
    ):
        document = json.loads(spatial_path.read_text(encoding="utf-8"))
        version = document.get("meta", {}).get("versio_contracte", "")
        version_parts = version.split(".")
        if len(version_parts) < 2:
            reports.append(
                {
                    "exercise": document.get("font_semantica", {}).get(
                        "exercici_id"
                    ),
                    "schema": None,
                    "valid": False,
                    "errors": [
                        {
                            "code": "SPATIAL_SCHEMA_VERSION",
                            "path": "meta/versio_contracte",
                            "message": f"Versió de contracte no reconeguda: {version}",
                        }
                    ],
                    "warnings": [],
                    "summary": {
                        "error_count": 1,
                        "structural_error_count": 1,
                        "relational_error_count": 0,
                    },
                    "geometry_generated": False,
                    "render_generated": False,
                }
            )
            continue

        schema_path = (
            ROOT
            / "schema"
            / (
                "traca.spatial-relations.schema.v"
                f"{version_parts[0]}.{version_parts[1]}.json"
            )
        )
        exercise_id = document.get("font_semantica", {}).get("exercici_id")
        sibling_semantic_path = spatial_path.with_name("semantic.json")
        if sibling_semantic_path.exists():
            semantic_document = json.loads(
                sibling_semantic_path.read_text(encoding="utf-8")
            )
        else:
            semantic_document = _corpus_exercise(corpus_document, exercise_id)

        if not schema_path.exists():
            reports.append(
                {
                    "exercise": exercise_id,
                    "schema": str(schema_path),
                    "valid": False,
                    "errors": [
                        {
                            "code": "SPATIAL_SCHEMA_MISSING",
                            "path": "meta/versio_contracte",
                            "message": f"No existeix l'esquema per a la versió {version}.",
                        }
                    ],
                    "warnings": [],
                    "summary": {
                        "error_count": 1,
                        "structural_error_count": 1,
                        "relational_error_count": 0,
                    },
                    "geometry_generated": False,
                    "render_generated": False,
                }
            )
            continue

        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        report = validate_spatial_relations_document(
            document,
            schema,
            semantic_document,
        )
        output_path = spatial_path.with_name("spatial-relations.validation.json")
        output_path.write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        reports.append(report)
    return reports


def main() -> int:
    exercise_report = validate()
    corpus_report = validate_corpus()
    spatial_reports = validate_all_spatial_relations()
    combined = {
        "valid": (
            exercise_report["valid"]
            and corpus_report["valid"]
            and all(report["valid"] for report in spatial_reports)
        ),
        "reports": [exercise_report, corpus_report, *spatial_reports],
    }
    print(json.dumps(combined, ensure_ascii=False, indent=2))
    return 0 if combined["valid"] else 1


if __name__ == "__main__":
    sys.exit(main())
