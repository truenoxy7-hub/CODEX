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
    ROOT / "schema" / "traca.spatial-relations.schema.v0.1.json"
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

    exercise_id = semantic_document.get("identificacio", {}).get("id")
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

    semantic_model = semantic_document.get("model_exercici", {})
    semantic_participant_ids = {
        participant.get("id")
        for participant in semantic_model.get("participants_plantilla", [])
    }
    semantic_material_ids = {
        material.get("id") for material in semantic_model.get("materials", [])
    }
    semantic_space_ids = {
        space.get("id")
        for space in semantic_model.get("espais_i_intervals", [])
    }
    semantic_phase_ids = {
        phase.get("id") for phase in semantic_model.get("subaccions", [])
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

    previous_by_actor: dict[str, Document] = {}
    for index, transition in enumerate(transitions):
        actor = transition.get("actor")
        previous = previous_by_actor.get(actor)
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
                        f"La transició de {actor} comença a "
                        f"{transition.get('des_de')}, però el tram anterior "
                        f"acabava a {previous.get('cap_a')}."
                    ),
                }
            )
        previous_by_actor[actor] = transition

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


def main() -> int:
    exercise_report = validate()
    corpus_report = validate_corpus()
    spatial_report = validate_spatial_relations()
    combined = {
        "valid": (
            exercise_report["valid"]
            and corpus_report["valid"]
            and spatial_report["valid"]
        ),
        "reports": [exercise_report, corpus_report, spatial_report],
    }
    print(json.dumps(combined, ensure_ascii=False, indent=2))
    return 0 if combined["valid"] else 1


if __name__ == "__main__":
    sys.exit(main())
