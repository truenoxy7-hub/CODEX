from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import jsonschema
import pytest


ROOT = Path(__file__).resolve().parents[1]
NODE = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"


def node() -> str:
    executable = shutil.which("node")
    if executable:
        return executable
    if NODE.is_file():
        return str(NODE)
    pytest.skip("Node no està disponible")


def run_node(source: str) -> dict:
    completed = subprocess.run([node(), "-e", source], cwd=ROOT, check=True, capture_output=True, text=True)
    return json.loads(completed.stdout)


def test_visual_dictionary_v02_validates_and_has_exactly_fourteen_canonical_symbols() -> None:
    document = json.loads((ROOT / "knowledge/visual-functional-dictionary.v0.2.json").read_text(encoding="utf-8"))
    schema = json.loads((ROOT / "schema/traca.visual-functional-dictionary.schema.v0.2.json").read_text(encoding="utf-8"))

    jsonschema.Draft202012Validator(schema).validate(document)
    references = document["canonical_visual_reference"]
    assert len(references) == 14
    assert len({item["id"] for item in references}) == 14
    assert document["meta"]["imported_inventory_evidence_count"] == 103


def test_symbol_sheet_uses_all_canonical_references_and_is_readable_without_color() -> None:
    color = (ROOT / "examples/graphics-gallery/symbol-sheet-color.svg").read_text(encoding="utf-8")
    monochrome = (ROOT / "examples/graphics-gallery/symbol-sheet-monochrome.svg").read_text(encoding="utf-8")

    assert color.count("data-canonical-ref=") == 14
    assert monochrome.count("data-canonical-ref=") == 14
    assert "mode-monochrome" in monochrome
    assert "#111111" in monochrome
    assert "#ef763e" not in monochrome
    assert "#8b6f54" not in monochrome
    assert "#e84b52" not in monochrome
    for extension in ("goalkeeper", "cone", "bench", "cylinder"):
        assert f'data-extension="{extension}"' in color


def test_graphic_knowledge_adapter_is_selective_and_rejects_candidates() -> None:
    result = run_node("""
const K=require('./interface/js/graphic-knowledge-base.js');
const source={meta:{id:'fixture',runtime_import_allowed:false},case_index:[],tests:[],rules:[
 {id:'R01',status:'confirmada_per_entrenador',value:1,evidence_refs:['E1']},
 {id:'R02',status:'candidat',value:2,evidence_refs:['E2']}
]};
process.stdout.write(JSON.stringify(K.adaptOperational(source,{activated_records:['R01','R02']})));
""")

    assert result["status"] == "selective_adapter"
    assert result["mass_import"] is False
    assert [item["id"] for item in result["facts"]] == ["R01"]
    assert result["rejected"] == [{"id": "R02", "collection": "rules", "status": "candidat", "reason": "ASSERTION_NOT_OPERATIONAL"}]


def test_graphic_knowledge_validator_rejects_mass_import_and_duplicate_ids() -> None:
    result = run_node("""
const K=require('./interface/js/graphic-knowledge-base.js');
process.stdout.write(JSON.stringify(K.validate({meta:{id:'fixture'},runtime_import_allowed:true,rules:[{id:'R01'},{id:'R01'}]})));
""")

    assert result["valid"] is False
    assert {item["code"] for item in result["errors"]} >= {"MASS_IMPORT_FORBIDDEN", "DUPLICATE_ID"}


def test_model_interpretation_provider_requires_evidence_and_never_self_validates() -> None:
    result = run_node("""
const P=require('./interface/js/model-interpretation-provider.js');
(async()=>{
 const good=await P.create({provider:'fixture',model:'m1',invoke:async()=>({participants:[],actions:[{id:'A1',type:'pass',evidence_spans:['passa']}],unresolved:[]})}).interpret({description:'passa'});
 const bad=await P.create({invoke:async()=>({participants:[],actions:[{id:'A1',type:'pass'}]})}).interpret({description:'passa'});
 process.stdout.write(JSON.stringify({good,bad}));
})();
""")

    assert result["good"]["status"] == "model_proposal"
    assert result["good"]["authority"] == "provisional_model_output"
    assert result["good"]["requires_coach_validation"] is True
    assert result["bad"]["status"] == "rejected"
    assert "ACTION_EVIDENCE_REQUIRED:A1" in result["bad"]["validation"]["errors"]


def test_gallery_reports_all_internal_cases_without_fake_geometry_success() -> None:
    coverage = json.loads((ROOT / "examples/graphics-gallery/coverage.json").read_text(encoding="utf-8"))
    manifest = json.loads((ROOT / "examples/graphics-gallery/manifest.json").read_text(encoding="utf-8"))
    html = (ROOT / "examples/graphics-gallery/index.html").read_text(encoding="utf-8")

    assert coverage["totals"]["exercises"] == 15
    assert coverage["totals"]["generic_geometry_ready"] == 0
    assert len(coverage["exercises"]) == 15
    assert manifest["source_availability"]["graphic_knowledge_json"] == "not_found"
    assert "Una targeta buida és un diagnòstic, no un èxit simulat" in html
    assert html.count('class="case-card"') == 15


def test_renderer_exports_revision_and_visual_policy_metadata() -> None:
    svg = (ROOT / "examples/general-geometry/a1-pass-reception.svg").read_text(encoding="utf-8")
    renderer = (ROOT / "interface/js/renderer.js").read_text(encoding="utf-8")

    assert "TRACA_rendered_graphic" in svg
    assert "visual_policy_ref" in svg
    assert "geometry_version" in svg
    assert "configuration.editor_width_px" in renderer
    assert "configuration.pixel_ratio" in renderer
