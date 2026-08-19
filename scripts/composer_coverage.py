from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CORPUS = ROOT / "corpus/uvof.semantic.json"

TRANSITION_OPERATORS = {
    "ajust_sense_pilota": "movement",
    "recepcio": "reception",
    "atac_espai": "movement",
    "finta": "feint",
    "encreuament": "crossing",
    "continuitat": "movement",
    "recuperacio_sense_pilota": "movement",
    "resolucio": None,
}


def semantic_special(action: dict[str, object]) -> str | None:
    name = str(action.get("accio", "")).lower()
    if name == "permuta" or name.startswith("permuta_"):
        return "permutation"
    if "llisca" in name or "lliscament" in name:
        return "pivot_slide"
    if "bloqueig" in name:
        return "block"
    return None


def relation_sufficient(unit: dict[str, object]) -> bool:
    operator = unit["operator"]
    payload = unit["payload"]
    if operator in {"movement", "reception", "pivot_slide"}:
        return bool(payload.get("actor"))
    if operator == "pass":
        return bool(payload.get("posseidor_inicial") and payload.get("posseidor_final"))
    if operator == "numerical_relation":
        return bool(payload.get("primary_attacker_ref") and payload.get("supporting_attacker_ref") and payload.get("defender_ref"))
    if operator == "permutation":
        return bool(payload.get("primer_jugador") and payload.get("segon_jugador"))
    if operator == "feint":
        return bool(payload.get("actor") and payload.get("referencia_oposicional") and payload.get("des_de") and payload.get("cap_a"))
    if operator == "crossing":
        return bool(payload.get("actor_refs") and payload.get("des_de") and payload.get("cap_a"))
    if operator == "block":
        return bool(payload.get("actor") and (payload.get("opponent_ref") or payload.get("blocked_defender_ref")))
    return False


def exercise_units(exercise: dict[str, object], spatial: dict[str, object]) -> list[dict[str, object]]:
    units: list[dict[str, object]] = []
    for transition in spatial.get("transicions", []):
        transition_type = transition.get("tipus")
        units.append({
            "id": transition.get("id"),
            "source": "spatial_transition",
            "semantic_type": transition_type,
            "operator": TRANSITION_OPERATORS.get(transition_type),
            "payload": transition,
        })
    for flow in spatial.get("fluxos_pilota", []):
        units.append({"id": flow.get("id"), "source": "ball_flow", "semantic_type": flow.get("accio"), "operator": "pass", "payload": flow})
    for relation in spatial.get("typed_relations", []):
        operator = "numerical_relation" if relation.get("kind") == "2x1" else None
        units.append({"id": relation.get("id"), "source": "typed_relation", "semantic_type": relation.get("kind"), "operator": operator, "payload": relation})
    for phase in exercise.get("fases", []):
        for index, action in enumerate(phase.get("accions", []), 1):
            operator = semantic_special(action)
            if operator:
                units.append({
                    "id": f"{phase.get('id')}:{index}:{operator}",
                    "source": "semantic_action",
                    "semantic_type": action.get("accio"),
                    "operator": operator,
                    "payload": action,
                })
    return units


def report() -> dict[str, object]:
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    exercises = []
    all_units: list[dict[str, object]] = []
    for exercise in corpus["exercicis"]:
        spatial_path = ROOT / "exercises" / exercise["id"] / "spatial-relations.json"
        spatial = json.loads(spatial_path.read_text(encoding="utf-8"))
        units = exercise_units(exercise, spatial)
        recognized = [unit for unit in units if unit["operator"]]
        sufficient = [unit for unit in recognized if relation_sufficient(unit)]
        unsupported = [unit for unit in units if not unit["operator"]]
        missing = sorted({
            "tipus de resolució (passada/llançament/moviment)" if not unit["operator"] else f"slots obligatoris de {unit['operator']}"
            for unit in units if not unit["operator"] or not relation_sufficient(unit)
        })
        item = {
            "exercise_id": exercise["id"],
            "semantic_units": len(units),
            "recognized_units": len(recognized),
            "relations_sufficient": len(sufficient),
            "composition_coverage": round(len(sufficient) / len(units), 4) if units else 0,
            "geometry_coverage": 0,
            "operators": sorted({unit["operator"] for unit in recognized}),
            "missing_information": missing,
            "unsupported": sorted({str(unit["semantic_type"]) for unit in unsupported}),
        }
        exercises.append(item)
        all_units.extend(units)
    recognized = [unit for unit in all_units if unit["operator"]]
    sufficient = [unit for unit in recognized if relation_sufficient(unit)]
    return {
        "meta": {
            "format": "TRACA_composer_coverage",
            "version": "0.1.0",
            "method": "generic classification of typed spatial transitions, ball flows, typed relations and special semantic actions; no exercise-specific rules",
            "geometry_policy": "No corpus spatial file contains resolved coordinates; UVOF015 geometry is an independent regression fixture.",
        },
        "totals": {
            "exercises": len(exercises),
            "semantic_units": len(all_units),
            "recognized_units": len(recognized),
            "recognized_ratio": round(len(recognized) / len(all_units), 4),
            "relations_sufficient": len(sufficient),
            "composition_ratio": round(len(sufficient) / len(all_units), 4),
            "generic_geometry_ready": 0,
        },
        "exercises": exercises,
    }


if __name__ == "__main__":
    print(json.dumps(report(), ensure_ascii=False, indent=2))
