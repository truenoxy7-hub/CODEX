from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INTERFACE = ROOT / "interface"


def test_universal_workspace_files_exist() -> None:
    expected = [
        "index.html",
        "styles.css",
        "data/handball-knowledge.js",
        "data/uvof015.case.js",
        "data/uvof015.geometry.js",
        "data/visual-functional-dictionary.js",
        "js/change-explainer.js",
        "js/interpretation-provider.js",
        "js/knowledge-resolver.js",
        "js/composition-graph.js",
        "js/state-registry.js",
        "js/ball-flow.js",
        "js/spatial-constraints.js",
        "js/composition-operators.js",
        "js/composition-preflight.js",
        "js/clarification-orchestrator.js",
        "js/generic-geometry-resolver.js",
        "js/representation-composer.js",
        "js/manual-geometry.js",
        "js/promotion.js",
        "js/workspace-preflight.js",
        "js/geometry-dependencies.js",
        "js/visual-grammar.js",
        "js/corrections.js",
        "js/store.js",
        "js/persistence.js",
        "js/import-export.js",
        "js/renderer.js",
        "js/editor.js",
        "js/knowledge-library.js",
        "js/inspection-ui.js",
        "js/app.js",
    ]
    assert all((INTERFACE / path).is_file() for path in expected)


def test_interface_exposes_the_universal_supervised_loop() -> None:
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")

    for label in ("ESCRIURE", "GENERAR", "CORREGIR", "GUARDAR"):
        assert label in html
    assert 'id="new-case"' in html
    assert "Què vols representar?" in html
    assert "Generar representació" in html
    assert "Guardar exercici" in html
    assert "Guardar en construcció" in html
    assert "TR-UVOF-015" in html
    assert 'src="js/interpretation-provider.js"' in html
    assert 'src="js/knowledge-resolver.js"' in html
    assert 'src="js/composition-graph.js"' in html
    assert 'src="js/composition-operators.js"' in html
    assert 'src="js/composition-preflight.js"' in html
    assert 'src="js/clarification-orchestrator.js"' in html
    assert 'src="js/generic-geometry-resolver.js"' in html
    assert 'src="js/representation-composer.js"' in html
    assert 'src="js/inspection-ui.js"' in html
    assert 'src="data/handball-knowledge.js"' in html
    assert 'id="case-origin"' not in html
    assert 'id="case-tags"' not in html
    assert 'id="new-origin"' not in html
    assert 'id="new-tags"' not in html
    assert "etiquetes s’omplen automàticament" in html
    assert 'class="workspace-panel inspector-panel advanced-zone"' in html
    assert 'class="workspace-panel dock-panel advanced-zone"' in html


def test_interface_has_three_part_workspace_and_mobile_panel_navigation() -> None:
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")
    css = (INTERFACE / "styles.css").read_text(encoding="utf-8")

    assert 'class="workspace-panel flow-panel is-mobile-active"' in html
    assert 'class="workspace-panel court-panel is-mobile-active"' in html
    assert 'class="workspace-panel inspector-panel advanced-zone"' in html
    assert 'class="workspace-panel dock-panel advanced-zone"' in html
    assert 'data-mobile-panel="court"' in html
    assert "@media (max-width: 820px)" in css


def test_all_geometry_views_and_explicit_promotion_are_visible() -> None:
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")

    for control in ('id="undo"', 'id="redo"', 'id="reset"', 'data-view="generated"',
                    'data-view="corrected"', 'data-view="compare"', 'data-view="control"'):
        assert control in html
    assert "NO RESOLVER AVAILABLE" in html
    assert "referència manual" in html.lower()
    assert "Promotion Builder" in html
    assert "Només les seleccionades" in html
    assert 'id="import-file"' in html
    assert 'id="export-case"' in html
    assert "Diagnòstic de composició" in html
    for block in ("tacticalIR", "compositionPlan", "spatialConstraints", "questions", "ballFlow"):
        assert f'data-diagnostic-block="{block}"' in html
        assert f'data-copy-diagnostic="{block}"' in html


def test_export_is_persistently_available_inside_the_data_panel() -> None:
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")
    dock_start = html.index('class="workspace-panel dock-panel advanced-zone"')
    dock_end = html.index("</section>\n    </main>", dock_start)
    dock = html[dock_start:dock_end]

    assert 'class="dock-header"' in dock
    assert 'id="export-case"' in dock
    assert dock.index('id="export-case"') < dock.index('class="dock-content"')


def test_renderer_is_segment_driven_and_generated_compare_is_read_only() -> None:
    renderer = (INTERFACE / "js/renderer.js").read_text(encoding="utf-8")
    app = (INTERFACE / "js/app.js").read_text(encoding="utf-8")

    assert "function pathData" in renderer
    assert '`${index ? "L" : "M"}' in renderer
    assert "smoothPath" not in renderer
    assert 'segment.type === "cubic"' in renderer
    assert "space.polygon" not in renderer
    assert "space.anchor" in renderer
    assert '"stroke-linejoin": "miter"' in renderer
    assert "comparison-ghost" in renderer
    assert 'fill: "none"' in renderer
    assert "grammar.states && grammar.states.future" in renderer
    assert "dependenciesApi.visibleFutureStates" in renderer
    assert 'alternative.approach_path, "approach_path"' in renderer
    assert 'if (view === "control") dependenciesApi.visibleFutureStates' not in renderer
    assert 'snapshot.ui.view === "control" || snapshot.ui.view === "corrected"' in app


def test_default_case_is_blank_and_example_is_only_explicit() -> None:
    app = (INTERFACE / "js/app.js").read_text(encoding="utf-8")

    assert 'description: ""' in app
    assert "initialGeometry: null" in app
    assert '$("#load-example").addEventListener' in app
    assert "initialCase: initialExample.caseData" not in app


def test_interface_states_honest_resolver_and_knowledge_limits() -> None:
    app = (INTERFACE / "js/app.js").read_text(encoding="utf-8")
    provider = (INTERFACE / "js/interpretation-provider.js").read_text(encoding="utf-8")

    assert "Encara no hi ha un pla de composició per a aquest cas" in app
    assert "No és generatedGeometry" in app
    assert "Coincidències lèxiques locals; no són una interpretació tàctica validada" in provider
    assert 'currentCase.case_type === "canonical_specimen"' in provider


def test_normal_flow_projects_only_the_active_clarification_question() -> None:
    app = (INTERFACE / "js/app.js").read_text(encoding="utf-8")

    assert "snapshot.composition.active_question" in app
    assert "const questions = activeQuestion ? [activeQuestion] : []" in app
    assert "Suggeriment:" in app
