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
    assert "TR-UVOF-001" in html
    assert "Traçabilitat" in html


def test_interface_does_not_pretend_to_render_tactical_geometry():
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")

    assert "Generar gràfic · propera iteració" in html
    assert "sense geometria tàctica" in html.lower()
    assert "<svg" not in html.lower()


def test_interface_has_a_mobile_layout_and_accessible_live_feedback():
    html = (INTERFACE / "index.html").read_text(encoding="utf-8")
    css = (INTERFACE / "styles.css").read_text(encoding="utf-8")

    assert 'aria-live="polite"' in html
    assert "@media (max-width: 640px)" in css
