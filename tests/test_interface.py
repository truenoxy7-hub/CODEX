from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INTERFACE = ROOT / "interface"


def test_interface_first_iteration_files_exist():
    assert (INTERFACE / "index.html").is_file()
    assert (INTERFACE / "styles.css").is_file()
    assert (INTERFACE / "app.js").is_file()


def test_interface_exposes_the_approved_product_flow():
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")

    assert 'lang="ca"' in html
    assert "Descriu l’exercici" in html
    assert "Interpretar descripció" in html
    assert "Confirmar interpretació" in html
    assert "Previsualització" in html
    assert "TR-UVOF-015" in html
    assert "Traçabilitat" in html


def test_interface_generates_only_after_confirmation():
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")
    app = (INTERFACE / "app.js").read_text(encoding="utf-8")

    assert 'id="generate"' in html
    assert "Generar gràfic" in html
    assert "elements.generate.disabled = false" in app
    assert "renderGeometry" in app
    assert "<svg" not in html.lower()


def test_preview_uses_the_versioned_ihf_court_and_svg_renderer():
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")
    app = (INTERFACE / "app.js").read_text(encoding="utf-8")

    assert "Rules%20of%20the%20Game_Indoor%20Handball_E.pdf" in html
    assert 'src="data/uvof015.geometry.js"' in html
    assert "goalAreaPath" in app
    assert "freeThrowPath" in app
    assert "penalty_line_distance_m" in app
    assert "goalkeeper_line_distance_m" in app


def test_interface_exposes_one_independent_alternative_selector_per_duel():
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")
    app = (INTERFACE / "app.js").read_text(encoding="utf-8")

    assert 'id="branch-selectors"' in html
    assert "geometry.branches.forEach" in app
    assert "La selecció només canvia la previsualització" in html
    assert 'id="export-svg"' in html


def test_interface_has_a_mobile_layout_and_accessible_live_feedback():
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")
    css = (INTERFACE / "styles.css").read_text(encoding="utf-8")

    assert 'aria-live="polite"' in html
    assert "@media (max-width: 640px)" in css
