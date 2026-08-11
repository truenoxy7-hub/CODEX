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
        "js/change-explainer.js",
        "js/interpretation-provider.js",
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
        "js/app.js",
    ]
    assert all((INTERFACE / path).is_file() for path in expected)


def test_interface_exposes_the_universal_supervised_loop() -> None:
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")

    for label in ("Descriure", "Interpretar", "Representar", "Corregir", "Validar", "Aprendre"):
        assert label in html
    assert 'id="new-case"' in html
    assert "Qualsevol situació" in html
    assert "Analitzar fins on sabem" in html
    assert "Guardar en construcció" in html
    assert "TR-UVOF-015" in html
    assert 'src="js/interpretation-provider.js"' in html
    assert 'src="data/handball-knowledge.js"' in html


def test_interface_has_three_part_workspace_and_mobile_panel_navigation() -> None:
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")
    css = (INTERFACE / "styles.css").read_text(encoding="utf-8")

    assert 'class="workspace-panel flow-panel"' in html
    assert 'class="workspace-panel court-panel"' in html
    assert 'class="workspace-panel inspector-panel"' in html
    assert 'class="workspace-panel dock-panel"' in html
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
    assert 'snapshot.ui.view === "control" || snapshot.ui.view === "corrected"' in app


def test_interface_states_honest_resolver_and_knowledge_limits() -> None:
    app = (INTERFACE / "js/app.js").read_text(encoding="utf-8")
    provider = (INTERFACE / "js/interpretation-provider.js").read_text(encoding="utf-8")

    assert "No hi ha resolutor per a aquest cas" in app
    assert "No és generatedGeometry" in app
    assert "Coincidències lèxiques locals; no són una interpretació tàctica validada" in provider
    assert 'currentCase.case_type === "canonical_specimen"' in provider
