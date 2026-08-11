from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DICTIONARY = ROOT / "knowledge/visual-functional-dictionary.v0.1.json"

ROW = re.compile(r"^\| `(?P<id>EV-[^`]+)`\s+—\s+(?P<label>[^|]+)\| \*\*(?P<classification>[^*]+)\*\* \| (?P<statement>.+) \|$")

LEGEND = {
    "VF_ATTACKER": ("E_LEGEND_ATTACKER", "Atacant: cercle de contorn continu."),
    "VF_ATTACKER_WITH_BALL": ("E_LEGEND_BALL_OWNER", "Atacant amb pilota: cercle i punt petit adjacent."),
    "VF_DEFENDER": ("E_LEGEND_DEFENDER", "Defensor: triangle de contorn continu."),
    "VF_MOVEMENT_WITHOUT_BALL": ("E_LEGEND_MOVEMENT", "Desplaçament sense pilota: línia contínua amb fletxa."),
    "VF_PASS": ("E_LEGEND_PASS", "Passada: línia discontínua amb fletxa."),
    "VF_PASS_FEINT": ("E_LEGEND_PASS_FEINT", "Finta de passada: passada discontínua amb marca obliqua curta."),
    "VF_SHOT": ("E_LEGEND_SHOT", "Llançament a porteria: fletxa de doble traç continu."),
    "VF_SHOT_FEINT": ("E_LEGEND_SHOT_FEINT", "Finta de llançament: llançament amb marca obliqua curta."),
    "VF_FEINT": ("E_LEGEND_FEINT", "Finta: trajectòria amb canvi de direcció perceptible i fletxa."),
    "VF_BLOCK_SCREEN": ("E_LEGEND_BLOCK", "Bloqueig o pantalla: atacant amb marca perpendicular pròxima."),
    "VF_DEFENSIVE_BLOCK": ("E_LEGEND_DEFENSIVE_BLOCK", "Blocatge: defensor, recorregut i marca perpendicular final."),
    "VF_TEMPORAL_STATE": ("E_LEGEND_TEMPORAL_STATE", "Posició abans o després: contorn discontinu del participant."),
    "VF_DRIBBLE": ("E_LEGEND_DRIBBLE", "Desplaçament en bot: trajectòria ondulada amb fletxa."),
}

INVENTORY_LINKS = {
    "VF_ATTACKER": ["EV-ENT-001-A"],
    "VF_ATTACKER_WITH_BALL": ["EV-POSS-004-A", "EV-POSS-011-A"],
    "VF_DEFENDER": ["EV-ENT-001-A"],
    "VF_MOVEMENT_WITHOUT_BALL": ["EV-MOVE-007-A"],
    "VF_PASS": ["EV-LINE-001-A", "EV-PASS-004-A"],
    "VF_BLOCK_SCREEN": ["EV-BLOCK-003-A"],
    "VF_TWO_V_ONE": ["EV-2X1-001-A", "EV-2X1-003-A", "EV-2X1-012-A"],
    "VF_PIVOT_SLIDE": ["EV-SLIDE-009-A", "EV-SLIDE-010-A", "EV-SLIDE-012-A", "EV-SLIDE-013-A"],
}


def parse_inventory(path: Path) -> list[dict[str, object]]:
    evidence: dict[str, dict[str, object]] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        match = ROW.match(line)
        if not match or match.group("id") in evidence:
            continue
        evidence_id = match.group("id")
        number = re.search(r"-(\d{3})-", evidence_id)
        evidence[evidence_id] = {
            "id": evidence_id,
            "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
            "statement": match.group("statement").strip(),
            "label": match.group("label").strip(),
            "classification": match.group("classification").strip().lower().replace(" ", "_"),
            "exercise_ref": f"TR-UVOF-{number.group(1)}" if number else None,
        }
    if len(evidence) != 103:
        raise SystemExit(f"S'esperaven 103 evidències úniques i se n'han trobat {len(evidence)}")
    return list(evidence.values())


def add_unique(target: list[str], values: list[str]) -> None:
    for value in values:
        if value not in target:
            target.append(value)


def main() -> None:
    parser = argparse.ArgumentParser(description="Importa l'inventari visual consolidat al diccionari TRAÇA.")
    parser.add_argument("inventory", type=Path)
    args = parser.parse_args()

    dictionary = json.loads(DICTIONARY.read_text(encoding="utf-8"))
    inventory = parse_inventory(args.inventory)
    sources = {item["id"]: item for item in dictionary["sources"]}
    sources["SRC_INVENTORY_REPRESENTATIONS_V0_1"].update({
        "status": "available",
        "ref": "coach_attachment:INVENTARI_DE_REPRESENTACIONS_TRACA.md",
        "reported_evidence_count": 103,
        "imported_evidence_count": 103,
    })
    sources["SRC_COACH_GRAPHIC_LEGEND"].update({
        "status": "available",
        "ref": "coach_attachment:AEB796E5-F49A-4466-A62E-79AA36F44AD4.png",
    })

    retained = [item for item in dictionary["evidence"] if item["source_ref"] not in {"SRC_INVENTORY_REPRESENTATIONS_V0_1", "SRC_COACH_GRAPHIC_LEGEND"}]
    legend_evidence = [
        {"id": evidence_id, "source_ref": "SRC_COACH_GRAPHIC_LEGEND", "statement": statement}
        for evidence_id, statement in LEGEND.values()
    ]
    dictionary["evidence"] = retained + legend_evidence + inventory

    entries = {item["id"]: item for item in dictionary["entries"]}
    for entry_id, (evidence_id, _statement) in LEGEND.items():
        entry = entries.get(entry_id)
        if not entry:
            continue
        add_unique(entry["source_refs"], ["SRC_COACH_GRAPHIC_LEGEND"])
        add_unique(entry["evidence_refs"], [evidence_id])
    for entry_id, evidence_refs in INVENTORY_LINKS.items():
        entry = entries.get(entry_id)
        if not entry:
            continue
        add_unique(entry["source_refs"], ["SRC_INVENTORY_REPRESENTATIONS_V0_1"])
        add_unique(entry["evidence_refs"], evidence_refs)

    dictionary["meta"].update({
        "status": "operational_with_audited_inventory",
        "imported_inventory_evidence_count": 103,
        "limitation": "S'han importat i classificat les 103 evidències de l'inventari. Les evidències candidates, ambigües o superades es conserven per traçabilitat però no poden omplir slots obligatoris ni generar geometria.",
    })
    DICTIONARY.write_text(json.dumps(dictionary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
