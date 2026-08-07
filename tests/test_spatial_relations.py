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
