from __future__ import annotations

import hashlib
import json
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.spatial_preflight import preflight_document


SPATIAL_PATH = ROOT / "exercises/TR-UVOF-015/spatial-relations.json"
COURT_PROFILE_PATH = ROOT / "config/handball-court.ihf-2025.json"
GEOMETRY_SCHEMA_PATH = ROOT / "schema/traca.geometry.schema.v0.1.json"
GEOMETRY_PATH = ROOT / "exercises/TR-UVOF-015/geometry.json"
INTERFACE_BUNDLE_PATH = ROOT / "interface/data/uvof015.geometry.js"


Document = dict[str, Any]


ZONE_SPECS = (
    {
        "suffix": "ESQ",
        "zone": "Z_ESQ",
        "attacker": "A_ESQ",
        "defender": "D_ESQ",
        "passer": "P_ESQ",
        "ball": "B_ESQ",
        "limits": ("LIM_0", "LIM_1"),
        "spaces": ("E_ESQ_A", "E_ESQ_B"),
        "branch": "BR_DUEL_ESQ",
        "transition_prefix": "AESQ",
    },
    {
        "suffix": "CE",
        "zone": "Z_CE",
        "attacker": "A_CE",
        "defender": "D_CE",
        "passer": "P_CE",
        "ball": "B_CE",
        "limits": ("LIM_1", "LIM_2"),
        "spaces": ("E_CE_A", "E_CE_B"),
        "branch": "BR_DUEL_CE",
        "transition_prefix": "ACE",
    },
    {
        "suffix": "DRE",
        "zone": "Z_DRE",
        "attacker": "A_DRE",
        "defender": "D_DRE",
        "passer": "P_DRE",
        "ball": "B_DRE",
        "limits": ("LIM_2", "LIM_3"),
        "spaces": ("E_DRE_A", "E_DRE_B"),
        "branch": "BR_DUEL_DRE",
        "transition_prefix": "ADRE",
    },
)


LIMIT_X = {
    "LIM_0": 1.25,
    "LIM_1": 7.1,
    "LIM_2": 12.9,
    "LIM_3": 18.75,
}


def _canonical_digest(document: Document) -> str:
    payload = json.dumps(
        document,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _source_ref(collection: str, index: int) -> str:
    return f"exercises/TR-UVOF-015/spatial-relations.json#/{collection}/{index}"


def _index_by_id(items: list[Document]) -> dict[str, tuple[int, Document]]:
    return {item["id"]: (index, item) for index, item in enumerate(items)}


def _point(x: float, y: float) -> list[float]:
    return [round(x, 3), round(y, 3)]


def _rectangle(left: float, top: float, right: float, bottom: float) -> list[list[float]]:
    return [
        _point(left, top),
        _point(right, top),
        _point(right, bottom),
        _point(left, bottom),
    ]


def _alternative_spaces(alternative_id: str, spaces: tuple[str, str]) -> tuple[str, str]:
    space_a, space_b = spaces
    if alternative_id.endswith("CONTINUA_A"):
        return space_a, space_a
    if alternative_id.endswith("FINTA_A_B"):
        return space_a, space_b
    if alternative_id.endswith("CONTINUA_B"):
        return space_b, space_b
    if alternative_id.endswith("FINTA_B_A"):
        return space_b, space_a
    raise ValueError(f"Alternativa UVOF015 no suportada: {alternative_id}")


def resolve_uvof015_geometry(
    spatial: Document,
    court_profile: Document,
) -> Document:
    preflight = preflight_document(spatial)
    if preflight["status"] != "ready":
        codes = ", ".join(item["code"] for item in preflight["diagnostics"])
        raise ValueError(f"GEOMETRY_INPUT_NOT_READY: {codes or preflight['status']}")
    if spatial["font_semantica"]["exercici_id"] != "TR-UVOF-015":
        raise ValueError("GEOMETRY_TEMPLATE_UNSUPPORTED: només TR-UVOF-015")

    node_index = _index_by_id(spatial["nodes"])
    space_index = _index_by_id(spatial["espais"])
    transition_index = _index_by_id(spatial["transicions"])
    branch_index = _index_by_id(spatial["branques_decisionals"])

    zones: list[Document] = []
    spaces: list[Document] = []
    entities: list[Document] = []
    common_paths: list[Document] = []
    branches: list[Document] = []
    traceability: list[Document] = []
    entity_ids: set[str] = set()

    def add_entity(
        entity_id: str,
        kind: str,
        label: str,
        x: float,
        y: float,
    ) -> None:
        if entity_id in entity_ids:
            return
        index, _ = node_index[entity_id]
        source = _source_ref("nodes", index)
        entities.append(
            {
                "id": entity_id,
                "kind": kind,
                "label": label,
                "position": _point(x, y),
                "source_ref": source,
                "status": "derived",
            }
        )
        traceability.append(
            {"geometry_ref": f"geometry:entity:{entity_id}", "source_refs": [source]}
        )
        entity_ids.add(entity_id)

    for limit_id, x in LIMIT_X.items():
        add_entity(limit_id, "cone", "", x, 10.15)

    for spec in ZONE_SPECS:
        left_limit, right_limit = spec["limits"]
        left_x = LIMIT_X[left_limit]
        right_x = LIMIT_X[right_limit]
        defender_x = (left_x + right_x) / 2
        defender_y = 7.6
        attacker_y = 14.1
        passer_y = 17.1

        zone_index, _ = space_index[spec["zone"]]
        zone_source = _source_ref("espais", zone_index)
        zones.append(
            {
                "id": spec["zone"],
                "source_ref": zone_source,
                "polygon": _rectangle(left_x, 5.15, right_x, 15.25),
                "limit_refs": [left_limit, right_limit],
                "defender_ref": spec["defender"],
                "defensive_line": [
                    _point(left_x + 0.35, defender_y),
                    _point(right_x - 0.35, defender_y),
                ],
            }
        )
        traceability.append(
            {"geometry_ref": f"geometry:zone:{spec['zone']}", "source_refs": [zone_source]}
        )

        space_centers = {
            spec["spaces"][0]: (left_x + defender_x) / 2,
            spec["spaces"][1]: (defender_x + right_x) / 2,
        }
        for space_id, start_x, end_x in (
            (spec["spaces"][0], left_x, defender_x),
            (spec["spaces"][1], defender_x, right_x),
        ):
            index, _ = space_index[space_id]
            source = _source_ref("espais", index)
            spaces.append(
                {
                    "id": space_id,
                    "source_ref": source,
                    "zone_ref": spec["zone"],
                    "defender_ref": spec["defender"],
                    "polygon": _rectangle(start_x + 0.08, 5.45, end_x - 0.08, 11.05),
                    "center": _point(space_centers[space_id], 8.25),
                }
            )
            traceability.append(
                {"geometry_ref": f"geometry:space:{space_id}", "source_refs": [source]}
            )

        add_entity(spec["attacker"], "attacker", "A", defender_x, attacker_y)
        add_entity(spec["passer"], "passer", "P", defender_x, passer_y)
        add_entity(spec["defender"], "defender", "D", defender_x, defender_y)
        add_entity(spec["ball"], "ball", "", defender_x + 0.34, attacker_y - 0.12)

        attacker_index, _ = node_index[spec["attacker"]]
        passer_index, _ = node_index[spec["passer"]]
        initial_transition_id = f"T_{spec['transition_prefix']}_INICIA"
        receive_transition_id = f"T_{spec['transition_prefix']}_REP"
        initial_transition_index, _ = transition_index[initial_transition_id]
        receive_transition_index, _ = transition_index[receive_transition_id]
        common_paths.extend(
            [
                {
                    "id": f"PATH_{spec['suffix']}_PASSADA_INICIAL",
                    "kind": "initial_pass",
                    "points": [
                        _point(defender_x, attacker_y - 0.15),
                        _point(defender_x + 0.62, 15.45),
                        _point(defender_x, passer_y - 0.25),
                    ],
                    "source_refs": [
                        _source_ref("transicions", initial_transition_index),
                        _source_ref("nodes", attacker_index),
                        _source_ref("nodes", passer_index),
                    ],
                },
                {
                    "id": f"PATH_{spec['suffix']}_CURSA_SENSE_PILOTA",
                    "kind": "run_without_ball",
                    "points": [
                        _point(defender_x, attacker_y - 0.35),
                        _point(defender_x, 12.45),
                        _point(defender_x, 11.05),
                    ],
                    "source_refs": [
                        _source_ref("transicions", receive_transition_index),
                        _source_ref("nodes", attacker_index),
                    ],
                },
            ]
        )

        branch_position, branch = branch_index[spec["branch"]]
        geometry_alternatives: list[Document] = []
        for alternative_position, alternative in enumerate(branch["alternatives"]):
            initial_space, target_space = _alternative_spaces(
                alternative["id"], spec["spaces"]
            )
            initial_x = space_centers[initial_space]
            target_x = space_centers[target_space]
            token = alternative["id"].removeprefix(f"A_{spec['suffix']}_")
            transition_id = f"T_{spec['transition_prefix']}_{token}"
            transition_position, transition = transition_index[transition_id]
            is_feint = transition["tipus"] == "finta"

            if is_feint:
                path_points = [
                    _point(initial_x, 10.75),
                    _point(initial_x, 8.35),
                    _point(initial_x, 7.9),
                    _point((initial_x + target_x) / 2, 7.55),
                    _point(target_x, 6.65),
                    _point(target_x, 5.75),
                ]
            else:
                path_points = [
                    _point(initial_x, 10.75),
                    _point(initial_x, 8.3),
                    _point(target_x, 5.75),
                ]

            alternative_source = (
                f"exercises/TR-UVOF-015/spatial-relations.json#/"
                f"branques_decisionals/{branch_position}/alternatives/"
                f"{alternative_position}"
            )
            transition_source = _source_ref("transicions", transition_position)
            geometry_alternatives.append(
                {
                    "id": alternative["id"],
                    "source_ref": alternative_source,
                    "transition_ref": transition_source,
                    "kind": "feint" if is_feint else "continuation",
                    "initial_space_ref": initial_space,
                    "target_space_ref": target_space,
                    "points": path_points,
                    "return_ball_points": [
                        _point(defender_x, passer_y - 0.25),
                        _point(defender_x - 0.68, 13.35),
                        _point(initial_x, 10.75),
                    ],
                    "qualifiers": deepcopy(transition.get("qualificadors", [])),
                }
            )
            traceability.append(
                {
                    "geometry_ref": f"geometry:alternative:{alternative['id']}",
                    "source_refs": [alternative_source, transition_source],
                }
            )

        branch_source = _source_ref("branques_decisionals", branch_position)
        branches.append(
            {
                "id": branch["id"],
                "source_ref": branch_source,
                "zone_ref": spec["zone"],
                "alternatives": geometry_alternatives,
            }
        )

    court = court_profile["court"]
    goal = court_profile["goal"]
    markings = court_profile["markings"]
    result: Document = {
        "$schema": "../../schema/traca.geometry.schema.v0.1.json",
        "meta": {
            "format": "TRACA_geometria_derivada",
            "version": "0.1.0",
            "exercise_id": "TR-UVOF-015",
            "status": "derived_from_ready_contract",
            "source_spatial_ref": "exercises/TR-UVOF-015/spatial-relations.json",
            "source_spatial_digest": spatial["integrity"]["spatial_digest"],
            "court_profile_ref": "config/handball-court.ihf-2025.json",
            "court_profile_digest": _canonical_digest(court_profile),
        },
        "court": {
            "width_m": court["width_m"],
            "half_length_m": court["half_length_m"],
            "goal": deepcopy(goal),
            "markings": deepcopy(markings),
            "view_box": [-0.8, -1.0, 21.6, 21.8],
        },
        "layout_policy": {
            "id": "uvof015_three_zones_v0.1",
            "status": "provisional_render_policy",
            "coordinate_system": "metres_origin_goal_line_left",
            "attack_direction": "negative_y",
            "notes": [
                "Les amplades de les tres zones són una política visual simètrica, no coneixement tàctic.",
                "Cap alternativa decisional se selecciona al JSON; la interfície només en previsualitza una per duel.",
                "Les posicions es deriven després d'un preflight ready i no modifiquen la font espacial.",
            ],
        },
        "zones": zones,
        "spaces": spaces,
        "entities": entities,
        "common_paths": common_paths,
        "branches": branches,
        "traceability": traceability,
    }
    Draft202012Validator(
        json.loads(GEOMETRY_SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(result)
    return result


def build_geometry_artifacts() -> Document:
    spatial = json.loads(SPATIAL_PATH.read_text(encoding="utf-8"))
    court_profile = json.loads(COURT_PROFILE_PATH.read_text(encoding="utf-8"))
    geometry = resolve_uvof015_geometry(spatial, court_profile)
    payload = json.dumps(geometry, ensure_ascii=False, indent=2) + "\n"
    GEOMETRY_PATH.write_text(payload, encoding="utf-8")
    INTERFACE_BUNDLE_PATH.parent.mkdir(parents=True, exist_ok=True)
    INTERFACE_BUNDLE_PATH.write_text(
        "window.TRACA_UVOF015_GEOMETRY = "
        + json.dumps(geometry, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    return geometry


def main() -> int:
    geometry = build_geometry_artifacts()
    print(
        json.dumps(
            {
                "exercise_id": geometry["meta"]["exercise_id"],
                "zones": len(geometry["zones"]),
                "alternatives": sum(
                    len(branch["alternatives"]) for branch in geometry["branches"]
                ),
                "geometry": str(GEOMETRY_PATH.relative_to(ROOT)),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
