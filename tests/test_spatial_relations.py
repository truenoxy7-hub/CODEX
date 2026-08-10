from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

from scripts.validate_semantic import validate_spatial_relations_document

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def spatial_document() -> dict:
    return json.loads(
        (
            ROOT
            / "exercises"
            / "TR-UVOF-001"
            / "spatial-relations.json"
        ).read_text(encoding="utf-8")
    )


@pytest.fixture
def spatial_schema() -> dict:
    return json.loads(
        (
            ROOT
            / "schema"
            / "traca.spatial-relations.schema.v0.2.json"
        ).read_text(encoding="utf-8")
    )


@pytest.fixture
def semantic_document() -> dict:
    return json.loads(
        (
            ROOT / "exercises" / "TR-UVOF-001" / "semantic.json"
        ).read_text(encoding="utf-8")
    )


def _error_codes(report: dict) -> list[str]:
    return [error["code"] for error in report["errors"]]


def test_spatial_schema_is_a_valid_draft_2020_12_schema(
    spatial_schema,
) -> None:
    Draft202012Validator.check_schema(spatial_schema)


def test_repository_spatial_contract_passes(
    spatial_document,
    spatial_schema,
    semantic_document,
) -> None:
    report = validate_spatial_relations_document(
        spatial_document,
        spatial_schema,
        semantic_document,
    )

    assert report["valid"] is True
    assert report["errors"] == []
    assert report["summary"] == {
        "node_count": 17,
        "space_count": 9,
        "state_count": 7,
        "transition_count": 6,
        "ball_flow_count": 0,
        "branch_count": 2,
        "error_count": 0,
        "structural_error_count": 0,
        "relational_error_count": 0,
    }
    assert report["geometry_generated"] is False
    assert report["render_generated"] is False
    wing_space = next(
        space
        for space in spatial_document["espais"]
        if space["id"] == "ESPAI_EXTREM_Z2"
    )
    assert wing_space["definicio"] == {
        "operador": "entre",
        "arguments": ["LINIA_FONS", "D_Z2"],
    }
    assert wing_space["restriccions"] == [
        {"operador": "interior_de", "arguments": ["AREA_6M"]}
    ]


def test_spatial_contract_rejects_coordinates(
    spatial_document,
    spatial_schema,
    semantic_document,
) -> None:
    document = deepcopy(spatial_document)
    document["x"] = 100

    report = validate_spatial_relations_document(
        document,
        spatial_schema,
        semantic_document,
    )

    assert report["valid"] is False
    assert "SCHEMA_ERROR" in _error_codes(report)


def test_spatial_contract_rejects_unknown_relation_object(
    spatial_document,
    spatial_schema,
    semantic_document,
) -> None:
    document = deepcopy(spatial_document)
    document["estats"][0]["relacions"][0]["objectes"] = ["INT_INEXISTENT"]

    report = validate_spatial_relations_document(
        document,
        spatial_schema,
        semantic_document,
    )

    assert "SPATIAL_UNKNOWN_RELATION_OBJECT" in _error_codes(report)


def test_spatial_contract_rejects_unknown_space_constraint(
    spatial_document,
    spatial_schema,
    semantic_document,
) -> None:
    document = deepcopy(spatial_document)
    wing_space = next(
        space
        for space in document["espais"]
        if space["id"] == "ESPAI_EXTREM_Z2"
    )
    wing_space["restriccions"][0]["arguments"] = ["AREA_INEXISTENT"]

    report = validate_spatial_relations_document(
        document,
        spatial_schema,
        semantic_document,
    )

    assert "SPATIAL_UNKNOWN_BOUNDARY" in _error_codes(report)


def test_spatial_contract_rejects_asymmetric_adjacency(
    spatial_document,
    spatial_schema,
    semantic_document,
) -> None:
    document = deepcopy(spatial_document)
    int_2 = next(space for space in document["espais"] if space["id"] == "INT_2")
    int_2["contiguitats"] = [
        item for item in int_2["contiguitats"] if item["espai"] != "INT_1"
    ]

    report = validate_spatial_relations_document(
        document,
        spatial_schema,
        semantic_document,
    )

    assert "SPATIAL_ASYMMETRIC_ADJACENCY" in _error_codes(report)


def test_spatial_contract_rejects_false_shared_reference(
    spatial_document,
    spatial_schema,
    semantic_document,
) -> None:
    document = deepcopy(spatial_document)
    int_1 = next(space for space in document["espais"] if space["id"] == "INT_1")
    int_2 = next(space for space in document["espais"] if space["id"] == "INT_2")
    int_1["contiguitats"][0]["referent_compartit"] = "D_Z1"
    reciprocal = next(
        item for item in int_2["contiguitats"] if item["espai"] == "INT_1"
    )
    reciprocal["referent_compartit"] = "D_Z1"

    report = validate_spatial_relations_document(
        document,
        spatial_schema,
        semantic_document,
    )

    assert "SPATIAL_INVALID_SHARED_REFERENCE" in _error_codes(report)


def test_spatial_contract_rejects_disconnected_transition(
    spatial_document,
    spatial_schema,
    semantic_document,
) -> None:
    document = deepcopy(spatial_document)
    transition = next(
        item
        for item in document["transicions"]
        if item["id"] == "T_SA2_ATAC"
    )
    transition["des_de"] = "INT_1"

    report = validate_spatial_relations_document(
        document,
        spatial_schema,
        semantic_document,
    )

    assert "SPATIAL_DISCONNECTED_TRANSITION" in _error_codes(report)


def test_spatial_contract_rejects_wrong_semantic_source(
    spatial_document,
    spatial_schema,
    semantic_document,
) -> None:
    document = deepcopy(spatial_document)
    document["font_semantica"]["exercici_id"] = "TR-UVOF-999"

    report = validate_spatial_relations_document(
        document,
        spatial_schema,
        semantic_document,
    )

    assert "SPATIAL_SOURCE_EXERCISE" in _error_codes(report)


def test_spatial_contract_requires_open_decisions(
    spatial_document,
    spatial_schema,
    semantic_document,
) -> None:
    document = deepcopy(spatial_document)
    document["branques_decisionals"][0]["resolucio"] = "predeterminada"

    report = validate_spatial_relations_document(
        document,
        spatial_schema,
        semantic_document,
    )

    assert "SCHEMA_ERROR" in _error_codes(report)


@pytest.fixture
def spatial_document_002() -> dict:
    return json.loads(
        (
            ROOT
            / "exercises"
            / "TR-UVOF-002"
            / "spatial-relations.json"
        ).read_text(encoding="utf-8")
    )


@pytest.fixture
def semantic_document_002() -> dict:
    corpus = json.loads(
        (ROOT / "corpus" / "uvof.semantic.json").read_text(encoding="utf-8")
    )
    return next(
        exercise
        for exercise in corpus["exercicis"]
        if exercise["id"] == "TR-UVOF-002"
    )


def test_uvof002_spatial_contract_represents_validated_topology_and_flows(
    spatial_document_002,
    spatial_schema,
    semantic_document_002,
) -> None:
    report = validate_spatial_relations_document(
        spatial_document_002,
        spatial_schema,
        semantic_document_002,
    )

    assert report["valid"] is True
    assert report["summary"] == {
        "node_count": 13,
        "space_count": 7,
        "state_count": 8,
        "transition_count": 13,
        "ball_flow_count": 8,
        "branch_count": 2,
        "error_count": 0,
        "structural_error_count": 0,
        "relational_error_count": 0,
    }
    nodes = {node["id"]: node for node in spatial_document_002["nodes"]}
    assert all(
        nodes[defender_id]["classe"] == "participant"
        for defender_id in ("D1", "D2", "D3_LOCAL", "D3_OPOSAT")
    )
    interval_33 = next(
        space for space in spatial_document_002["espais"]
        if space["id"] == "INT_33"
    )
    assert interval_33["definicio"]["arguments"] == [
        "D3_LOCAL",
        "D3_OPOSAT",
    ]
    central_cross = next(
        transition for transition in spatial_document_002["transicions"]
        if transition["id"] == "T_CE_ENCREUAMENT_12"
    )
    assert central_cross["tipus"] == "encreuament"
    assert central_cross["via"] == ["POS_DARRERE_L"]


def test_uvof002_rejects_disconnected_ball_flow(
    spatial_document_002,
    spatial_schema,
    semantic_document_002,
) -> None:
    document = deepcopy(spatial_document_002)
    return_flow = next(
        flow for flow in document["fluxos_pilota"]
        if flow["id"] == "FP_12_23_DEVOLUCIO"
    )
    return_flow["posseidor_inicial"] = "CE"

    report = validate_spatial_relations_document(
        document,
        spatial_schema,
        semantic_document_002,
    )

    assert "SPATIAL_BALL_FLOW_DISCONNECTED" in _error_codes(report)


def test_uvof002_rejects_unknown_semantic_decision(
    spatial_document_002,
    spatial_schema,
    semantic_document_002,
) -> None:
    document = deepcopy(spatial_document_002)
    document["branques_decisionals"][0]["decisions_semantiques_ref"][0] = (
        "fases/F1/decisions/D_INEXISTENT"
    )

    report = validate_spatial_relations_document(
        document,
        spatial_schema,
        semantic_document_002,
    )

    assert "SPATIAL_UNKNOWN_DECISION" in _error_codes(report)


@pytest.fixture
def spatial_document_003() -> dict:
    return json.loads(
        (
            ROOT
            / "exercises"
            / "TR-UVOF-003"
            / "spatial-relations.json"
        ).read_text(encoding="utf-8")
    )


@pytest.fixture
def semantic_document_003() -> dict:
    corpus = json.loads(
        (ROOT / "corpus" / "uvof.semantic.json").read_text(encoding="utf-8")
    )
    return next(
        exercise
        for exercise in corpus["exercicis"]
        if exercise["id"] == "TR-UVOF-003"
    )


def test_uvof003_spatial_contract_represents_full_6x6_and_task_rules(
    spatial_document_003,
    spatial_schema,
    semantic_document_003,
) -> None:
    report = validate_spatial_relations_document(
        spatial_document_003,
        spatial_schema,
        semantic_document_003,
    )

    assert report["valid"] is True
    assert report["summary"] == {
        "node_count": 17,
        "space_count": 11,
        "state_count": 9,
        "transition_count": 11,
        "ball_flow_count": 8,
        "branch_count": 4,
        "error_count": 0,
        "structural_error_count": 0,
        "relational_error_count": 0,
    }
    nodes = {node["id"]: node for node in spatial_document_003["nodes"]}
    assert all(
        nodes[defender_id]["classe"] == "participant"
        for defender_id in (
            "D1_LOCAL",
            "D2_LOCAL",
            "D3_LOCAL",
            "D3_OPOSAT",
            "D2_OPOSAT",
            "D1_OPOSAT",
        )
    )
    pivot_pass = next(
        flow for flow in spatial_document_003["fluxos_pilota"]
        if flow["id"] == "FP_23_AJUDA_PIVOT"
    )
    assert pivot_pass["estat_coneixement"] == "condicio_tasca"
    assert "obligatoria_com_a_condicio_tasca" in pivot_pass["qualificadors"]
    wing_pass = next(
        flow for flow in spatial_document_003["fluxos_pilota"]
        if flow["id"] == "FP_12_AJUDA_EXTREM"
    )
    assert wing_pass["estat_coneixement"] == "validat"
    assert "obligatoria_com_a_principi_de_joc" in wing_pass["qualificadors"]
    wing_finish = next(
        transition for transition in spatial_document_003["transicions"]
        if transition["id"] == "T_EXT_LOCAL_FINALITZA"
    )
    assert {
        "anticipa_passada",
        "rep_dins_espai_exterior",
        "salt_cap_al_centre",
    } <= set(wing_finish["qualificadors"])
    wing_branch = next(
        branch for branch in spatial_document_003["branques_decisionals"]
        if branch["id"] == "BR_SUPERA_12"
    )
    wing_help = next(
        alternative for alternative in wing_branch["alternatives"]
        if alternative["id"] == "A_12_AMB_AJUDA"
    )
    wing_effects = [
        relation for relation in wing_help["efectes_espacials"]
        if relation["subjecte"] == "EXT_LOCAL"
    ]
    assert {
        "mante_amplitud_a",
        "disponible_per_rebre_a",
        "ataca",
        "salta_cap_a",
    } <= {relation["predicat"] for relation in wing_effects}
    assert all(
        relation["caracter"] == "obligatori"
        for relation in wing_effects
    )
    switch_branch = next(
        branch for branch in spatial_document_003["branques_decisionals"]
        if branch["id"] == "BR_CANVI_BANDA"
    )
    assert switch_branch["caracter"] == "obligatori"
    pivot_blocks = {
        tuple(relation["objectes"])
        for state in spatial_document_003["estats"]
        for relation in state["relacions"]
        if relation["subjecte"] == "PV"
        and relation["predicat"] == "per_davant_de"
    }
    assert pivot_blocks == {("D3_LOCAL",), ("D3_OPOSAT",)}
    assert {
        flow["posseidor_final"]
        for flow in spatial_document_003["fluxos_pilota"]
        if flow["id"] in {"FP_23_CANVI_BANDA", "FP_12_CANVI_BANDA"}
    } == {"L_OPOSAT"}


def test_uvof003_rejects_disconnected_change_of_side_flow(
    spatial_document_003,
    spatial_schema,
    semantic_document_003,
) -> None:
    document = deepcopy(spatial_document_003)
    switch_flow = next(
        flow for flow in document["fluxos_pilota"]
        if flow["id"] == "FP_23_CANVI_BANDA"
    )
    switch_flow["posseidor_inicial"] = "CE"

    report = validate_spatial_relations_document(
        document,
        spatial_schema,
        semantic_document_003,
    )

    assert "SPATIAL_BALL_FLOW_DISCONNECTED" in _error_codes(report)


@pytest.mark.parametrize(
    ("exercise_id", "expected_summary"),
    [
        (
            "TR-UVOF-004",
            {
                "node_count": 13,
                "space_count": 6,
                "state_count": 5,
                "transition_count": 10,
                "ball_flow_count": 6,
                "branch_count": 3,
                "error_count": 0,
                "structural_error_count": 0,
                "relational_error_count": 0,
            },
        ),
        (
            "TR-UVOF-005",
            {
                "node_count": 16,
                "space_count": 7,
                "state_count": 4,
                "transition_count": 6,
                "ball_flow_count": 0,
                "branch_count": 1,
                "error_count": 0,
                "structural_error_count": 0,
                "relational_error_count": 0,
            },
        ),
        (
            "TR-UVOF-006",
            {
                "node_count": 18,
                "space_count": 8,
                "state_count": 7,
                "transition_count": 9,
                "ball_flow_count": 9,
                "branch_count": 4,
                "error_count": 0,
                "structural_error_count": 0,
                "relational_error_count": 0,
            },
        ),
        (
            "TR-UVOF-007",
            {
                "node_count": 11,
                "space_count": 5,
                "state_count": 4,
                "transition_count": 5,
                "ball_flow_count": 0,
                "branch_count": 2,
                "error_count": 0,
                "structural_error_count": 0,
                "relational_error_count": 0,
            },
        ),
        (
            "TR-UVOF-008",
            {
                "node_count": 16,
                "space_count": 7,
                "state_count": 4,
                "transition_count": 6,
                "ball_flow_count": 0,
                "branch_count": 1,
                "error_count": 0,
                "structural_error_count": 0,
                "relational_error_count": 0,
            },
        ),
        (
            "TR-UVOF-009",
            {
                "node_count": 16,
                "space_count": 7,
                "state_count": 7,
                "transition_count": 9,
                "ball_flow_count": 4,
                "branch_count": 1,
                "error_count": 0,
                "structural_error_count": 0,
                "relational_error_count": 0,
            },
        ),
    ],
)
def test_uvof004_to_009_spatial_contracts_pass(
    exercise_id,
    expected_summary,
    spatial_schema,
) -> None:
    spatial_document = json.loads(
        (
            ROOT / "exercises" / exercise_id / "spatial-relations.json"
        ).read_text(encoding="utf-8")
    )
    corpus = json.loads(
        (ROOT / "corpus" / "uvof.semantic.json").read_text(encoding="utf-8")
    )
    semantic_document = next(
        exercise
        for exercise in corpus["exercicis"]
        if exercise["id"] == exercise_id
    )

    report = validate_spatial_relations_document(
        spatial_document,
        spatial_schema,
        semantic_document,
    )

    assert report["valid"] is True
    assert report["summary"] == expected_summary


def test_uvof004_links_pass_side_to_interval_and_opposite_cone() -> None:
    document = json.loads(
        (
            ROOT / "exercises" / "TR-UVOF-004" / "spatial-relations.json"
        ).read_text(encoding="utf-8")
    )
    branch = next(
        item
        for item in document["branques_decisionals"]
        if item["id"] == "BR_COSTAT_PASSADA"
    )
    effects = {
        alternative["id"]: {
            (relation["subjecte"], relation["predicat"], tuple(relation["objectes"]))
            for relation in alternative["efectes_espacials"]
        }
        for alternative in branch["alternatives"]
    }

    assert ("L", "ataca", ("INT_12",)) in effects["A_PASSADA_EXT"]
    assert ("D2", "proper_a", ("ZONA_CON_CE",)) in effects["A_PASSADA_EXT"]
    assert ("L", "ataca", ("INT_23",)) in effects["A_PASSADA_CE"]
    assert ("D2", "proper_a", ("ZONA_CON_EXT",)) in effects["A_PASSADA_CE"]


def test_uvof005_represents_six_attackers_and_full_51_defense() -> None:
    document = json.loads(
        (
            ROOT / "exercises" / "TR-UVOF-005" / "spatial-relations.json"
        ).read_text(encoding="utf-8")
    )
    participant_ids = {
        node["id"]
        for node in document["nodes"]
        if node["classe"] == "participant"
    }

    assert {
        "EXT_LOCAL",
        "L_LOCAL",
        "CE",
        "L_OPOSAT",
        "EXT_OPOSAT",
        "PV",
    } <= participant_ids
    assert {
        "D1_LOCAL",
        "D2_LOCAL",
        "D3_CENTRAL",
        "D2_OPOSAT",
        "D1_OPOSAT",
        "DAV",
    } <= participant_ids
    advanced_relation = next(
        relation
        for state in document["estats"]
        for relation in state["relacions"]
        if relation["subjecte"] == "DAV"
    )
    assert advanced_relation["predicat"] == "per_davant_de"
    assert advanced_relation["objectes"] == ["D3_CENTRAL"]


def test_uvof006_keeps_both_cylinders_as_defender_handicaps() -> None:
    document = json.loads(
        (
            ROOT / "exercises" / "TR-UVOF-006" / "spatial-relations.json"
        ).read_text(encoding="utf-8")
    )
    holder_relations = {
        relation["subjecte"]: relation["objectes"][0]
        for state in document["estats"]
        for relation in state["relacions"]
        if relation["predicat"] == "sostingut_per"
    }
    node_classes = {node["id"]: node["classe"] for node in document["nodes"]}
    switch_branch = next(
        branch
        for branch in document["branques_decisionals"]
        if branch["id"] == "BR_CANVI_BANDA"
    )

    assert holder_relations == {
        "CIL_D2_LOCAL": "D2_LOCAL",
        "CIL_D3_OPOSAT": "D3_OPOSAT",
    }
    assert all(
        node_classes[defender_id] == "participant"
        for defender_id in ("D1_LOCAL", "D2_LOCAL", "D3_LOCAL", "D3_OPOSAT")
    )
    assert switch_branch["caracter"] == "preferent"


def test_uvof007_keeps_extreme_order_and_defensive_references() -> None:
    document = json.loads(
        (
            ROOT / "exercises" / "TR-UVOF-007" / "spatial-relations.json"
        ).read_text(encoding="utf-8")
    )
    relations = [
        relation
        for state in document["estats"]
        for relation in state["relacions"]
        if relation["predicat"] == "relacionat_en_2x1_amb"
    ]
    cylinder = next(node for node in document["nodes"] if node["id"] == "CIL_D2")

    assert cylinder["classe"] == "material"
    assert cylinder["funcio"] == "substitut_oposicional_actiu_del_segon_defensor"
    assert {
        (relation["subjecte"], tuple(relation["objectes"]))
        for relation in relations
    } == {
        ("EXT_1", ("CE", "D3")),
        ("EXT_2", ("L", "D1")),
    }


def test_uvof008_represents_full_51_and_defensive_concentration() -> None:
    document = json.loads(
        (
            ROOT / "exercises" / "TR-UVOF-008" / "spatial-relations.json"
        ).read_text(encoding="utf-8")
    )
    participants = {
        node["id"]
        for node in document["nodes"]
        if node["classe"] == "participant"
    }
    concentration = next(
        state for state in document["estats"] if state["id"] == "S_CONCENTRACIO"
    )

    assert participants == {
        "EXT_LOCAL",
        "L_LOCAL",
        "CE",
        "L_OPOSAT",
        "EXT_OPOSAT",
        "PV",
        "D1_LOCAL",
        "D2_LOCAL",
        "D3_CENTRAL",
        "D2_OPOSAT",
        "D1_OPOSAT",
        "DAV",
    }
    assert any(
        relation["subjecte"] == "DAV"
        and relation["predicat"] == "proper_a"
        and relation["objectes"] == ["ZONA_CONCENTRACIO", "PV"]
        for relation in concentration["relacions"]
    )


def test_uvof009_preserves_permutation_positions_and_three_ball_flows() -> None:
    document = json.loads(
        (
            ROOT / "exercises" / "TR-UVOF-009" / "spatial-relations.json"
        ).read_text(encoding="utf-8")
    )
    permutation = next(
        state for state in document["estats"] if state["id"] == "S_PERMUTA"
    )
    positions = {
        relation["subjecte"]: relation["objectes"][0]
        for relation in permutation["relacions"]
    }
    flows = {
        (
            flow["trajectoria_id"],
            flow["ordre"],
            flow["pilota_id"],
            flow["posseidor_inicial"],
            flow["posseidor_final"],
        )
        for flow in document["fluxos_pilota"]
    }

    assert positions == {"CE": "POS_LATERAL", "L": "POS_CENTRAL"}
    assert flows == {
        ("PERMUTA_CE_L", 1, "B1", "L", "EXT_1"),
        ("PERMUTA_CE_L", 2, "B1", "EXT_1", "CE"),
        ("FINAL_L_CENTRAL", 1, "B2", "PV", "L"),
        ("LLISCAMENT_PV", 1, "B3", "EXT_2", "PV"),
    }
