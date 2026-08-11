from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INTERFACE = ROOT / "interface"


def test_learning_workspace_files_exist() -> None:
    expected = [
        "index.html",
        "styles.css",
        "data/uvof015.case.js",
        "data/uvof015.geometry.js",
        "js/utils.js",
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


def test_interface_exposes_the_complete_learning_loop() -> None:
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")

    for label in (
        "Descriure",
        "Interpretar",
        "Generar",
        "Corregir",
        "Validar",
        "Guardar i reutilitzar",
    ):
        assert label in html
    assert "TR-UVOF-015" in html
    assert "Text nou arbitrari encara no s’interpreta" not in html
    assert 'src="js/store.js"' in html
    assert 'src="data/uvof015.geometry.js"' in html
    assert "one-v-one.js" not in html


def test_interface_has_three_part_workspace_and_mobile_panel_navigation() -> None:
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")
    css = (INTERFACE / "styles.css").read_text(encoding="utf-8")

    assert 'class="workspace-panel flow-panel"' in html
    assert 'class="workspace-panel court-panel"' in html
    assert 'class="workspace-panel inspector-panel"' in html
    assert 'class="workspace-panel dock-panel"' in html
    assert 'data-mobile-panel="court"' in html
    assert "@media (max-width: 820px)" in css


def test_editor_controls_and_explicit_promotion_choices_are_visible() -> None:
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")

    assert 'id="undo"' in html
    assert 'id="redo"' in html
    assert 'id="reset"' in html
    assert 'data-view="clean"' in html
    assert 'data-view="control"' in html
    assert "Guardar només aquest cas" in html
    assert "Crear candidat de patró" in html
    assert "Proposar regla candidata" in html
    assert 'id="import-file"' in html
    assert 'id="export-case"' in html


def test_renderer_is_segment_driven_and_does_not_contain_smoothing_policy() -> None:
    renderer = (INTERFACE / "js/renderer.js").read_text(encoding="utf-8")

    assert "function pathData" in renderer
    assert '`${index ? "L" : "M"}' in renderer
    assert "smoothPath" not in renderer
    assert '"stroke-linejoin": "miter"' in renderer


def test_interface_states_the_honest_engine_limit() -> None:
    case_data = (INTERFACE / "data/uvof015.case.js").read_text(encoding="utf-8")
    app = (INTERFACE / "js/app.js").read_text(encoding="utf-8")

    assert "Encara no interpreta text nou arbitrari" in case_data
    assert "TRAÇA no inventarà cap geometria" in app
