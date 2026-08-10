from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from copy import deepcopy
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CORPUS_PATH = ROOT / "corpus" / "uvof.semantic.json"
DETAIL_PATH = ROOT / "exercises" / "TR-UVOF-001" / "semantic.json"
V02_SCHEMA = ROOT / "schema" / "traca.spatial-relations.schema.v0.2.json"
V03_SCHEMA = ROOT / "schema" / "traca.spatial-relations.schema.v0.3.json"

Document = dict[str, Any]


def canonical_digest(value: Any) -> str:
    payload = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return f"sha256:{hashlib.sha256(payload).hexdigest()}"


def spatial_digest(document: Document) -> str:
    payload = deepcopy(document)
    payload.get("integrity", {}).pop("spatial_digest", None)
    return canonical_digest(payload)


def artifact_ref(path: str, pointer: str = "") -> str:
    return f"{path}#{pointer}"


def _schema_v03() -> Document:
    schema = json.loads(V02_SCHEMA.read_text(encoding="utf-8"))
    schema["$id"] = "https://traca.local/schema/traca.spatial-relations.v0.3.json"
    schema["title"] = "TRAÇA — contracte de relacions espacials v0.3"
    schema["description"] = (
        "Capa qualitativa traçable i apta per a preflight. "
        "No admet coordenades, geometria resolta ni renderitzat."
    )
    schema["properties"]["meta"]["properties"]["versio_contracte"] = {
        "const": "0.3.0"
    }
    schema["$defs"]["estatConeixement"]["enum"].extend(
        ["unknown", "unresolved"]
    )
    stable_ref = {
        "type": "string",
        "pattern": r"^[^#]+#(?:/.*)?$",
    }
    global_ref = {
        "type": "string",
        "pattern": r"^traca:TR-UVOF-[0-9]{3}:[a-z_]+:[A-Z0-9_:-]+$",
    }
    schema["$defs"]["stableSemanticRef"] = stable_ref
    schema["$defs"]["globalRef"] = global_ref

    for definition in ("node", "espai"):
        if "referencia_semantica" in schema["$defs"][definition]["properties"]:
            schema["$defs"][definition]["properties"]["referencia_semantica"] = {
                "$ref": "#/$defs/stableSemanticRef"
            }
    schema["$defs"]["transicio"]["properties"]["accio_semantica_ref"] = {
        "$ref": "#/$defs/stableSemanticRef"
    }
    branch = schema["$defs"]["branca"]["properties"]
    branch["decisio_semantica_ref"] = {"$ref": "#/$defs/stableSemanticRef"}
    branch["decisions_semantiques_ref"] = {
        "type": "array",
        "minItems": 1,
        "items": {"$ref": "#/$defs/stableSemanticRef"},
        "uniqueItems": True,
    }
    schema["$defs"]["fluxPilota"]["required"].append("referencia_semantica")
    schema["$defs"]["fluxPilota"]["properties"]["referencia_semantica"] = {
        "$ref": "#/$defs/stableSemanticRef"
    }

    new_required = [
        "semantic_source",
        "namespace",
        "bindings",
        "participant_semantics",
        "participant_groups",
        "material_semantics",
        "typed_relations",
        "typed_conditions",
        "operator_frames",
        "decision_mappings",
        "semantic_coverage",
        "dependencies",
        "replication",
        "unresolved_items",
        "integrity",
        "compatibility",
    ]
    schema["required"].extend(new_required)
    if "fluxos_pilota" not in schema["required"]:
        schema["required"].append("fluxos_pilota")
    schema["properties"].update(
        {
            "semantic_source": {"$ref": "#/$defs/semanticSource"},
            "namespace": {"$ref": "#/$defs/namespace"},
            "bindings": {
                "type": "array",
                "items": {"$ref": "#/$defs/binding"},
            },
            "participant_semantics": {
                "type": "array",
                "items": {"$ref": "#/$defs/participantSemantic"},
            },
            "participant_groups": {
                "type": "array",
                "items": {"$ref": "#/$defs/participantGroup"},
            },
            "material_semantics": {
                "type": "array",
                "items": {"$ref": "#/$defs/materialSemantic"},
            },
            "typed_relations": {
                "type": "array",
                "items": {"$ref": "#/$defs/typedRelation"},
            },
            "typed_conditions": {
                "type": "array",
                "items": {"$ref": "#/$defs/typedCondition"},
            },
            "operator_frames": {
                "type": "array",
                "items": {"$ref": "#/$defs/operatorFrame"},
            },
            "decision_mappings": {
                "type": "array",
                "items": {"$ref": "#/$defs/decisionMapping"},
            },
            "semantic_coverage": {
                "type": "array",
                "minItems": 1,
                "items": {"$ref": "#/$defs/coverage"},
            },
            "dependencies": {
                "type": "array",
                "items": {"$ref": "#/$defs/dependency"},
            },
            "replication": {"$ref": "#/$defs/replication"},
            "unresolved_items": {
                "type": "array",
                "items": {"$ref": "#/$defs/unresolvedItem"},
            },
            "integrity": {"$ref": "#/$defs/integrity"},
            "compatibility": {"$ref": "#/$defs/compatibility"},
        }
    )

    schema["$defs"].update(
        {
            "semanticCandidate": {
                "type": "object",
                "required": [
                    "id",
                    "artifact",
                    "selector",
                    "version",
                    "digest",
                    "canonical",
                    "validation_status",
                ],
                "properties": {
                    "id": {"type": "string", "minLength": 1},
                    "artifact": {"type": "string", "minLength": 1},
                    "selector": {"type": "string"},
                    "version": {"type": "string", "minLength": 1},
                    "digest": {
                        "type": "string",
                        "pattern": r"^sha256:[0-9a-f]{64}$",
                    },
                    "canonical": {"type": "boolean"},
                    "validation_status": {
                        "enum": ["validated", "partially_validated", "conflict"]
                    },
                },
                "additionalProperties": False,
            },
            "semanticSource": {
                "type": "object",
                "required": ["exercise_id", "status", "candidates"],
                "properties": {
                    "exercise_id": {
                        "type": "string",
                        "pattern": r"^TR-UVOF-[0-9]{3}$",
                    },
                    "status": {"enum": ["canonical", "conflict"]},
                    "candidates": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"$ref": "#/$defs/semanticCandidate"},
                    },
                    "conflict_code": {"type": "string"},
                },
                "additionalProperties": False,
            },
            "namespaceEntity": {
                "type": "object",
                "required": ["ref", "kind", "local_id", "knowledge_status"],
                "properties": {
                    "ref": {"$ref": "#/$defs/globalRef"},
                    "kind": {
                        "enum": [
                            "participant",
                            "material",
                            "ball",
                            "reference",
                            "space",
                            "state",
                            "transition",
                            "ball_flow",
                            "decision_branch",
                            "decision_alternative",
                        ]
                    },
                    "local_id": {"type": "string", "minLength": 1},
                    "source_ref": {"$ref": "#/$defs/stableSemanticRef"},
                    "knowledge_status": {"$ref": "#/$defs/estatConeixement"},
                },
                "additionalProperties": False,
            },
            "namespace": {
                "type": "object",
                "required": ["base", "entities"],
                "properties": {
                    "base": {
                        "type": "string",
                        "pattern": r"^traca:TR-UVOF-[0-9]{3}$",
                    },
                    "entities": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"$ref": "#/$defs/namespaceEntity"},
                    },
                },
                "additionalProperties": False,
            },
            "binding": {
                "type": "object",
                "required": [
                    "id",
                    "actor",
                    "source_refs",
                    "target_refs",
                    "mode",
                    "status",
                ],
                "properties": {
                    "id": {"type": "string", "pattern": r"^[A-Z0-9_:-]+$"},
                    "actor": {"type": "string", "minLength": 1},
                    "source_refs": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"$ref": "#/$defs/stableSemanticRef"},
                        "uniqueItems": True,
                    },
                    "target_refs": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"$ref": "#/$defs/globalRef"},
                        "uniqueItems": True,
                    },
                    "mode": {"enum": ["runtime_choice", "replicated"]},
                    "status": {"enum": ["resolved", "provisional", "unresolved"]},
                },
                "additionalProperties": False,
            },
            "declaredValue": {
                "type": "object",
                "required": ["value", "status"],
                "properties": {
                    "value": {"type": ["string", "null"]},
                    "status": {
                        "enum": ["validated", "provisional", "unknown", "unresolved"]
                    },
                },
                "additionalProperties": False,
            },
            "participantSemantic": {
                "type": "object",
                "required": [
                    "participant_ref",
                    "source_ref",
                    "team",
                    "canonical_role",
                    "side",
                    "temporal_role",
                    "exercise_function",
                ],
                "properties": {
                    "participant_ref": {"$ref": "#/$defs/globalRef"},
                    "source_ref": {"$ref": "#/$defs/stableSemanticRef"},
                    "team": {"$ref": "#/$defs/declaredValue"},
                    "canonical_role": {"$ref": "#/$defs/declaredValue"},
                    "side": {"$ref": "#/$defs/declaredValue"},
                    "temporal_role": {"$ref": "#/$defs/declaredValue"},
                    "exercise_function": {"$ref": "#/$defs/declaredValue"},
                },
                "additionalProperties": False,
            },
            "participantGroup": {
                "type": "object",
                "required": [
                    "id",
                    "source_ref",
                    "expected_cardinality",
                    "instance_refs",
                    "status",
                ],
                "properties": {
                    "id": {"type": "string", "pattern": r"^[A-Z0-9_:-]+$"},
                    "source_ref": {"$ref": "#/$defs/stableSemanticRef"},
                    "expected_cardinality": {"type": "integer", "minimum": 1},
                    "instance_refs": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/globalRef"},
                        "uniqueItems": True,
                    },
                    "status": {"enum": ["resolved", "unresolved"]},
                },
                "additionalProperties": False,
            },
            "materialSemantic": {
                "type": "object",
                "required": [
                    "material_ref",
                    "source_ref",
                    "instance_function",
                    "capabilities",
                    "knowledge_status",
                ],
                "properties": {
                    "material_ref": {"$ref": "#/$defs/globalRef"},
                    "source_ref": {"$ref": "#/$defs/stableSemanticRef"},
                    "instance_function": {"type": "string", "minLength": 1},
                    "capabilities": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"type": "string", "minLength": 1},
                        "uniqueItems": True,
                    },
                    "knowledge_status": {"$ref": "#/$defs/estatConeixement"},
                },
                "additionalProperties": False,
            },
            "typedRelation": {
                "type": "object",
                "required": [
                    "id",
                    "kind",
                    "primary_attacker_ref",
                    "supporting_attacker_ref",
                    "defender_ref",
                    "origin_ref",
                    "knowledge_status",
                ],
                "properties": {
                    "id": {"type": "string", "pattern": r"^[A-Z0-9_:-]+$"},
                    "kind": {"const": "2x1"},
                    "primary_attacker_ref": {"$ref": "#/$defs/globalRef"},
                    "supporting_attacker_ref": {"$ref": "#/$defs/globalRef"},
                    "defender_ref": {"$ref": "#/$defs/globalRef"},
                    "origin_ref": {"$ref": "#/$defs/stableSemanticRef"},
                    "knowledge_status": {"$ref": "#/$defs/estatConeixement"},
                },
                "additionalProperties": False,
            },
            "typedCondition": {
                "type": "object",
                "required": ["id", "kind", "expression", "origin_ref", "status"],
                "properties": {
                    "id": {"type": "string", "pattern": r"^[A-Z0-9_:-]+$"},
                    "kind": {
                        "enum": ["task_condition", "state", "observation", "predicate"]
                    },
                    "expression": {"type": "string", "minLength": 1},
                    "origin_ref": {"$ref": "#/$defs/stableSemanticRef"},
                    "status": {"enum": ["validated", "provisional", "unresolved"]},
                },
                "additionalProperties": False,
            },
            "operatorFrame": {
                "type": "object",
                "required": [
                    "id",
                    "space_ref",
                    "definition_ref",
                    "operator",
                    "axis",
                    "viewpoint",
                    "distance_class",
                    "closure",
                    "status",
                ],
                "properties": {
                    "id": {"type": "string", "pattern": r"^[A-Z0-9_:-]+$"},
                    "space_ref": {"$ref": "#/$defs/globalRef"},
                    "definition_ref": {"$ref": "#/$defs/stableSemanticRef"},
                    "operator": {
                        "enum": [
                            "exterior_de",
                            "interior_de",
                            "darrere_de",
                            "proper_a",
                            "delimitat_per",
                        ]
                    },
                    "axis": {"type": "string", "minLength": 1},
                    "viewpoint": {"type": "string", "minLength": 1},
                    "distance_class": {"type": "string", "minLength": 1},
                    "closure": {"type": "string", "minLength": 1},
                    "status": {"enum": ["complete", "unresolved"]},
                },
                "additionalProperties": False,
            },
            "optionMapping": {
                "type": "object",
                "required": ["option_ref", "alternative_refs", "status"],
                "properties": {
                    "option_ref": {"$ref": "#/$defs/stableSemanticRef"},
                    "alternative_refs": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/globalRef"},
                        "uniqueItems": True,
                    },
                    "status": {"enum": ["mapped", "preserved_symbolically"]},
                },
                "additionalProperties": False,
            },
            "decisionMapping": {
                "type": "object",
                "required": ["decision_ref", "branch_refs", "options"],
                "properties": {
                    "decision_ref": {"$ref": "#/$defs/stableSemanticRef"},
                    "branch_refs": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/globalRef"},
                        "uniqueItems": True,
                    },
                    "options": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"$ref": "#/$defs/optionMapping"},
                    },
                },
                "additionalProperties": False,
            },
            "coverage": {
                "type": "object",
                "required": ["source_ref", "kind", "preservation", "spatial_refs"],
                "properties": {
                    "source_ref": {"$ref": "#/$defs/stableSemanticRef"},
                    "kind": {
                        "enum": [
                            "participant",
                            "material",
                            "ball",
                            "action",
                            "ball_flow",
                            "decision",
                            "decision_option",
                        ]
                    },
                    "preservation": {"enum": ["mapped", "preserved_symbolically"]},
                    "spatial_refs": {
                        "type": "array",
                        "items": {"type": "string", "minLength": 1},
                        "uniqueItems": True,
                    },
                },
                "additionalProperties": False,
            },
            "dependency": {
                "type": "object",
                "required": ["from_ref", "to_ref", "kind", "origin_ref"],
                "properties": {
                    "from_ref": {"$ref": "#/$defs/globalRef"},
                    "to_ref": {"$ref": "#/$defs/globalRef"},
                    "kind": {"enum": ["defined_by", "relational_constraint"]},
                    "origin_ref": {"$ref": "#/$defs/stableSemanticRef"},
                },
                "additionalProperties": False,
            },
            "replication": {
                "type": "object",
                "required": ["mode", "status", "identity_mapping", "required_for_preflight"],
                "properties": {
                    "mode": {
                        "enum": [
                            "sense_simetria",
                            "reflectible",
                            "dues_bandes_paraleles",
                        ]
                    },
                    "status": {"enum": ["resolved", "unresolved"]},
                    "identity_mapping": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["source_ref", "target_ref"],
                            "properties": {
                                "source_ref": {"$ref": "#/$defs/globalRef"},
                                "target_ref": {"$ref": "#/$defs/globalRef"},
                            },
                            "additionalProperties": False,
                        },
                    },
                    "required_for_preflight": {"type": "boolean"},
                },
                "additionalProperties": False,
            },
            "unresolvedItem": {
                "type": "object",
                "required": ["code", "impact", "entity_refs", "message", "requires_trainer"],
                "properties": {
                    "code": {"type": "string", "pattern": r"^[A-Z0-9_:-]+$"},
                    "impact": {"enum": ["partial", "blocked"]},
                    "entity_refs": {"type": "array", "items": {"type": "string"}},
                    "message": {"type": "string", "minLength": 1},
                    "requires_trainer": {"type": "boolean"},
                },
                "additionalProperties": False,
            },
            "integrity": {
                "type": "object",
                "required": ["algorithm", "spatial_digest"],
                "properties": {
                    "algorithm": {"const": "sha256"},
                    "spatial_digest": {
                        "type": "string",
                        "pattern": r"^sha256:[0-9a-f]{64}$",
                    },
                },
                "additionalProperties": False,
            },
            "compatibility": {
                "type": "object",
                "required": ["migrated_from", "v02_status", "policy"],
                "properties": {
                    "migrated_from": {"const": "0.2.0"},
                    "v02_status": {"const": "historical_read_only"},
                    "policy": {"const": "no_implicit_downgrade"},
                },
                "additionalProperties": False,
            },
        }
    )
    return schema


def _pointer_get(document: Any, pointer: str) -> Any:
    value = document
    if not pointer:
        return value
    for token in pointer.lstrip("/").split("/"):
        token = token.replace("~1", "/").replace("~0", "~")
        value = value[int(token)] if isinstance(value, list) else value[token]
    return value


def _normalize(value: str) -> set[str]:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return {
        token
        for token in re.split(r"[^a-z0-9]+", ascii_value.lower())
        if len(token) >= 4
    }


def _global(exercise_id: str, kind: str, local_id: str) -> str:
    return f"traca:{exercise_id}:{kind}:{local_id}"


def _find_index(items: list[Document], item_id: str) -> int | None:
    return next((index for index, item in enumerate(items) if item.get("id") == item_id), None)


def _corpus_ref(exercise_index: int, collection: str, item_index: int) -> str:
    return artifact_ref(
        "corpus/uvof.semantic.json",
        f"/exercicis/{exercise_index}/{collection}/{item_index}",
    )


def _semantic_catalog(
    exercise: Document,
    exercise_index: int,
) -> list[Document]:
    catalog: list[Document] = []
    base = f"/exercicis/{exercise_index}"
    for collection, kind in (
        ("participants", "participant"),
        ("materials", "material"),
        ("pilotes", "ball"),
    ):
        for index, item in enumerate(exercise.get(collection, [])):
            catalog.append(
                {
                    "source_ref": artifact_ref(
                        "corpus/uvof.semantic.json", f"{base}/{collection}/{index}"
                    ),
                    "kind": kind,
                    "semantic_id": item.get("id"),
                }
            )
    for phase_index, phase in enumerate(exercise.get("fases", [])):
        for action_index, action in enumerate(phase.get("accions", [])):
            catalog.append(
                {
                    "source_ref": artifact_ref(
                        "corpus/uvof.semantic.json",
                        f"{base}/fases/{phase_index}/accions/{action_index}",
                    ),
                    "kind": "action",
                    "semantic_id": f"{phase.get('id')}:{action.get('ordre')}",
                }
            )
        for flow_index, flow in enumerate(phase.get("fluxos_pilota", [])):
            catalog.append(
                {
                    "source_ref": artifact_ref(
                        "corpus/uvof.semantic.json",
                        f"{base}/fases/{phase_index}/fluxos_pilota/{flow_index}",
                    ),
                    "kind": "ball_flow",
                    "semantic_id": (
                        f"{phase.get('id')}:{flow.get('trajectoria_id', 'FLUX')}"
                        f":{flow.get('ordre', flow_index + 1)}"
                    ),
                    "value": flow,
                }
            )
        for decision_index, decision in enumerate(phase.get("decisions", [])):
            decision_ref = artifact_ref(
                "corpus/uvof.semantic.json",
                f"{base}/fases/{phase_index}/decisions/{decision_index}",
            )
            catalog.append(
                {
                    "source_ref": decision_ref,
                    "kind": "decision",
                    "semantic_id": decision.get("id"),
                }
            )
            for option_index, option in enumerate(decision.get("opcions", [])):
                catalog.append(
                    {
                        "source_ref": f"{decision_ref}/opcions/{option_index}",
                        "kind": "decision_option",
                        "semantic_id": option,
                        "decision_ref": decision_ref,
                    }
                )
    return catalog


def _detail_catalog(detail: Document) -> list[Document]:
    catalog: list[Document] = []
    model = detail["model_exercici"]
    for collection, semantic_collection, kind in (
        ("participants_plantilla", "participants_plantilla", "participant"),
        ("materials", "materials", "material"),
    ):
        for index, item in enumerate(model.get(collection, [])):
            catalog.append(
                {
                    "source_ref": artifact_ref(
                        "exercises/TR-UVOF-001/semantic.json",
                        f"/model_exercici/{semantic_collection}/{index}",
                    ),
                    "kind": kind,
                    "semantic_id": item.get("id"),
                }
            )
    for sub_index, subaction in enumerate(model.get("subaccions", [])):
        for action_index, action in enumerate(subaction.get("sequencia_obligatoria", [])):
            catalog.append(
                {
                    "source_ref": artifact_ref(
                        "exercises/TR-UVOF-001/semantic.json",
                        f"/model_exercici/subaccions/{sub_index}/sequencia_obligatoria/{action_index}",
                    ),
                    "kind": "action",
                    "semantic_id": f"{subaction.get('id')}:{action.get('ordre')}",
                }
            )
    return catalog


def _node_semantic_ref(
    exercise_id: str,
    node: Document,
    exercise: Document,
    exercise_index: int,
    detail: Document,
) -> str | None:
    node_id = node["id"]
    if exercise_id == "TR-UVOF-001":
        detail_collection = {
            "participant": "participants_plantilla",
            "material": "materials",
        }.get(node.get("classe"))
        if detail_collection:
            index = _find_index(detail["model_exercici"].get(detail_collection, []), node_id)
            if index is not None:
                return artifact_ref(
                    "exercises/TR-UVOF-001/semantic.json",
                    f"/model_exercici/{detail_collection}/{index}",
                )
    collection = {
        "participant": "participants",
        "material": "materials",
        "pilota": "pilotes",
    }.get(node.get("classe"))
    if collection:
        index = _find_index(exercise.get(collection, []), node_id)
        if index is not None:
            return _corpus_ref(exercise_index, collection, index)
    return None


def _action_ref(
    current: str | None,
    phase_id: str,
    exercise: Document,
    exercise_index: int,
    exercise_id: str,
) -> str | None:
    if not current:
        return None
    if exercise_id == "TR-UVOF-001":
        match = re.fullmatch(r"(SA[12])\.sequencia_obligatoria\.(\d+)", current)
        if match:
            subactions = json.loads(DETAIL_PATH.read_text(encoding="utf-8"))["model_exercici"]["subaccions"]
            sub_index = next(i for i, item in enumerate(subactions) if item["id"] == match.group(1))
            return artifact_ref(
                "exercises/TR-UVOF-001/semantic.json",
                f"/model_exercici/subaccions/{sub_index}/sequencia_obligatoria/{match.group(2)}",
            )
        return None
    phase_index = next(
        (index for index, phase in enumerate(exercise.get("fases", [])) if phase.get("id") == phase_id),
        None,
    )
    if phase_index is None:
        return None
    match = re.search(r"accions/(\d+)$", current)
    if not match:
        return None
    action_index = int(match.group(1))
    actions = exercise["fases"][phase_index].get("accions", [])
    if action_index >= len(actions):
        return None
    return artifact_ref(
        "corpus/uvof.semantic.json",
        f"/exercicis/{exercise_index}/fases/{phase_index}/accions/{action_index}",
    )


def _decision_ref(
    decision_id: str,
    exercise: Document,
    exercise_index: int,
) -> str | None:
    for phase_index, phase in enumerate(exercise.get("fases", [])):
        for decision_index, decision in enumerate(phase.get("decisions", [])):
            if decision.get("id") == decision_id:
                return artifact_ref(
                    "corpus/uvof.semantic.json",
                    f"/exercicis/{exercise_index}/fases/{phase_index}/decisions/{decision_index}",
                )
    return None


def _flow_ref(
    flow: Document,
    exercise: Document,
    exercise_index: int,
) -> str | None:
    candidates: list[tuple[int, int, Document]] = []
    for phase_index, phase in enumerate(exercise.get("fases", [])):
        if phase.get("id") != flow.get("fase_ref"):
            continue
        for flow_index, semantic_flow in enumerate(phase.get("fluxos_pilota", [])):
            if (
                semantic_flow.get("pilota_id") == flow.get("pilota_id")
                and semantic_flow.get("posseidor_inicial") == flow.get("posseidor_inicial")
                and semantic_flow.get("posseidor_final") == flow.get("posseidor_final")
            ):
                candidates.append((phase_index, flow_index, semantic_flow))
    if not candidates:
        return None
    exact = next(
        (
            candidate
            for candidate in candidates
            if candidate[2].get("trajectoria_id") == flow.get("trajectoria_id")
            and candidate[2].get("ordre", 1) == flow.get("ordre")
        ),
        candidates[0],
    )
    return artifact_ref(
        "corpus/uvof.semantic.json",
        f"/exercicis/{exercise_index}/fases/{exact[0]}/fluxos_pilota/{exact[1]}",
    )


def _add_uvof001_ball_flows(document: Document, exercise: Document, exercise_index: int) -> None:
    existing_ids = {node["id"] for node in document["nodes"]}
    for ball_index, ball in enumerate(exercise.get("pilotes", [])):
        if ball["id"] not in existing_ids:
            document["nodes"].append(
                {
                    "id": ball["id"],
                    "classe": "pilota",
                    "referencia_semantica": _corpus_ref(exercise_index, "pilotes", ball_index),
                    "funcio": f"pilota_semantica_{ball['id']}",
                    "estat_coneixement": "validat",
                }
            )
    document["fluxos_pilota"] = []
    for phase_index, phase in enumerate(exercise.get("fases", [])):
        for flow_index, flow in enumerate(phase.get("fluxos_pilota", [])):
            document["fluxos_pilota"].append(
                {
                    "id": f"FP_{phase['id']}_{flow['pilota_id']}",
                    "fase_ref": phase["id"],
                    "trajectoria_id": f"{phase['id']}_{flow['pilota_id']}",
                    "ordre": 1,
                    "pilota_id": flow["pilota_id"],
                    "posseidor_inicial": flow["posseidor_inicial"],
                    "accio": "passada",
                    "posseidor_final": flow["posseidor_final"],
                    "qualificadors": [flow["accio"]],
                    "estat_coneixement": "validat",
                    "referencia_semantica": artifact_ref(
                        "corpus/uvof.semantic.json",
                        f"/exercicis/{exercise_index}/fases/{phase_index}/fluxos_pilota/{flow_index}",
                    ),
                }
            )


def _namespace(document: Document, exercise_id: str) -> Document:
    entities: list[Document] = []
    node_kind = {
        "participant": "participant",
        "material": "material",
        "pilota": "ball",
    }
    for node in document["nodes"]:
        entity: Document = {
            "ref": _global(exercise_id, "node", node["id"]),
            "kind": node_kind.get(node["classe"], "reference"),
            "local_id": node["id"],
            "knowledge_status": node["estat_coneixement"],
        }
        if node.get("referencia_semantica"):
            entity["source_ref"] = node["referencia_semantica"]
        entities.append(entity)
    for collection, kind, global_kind in (
        ("espais", "space", "space"),
        ("estats", "state", "state"),
        ("transicions", "transition", "transition"),
        ("fluxos_pilota", "ball_flow", "flow"),
        ("branques_decisionals", "decision_branch", "branch"),
    ):
        for item in document.get(collection, []):
            entities.append(
                {
                    "ref": _global(exercise_id, global_kind, item["id"]),
                    "kind": kind,
                    "local_id": item["id"],
                    "knowledge_status": "validat",
                }
            )
            if collection == "branques_decisionals":
                for alternative in item["alternatives"]:
                    entities.append(
                        {
                            "ref": _global(exercise_id, "alternative", alternative["id"]),
                            "kind": "decision_alternative",
                            "local_id": alternative["id"],
                            "knowledge_status": "validat",
                        }
                    )
    return {"base": f"traca:{exercise_id}", "entities": entities}


def _material_semantics(
    document: Document,
    exercise_id: str,
    exercise: Document,
    exercise_index: int,
    detail: Document,
) -> list[Document]:
    result: list[Document] = []
    for node in document["nodes"]:
        if node["classe"] != "material":
            continue
        source_ref = node.get("referencia_semantica")
        if not source_ref:
            continue
        function = node.get("funcio", "funcio_declarada_a_la_font")
        result.append(
            {
                "material_ref": _global(exercise_id, "node", node["id"]),
                "source_ref": source_ref,
                "instance_function": function,
                "capabilities": [f"instance_function:{function}"],
                "knowledge_status": node["estat_coneixement"],
            }
        )
    return result


def _bindings(
    exercise_id: str,
    exercise: Document,
    exercise_index: int,
) -> list[Document]:
    participant_ids = {item["id"] for item in exercise.get("participants", [])}
    source_by_actor: dict[str, list[str]] = {}
    for phase_index, phase in enumerate(exercise.get("fases", [])):
        for action_index, action in enumerate(phase.get("accions", [])):
            actor = action.get("actor")
            if actor and actor not in participant_ids:
                source_by_actor.setdefault(actor, []).append(
                    artifact_ref(
                        "corpus/uvof.semantic.json",
                        f"/exercicis/{exercise_index}/fases/{phase_index}/accions/{action_index}",
                    )
                )
    candidates = {
        "PORTADOR_ACTUAL": [
            item["id"] for item in exercise.get("participants", []) if item.get("equip") == "atac"
        ],
        "RECEPTOR_ENCREUAMENT": ["CE", "EXT"],
        "JUGADOR_QUE_OCUPA_CENTRAL": ["L", "CE"],
        "ATAC_6": [
            item["id"] for item in exercise.get("participants", []) if item.get("equip") == "atac"
        ],
        "ATACANT_DE_ZONA": ["A_ESQ", "A_CE", "A_DRE"],
    }
    result: list[Document] = []
    for actor, source_refs in sorted(source_by_actor.items()):
        target_ids = [item for item in candidates.get(actor, []) if item in participant_ids]
        if not target_ids:
            continue
        result.append(
            {
                "id": f"BIND_{actor}",
                "actor": actor,
                "source_refs": source_refs,
                "target_refs": [
                    _global(exercise_id, "node", item) for item in target_ids
                ],
                "mode": "replicated" if actor == "ATACANT_DE_ZONA" else "runtime_choice",
                "status": "resolved",
            }
        )
    return result


def _participant_semantics(
    document: Document,
    exercise_id: str,
    corpus: Document,
    detail: Document,
) -> list[Document]:
    result: list[Document] = []
    for node in document["nodes"]:
        if node["classe"] != "participant":
            continue
        source_ref = node["referencia_semantica"]
        artifact, pointer = source_ref.split("#", 1)
        source_document = (
            corpus
            if artifact == "corpus/uvof.semantic.json"
            else detail
        )
        source = _pointer_get(source_document, pointer)
        canonical_role = source.get("rol_inicial", source.get("rol"))
        source_function = source.get("funcio")
        exercise_function = source_function or node.get("rol")
        result.append(
            {
                "participant_ref": _global(exercise_id, "node", node["id"]),
                "source_ref": source_ref,
                "team": {
                    "value": source.get("equip"),
                    "status": "validated" if source.get("equip") else "unknown",
                },
                "canonical_role": {
                    "value": canonical_role,
                    "status": "validated" if canonical_role else "unknown",
                },
                # Side and temporary role are deliberately not inferred from
                # IDs or compound role strings.
                "side": {
                    "value": source.get("costat"),
                    "status": "validated" if source.get("costat") else "unknown",
                },
                "temporal_role": {
                    "value": source.get("rol_temporal"),
                    "status": (
                        "validated" if source.get("rol_temporal") else "unknown"
                    ),
                },
                "exercise_function": {
                    "value": exercise_function,
                    "status": (
                        "validated"
                        if source_function
                        or node["estat_coneixement"] in {"validat", "condicio_tasca"}
                        else "provisional"
                    ),
                },
            }
        )
    return result


def _participant_groups(
    exercise_id: str,
    exercise: Document,
    exercise_index: int,
) -> list[Document]:
    result: list[Document] = []
    for index, participant in enumerate(exercise.get("participants", [])):
        if participant.get("rol_inicial") == "quatre_defensors":
            result.append(
                {
                    "id": participant["id"],
                    "source_ref": _corpus_ref(exercise_index, "participants", index),
                    "expected_cardinality": 4,
                    "instance_refs": [
                        _global(exercise_id, "node", participant["id"])
                    ],
                    "status": "unresolved",
                }
            )
    return result


def _typed_relations(document: Document, exercise_id: str) -> list[Document]:
    node_by_id = {node["id"]: node for node in document["nodes"]}
    result: list[Document] = []
    seen: set[tuple[str, str, str]] = set()
    fallback_defender = {
        ("TR-UVOF-003", "PV"): "D3_LOCAL",
        ("TR-UVOF-003", "EXT_LOCAL"): "D1_LOCAL",
    }
    relation_index = 0
    for state_index, state in enumerate(document.get("estats", [])):
        for local_index, relation in enumerate(state.get("relacions", [])):
            if relation.get("predicat") != "relacionat_en_2x1_amb":
                continue
            objects = relation.get("objectes", [])
            if not objects:
                continue
            support = objects[0]
            defender = next(
                (
                    item
                    for item in objects[1:]
                    if node_by_id.get(item, {}).get("rol", "").find("defensor") >= 0
                ),
                fallback_defender.get((exercise_id, support)),
            )
            if not defender:
                continue
            key = (relation["subjecte"], support, defender)
            if key in seen:
                continue
            seen.add(key)
            relation_index += 1
            result.append(
                {
                    "id": f"REL_2X1_{relation_index}",
                    "kind": "2x1",
                    "primary_attacker_ref": _global(exercise_id, "node", key[0]),
                    "supporting_attacker_ref": _global(exercise_id, "node", support),
                    "defender_ref": _global(exercise_id, "node", defender),
                    "origin_ref": (
                        f"exercises/{exercise_id}/spatial-relations.json"
                        f"#/estats/{state_index}/relacions/{local_index}"
                    ),
                    "knowledge_status": relation["estat_coneixement"],
                }
            )
    return result


def _typed_conditions(document: Document, exercise_id: str) -> list[Document]:
    result: list[Document] = []
    counter = 0
    for collection in ("transicions", "fluxos_pilota"):
        for index, item in enumerate(document.get(collection, [])):
            expression = item.get("condicio")
            if not expression:
                continue
            counter += 1
            knowledge = item.get("estat_coneixement")
            kind = "task_condition" if knowledge == "condicio_tasca" else "observation"
            result.append(
                {
                    "id": f"COND_{counter}",
                    "kind": kind,
                    "expression": expression,
                    "origin_ref": f"exercises/{exercise_id}/spatial-relations.json#/{collection}/{index}/condicio",
                    "status": "validated" if knowledge != "provisional" else "provisional",
                }
            )
    for branch_index, branch in enumerate(document.get("branques_decisionals", [])):
        for alternative_index, alternative in enumerate(branch.get("alternatives", [])):
            counter += 1
            result.append(
                {
                    "id": f"COND_{counter}",
                    "kind": "observation",
                    "expression": alternative["condicio"],
                    "origin_ref": (
                        f"exercises/{exercise_id}/spatial-relations.json"
                        f"#/branques_decisionals/{branch_index}/alternatives/{alternative_index}/condicio"
                    ),
                    "status": "validated",
                }
            )
    return result


def _operator_frames(document: Document, exercise_id: str) -> list[Document]:
    ambiguous = {"exterior_de", "interior_de", "darrere_de", "proper_a", "delimitat_per"}
    frames: list[Document] = []
    for space_index, space in enumerate(document["espais"]):
        definitions = [("definicio", space["definicio"])] + [
            (f"restriccions/{index}", restriction)
            for index, restriction in enumerate(space.get("restriccions", []))
        ]
        for definition_name, definition in definitions:
            operator = definition["operador"]
            if operator not in ambiguous:
                continue
            unresolved = exercise_id == "TR-UVOF-015" and operator == "delimitat_per"
            frames.append(
                {
                    "id": f"FRAME_{space['id']}_{len(frames) + 1}",
                    "space_ref": _global(exercise_id, "space", space["id"]),
                    "definition_ref": (
                        f"exercises/{exercise_id}/spatial-relations.json"
                        f"#/espais/{space_index}/{definition_name}"
                    ),
                    "operator": operator,
                    "axis": (
                        "attack_relative" if operator in {"exterior_de", "interior_de", "darrere_de"}
                        else "relational"
                    ),
                    "viewpoint": "attacking_team" if operator != "proper_a" else "subject_relative",
                    "distance_class": "functional" if operator == "proper_a" else "not_applicable",
                    "closure": (
                        "unresolved" if unresolved else "semantic_boundary_set"
                        if operator == "delimitat_per" else "referenced_boundary"
                        if operator == "interior_de" else "not_applicable"
                    ),
                    "status": "unresolved" if unresolved else "complete",
                }
            )
    return frames


def _decision_mappings(
    document: Document,
    exercise_id: str,
    exercise: Document,
    exercise_index: int,
) -> list[Document]:
    branch_by_decision: dict[str, list[Document]] = {}
    for branch in document.get("branques_decisionals", []):
        refs = branch.get("decisions_semantiques_ref") or [branch.get("decisio_semantica_ref")]
        for ref in refs:
            if ref:
                branch_by_decision.setdefault(ref, []).append(branch)
    result: list[Document] = []
    explicit_014 = {
        "superar": "A_SUPERAR",
        "pivot": "A_CONTINUITAT_INTERIOR",
        "extrem": "A_CONTINUITAT_EXTERIOR",
        "canvi_de_banda_si_conve": "A_CANVI_BANDA",
    }
    for phase_index, phase in enumerate(exercise.get("fases", [])):
        for decision_index, decision in enumerate(phase.get("decisions", [])):
            decision_ref = artifact_ref(
                "corpus/uvof.semantic.json",
                f"/exercicis/{exercise_index}/fases/{phase_index}/decisions/{decision_index}",
            )
            branches = branch_by_decision.get(decision_ref, [])
            alternatives = [alternative for branch in branches for alternative in branch["alternatives"]]
            mappings: list[Document] = []
            for option_index, option in enumerate(decision.get("opcions", [])):
                option_ref = f"{decision_ref}/opcions/{option_index}"
                matched: list[Document] = []
                if exercise_id == "TR-UVOF-014" and option in explicit_014:
                    matched = [
                        item for item in alternatives if item["id"] == explicit_014[option]
                    ]
                else:
                    option_tokens = _normalize(option)
                    scored = [
                        (
                            len(
                                option_tokens
                                & _normalize(
                                    f"{alternative['id']} {alternative['condicio']} "
                                    + " ".join(
                                        str(value)
                                        for relation in alternative["efectes_espacials"]
                                        for value in (
                                            relation["subjecte"],
                                            relation["predicat"],
                                            *relation["objectes"],
                                        )
                                    )
                                )
                            ),
                            alternative,
                        )
                        for alternative in alternatives
                    ]
                    best = max((score for score, _ in scored), default=0)
                    if best > 0:
                        matched = [item for score, item in scored if score == best][:1]
                mappings.append(
                    {
                        "option_ref": option_ref,
                        "alternative_refs": [
                            _global(exercise_id, "alternative", item["id"])
                            for item in matched
                        ],
                        "status": "mapped" if matched else "preserved_symbolically",
                    }
                )
            result.append(
                {
                    "decision_ref": decision_ref,
                    "branch_refs": [
                        _global(exercise_id, "branch", branch["id"])
                        for branch in branches
                    ],
                    "options": mappings,
                }
            )
    return result


def _dependencies(document: Document, exercise_id: str) -> list[Document]:
    known_local = {
        node["id"]: _global(exercise_id, "node", node["id"])
        for node in document["nodes"]
    }
    known_local.update(
        {
            space["id"]: _global(exercise_id, "space", space["id"])
            for space in document["espais"]
        }
    )
    edges: list[Document] = []
    seen: set[tuple[str, str, str]] = set()

    def add(from_ref: str, to_ref: str, kind: str, origin_ref: str) -> None:
        key = (from_ref, to_ref, kind)
        if key in seen:
            return
        seen.add(key)
        edges.append(
            {
                "from_ref": from_ref,
                "to_ref": to_ref,
                "kind": kind,
                "origin_ref": origin_ref,
            }
        )

    for space_index, space in enumerate(document["espais"]):
        for name, definition in [("definicio", space["definicio"])] + [
            (f"restriccions/{index}", restriction)
            for index, restriction in enumerate(space.get("restriccions", []))
        ]:
            for argument in definition["arguments"]:
                if argument in known_local:
                    add(
                        known_local[space["id"]],
                        known_local[argument],
                        "defined_by",
                        f"exercises/{exercise_id}/spatial-relations.json#/espais/{space_index}/{name}",
                    )
    # Only constraints that can define an entity through another entity belong
    # in the resolvability graph. Tactical relations such as adaptation,
    # front/behind or support are directional facts, not definitions; treating
    # them as dependencies creates false cycles.
    dependency_predicates = {"ocupa", "proper_a"}
    for state_index, state in enumerate(document["estats"]):
        for relation_index, relation in enumerate(state["relacions"]):
            if relation["predicat"] not in dependency_predicates:
                continue
            if relation["subjecte"] not in known_local:
                continue
            for object_id in relation["objectes"]:
                if object_id in known_local:
                    add(
                        known_local[relation["subjecte"]],
                        known_local[object_id],
                        "relational_constraint",
                        (
                            f"exercises/{exercise_id}/spatial-relations.json"
                            f"#/estats/{state_index}/relacions/{relation_index}"
                        ),
                    )
    return edges


def _coverage(
    document: Document,
    exercise_id: str,
    catalogs: list[list[Document]],
) -> list[Document]:
    entity_by_source: dict[str, list[str]] = {}
    for entity in document["namespace"]["entities"]:
        if entity.get("source_ref"):
            entity_by_source.setdefault(entity["source_ref"], []).append(entity["ref"])
    for transition in document.get("transicions", []):
        if transition.get("accio_semantica_ref"):
            entity_by_source.setdefault(transition["accio_semantica_ref"], []).append(
                _global(exercise_id, "transition", transition["id"])
            )
    for flow in document.get("fluxos_pilota", []):
        entity_by_source.setdefault(flow["referencia_semantica"], []).append(
            _global(exercise_id, "flow", flow["id"])
        )
    for branch in document.get("branques_decisionals", []):
        for ref in branch.get("decisions_semantiques_ref") or [branch.get("decisio_semantica_ref")]:
            if ref:
                entity_by_source.setdefault(ref, []).append(
                    _global(exercise_id, "branch", branch["id"])
                )
    for mapping in document["decision_mappings"]:
        for option in mapping["options"]:
            entity_by_source.setdefault(option["option_ref"], []).extend(
                option["alternative_refs"]
            )
    result: list[Document] = []
    seen: set[str] = set()
    for catalog in catalogs:
        for item in catalog:
            source_ref = item["source_ref"]
            if source_ref in seen:
                continue
            seen.add(source_ref)
            refs = sorted(set(entity_by_source.get(source_ref, [])))
            result.append(
                {
                    "source_ref": source_ref,
                    "kind": item["kind"],
                    "preservation": "mapped" if refs else "preserved_symbolically",
                    "spatial_refs": refs,
                }
            )
    return result


def _unresolved_items(exercise_id: str) -> list[Document]:
    items: dict[str, list[Document]] = {
        "TR-UVOF-001": [
            {
                "code": "SEMANTIC_SOURCE_CONFLICT",
                "impact": "blocked",
                "entity_refs": ["TR-UVOF-001"],
                "message": "El model detallat i el corpus discrepen; no hi ha mapping aprovat.",
                "requires_trainer": True,
            }
        ],
        "TR-UVOF-005": [
            {
                "code": "SEMANTIC_BALL_FLOW_UNSPECIFIED",
                "impact": "partial",
                "entity_refs": ["traca:TR-UVOF-005:node:B1"],
                "message": "B1 està declarada però la font no especifica cap flux.",
                "requires_trainer": True,
            }
        ],
        "TR-UVOF-007": [
            {
                "code": "SEMANTIC_BALL_INFORMATION_UNSPECIFIED",
                "impact": "partial",
                "entity_refs": ["TR-UVOF-007"],
                "message": "La font no declara pilota, posseïdor ni passades.",
                "requires_trainer": True,
            }
        ],
        "TR-UVOF-008": [
            {
                "code": "SEMANTIC_BALL_INFORMATION_UNSPECIFIED",
                "impact": "partial",
                "entity_refs": ["TR-UVOF-008"],
                "message": "La font no declara pilota, posseïdor ni passades.",
                "requires_trainer": True,
            }
        ],
        "TR-UVOF-011": [
            {
                "code": "UNINSTANTIATED_PARTICIPANT_GROUP",
                "impact": "blocked",
                "entity_refs": ["DEF_4"],
                "message": "DEF_4 és un únic node i no quatre defensors identificats.",
                "requires_trainer": True,
            }
        ],
        "TR-UVOF-014": [
            {
                "code": "SEMANTIC_OPTIONS_PRESERVED_SYMBOLICALLY",
                "impact": "partial",
                "entity_refs": ["traca:TR-UVOF-014:branch:BR_JOC_OBERT_6X6"],
                "message": "Les sis opcions es preserven; continuïtat i encreuament resten simbòliques.",
                "requires_trainer": True,
            }
        ],
        "TR-UVOF-015": [
            {
                "code": "FINTA_ADJACENT_SPACE_MISSING",
                "impact": "blocked",
                "entity_refs": ["T_AESQ_FINTA", "T_ACE_FINTA", "T_ADRE_FINTA"],
                "message": "Falten l'espai inicial, el contigu i el criteri de superació de cada duel.",
                "requires_trainer": True,
            }
        ],
    }
    return items.get(exercise_id, [])


def migrate_document(
    document: Document,
    exercise: Document,
    exercise_index: int,
    corpus: Document,
    detail: Document,
) -> Document:
    result = deepcopy(document)
    exercise_id = exercise["id"]
    result["meta"]["versio_contracte"] = "0.3.0"
    result["meta"]["versio_instancia"] = "0.3.0"

    detail_candidate = {
        "id": "detailed",
        "artifact": "exercises/TR-UVOF-001/semantic.json",
        "selector": "",
        "version": detail["meta"]["versio_instancia"],
        "digest": canonical_digest(detail),
        "canonical": False,
        "validation_status": "partially_validated",
    }
    corpus_candidate = {
        "id": "corpus",
        "artifact": "corpus/uvof.semantic.json",
        "selector": f"/exercicis/{exercise_index}",
        "version": corpus["meta"]["versio_corpus"],
        "digest": canonical_digest(exercise),
        "canonical": exercise_id != "TR-UVOF-001",
        "validation_status": "validated",
    }
    if exercise_id == "TR-UVOF-001":
        result["semantic_source"] = {
            "exercise_id": exercise_id,
            "status": "conflict",
            "candidates": [detail_candidate, corpus_candidate],
            "conflict_code": "SEMANTIC_SOURCE_CONFLICT",
        }
        _add_uvof001_ball_flows(result, exercise, exercise_index)
    else:
        result["semantic_source"] = {
            "exercise_id": exercise_id,
            "status": "canonical",
            "candidates": [corpus_candidate],
        }
    result["font_semantica"]["fitxers"] = [
        candidate["artifact"] for candidate in result["semantic_source"]["candidates"]
    ]

    for node in result["nodes"]:
        source_ref = _node_semantic_ref(
            exercise_id, node, exercise, exercise_index, detail
        )
        if source_ref:
            node["referencia_semantica"] = source_ref
        else:
            node.pop("referencia_semantica", None)

    if exercise_id == "TR-UVOF-001":
        spaces = detail["model_exercici"]["espais_i_intervals"]
        for space in result["espais"]:
            index = _find_index(spaces, space["id"])
            if index is not None:
                space["referencia_semantica"] = artifact_ref(
                    "exercises/TR-UVOF-001/semantic.json",
                    f"/model_exercici/espais_i_intervals/{index}",
                )
            else:
                space.pop("referencia_semantica", None)
    else:
        for space in result["espais"]:
            space.pop("referencia_semantica", None)

    for transition in result["transicions"]:
        ref = _action_ref(
            transition.get("accio_semantica_ref"),
            transition["fase_ref"],
            exercise,
            exercise_index,
            exercise_id,
        )
        if ref:
            transition["accio_semantica_ref"] = ref
        else:
            transition.pop("accio_semantica_ref", None)

    for branch in result["branques_decisionals"]:
        current_refs = branch.get("decisions_semantiques_ref") or [
            branch.get("decisio_semantica_ref")
        ]
        stable_refs = []
        for current in current_refs:
            if not current:
                continue
            decision_id = str(current).rsplit("/", 1)[-1]
            if exercise_id == "TR-UVOF-001" and current.startswith("SA"):
                sub_id = current.split(".", 1)[0]
                subactions = detail["model_exercici"]["subaccions"]
                sub_index = next(i for i, item in enumerate(subactions) if item["id"] == sub_id)
                stable_refs.append(
                    artifact_ref(
                        "exercises/TR-UVOF-001/semantic.json",
                        f"/model_exercici/subaccions/{sub_index}/situacio_decisional",
                    )
                )
            else:
                stable = _decision_ref(decision_id, exercise, exercise_index)
                if stable:
                    stable_refs.append(stable)
        branch.pop("decisio_semantica_ref", None)
        branch.pop("decisions_semantiques_ref", None)
        if len(stable_refs) == 1:
            branch["decisio_semantica_ref"] = stable_refs[0]
        elif stable_refs:
            branch["decisions_semantiques_ref"] = stable_refs

    for flow in result.get("fluxos_pilota", []):
        if not flow.get("referencia_semantica"):
            source_ref = _flow_ref(flow, exercise, exercise_index)
            if source_ref:
                flow["referencia_semantica"] = source_ref

    result["namespace"] = _namespace(result, exercise_id)
    result["bindings"] = _bindings(exercise_id, exercise, exercise_index)
    result["participant_semantics"] = _participant_semantics(
        result, exercise_id, corpus, detail
    )
    result["participant_groups"] = _participant_groups(
        exercise_id, exercise, exercise_index
    )
    result["material_semantics"] = _material_semantics(
        result, exercise_id, exercise, exercise_index, detail
    )
    result["typed_relations"] = _typed_relations(result, exercise_id)
    result["typed_conditions"] = _typed_conditions(result, exercise_id)
    result["operator_frames"] = _operator_frames(result, exercise_id)
    result["decision_mappings"] = _decision_mappings(
        result, exercise_id, exercise, exercise_index
    )
    result["dependencies"] = _dependencies(result, exercise_id)
    result["replication"] = {
        "mode": result["font_semantica"]["simetria"],
        "status": (
            "resolved"
            if result["font_semantica"]["simetria"] == "sense_simetria"
            else "unresolved"
        ),
        "identity_mapping": [],
        "required_for_preflight": False,
    }
    result["unresolved_items"] = _unresolved_items(exercise_id)
    result["compatibility"] = {
        "migrated_from": "0.2.0",
        "v02_status": "historical_read_only",
        "policy": "no_implicit_downgrade",
    }
    catalogs = [_semantic_catalog(exercise, exercise_index)]
    if exercise_id == "TR-UVOF-001":
        catalogs.append(_detail_catalog(detail))
    result["semantic_coverage"] = _coverage(result, exercise_id, catalogs)
    result["integrity"] = {"algorithm": "sha256", "spatial_digest": ""}
    result["integrity"]["spatial_digest"] = spatial_digest(result)
    return result


def main() -> int:
    V03_SCHEMA.write_text(
        json.dumps(_schema_v03(), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    detail = json.loads(DETAIL_PATH.read_text(encoding="utf-8"))
    exercise_by_id = {
        exercise["id"]: (index, exercise)
        for index, exercise in enumerate(corpus["exercicis"])
    }
    for path in sorted((ROOT / "exercises").glob("TR-UVOF-*/spatial-relations.json")):
        current = json.loads(path.read_text(encoding="utf-8"))
        if current.get("meta", {}).get("versio_contracte") != "0.2.0":
            raise RuntimeError(
                f"{path} no és una entrada v0.2; la migració és one-shot i no "
                "reescriu v0.3."
            )
        exercise_id = current["font_semantica"]["exercici_id"]
        exercise_index, exercise = exercise_by_id[exercise_id]
        migrated = migrate_document(
            current,
            exercise,
            exercise_index,
            corpus,
            detail,
        )
        path.write_text(
            json.dumps(migrated, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
