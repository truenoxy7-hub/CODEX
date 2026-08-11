from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
INTERFACE = ROOT / "interface"
INTERPRETER = INTERFACE / "one-v-one.js"
COURT_PROFILE = ROOT / "config/handball-court.ihf-2025.json"
LOCAL_NODE = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"


def _node() -> str:
    executable = shutil.which("node")
    if executable:
        return executable
    if LOCAL_NODE.is_file():
        return str(LOCAL_NODE)
    pytest.skip("Node no està disponible per provar l'intèrpret del navegador")


def _run_interpreter(text: str, *, with_geometry: bool = False) -> dict:
    script = """
const api = require(process.argv[1]);
const court = require(process.argv[2]);
const interpretation = api.interpret(process.argv[3]);
const result = process.argv[4] === "geometry"
  ? { interpretation, geometry: api.buildGeometry(interpretation, court) }
  : interpretation;
process.stdout.write(JSON.stringify(result));
"""
    completed = subprocess.run(
        [
            _node(),
            "-e",
            script,
            str(INTERPRETER),
            str(COURT_PROFILE),
            text,
            "geometry" if with_geometry else "interpretation",
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def test_interface_first_iteration_files_exist():
    assert (INTERFACE / "index.html").is_file()
    assert (INTERFACE / "styles.css").is_file()
    assert (INTERFACE / "app.js").is_file()
    assert INTERPRETER.is_file()
    assert (INTERFACE / "data/court-profile.js").is_file()


def test_interface_exposes_free_text_flow_instead_of_a_fixed_corpus_example():
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")

    assert 'lang="ca"' in html
    assert "Descriu l’exercici" in html
    assert "Interpretar descripció" in html
    assert "Confirmar interpretació" in html
    assert "Carregar exemple 1x1" in html
    assert "Previsualització" in html
    assert "TR-UVOF-015" not in html
    assert 'src="one-v-one.js"' in html
    assert 'src="data/court-profile.js"' in html
    assert "Traçabilitat" in html


def test_interface_generates_only_after_confirmation():
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")
    app = (INTERFACE / "app.js").read_text(encoding="utf-8")

    assert 'id="generate"' in html
    assert "Generar gràfic" in html
    assert "geometry = oneVOne.buildGeometry(interpretation, courtProfile)" in app
    assert "elements.generate.disabled = false" in app
    assert "renderGeometry" in app
    assert 'elements.description.addEventListener("input", invalidateInterpretation)' in app
    assert "<svg" not in html.lower()


def test_preview_uses_the_versioned_ihf_court_and_svg_renderer():
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")
    app = (INTERFACE / "app.js").read_text(encoding="utf-8")

    assert "Rules%20of%20the%20Game_Indoor%20Handball_E.pdf" in html
    assert "goalAreaPath" in app
    assert "freeThrowPath" in app
    assert "penalty_line_distance_m" in app
    assert "goalkeeper_line_distance_m" in app


def test_interface_exposes_alternatives_without_changing_the_source_text():
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")
    app = (INTERFACE / "app.js").read_text(encoding="utf-8")

    assert 'id="branch-selectors"' in html
    assert "geometry.branches.forEach" in app
    assert "no modifica la descripció original" in html
    assert 'id="export-svg"' in html


def test_interface_has_a_mobile_layout_and_accessible_live_feedback():
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")
    css = (INTERFACE / "styles.css").read_text(encoding="utf-8")

    assert 'aria-live="polite"' in html
    assert "@media (max-width: 640px)" in css


def test_new_simple_one_v_one_is_interpreted_from_its_own_text():
    result = _run_interpreter(
        "Un lateral esquerre amb pilota juga un 1x1 contra un segon defensiu. "
        "Té llibertat per sortir cap a l'interior o cap a l'exterior. Sense bot."
    )

    assert result["status"] == "ready_for_confirmation"
    assert result["facts"]["attacker"] == {
        "role": "lateral",
        "side": "left",
        "label": "Lateral esquerre",
        "short_label": "LE",
    }
    assert result["facts"]["defender"]["role"] == "second"
    assert result["facts"]["ball_start"] == "attacker"
    assert result["facts"]["dribble"] == "forbidden"
    assert result["facts"]["decision"] == "freedom"
    assert result["pending"] == []


def test_a_different_description_changes_the_interpretation():
    result = _run_interpreter(
        "La central rep la pilota del passador i resol un 1x1 contra el primer defensiu. Pot botar."
    )

    assert result["facts"]["attacker"]["role"] == "central"
    assert result["facts"]["defender"]["role"] == "first"
    assert result["facts"]["support"] is True
    assert result["facts"]["ball_start"] == "support"
    assert result["facts"]["dribble"] == "allowed"
    assert result["evidence"]["decision"] == "domain_default"


def test_common_one_against_one_notation_and_defender_alias_are_supported():
    result = _run_interpreter(
        "Un lateral dret amb pilota fa un 1 contra 1 davant del D2. Sense bot."
    )

    assert result["status"] == "ready_for_confirmation"
    assert result["facts"]["attacker"]["side"] == "right"
    assert result["facts"]["defender"]["role"] == "second"


@pytest.mark.parametrize(
    "text",
    [
        "Dos atacants resolen un 2x1 contra un defensor.",
        "Tres zones simultànies amb un duel a cada zona.",
        "El lateral passa al central i finalitza.",
    ],
)
def test_the_first_interpreter_refuses_to_invent_outside_one_v_one_scope(text: str):
    result = _run_interpreter(text)

    assert result["status"] == "unsupported"
    assert result["scope"] == "one_v_one"


def test_confirmable_text_builds_one_duel_with_four_unselected_resolutions():
    result = _run_interpreter(
        "Un lateral dret amb pilota juga un 1x1 contra un segon defensiu, "
        "amb llibertat per decidir i sense bot.",
        with_geometry=True,
    )
    geometry = result["geometry"]

    assert len(geometry["zones"]) == 1
    assert len(geometry["spaces"]) == 2
    assert len(geometry["branches"]) == 1
    alternatives = geometry["branches"][0]["alternatives"]
    assert len(alternatives) == 4
    assert not any("selected" in alternative for alternative in alternatives)
    assert all(min(point[1] for point in alternative["points"]) < 8.15 for alternative in alternatives)
    assert all(max(point[1] for point in alternative["points"]) > 8.15 for alternative in alternatives)
    assert all("sense_bot" in alternative["qualifiers"] for alternative in alternatives)
