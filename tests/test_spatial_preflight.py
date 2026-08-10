from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

from jsonschema import Draft202012Validator

from scripts.spatial_preflight import (
    SourceRegistry,
    _candidate_selected_document,
    _semantic_entities,
    canonical_digest,
    preflight_all,
    preflight_document,
    preflight_path,
    spatial_digest,
)


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "traca.spatial-relations.schema.v0.3.json"

EXPECTED_STATUSES = {
    "TR-UVOF-001": "blocked",
    "TR-UVOF-002": "ready",
    "TR-UVOF-003": "ready",
    "TR-UVOF-004": "ready",
    "TR-UVOF-005": "partial",
    "TR-UVOF-006": "ready",
    "TR-UVOF-007": "partial",
    "TR-UVOF-008": "blocked",
    "TR-UVOF-009": "ready",
    "TR-UVOF-010": "blocked",
    "TR-UVOF-011": "blocked",
    "TR-UVOF-012": "ready",
    "TR-UVOF-013": "ready",
    "TR-UVOF-014": "partial",
    "TR-UVOF-015": "blocked",
}


def _load(exercise_id: str) -> dict:
    path = ROOT / "exercises" / exercise_id / "spatial-relations.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _codes(result: dict) -> set[str]:
    return {item["code"] for item in result["diagnostics"]}


def _refresh_digest(document: dict) -> None:
    document["integrity"]["spatial_digest"] = spatial_digest(document)


def test_v03_schema_is_valid_and_all_fifteen_instances_conform() -> None:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema)
    paths = sorted((ROOT / "exercises").glob("TR-UVOF-*/spatial-relations.json"))

    assert len(paths) == 15
    for path in paths:
        document = json.loads(path.read_text(encoding="utf-8"))
        assert list(validator.iter_errors(document)) == [], path
        assert document["meta"]["versio_contracte"] == "0.3.0"
        assert document["compatibility"] == {
            "migrated_from": "0.2.0",
            "v02_status": "historical_read_only",
            "policy": "no_implicit_downgrade",
        }


def test_preflight_status_matrix_is_reproducible() -> None:
    first = preflight_all()
    second = preflight_all()

    assert first == second
    assert {item["exercise_id"]: item["status"] for item in first} == EXPECTED_STATUSES
    assert all(item["geometry_generated"] is False for item in first)


def test_preflight_is_read_only() -> None:
    path = ROOT / "exercises/TR-UVOF-002/spatial-relations.json"
    before = path.read_bytes()

    result = preflight_path(path)

    assert result["status"] == "ready"
    assert path.read_bytes() == before


def test_source_fingerprints_are_exact_and_tampering_is_blocked() -> None:
    document = _load("TR-UVOF-002")
    candidate = document["semantic_source"]["candidates"][0]
    corpus = json.loads((ROOT / candidate["artifact"]).read_text(encoding="utf-8"))
    selected = corpus
    for token in candidate["selector"].lstrip("/").split("/"):
        selected = selected[int(token)] if isinstance(selected, list) else selected[token]
    assert candidate["digest"] == canonical_digest(selected)

    candidate["digest"] = "sha256:" + "0" * 64
    _refresh_digest(document)
    result = preflight_document(document)

    assert result["status"] == "blocked"
    assert "SEMANTIC_SOURCE_DIGEST_MISMATCH" in _codes(result)


def test_spatial_fingerprint_tampering_is_blocked() -> None:
    document = _load("TR-UVOF-002")
    document["font_semantica"]["exercici_id"] = "TR-UVOF-999"

    result = preflight_document(document)

    assert result["status"] == "blocked"
    assert "SPATIAL_SOURCE_DIGEST_MISMATCH" in _codes(result)


def test_canonical_source_requires_exactly_one_candidate() -> None:
    document = _load("TR-UVOF-002")
    duplicate = deepcopy(document["semantic_source"]["candidates"][0])
    duplicate["id"] = "duplicate"
    document["semantic_source"]["candidates"].append(duplicate)
    _refresh_digest(document)

    result = preflight_document(document)

    assert "SEMANTIC_CANONICAL_SOURCE_CARDINALITY" in _codes(result)


def test_uvof001_preserves_source_conflict_and_both_ball_flows() -> None:
    document = _load("TR-UVOF-001")
    result = preflight_document(document)

    assert result["status"] == "blocked"
    assert "SEMANTIC_SOURCE_CONFLICT" in _codes(result)
    assert {item["canonical"] for item in document["semantic_source"]["candidates"]} == {False}
    assert {
        node["id"] for node in document["nodes"] if node["classe"] == "pilota"
    } >= {"B1", "B2"}
    assert {
        flow["pilota_id"] for flow in document["fluxos_pilota"]
    } == {"B1", "B2"}


def test_unresolved_and_wrong_type_references_block() -> None:
    unresolved = _load("TR-UVOF-002")
    unresolved["semantic_coverage"][0]["source_ref"] = (
        "corpus/uvof.semantic.json#/exercicis/1/participants/999"
    )
    _refresh_digest(unresolved)
    unresolved_result = preflight_document(unresolved)
    assert "SEMANTIC_REFERENCE_UNRESOLVED" in _codes(unresolved_result)

    wrong_type = _load("TR-UVOF-002")
    wrong_type["participant_semantics"][0]["participant_ref"] = next(
        entity["ref"]
        for entity in wrong_type["namespace"]["entities"]
        if entity["kind"] == "space"
    )
    _refresh_digest(wrong_type)
    wrong_type_result = preflight_document(wrong_type)
    assert "PARTICIPANT_SEMANTIC_REFERENCE_TYPE_MISMATCH" in _codes(wrong_type_result)


def test_namespace_collisions_duplicates_and_dangling_entities_block() -> None:
    collision = _load("TR-UVOF-002")
    collision["namespace"]["entities"].append(
        deepcopy(collision["namespace"]["entities"][0])
    )
    _refresh_digest(collision)
    assert "GLOBAL_NAMESPACE_COLLISION" in _codes(preflight_document(collision))

    duplicate = _load("TR-UVOF-002")
    duplicate["nodes"].append(deepcopy(duplicate["nodes"][0]))
    _refresh_digest(duplicate)
    assert "LOCAL_ID_DUPLICATE" in _codes(preflight_document(duplicate))

    dangling = _load("TR-UVOF-002")
    dangling["fluxos_pilota"].pop()
    _refresh_digest(dangling)
    assert "GLOBAL_NAMESPACE_DANGLING_ENTITY" in _codes(
        preflight_document(dangling)
    )


def test_bindings_cardinality_and_material_capabilities_are_checked() -> None:
    binding = _load("TR-UVOF-005")
    binding["bindings"][0]["target_refs"] = [
        next(
            entity["ref"]
            for entity in binding["namespace"]["entities"]
            if entity["kind"] == "space"
        )
    ]
    _refresh_digest(binding)
    assert "BINDING_TARGET_TYPE_MISMATCH" in _codes(preflight_document(binding))

    cardinality = preflight_document(_load("TR-UVOF-011"))
    assert cardinality["status"] == "blocked"
    assert "UNINSTANTIATED_PARTICIPANT_GROUP" in _codes(cardinality)

    capability = _load("TR-UVOF-004")
    capability["material_semantics"][0]["capabilities"] = []
    _refresh_digest(capability)
    capability_result = preflight_document(capability)
    assert capability_result["status"] == "blocked"
    assert "SPATIAL_SCHEMA_ERROR" in _codes(capability_result)


def test_participant_role_dimensions_are_separate_without_side_inference() -> None:
    document = _load("TR-UVOF-009")
    profiles = {item["participant_ref"].rsplit(":", 1)[-1]: item for item in document["participant_semantics"]}

    assert profiles["CE"]["canonical_role"]["value"] == "central"
    assert profiles["CE"]["exercise_function"]["value"] == (
        "primer_jugador_de_la_permuta_i_receptor_a_lateral"
    )
    assert profiles["CE"]["side"] == {"value": None, "status": "unknown"}
    assert profiles["CE"]["temporal_role"] == {
        "value": None,
        "status": "unknown",
    }


def test_2x1_roles_and_typed_conditions_resolve() -> None:
    relation_document = _load("TR-UVOF-007")
    relations = relation_document["typed_relations"]
    assert len(relations) == 2
    assert all(
        {
            "primary_attacker_ref",
            "supporting_attacker_ref",
            "defender_ref",
        }
        <= relation.keys()
        for relation in relations
    )

    condition_document = _load("TR-UVOF-010")
    condition_document["typed_conditions"][0]["expression"] = "alterada"
    _refresh_digest(condition_document)
    result = preflight_document(condition_document)
    assert "TYPED_CONDITION_ORIGIN_MISMATCH" in _codes(result)


def test_uvof008_and_uvof010_cycles_are_detected_without_anchors() -> None:
    for exercise_id in ("TR-UVOF-008", "TR-UVOF-010"):
        result = preflight_document(_load(exercise_id))
        assert result["status"] == "blocked"
        assert "SPATIAL_UNANCHORED_CYCLE" in _codes(result)


def test_uvof014_keeps_six_individually_identifiable_options() -> None:
    document = _load("TR-UVOF-014")
    options = document["decision_mappings"][0]["options"]

    assert len(options) == 6
    assert len({item["option_ref"] for item in options}) == 6
    assert any(item["status"] == "preserved_symbolically" for item in options)
    assert preflight_document(document)["status"] == "partial"


def test_removing_an_option_or_flow_is_a_destructive_failure() -> None:
    option_document = _load("TR-UVOF-014")
    option_document["decision_mappings"][0]["options"].pop(2)
    _refresh_digest(option_document)
    assert "SEMANTIC_OPTION_COVERAGE_GAP" in _codes(
        preflight_document(option_document)
    )

    flow_document = _load("TR-UVOF-002")
    removed_flow = flow_document["fluxos_pilota"].pop(0)
    flow_document["namespace"]["entities"] = [
        entity
        for entity in flow_document["namespace"]["entities"]
        if not (
            entity["kind"] == "ball_flow"
            and entity["local_id"] == removed_flow["id"]
        )
    ]
    flow_document["semantic_coverage"] = [
        coverage
        for coverage in flow_document["semantic_coverage"]
        if coverage["source_ref"] != removed_flow["referencia_semantica"]
    ]
    _refresh_digest(flow_document)
    assert "SEMANTIC_FLOW_LOSS" in _codes(
        preflight_document(flow_document)
    )


def test_uvof005_007_008_do_not_receive_invented_flows() -> None:
    expected_codes = {
        "TR-UVOF-005": "SEMANTIC_BALL_FLOW_UNSPECIFIED",
        "TR-UVOF-007": "SEMANTIC_BALL_INFORMATION_UNSPECIFIED",
        "TR-UVOF-008": "SEMANTIC_BALL_INFORMATION_UNSPECIFIED",
    }
    for exercise_id, code in expected_codes.items():
        document = _load(exercise_id)
        assert document["fluxos_pilota"] == []
        assert code in _codes(preflight_document(document))


def test_uvof015_blocks_missing_adjacent_feint_space_and_incomplete_frames() -> None:
    result = preflight_document(_load("TR-UVOF-015"))

    assert result["status"] == "blocked"
    assert "FINTA_ADJACENT_SPACE_MISSING" in _codes(result)
    assert "SPATIAL_FRAME_INSUFFICIENT" in _codes(result)


def test_semantic_coverage_is_exhaustive_for_all_declared_sources() -> None:
    for path in sorted((ROOT / "exercises").glob("TR-UVOF-*/spatial-relations.json")):
        document = json.loads(path.read_text(encoding="utf-8"))
        source = document["semantic_source"]
        registry = SourceRegistry(ROOT, source["candidates"])
        registry.load(str(path.relative_to(ROOT)))
        expected: set[str] = set()
        for candidate in source["candidates"]:
            selected = _candidate_selected_document(registry, candidate)
            assert selected is not None
            expected.update(
                item["source_ref"]
                for item in _semantic_entities(
                    selected,
                    candidate["artifact"],
                    candidate["selector"],
                )
            )
        actual = {item["source_ref"] for item in document["semantic_coverage"]}
        assert expected <= actual, path


def test_provisional_and_unresolved_statuses_propagate_to_partial() -> None:
    provisional = _load("TR-UVOF-002")
    provisional["typed_conditions"][0]["status"] = "provisional"
    _refresh_digest(provisional)
    provisional_result = preflight_document(provisional)
    assert provisional_result["status"] == "partial"
    assert "KNOWLEDGE_STATUS_PROPAGATED" in _codes(provisional_result)

    unresolved = _load("TR-UVOF-002")
    unresolved["participant_semantics"][0]["temporal_role"]["status"] = "unresolved"
    _refresh_digest(unresolved)
    unresolved_result = preflight_document(unresolved)
    assert unresolved_result["status"] == "partial"
    assert "KNOWLEDGE_STATUS_PROPAGATED" in _codes(unresolved_result)


def test_false_or_unmapped_symmetry_blocks_without_duplication() -> None:
    unmapped = _load("TR-UVOF-002")
    unmapped["replication"]["status"] = "resolved"
    _refresh_digest(unmapped)
    assert "SPATIAL_SYMMETRY_MAPPING_MISSING" in _codes(
        preflight_document(unmapped)
    )

    false_symmetry = _load("TR-UVOF-003")
    participant_refs = [
        item["ref"]
        for item in false_symmetry["namespace"]["entities"]
        if item["kind"] == "participant"
    ]
    false_symmetry["replication"]["identity_mapping"] = [
        {"source_ref": participant_refs[0], "target_ref": participant_refs[1]}
    ]
    _refresh_digest(false_symmetry)
    assert "SPATIAL_FALSE_SYMMETRY" in _codes(
        preflight_document(false_symmetry)
    )


def test_geometry_is_rejected_and_never_generated() -> None:
    document = _load("TR-UVOF-002")
    document["geometry"] = {"x": 1}

    result = preflight_document(document)

    assert result["status"] == "blocked"
    assert result["geometry_generated"] is False
    assert "SPATIAL_GEOMETRY_FORBIDDEN" in _codes(result)
