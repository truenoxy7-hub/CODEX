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
    "TR-UVOF-001": "ready",
    "TR-UVOF-002": "ready",
    "TR-UVOF-003": "ready",
    "TR-UVOF-004": "ready",
    "TR-UVOF-005": "partial",
    "TR-UVOF-006": "ready",
    "TR-UVOF-007": "partial",
    "TR-UVOF-008": "ready",
    "TR-UVOF-009": "ready",
    "TR-UVOF-010": "ready",
    "TR-UVOF-011": "ready",
    "TR-UVOF-012": "ready",
    "TR-UVOF-013": "ready",
    "TR-UVOF-014": "partial",
    "TR-UVOF-015": "ready",
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

    conflict = _load("TR-UVOF-001")
    conflict["semantic_source"]["status"] = "conflict"
    conflict["semantic_source"]["conflict_code"] = "SEMANTIC_SOURCE_CONFLICT"
    for candidate in conflict["semantic_source"]["candidates"]:
        candidate["canonical"] = False
    _refresh_digest(conflict)

    conflict_result = preflight_document(conflict)
    assert conflict_result["status"] == "blocked"
    assert "SEMANTIC_SOURCE_CONFLICT" in _codes(conflict_result)


def test_uvof001_uses_detailed_source_with_mapped_corpus_projection() -> None:
    document = _load("TR-UVOF-001")
    result = preflight_document(document)

    assert result["status"] == "ready"
    assert "SEMANTIC_SOURCE_CONFLICT" not in _codes(result)
    candidates = {
        item["id"]: item for item in document["semantic_source"]["candidates"]
    }
    assert candidates["detailed"]["canonical"] is True
    assert candidates["corpus"]["canonical"] is False
    assert {
        node["id"] for node in document["nodes"] if node["classe"] == "pilota"
    } >= {"B1", "B2"}
    assert {
        flow["pilota_id"] for flow in document["fluxos_pilota"]
    } == {"B1", "B2"}
    coverage = {item["source_ref"]: item for item in document["semantic_coverage"]}
    assert coverage["corpus/uvof.semantic.json#/exercicis/0/participants/4"][
        "spatial_refs"
    ] == ["traca:TR-UVOF-001:node:D_Z2"]
    assert coverage["corpus/uvof.semantic.json#/exercicis/0/participants/5"][
        "spatial_refs"
    ] == ["traca:TR-UVOF-001:node:D_Z1"]
    assert coverage["corpus/uvof.semantic.json#/exercicis/0/materials/1"][
        "spatial_refs"
    ] == ["traca:TR-UVOF-001:node:C1", "traca:TR-UVOF-001:node:C2"]
    c3 = next(
        item
        for item in document["material_semantics"]
        if item["material_ref"] == "traca:TR-UVOF-001:node:C3"
    )
    assert "delimita_espai:SA2" in c3["capabilities"]


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

    cardinality = _load("TR-UVOF-011")
    defender_refs = [
        entity["ref"]
        for entity in cardinality["namespace"]["entities"]
        if entity["local_id"]
        in {"D1_LOCAL", "D2_LOCAL", "D3_LOCAL", "D3_OPOSAT"}
    ]
    cardinality["participant_groups"] = [
        {
            "id": "DEFENSA_4X4",
            "source_ref": (
                "corpus/uvof.semantic.json#/exercicis/10/participants/4"
            ),
            "expected_cardinality": 4,
            "instance_refs": defender_refs[:-1],
            "status": "unresolved",
        }
    ]
    _refresh_digest(cardinality)
    cardinality_result = preflight_document(cardinality)
    assert cardinality_result["status"] == "blocked"
    assert "UNINSTANTIATED_PARTICIPANT_GROUP" in _codes(cardinality_result)

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


def test_uvof008_and_uvof010_are_anchored_and_cycles_remain_detectable() -> None:
    anchored = _load("TR-UVOF-008")
    assert preflight_document(anchored)["status"] == "ready"

    concentration = next(
        space
        for space in anchored["espais"]
        if space["id"] == "ZONA_CONCENTRACIO"
    )
    concentration["definicio"] = {
        "operador": "proper_a",
        "arguments": ["PV"],
    }
    frame = next(
        frame
        for frame in anchored["operator_frames"]
        if frame["space_ref"] == "traca:TR-UVOF-008:space:ZONA_CONCENTRACIO"
    )
    frame["operator"] = "proper_a"
    dependency = next(
        dependency
        for dependency in anchored["dependencies"]
        if dependency["from_ref"]
        == "traca:TR-UVOF-008:space:ZONA_CONCENTRACIO"
    )
    dependency["to_ref"] = "traca:TR-UVOF-008:node:PV"
    _refresh_digest(anchored)
    assert "SPATIAL_UNANCHORED_CYCLE" in _codes(preflight_document(anchored))

    pivot_anchor = _load("TR-UVOF-010")
    assert preflight_document(pivot_anchor)["status"] == "ready"
    pivot_space = next(
        space for space in pivot_anchor["espais"] if space["id"] == "ESPAI_PV"
    )
    pivot_space["definicio"] = {
        "operador": "proper_a",
        "arguments": ["D3"],
    }
    pivot_dependency = next(
        dependency
        for dependency in pivot_anchor["dependencies"]
        if dependency["from_ref"] == "traca:TR-UVOF-010:space:ESPAI_PV"
        and dependency["kind"] == "defined_by"
        and dependency["to_ref"] == "traca:TR-UVOF-010:node:CON_PV"
    )
    pivot_dependency["to_ref"] = "traca:TR-UVOF-010:node:D3"
    old_defender_relation = next(
        relation
        for state in pivot_anchor["estats"]
        if state["id"] == "S_2X1_TANCAT"
        for relation in state["relacions"]
        if relation["subjecte"] == "PV" and "ESPAI_PV" in relation["objectes"]
    )
    old_defender_relation.update(
        {
            "subjecte": "D3",
            "predicat": "proper_a",
            "caracter": "disponible",
        }
    )
    pivot_anchor["dependencies"].append(
        {
            "from_ref": "traca:TR-UVOF-010:node:D3",
            "to_ref": "traca:TR-UVOF-010:space:ESPAI_PV",
            "kind": "relational_constraint",
            "origin_ref": (
                "exercises/TR-UVOF-010/spatial-relations.json"
                "#/estats/4/relacions/1"
            ),
        }
    )
    _refresh_digest(pivot_anchor)
    assert "SPATIAL_UNANCHORED_CYCLE" in _codes(
        preflight_document(pivot_anchor)
    )


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


def test_uvof005_and_007_do_not_receive_invented_flows() -> None:
    expected_codes = {
        "TR-UVOF-005": "SEMANTIC_BALL_FLOW_UNSPECIFIED",
        "TR-UVOF-007": "SEMANTIC_BALL_INFORMATION_UNSPECIFIED",
    }
    for exercise_id, code in expected_codes.items():
        document = _load(exercise_id)
        assert document["fluxos_pilota"] == []
        assert code in _codes(preflight_document(document))


def test_uvof008_preserves_validated_initial_ball_flow() -> None:
    document = _load("TR-UVOF-008")

    assert {
        node["id"] for node in document["nodes"] if node["classe"] == "pilota"
    } == {"B1"}
    assert [
        (
            flow["pilota_id"],
            flow["posseidor_inicial"],
            flow["posseidor_final"],
        )
        for flow in document["fluxos_pilota"]
    ] == [("B1", "CE", "L_OPOSAT")]


def test_uvof015_requires_adjacent_feint_spaces_and_complete_frames() -> None:
    current = preflight_document(_load("TR-UVOF-015"))
    assert current["status"] == "ready"
    assert current["diagnostics"] == []

    non_adjacent_feint = _load("TR-UVOF-015")
    feint = next(
        transition
        for transition in non_adjacent_feint["transicions"]
        if transition["id"] == "T_AESQ_FINTA_A_B"
    )
    feint["cap_a"] = feint["des_de"]
    _refresh_digest(non_adjacent_feint)
    assert "FINTA_ADJACENT_SPACE_MISSING" in _codes(
        preflight_document(non_adjacent_feint)
    )

    incomplete_frame = _load("TR-UVOF-015")
    incomplete_frame["operator_frames"][0]["status"] = "unresolved"
    _refresh_digest(incomplete_frame)
    assert "SPATIAL_FRAME_INSUFFICIENT" in _codes(
        preflight_document(incomplete_frame)
    )


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
