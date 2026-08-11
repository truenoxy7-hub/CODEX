from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
LOCAL_NODE = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"


def _node() -> str:
    executable = shutil.which("node")
    if executable:
        return executable
    if LOCAL_NODE.is_file():
        return str(LOCAL_NODE)
    pytest.skip("Node no està disponible per provar l’espai de treball")


def _run_node(script: str) -> dict:
    completed = subprocess.run(
        [_node(), "-e", script],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def _store_prelude() -> str:
    return """
const fs = require('fs');
const Store = require('./interface/js/store.js');
const Visual = require('./interface/js/visual-grammar.js');
const geometry = JSON.parse(fs.readFileSync('./exercises/TR-UVOF-015/geometry.json', 'utf8'));
const specimen = {id:'TR-UVOF-015', name:'Tres 1x1', description:'cas', source_refs:['source']};
const store = Store.createWorkspaceStore({specimen, generatedGeometry:geometry, visualGrammar:Visual.createVisualGrammar(), clock:()=> '2026-08-11T10:00:00.000Z'});
"""


def test_generated_and_working_geometry_are_strictly_separate() -> None:
    result = _run_node(_store_prelude() + """
const before = store.snapshot();
store.applyCorrection({target:{layer:'geometry', ref:'geometry:entity:A_ESQ', property:'position'}, after:[3,13], reason:'test'});
const after = store.snapshot();
process.stdout.write(JSON.stringify({
  generatedBefore:before.generatedGeometry.entities.find(x=>x.id==='A_ESQ').position,
  generatedAfter:after.generatedGeometry.entities.find(x=>x.id==='A_ESQ').position,
  workingAfter:after.workingGeometry.entities.find(x=>x.id==='A_ESQ').position,
  otherEntity:after.workingGeometry.entities.find(x=>x.id==='D_CE').position,
  zonesUnchanged:JSON.stringify(before.workingGeometry.zones) === JSON.stringify(after.workingGeometry.zones),
  event:after.corrections[0]
}));
""")

    assert result["generatedBefore"] == [4.175, 14.1]
    assert result["generatedAfter"] == [4.175, 14.1]
    assert result["workingAfter"] == [3, 13]
    assert result["otherEntity"] == [10, 7.6]
    assert result["zonesUnchanged"] is True
    assert result["event"]["id"] == "CORR-TR-UVOF-015-0001"
    assert result["event"]["before"] == [4.175, 14.1]
    assert result["event"]["after"] == [3, 13]
    assert result["event"]["scope"] == "case"
    assert result["event"]["status"] == "draft"


def test_undo_redo_and_reset_recompute_from_generated_geometry() -> None:
    result = _run_node(_store_prelude() + """
store.applyCorrection({target:{layer:'geometry', ref:'geometry:entity:A_ESQ', property:'position'}, after:[3,13], reason:'test'});
store.undo();
const undone = store.snapshot().workingGeometry.entities.find(x=>x.id==='A_ESQ').position;
store.redo();
const redone = store.snapshot().workingGeometry.entities.find(x=>x.id==='A_ESQ').position;
store.reset();
const reset = store.snapshot();
process.stdout.write(JSON.stringify({undone, redone, resetPosition:reset.workingGeometry.entities.find(x=>x.id==='A_ESQ').position, corrections:reset.corrections.length}));
""")

    assert result == {
        "undone": [4.175, 14.1],
        "redone": [3, 13],
        "resetPosition": [4.175, 14.1],
        "corrections": 0,
    }


def test_validation_does_not_promote_and_promotion_is_explicit() -> None:
    result = _run_node(_store_prelude() + """
store.applyCorrection({target:{layer:'spatial', ref:'spatial:annotation:TR-UVOF-015', property:'statement'}, before:'a', after:'b', reason:'coach'});
store.validate('coach');
const validated = store.snapshot();
const pattern = store.promotePattern({title:'Patró candidat'});
const rule = store.proposeGeneralRule({title:'Regla candidata'});
const promoted = store.snapshot();
process.stdout.write(JSON.stringify({
  validation:validated.validation,
  beforePatterns:validated.knowledgeLibrary.pattern_candidates.length,
  beforeRules:validated.knowledgeLibrary.general_rule_candidates.length,
  pattern, rule,
  semanticRules:promoted.knowledgeLibrary.semantic_rules.length
}));
""")

    assert result["validation"]["status"] == "validated_case"
    assert result["validation"]["counts_by_layer"] == {"spatial": 1}
    assert result["beforePatterns"] == 0
    assert result["beforeRules"] == 0
    assert result["pattern"]["status"] == "candidate"
    assert result["rule"]["status"] == "candidate"
    assert result["semanticRules"] == 0


def test_export_import_round_trip_preserves_training_case() -> None:
    result = _run_node(_store_prelude() + """
const IO = require('./interface/js/import-export.js');
store.applyCorrection({target:{layer:'geometry', ref:'geometry:entity:D_CE', property:'position'}, after:[10.4,7.4], reason:'test'});
store.validate('coach');
const payload = IO.exportPackage(store.snapshot(), ()=> '2026-08-11T11:00:00.000Z');
const second = Store.createWorkspaceStore({specimen, generatedGeometry:geometry, visualGrammar:Visual.createVisualGrammar(), clock:()=> '2026-08-11T12:00:00.000Z'});
second.restorePackage(IO.parsePackage(JSON.stringify(payload)));
const restored = second.snapshot();
process.stdout.write(JSON.stringify({
  format:payload.format,
  canonical:payload.metadata.canonical_promotion,
  corrections:restored.corrections,
  position:restored.workingGeometry.entities.find(x=>x.id==='D_CE').position,
  validation:restored.validation.status,
  generated:restored.generatedGeometry.entities.find(x=>x.id==='D_CE').position
}));
""")

    assert result["format"] == "TRACA_training_case"
    assert result["canonical"] is False
    assert len(result["corrections"]) == 1
    assert result["position"] == [10.4, 7.4]
    assert result["generated"] == [10, 7.6]
    assert result["validation"] == "validated_case"


def test_visual_grammar_and_renderer_preserve_tactical_line_meaning() -> None:
    result = _run_node("""
const Visual = require('./interface/js/visual-grammar.js');
const Renderer = require('./interface/js/renderer.js');
const grammar = Visual.createVisualGrammar();
process.stdout.write(JSON.stringify({
  entityKinds:Object.keys(grammar.entities),
  pathKinds:Object.keys(grammar.paths),
  overlayKinds:Object.keys(grammar.overlays),
  passDash:grammar.paths.pass.dash,
  movementDash:grammar.paths.movement.dash,
  withoutBallDash:grammar.paths.movement_without_ball.dash,
  feintMode:grammar.paths.feint.path_mode,
  preserveVertices:grammar.paths.feint.preserve_vertices,
  path:Renderer.pathData([[1,2],[3,4],[5,6]])
}));
""")

    assert set(result["entityKinds"]) >= {
        "attacker", "defender", "passer", "pivot", "ball", "cone", "bench", "cylinder"
    }
    assert set(result["pathKinds"]) >= {
        "movement", "movement_without_ball", "pass", "shot", "feint", "future_position"
    }
    assert set(result["overlayKinds"]) >= {
        "spatial_zone", "finishing_zone", "defensive_reference"
    }
    assert result["passDash"]
    assert result["movementDash"] is None
    assert result["withoutBallDash"] is None
    assert result["feintMode"] == "polyline"
    assert result["preserveVertices"] is True
    assert result["path"] == "M 1 2 L 3 4 L 5 6"
    assert "Q" not in result["path"]


def test_uvof015_regression_and_alternative_selection_do_not_mutate_geometry() -> None:
    result = _run_node(_store_prelude() + """
const initial = JSON.stringify(store.snapshot().workingGeometry);
const branch = store.snapshot().workingGeometry.branches[0];
store.setAlternative(branch.id, branch.alternatives[3].id);
const snapshot = store.snapshot();
process.stdout.write(JSON.stringify({
  zones:snapshot.workingGeometry.zones.length,
  spaces:snapshot.workingGeometry.spaces.length,
  branches:snapshot.workingGeometry.branches.length,
  alternatives:snapshot.workingGeometry.branches.reduce((n,b)=>n+b.alternatives.length,0),
  unchanged:initial === JSON.stringify(snapshot.workingGeometry),
  corrections:snapshot.corrections.length
}));
""")

    assert result == {
        "zones": 3,
        "spaces": 6,
        "branches": 3,
        "alternatives": 12,
        "unchanged": True,
        "corrections": 0,
    }


def test_training_case_and_correction_schemas_are_valid() -> None:
    try:
        from jsonschema import Draft202012Validator
    except (ImportError, ModuleNotFoundError):
        pytest.skip("jsonschema no està complet en l’entorn local")
    correction_path = ROOT / "schema/traca.correction-event.schema.v0.1.json"
    case_path = ROOT / "schema/traca.training-case.schema.v0.1.json"
    correction_schema = json.loads(correction_path.read_text(encoding="utf-8"))
    case_schema = json.loads(case_path.read_text(encoding="utf-8"))

    Draft202012Validator.check_schema(correction_schema)
    Draft202012Validator.check_schema(case_schema)
