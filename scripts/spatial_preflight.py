from __future__ import annotations

import argparse
import hashlib
import json
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable

from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[1]
AMBIGUOUS_OPERATORS = {
    "exterior_de",
    "interior_de",
    "darrere_de",
    "proper_a",
    "delimitat_per",
}
FORBIDDEN_GEOMETRY_KEYS = {
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
    payload = json.loads(json.dumps(document))
    payload.get("integrity", {}).pop("spatial_digest", None)
    return canonical_digest(payload)


def _pointer_get(document: Any, pointer: str) -> Any:
    value = document
    if not pointer:
        return value
    if not pointer.startswith("/"):
        raise ValueError("JSON Pointer must start with '/'")
    for token in pointer[1:].split("/"):
        token = token.replace("~1", "/").replace("~0", "~")
        value = value[int(token)] if isinstance(value, list) else value[token]
    return value


def _contains_forbidden_geometry(value: Any) -> bool:
    if isinstance(value, dict):
        if FORBIDDEN_GEOMETRY_KEYS.intersection(value):
            return True
        return any(_contains_forbidden_geometry(item) for item in value.values())
    if isinstance(value, list):
        return any(_contains_forbidden_geometry(item) for item in value)
    return False


def _diagnostic(
    code: str,
    impact: str,
    file: str,
    entity_ref: str,
    message: str,
    source_refs: Iterable[str] = (),
) -> Document:
    return {
        "code": code,
        "impact": impact,
        "file": file,
        "entity_ref": entity_ref,
        "message": message,
        "source_refs": sorted(set(source_refs)),
    }


class SourceRegistry:
    def __init__(self, root: Path, candidates: list[Document]) -> None:
        self.root = root
        self.candidates = candidates
        self.documents: dict[str, Any] = {}
        self.errors: list[Document] = []

    def load(self, spatial_file: str) -> None:
        for candidate in self.candidates:
            artifact = candidate["artifact"]
            path = (self.root / artifact).resolve()
            try:
                path.relative_to(self.root.resolve())
                raw = json.loads(path.read_text(encoding="utf-8"))
                selected = _pointer_get(raw, candidate["selector"])
            except (OSError, ValueError, KeyError, IndexError, TypeError, json.JSONDecodeError) as error:
                self.errors.append(
                    _diagnostic(
                        "SEMANTIC_SOURCE_UNRESOLVED",
                        "blocked",
                        spatial_file,
                        candidate["id"],
                        f"No es pot carregar la font semàntica: {error}",
                        [artifact],
                    )
                )
                continue
            self.documents[artifact] = raw
            actual_digest = canonical_digest(selected)
            if actual_digest != candidate["digest"]:
                self.errors.append(
                    _diagnostic(
                        "SEMANTIC_SOURCE_DIGEST_MISMATCH",
                        "blocked",
                        spatial_file,
                        candidate["id"],
                        "El fingerprint declarat no coincideix amb la font.",
                        [artifact_ref(artifact, candidate["selector"])],
                    )
                )

    def resolve(self, reference: str) -> Any:
        if "#" not in reference:
            raise ValueError("stable reference lacks '#'")
        artifact, pointer = reference.split("#", 1)
        if artifact not in self.documents:
            path = (self.root / artifact).resolve()
            path.relative_to(self.root.resolve())
            self.documents[artifact] = json.loads(path.read_text(encoding="utf-8"))
        return _pointer_get(self.documents[artifact], pointer)


def artifact_ref(artifact: str, pointer: str) -> str:
    return f"{artifact}#{pointer}"


def _semantic_entities(document: Any, artifact: str, selector: str) -> list[Document]:
    base = selector
    entities: list[Document] = []
    if isinstance(document, dict) and "model_exercici" in document:
        model = document["model_exercici"]
        for collection, kind in (
            ("participants_plantilla", "participant"),
            ("materials", "material"),
        ):
            for index, _ in enumerate(model.get(collection, [])):
                entities.append(
                    {
                        "source_ref": artifact_ref(
                            artifact, f"{base}/model_exercici/{collection}/{index}"
                        ),
                        "kind": kind,
                    }
                )
        for sub_index, subaction in enumerate(model.get("subaccions", [])):
            for action_index, _ in enumerate(subaction.get("sequencia_obligatoria", [])):
                entities.append(
                    {
                        "source_ref": artifact_ref(
                            artifact,
                            f"{base}/model_exercici/subaccions/{sub_index}/sequencia_obligatoria/{action_index}",
                        ),
                        "kind": "action",
                    }
                )
        return entities
    if not isinstance(document, dict):
        return entities
    for collection, kind in (
        ("participants", "participant"),
        ("materials", "material"),
        ("pilotes", "ball"),
    ):
        for index, _ in enumerate(document.get(collection, [])):
            entities.append(
                {
                    "source_ref": artifact_ref(artifact, f"{base}/{collection}/{index}"),
                    "kind": kind,
                }
            )
    for phase_index, phase in enumerate(document.get("fases", [])):
        for action_index, _ in enumerate(phase.get("accions", [])):
            entities.append(
                {
                    "source_ref": artifact_ref(
                        artifact, f"{base}/fases/{phase_index}/accions/{action_index}"
                    ),
                    "kind": "action",
                }
            )
        for flow_index, _ in enumerate(phase.get("fluxos_pilota", [])):
            entities.append(
                {
                    "source_ref": artifact_ref(
                        artifact,
                        f"{base}/fases/{phase_index}/fluxos_pilota/{flow_index}",
                    ),
                    "kind": "ball_flow",
                }
            )
        for decision_index, decision in enumerate(phase.get("decisions", [])):
            decision_ref = artifact_ref(
                artifact, f"{base}/fases/{phase_index}/decisions/{decision_index}"
            )
            entities.append({"source_ref": decision_ref, "kind": "decision"})
            for option_index, _ in enumerate(decision.get("opcions", [])):
                entities.append(
                    {
                        "source_ref": f"{decision_ref}/opcions/{option_index}",
                        "kind": "decision_option",
                    }
                )
    return entities


def _strongly_connected_components(edges: list[tuple[str, str]]) -> list[list[str]]:
    graph: dict[str, list[str]] = defaultdict(list)
    vertices: set[str] = set()
    for source, target in edges:
        graph[source].append(target)
        vertices.update((source, target))
    index = 0
    indices: dict[str, int] = {}
    lowlinks: dict[str, int] = {}
    stack: list[str] = []
    on_stack: set[str] = set()
    components: list[list[str]] = []

    def visit(vertex: str) -> None:
        nonlocal index
        indices[vertex] = index
        lowlinks[vertex] = index
        index += 1
        stack.append(vertex)
        on_stack.add(vertex)
        for neighbour in graph.get(vertex, []):
            if neighbour not in indices:
                visit(neighbour)
                lowlinks[vertex] = min(lowlinks[vertex], lowlinks[neighbour])
            elif neighbour in on_stack:
                lowlinks[vertex] = min(lowlinks[vertex], indices[neighbour])
        if lowlinks[vertex] == indices[vertex]:
            component: list[str] = []
            while True:
                current = stack.pop()
                on_stack.remove(current)
                component.append(current)
                if current == vertex:
                    break
            components.append(sorted(component))

    for vertex in sorted(vertices):
        if vertex not in indices:
            visit(vertex)
    return components


def _candidate_selected_document(
    registry: SourceRegistry, candidate: Document
) -> Any | None:
    raw = registry.documents.get(candidate["artifact"])
    if raw is None:
        return None
    try:
        return _pointer_get(raw, candidate["selector"])
    except (KeyError, IndexError, TypeError, ValueError):
        return None


def preflight_document(
    document: Document,
    *,
    root: Path = ROOT,
    spatial_file: str | None = None,
) -> Document:
    exercise_id = document.get("semantic_source", {}).get(
        "exercise_id",
        document.get("font_semantica", {}).get("exercici_id", "UNKNOWN"),
    )
    file = spatial_file or f"exercises/{exercise_id}/spatial-relations.json"
    diagnostics: list[Document] = []

    version = document.get("meta", {}).get("versio_contracte")
    if version != "0.3.0":
        diagnostics.append(
            _diagnostic(
                "SPATIAL_CONTRACT_VERSION_UNSUPPORTED",
                "blocked",
                file,
                "meta/versio_contracte",
                f"El preflight v0.3 no accepta la versió {version!r}.",
            )
        )
        return _finish(exercise_id, diagnostics)

    if _contains_forbidden_geometry(
        {key: value for key, value in document.items() if key != "meta"}
    ):
        diagnostics.append(
            _diagnostic(
                "SPATIAL_GEOMETRY_FORBIDDEN",
                "blocked",
                file,
                exercise_id,
                "El contracte v0.3 no admet geometria ni coordenades.",
            )
        )

    schema_path = root / "schema" / "traca.spatial-relations.schema.v0.3.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    structural_errors = sorted(
        Draft202012Validator(schema).iter_errors(document),
        key=lambda error: list(error.absolute_path),
    )
    for error in structural_errors:
        path = "/".join(str(part) for part in error.absolute_path)
        diagnostics.append(
            _diagnostic(
                "SPATIAL_SCHEMA_ERROR",
                "blocked",
                file,
                path,
                error.message,
            )
        )
    if structural_errors:
        return _finish(exercise_id, diagnostics)

    declared_digest = document["integrity"]["spatial_digest"]
    actual_digest = spatial_digest(document)
    if declared_digest != actual_digest:
        diagnostics.append(
            _diagnostic(
                "SPATIAL_SOURCE_DIGEST_MISMATCH",
                "blocked",
                file,
                "integrity/spatial_digest",
                "El fingerprint espacial no coincideix amb el contingut.",
            )
        )

    source = document["semantic_source"]
    canonical_candidates = [item for item in source["candidates"] if item["canonical"]]
    if source["status"] == "conflict":
        diagnostics.append(
            _diagnostic(
                "SEMANTIC_SOURCE_CONFLICT",
                "blocked",
                file,
                exercise_id,
                "Hi ha fonts semàntiques divergents sense mapping aprovat.",
                [item["artifact"] for item in source["candidates"]],
            )
        )
    elif len(canonical_candidates) != 1:
        diagnostics.append(
            _diagnostic(
                "SEMANTIC_CANONICAL_SOURCE_CARDINALITY",
                "blocked",
                file,
                exercise_id,
                "Cal exactament una font semàntica canònica.",
            )
        )

    registry = SourceRegistry(root, source["candidates"])
    registry.load(file)
    diagnostics.extend(registry.errors)

    namespace_entities = document["namespace"]["entities"]
    global_refs = [item["ref"] for item in namespace_entities]
    global_ref_set = set(global_refs)
    duplicate_refs = sorted({ref for ref in global_refs if global_refs.count(ref) > 1})
    for reference in duplicate_refs:
        diagnostics.append(
            _diagnostic(
                "GLOBAL_NAMESPACE_COLLISION",
                "blocked",
                file,
                reference,
                "La referència global està duplicada.",
            )
        )

    source_refs = [
        item["source_ref"]
        for item in namespace_entities
        if item.get("source_ref")
    ]
    for reference in sorted(
        {item for item in source_refs if source_refs.count(item) > 1}
    ):
        diagnostics.append(
            _diagnostic(
                "SEMANTIC_REFERENCE_DUPLICATE",
                "blocked",
                file,
                reference,
                "Dues entitats espacials reclamen la mateixa identitat semàntica.",
                [reference],
            )
        )

    node_kind = {
        "participant": "participant",
        "material": "material",
        "pilota": "ball",
    }
    live_entities: set[tuple[str, str]] = {
        (node_kind.get(node["classe"], "reference"), node["id"])
        for node in document["nodes"]
    }
    for collection, kind in (
        ("espais", "space"),
        ("estats", "state"),
        ("transicions", "transition"),
        ("fluxos_pilota", "ball_flow"),
        ("branques_decisionals", "decision_branch"),
    ):
        live_entities.update((kind, item["id"]) for item in document[collection])
    live_entities.update(
        ("decision_alternative", alternative["id"])
        for branch in document["branques_decisionals"]
        for alternative in branch["alternatives"]
    )
    namespace_keys = {
        (entity["kind"], entity["local_id"])
        for entity in namespace_entities
    }
    for kind, local_id in sorted(namespace_keys - live_entities):
        diagnostics.append(
            _diagnostic(
                "GLOBAL_NAMESPACE_DANGLING_ENTITY",
                "blocked",
                file,
                f"{kind}:{local_id}",
                "El namespace conserva una entitat que ja no existeix al document.",
            )
        )
    for kind, local_id in sorted(live_entities - namespace_keys):
        diagnostics.append(
            _diagnostic(
                "GLOBAL_NAMESPACE_ENTITY_MISSING",
                "blocked",
                file,
                f"{kind}:{local_id}",
                "Una entitat del document no té identitat al namespace global.",
            )
        )

    local_collections = {
        "nodes": document["nodes"],
        "spaces": document["espais"],
        "states": document["estats"],
        "transitions": document["transicions"],
        "flows": document["fluxos_pilota"],
        "branches": document["branques_decisionals"],
        "alternatives": [
            alternative
            for branch in document["branques_decisionals"]
            for alternative in branch["alternatives"]
        ],
    }
    for collection, items in local_collections.items():
        identifiers = [item["id"] for item in items]
        for identifier in sorted(
            {item for item in identifiers if identifiers.count(item) > 1}
        ):
            diagnostics.append(
                _diagnostic(
                    "LOCAL_ID_DUPLICATE",
                    "blocked",
                    file,
                    f"{collection}:{identifier}",
                    "L'identificador local està duplicat dins la col·lecció.",
                )
            )

    stable_refs: list[tuple[str, str, str | None]] = []
    for entity in namespace_entities:
        if entity.get("source_ref"):
            stable_refs.append(
                (entity["source_ref"], entity["ref"], entity["kind"])
            )
    for node in document["nodes"]:
        if node.get("referencia_semantica"):
            stable_refs.append(
                (node["referencia_semantica"], f"nodes/{node['id']}", node["classe"])
            )
    for space in document["espais"]:
        if space.get("referencia_semantica"):
            stable_refs.append(
                (space["referencia_semantica"], f"spaces/{space['id']}", "space")
            )
    for transition in document["transicions"]:
        if transition.get("accio_semantica_ref"):
            stable_refs.append(
                (transition["accio_semantica_ref"], transition["id"], "action")
            )
    for flow in document.get("fluxos_pilota", []):
        stable_refs.append((flow["referencia_semantica"], flow["id"], "ball_flow"))
    for mapping in document["decision_mappings"]:
        stable_refs.append((mapping["decision_ref"], mapping["decision_ref"], "decision"))
        for option in mapping["options"]:
            stable_refs.append((option["option_ref"], option["option_ref"], "decision_option"))
    for binding in document["bindings"]:
        stable_refs.extend((ref, binding["id"], "action") for ref in binding["source_refs"])
    for participant in document["participant_semantics"]:
        stable_refs.append(
            (participant["source_ref"], participant["participant_ref"], "participant")
        )
    for group in document["participant_groups"]:
        stable_refs.append((group["source_ref"], group["id"], "participant"))
    for material in document["material_semantics"]:
        stable_refs.append((material["source_ref"], material["material_ref"], "material"))
    for relation in document["typed_relations"]:
        stable_refs.append((relation["origin_ref"], relation["id"], "relation"))
    for frame in document["operator_frames"]:
        stable_refs.append((frame["definition_ref"], frame["id"], "space_definition"))
    for dependency in document["dependencies"]:
        stable_refs.append((dependency["origin_ref"], dependency["from_ref"], "dependency"))
    for coverage in document["semantic_coverage"]:
        stable_refs.append((coverage["source_ref"], coverage["source_ref"], coverage["kind"]))

    for reference, entity_ref, expected_kind in stable_refs:
        try:
            value = registry.resolve(reference)
        except (OSError, ValueError, KeyError, IndexError, TypeError, json.JSONDecodeError) as error:
            diagnostics.append(
                _diagnostic(
                    "SEMANTIC_REFERENCE_UNRESOLVED",
                    "blocked",
                    file,
                    entity_ref,
                    f"La referència {reference} no es resol: {error}",
                    [reference],
                )
            )
            continue
        # Coverage records point at source JSON values. Their final pointer
        # segment is an array index, not an entity identifier. Identifier/type
        # equality only applies to namespace and local-node references.
        if (
            expected_kind in {"participant", "material", "pilota", "ball"}
            and (entity_ref.startswith("traca:") or entity_ref.startswith("nodes/"))
        ):
            expected_id = entity_ref.rsplit(":", 1)[-1].rsplit("/", 1)[-1]
            if isinstance(value, dict) and value.get("id") not in {None, expected_id}:
                diagnostics.append(
                    _diagnostic(
                        "SEMANTIC_REFERENCE_TYPE_MISMATCH",
                        "blocked",
                        file,
                        entity_ref,
                        f"La referència resol una entitat diferent de {expected_id}.",
                        [reference],
                    )
                )

    entity_by_ref = {item["ref"]: item for item in namespace_entities}
    participant_entity_refs = {
        item["ref"] for item in namespace_entities if item["kind"] == "participant"
    }
    participant_profile_refs = {
        item["participant_ref"] for item in document["participant_semantics"]
    }
    for missing in sorted(participant_entity_refs - participant_profile_refs):
        diagnostics.append(
            _diagnostic(
                "PARTICIPANT_SEMANTICS_MISSING",
                "blocked",
                file,
                missing,
                "El participant no separa rol canònic, costat, rol temporal i funció.",
            )
        )
    for participant in document["participant_semantics"]:
        entity = entity_by_ref.get(participant["participant_ref"])
        if entity is None or entity["kind"] != "participant":
            diagnostics.append(
                _diagnostic(
                    "PARTICIPANT_SEMANTIC_REFERENCE_TYPE_MISMATCH",
                    "blocked",
                    file,
                    participant["participant_ref"],
                    "El perfil separat de rol no apunta a un participant.",
                    [participant["source_ref"]],
                )
            )
    material_entity_refs = {
        item["ref"] for item in namespace_entities if item["kind"] == "material"
    }
    material_profile_refs = {
        item["material_ref"] for item in document["material_semantics"]
    }
    for missing in sorted(material_entity_refs - material_profile_refs):
        diagnostics.append(
            _diagnostic(
                "MATERIAL_SEMANTICS_MISSING",
                "blocked",
                file,
                missing,
                "El material no declara funció i capabilities per instància.",
            )
        )
    for binding in document["bindings"]:
        for target in binding["target_refs"]:
            if target not in entity_by_ref or entity_by_ref[target]["kind"] != "participant":
                diagnostics.append(
                    _diagnostic(
                        "BINDING_TARGET_TYPE_MISMATCH",
                        "blocked",
                        file,
                        binding["id"],
                        "El binding ha d'apuntar exclusivament a participants.",
                        binding["source_refs"],
                    )
                )

    bound_actors = {binding["actor"] for binding in document["bindings"]}
    for candidate in source["candidates"]:
        selected = _candidate_selected_document(registry, candidate)
        if not isinstance(selected, dict) or "fases" not in selected:
            continue
        participant_ids = {
            participant.get("id") for participant in selected.get("participants", [])
        }
        for phase_index, phase in enumerate(selected.get("fases", [])):
            for action_index, action in enumerate(phase.get("accions", [])):
                actor = action.get("actor")
                if actor and actor not in participant_ids and actor not in bound_actors:
                    diagnostics.append(
                        _diagnostic(
                            "GENERIC_ACTOR_BINDING_MISSING",
                            "blocked",
                            file,
                            actor,
                            "Un actor genèric de la font no té binding explícit.",
                            [
                                artifact_ref(
                                    candidate["artifact"],
                                    (
                                        f"{candidate['selector']}/fases/{phase_index}"
                                        f"/accions/{action_index}"
                                    ),
                                )
                            ],
                        )
                    )

    for mapping in document["decision_mappings"]:
        for branch_ref in mapping["branch_refs"]:
            entity = entity_by_ref.get(branch_ref)
            if entity is None or entity["kind"] != "decision_branch":
                diagnostics.append(
                    _diagnostic(
                        "DECISION_BRANCH_REFERENCE_TYPE_MISMATCH",
                        "blocked",
                        file,
                        branch_ref,
                        "El mapping de decisió no apunta a una branca espacial.",
                        [mapping["decision_ref"]],
                    )
                )
        for option in mapping["options"]:
            for alternative_ref in option["alternative_refs"]:
                entity = entity_by_ref.get(alternative_ref)
                if entity is None or entity["kind"] != "decision_alternative":
                    diagnostics.append(
                        _diagnostic(
                            "DECISION_ALTERNATIVE_REFERENCE_TYPE_MISMATCH",
                            "blocked",
                            file,
                            alternative_ref,
                            "L'opció no apunta a una alternativa espacial.",
                            [option["option_ref"]],
                        )
                    )

    for group in document["participant_groups"]:
        actual = len(set(group["instance_refs"]))
        for instance_ref in group["instance_refs"]:
            entity = entity_by_ref.get(instance_ref)
            if entity is None or entity["kind"] != "participant":
                diagnostics.append(
                    _diagnostic(
                        "PARTICIPANT_GROUP_INSTANCE_TYPE_MISMATCH",
                        "blocked",
                        file,
                        group["id"],
                        "Una instància del grup no apunta a un participant.",
                        [group["source_ref"]],
                    )
                )
        if actual != group["expected_cardinality"]:
            diagnostics.append(
                _diagnostic(
                    "UNINSTANTIATED_PARTICIPANT_GROUP",
                    "blocked",
                    file,
                    group["id"],
                    (
                        f"S'esperaven {group['expected_cardinality']} participants "
                        f"i només n'hi ha {actual}."
                    ),
                    [group["source_ref"]],
                )
            )

    for material in document["material_semantics"]:
        entity = entity_by_ref.get(material["material_ref"])
        if entity is None or entity["kind"] != "material":
            diagnostics.append(
                _diagnostic(
                    "MATERIAL_REFERENCE_TYPE_MISMATCH",
                    "blocked",
                    file,
                    material["material_ref"],
                    "La semàntica de material no apunta a un material.",
                    [material["source_ref"]],
                )
            )
        if not material["capabilities"]:
            diagnostics.append(
                _diagnostic(
                    "MATERIAL_CAPABILITY_MISSING",
                    "blocked",
                    file,
                    material["material_ref"],
                    "El material no declara capabilities.",
                    [material["source_ref"]],
                )
            )

    for relation in document["typed_relations"]:
        for field in (
            "primary_attacker_ref",
            "supporting_attacker_ref",
            "defender_ref",
        ):
            reference = relation[field]
            if reference not in entity_by_ref or entity_by_ref[reference]["kind"] != "participant":
                diagnostics.append(
                    _diagnostic(
                        "TYPED_RELATION_ROLE_MISMATCH",
                        "blocked",
                        file,
                        relation["id"],
                        f"{field} no apunta a un participant.",
                        [relation["origin_ref"]],
                    )
                )

    for condition in document["typed_conditions"]:
        try:
            origin_value = registry.resolve(condition["origin_ref"])
        except (OSError, ValueError, KeyError, IndexError, TypeError, json.JSONDecodeError) as error:
            diagnostics.append(
                _diagnostic(
                    "TYPED_CONDITION_ORIGIN_UNRESOLVED",
                    "blocked",
                    file,
                    condition["id"],
                    f"No es resol l'origen de la condició tipada: {error}",
                    [condition["origin_ref"]],
                )
            )
            continue
        if origin_value != condition["expression"]:
            diagnostics.append(
                _diagnostic(
                    "TYPED_CONDITION_ORIGIN_MISMATCH",
                    "blocked",
                    file,
                    condition["id"],
                    "La condició tipada no conserva el literal d'origen.",
                    [condition["origin_ref"]],
                )
            )

    expected_frames: set[str] = set()
    for space_index, space in enumerate(document["espais"]):
        definitions = [("definicio", space["definicio"])] + [
            (f"restriccions/{index}", restriction)
            for index, restriction in enumerate(space.get("restriccions", []))
        ]
        for name, definition in definitions:
            if definition["operador"] in AMBIGUOUS_OPERATORS:
                expected_frames.add(
                    f"{file}#/espais/{space_index}/{name}"
                )
    actual_frames = {item["definition_ref"] for item in document["operator_frames"]}
    for missing in sorted(expected_frames - actual_frames):
        diagnostics.append(
            _diagnostic(
                "SPATIAL_FRAME_INSUFFICIENT",
                "blocked",
                file,
                missing,
                "Un operador ambigu no declara cap marc.",
                [missing],
            )
        )
    for frame in document["operator_frames"]:
        if frame["status"] == "unresolved":
            diagnostics.append(
                _diagnostic(
                    "SPATIAL_FRAME_INSUFFICIENT",
                    "partial",
                    file,
                    frame["space_ref"],
                    "El marc de l'operador continua unresolved.",
                    [frame["definition_ref"]],
                )
            )

    for dependency in document["dependencies"]:
        for field in ("from_ref", "to_ref"):
            if dependency[field] not in global_ref_set:
                diagnostics.append(
                    _diagnostic(
                        "SPATIAL_DEPENDENCY_REFERENCE_UNRESOLVED",
                        "blocked",
                        file,
                        dependency[field],
                        "La dependència apunta fora del namespace.",
                        [dependency["origin_ref"]],
                    )
                )
    edges = [
        (item["from_ref"], item["to_ref"])
        for item in document["dependencies"]
        if item["from_ref"] in global_ref_set and item["to_ref"] in global_ref_set
    ]
    self_edges = {source for source, target in edges if source == target}
    for component in _strongly_connected_components(edges):
        if len(component) > 1 or any(item in self_edges for item in component):
            diagnostics.append(
                _diagnostic(
                    "SPATIAL_UNANCHORED_CYCLE",
                    "blocked",
                    file,
                    component[0],
                    "El graf conté un cicle relacional sense ancoratge independent.",
                    component,
                )
            )

    expected_entities: list[Document] = []
    for candidate in source["candidates"]:
        selected = _candidate_selected_document(registry, candidate)
        if selected is not None:
            expected_entities.extend(
                _semantic_entities(selected, candidate["artifact"], candidate["selector"])
            )
    coverage_by_ref = {item["source_ref"]: item for item in document["semantic_coverage"]}
    for entity in expected_entities:
        if entity["source_ref"] in coverage_by_ref:
            continue
        code = {
            "ball_flow": "SEMANTIC_FLOW_LOSS",
            "decision_option": "SEMANTIC_OPTION_COVERAGE_GAP",
        }.get(entity["kind"], "SEMANTIC_COVERAGE_GAP")
        diagnostics.append(
            _diagnostic(
                code,
                "blocked",
                file,
                entity["source_ref"],
                f"L'entitat semàntica {entity['kind']} no està preservada.",
                [entity["source_ref"]],
            )
        )
    for coverage in document["semantic_coverage"]:
        for reference in coverage["spatial_refs"]:
            if not reference.startswith("traca:") or reference not in global_ref_set:
                diagnostics.append(
                    _diagnostic(
                        "SEMANTIC_COVERAGE_TARGET_UNRESOLVED",
                        "blocked",
                        file,
                        reference,
                        "La cobertura semàntica apunta a una entitat espacial inexistent.",
                        [coverage["source_ref"]],
                    )
                )

    option_refs = {
        entity["source_ref"]
        for entity in expected_entities
        if entity["kind"] == "decision_option"
    }
    mapped_options = {
        option["option_ref"]
        for mapping in document["decision_mappings"]
        for option in mapping["options"]
    }
    for missing_option in sorted(option_refs - mapped_options):
        diagnostics.append(
            _diagnostic(
                "SEMANTIC_OPTION_COVERAGE_GAP",
                "blocked",
                file,
                missing_option,
                "L'opció semàntica no té una entrada de mapping individual.",
                [missing_option],
            )
        )
    option_mapping_refs = [
        option["option_ref"]
        for mapping in document["decision_mappings"]
        for option in mapping["options"]
    ]
    for duplicate in sorted(
        {item for item in option_mapping_refs if option_mapping_refs.count(item) > 1}
    ):
        diagnostics.append(
            _diagnostic(
                "SEMANTIC_OPTION_MAPPING_DUPLICATE",
                "blocked",
                file,
                duplicate,
                "Una opció semàntica apareix més d'una vegada al mapping.",
                [duplicate],
            )
        )
    for mapping in document["decision_mappings"]:
        for option in mapping["options"]:
            if option["status"] == "mapped" and not option["alternative_refs"]:
                diagnostics.append(
                    _diagnostic(
                        "SEMANTIC_OPTION_COVERAGE_GAP",
                        "blocked",
                        file,
                        option["option_ref"],
                        "Una opció marcada mapped no té cap alternativa espacial.",
                        [option["option_ref"]],
                    )
                )

    for flow in document.get("fluxos_pilota", []):
        try:
            semantic_flow = registry.resolve(flow["referencia_semantica"])
        except (OSError, ValueError, KeyError, IndexError, TypeError, json.JSONDecodeError):
            continue
        if not isinstance(semantic_flow, dict) or semantic_flow.get("pilota_id") != flow["pilota_id"]:
            diagnostics.append(
                _diagnostic(
                    "SEMANTIC_FLOW_TYPE_MISMATCH",
                    "blocked",
                    file,
                    flow["id"],
                    "El flux espacial no correspon a la pilota de la font.",
                    [flow["referencia_semantica"]],
                )
            )

    for transition in document["transicions"]:
        if transition["tipus"] == "finta" and transition.get("des_de") == transition.get("cap_a"):
            diagnostics.append(
                _diagnostic(
                    "FINTA_ADJACENT_SPACE_MISSING",
                    "blocked",
                    file,
                    transition["id"],
                    "La finta no diferencia l'espai inicial de l'espai contigu.",
                )
            )

    for item in document["unresolved_items"]:
        diagnostics.append(
            _diagnostic(
                item["code"],
                item["impact"],
                file,
                item["entity_refs"][0] if item["entity_refs"] else exercise_id,
                item["message"],
                item["entity_refs"],
            )
        )

    replication = document["replication"]
    if (
        replication["mode"] != "sense_simetria"
        and replication["status"] == "resolved"
        and not replication["identity_mapping"]
    ):
        diagnostics.append(
            _diagnostic(
                "SPATIAL_SYMMETRY_MAPPING_MISSING",
                "blocked",
                file,
                "replication",
                "La simetria no es pot donar per resolta sense mapping d'identitats.",
            )
        )
    if replication["mode"] == "sense_simetria" and replication["identity_mapping"]:
        diagnostics.append(
            _diagnostic(
                "SPATIAL_FALSE_SYMMETRY",
                "blocked",
                file,
                "replication",
                "S'ha declarat un mapping de simetria en un exercici sense simetria.",
            )
        )
    if replication["required_for_preflight"] and replication["status"] != "resolved":
        diagnostics.append(
            _diagnostic(
                "SPATIAL_SYMMETRY_UNRESOLVED",
                "blocked",
                file,
                "replication",
                "El preflight exigeix un mapping de simetria que continua unresolved.",
            )
        )
    for identity in replication["identity_mapping"]:
        for field in ("source_ref", "target_ref"):
            if identity[field] not in global_ref_set:
                diagnostics.append(
                    _diagnostic(
                        "SPATIAL_SYMMETRY_REFERENCE_UNRESOLVED",
                        "blocked",
                        file,
                        identity[field],
                        "El mapping de simetria apunta fora del namespace.",
                    )
                )

    provisional_refs = [
        item["ref"]
        for item in namespace_entities
        if item["knowledge_status"] in {"provisional", "unresolved", "unknown"}
    ]
    provisional_refs.extend(
        item["id"]
        for item in document["typed_conditions"]
        if item["status"] in {"provisional", "unresolved"}
    )
    provisional_refs.extend(
        participant["participant_ref"]
        for participant in document["participant_semantics"]
        if any(
            participant[field]["status"] in {"provisional", "unresolved"}
            for field in (
                "team",
                "canonical_role",
                "side",
                "temporal_role",
                "exercise_function",
            )
        )
    )
    provisional_refs.extend(
        binding["id"]
        for binding in document["bindings"]
        if binding["status"] in {"provisional", "unresolved"}
    )
    if provisional_refs:
        diagnostics.append(
            _diagnostic(
                "KNOWLEDGE_STATUS_PROPAGATED",
                "partial",
                file,
                provisional_refs[0],
                "El preflight conserva coneixement provisional o unresolved.",
                provisional_refs,
            )
        )

    return _finish(exercise_id, diagnostics)


def _finish(exercise_id: str, diagnostics: list[Document]) -> Document:
    unique: dict[tuple[str, str], Document] = {}
    for item in diagnostics:
        unique.setdefault((item["code"], item["entity_ref"]), item)
    ordered = sorted(
        unique.values(),
        key=lambda item: (item["impact"] != "blocked", item["code"], item["entity_ref"]),
    )
    if any(item["impact"] == "blocked" for item in ordered):
        status = "blocked"
    elif ordered:
        status = "partial"
    else:
        status = "ready"
    return {
        "exercise_id": exercise_id,
        "status": status,
        "diagnostics": ordered,
        "summary": {
            "blocked_count": sum(item["impact"] == "blocked" for item in ordered),
            "partial_count": sum(item["impact"] == "partial" for item in ordered),
        },
        "geometry_generated": False,
    }


def preflight_path(path: Path, *, root: Path = ROOT) -> Document:
    document = json.loads(path.read_text(encoding="utf-8"))
    try:
        relative = str(path.resolve().relative_to(root.resolve()))
    except ValueError:
        relative = str(path)
    return preflight_document(document, root=root, spatial_file=relative)


def preflight_all(*, root: Path = ROOT) -> list[Document]:
    return [
        preflight_path(path, root=root)
        for path in sorted((root / "exercises").glob("TR-UVOF-*/spatial-relations.json"))
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description="Preflight read-only del contracte espacial v0.3")
    parser.add_argument("path", nargs="?", type=Path)
    args = parser.parse_args()
    result: Any = preflight_path(args.path) if args.path else preflight_all()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    reports = result if isinstance(result, list) else [result]
    return 0 if all(item["status"] in {"ready", "partial", "blocked"} for item in reports) else 1


if __name__ == "__main__":
    raise SystemExit(main())
