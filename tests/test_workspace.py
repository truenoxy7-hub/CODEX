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
        [_node(), "-e", script], cwd=ROOT, check=True, capture_output=True, text=True
    )
    return json.loads(completed.stdout)


def _store_prelude() -> str:
    return """
const fs = require('fs');
const Store = require('./interface/js/store.js');
const Visual = require('./interface/js/visual-grammar.js');
const geometry = JSON.parse(fs.readFileSync('./exercises/TR-UVOF-015/geometry.json', 'utf8'));
const specimen = {id:'TR-UVOF-015', name:'Tres 1x1', case_type:'canonical_specimen', description:'cas', source_refs:['source']};
const store = Store.createWorkspaceStore({initialCase:specimen, initialGeometry:geometry, visualGrammar:Visual.createVisualGrammar(), clock:()=> '2026-08-11T10:00:00.000Z'});
"""


def test_arbitrary_case_is_preserved_and_never_substituted_with_specimen() -> None:
    result = _run_node(_store_prelude() + """
const Provider = require('./interface/js/interpretation-provider.js');
const knowledge = require('./interface/data/handball-knowledge.js');
const exact = 'Central passa i va.\\nEl lateral rep entre 1-2; decisió oberta.';
const created = store.createCase({name:'Cas lliure', description:exact, origin:'coach'});
const interpretation = Provider.interpret(created, {canonicalCases:[specimen], knowledge});
store.setInterpretation(interpretation);
const snapshot = store.snapshot();
process.stdout.write(JSON.stringify({
  id:snapshot.currentCase.id, description:snapshot.currentCase.description,
  generated:snapshot.generatedGeometry, reference:snapshot.coachReferenceGeometry,
  geometryStatus:snapshot.geometryState.status, provider:snapshot.interpretation.provider,
  states:snapshot.interpretation.concepts.map(x=>x.knowledge_state),
  labels:snapshot.interpretation.concepts.map(x=>x.label),
  unknown:snapshot.interpretation.unknown_concepts.map(x=>x.label),
  unresolved:snapshot.interpretation.unresolved.length,
  origin:snapshot.currentCase.origin, tags:snapshot.currentCase.tags
}));
""")

    assert result["id"] == "CASE-2026-0001"
    assert result["description"] == "Central passa i va.\nEl lateral rep entre 1-2; decisió oberta."
    assert result["generated"] is None
    assert result["reference"] is None
    assert result["geometryStatus"] == "unavailable"
    assert result["provider"] == "local_rule_provider"
    assert result["states"] and set(result["states"]) == {"provisional"}
    assert "central" in result["labels"]
    assert "passada i va" in result["unknown"]
    assert result["unresolved"] >= 1
    assert result["origin"] == "coach_input"
    assert result["tags"] == ["passada", "recepció", "interval 1–2", "central", "lateral"]


def test_generated_and_working_geometry_are_strictly_separate() -> None:
    result = _run_node(_store_prelude() + """
const before = store.snapshot();
store.applyCorrection({target:{layer:'geometry', ref:'geometry:participant_state:STATE_ESQ_A_CURRENT', property:'position'}, operation:'move', after:[3,13], reason:'guanyar espai'});
const after = store.snapshot();
process.stdout.write(JSON.stringify({
  generatedBefore:before.generatedGeometry.entities.find(x=>x.id==='A_ESQ').position,
  generatedAfter:after.generatedGeometry.entities.find(x=>x.id==='A_ESQ').position,
  workingAfter:after.workingGeometry.entities.find(x=>x.id==='A_ESQ').position,
  event:after.corrections[0]
}));
""")

    assert result["generatedBefore"] == [4.175, 14.1]
    assert result["generatedAfter"] == [4.175, 14.1]
    assert result["workingAfter"] == [3, 13]
    assert result["event"]["machine_diff"]["before"] == [4.175, 14.1]
    assert result["event"]["machine_explanation"]
    assert result["event"]["coach_explanation"] == "guanyar espai"
    assert result["event"]["correction_type"] == "geometry.move"
    assert result["event"]["change_role"] == "primary"
    assert len(result["event"]["derived_effects"]) == 6
    assert result["event"]["target"]["ref"] == "geometry:participant_state:STATE_ESQ_A_CURRENT"


def test_no_resolver_case_can_be_built_saved_and_validated() -> None:
    result = _run_node(_store_prelude() + """
store.createCase({name:'Sense resolutor', description:'Un atacant fa una acció nova.'});
store.addSemanticItem({collection:'participant', label:'Atacant A', kind:'attacker'});
const draft = store.saveCase({status:'in_construction'});
store.startCoachReference({court:{width_m:20,half_length_m:20},goal:{width_m:3,height_m:2},markings:{goal_area_radius_m:6,free_throw_distance_m:9,free_throw_segment_m:.15,free_throw_gap_m:.15,penalty_line_length_m:1,goalkeeper_line_length_m:.15,penalty_line_distance_m:7,goalkeeper_line_distance_m:4}});
store.addManualPrimitive({primitive_type:'entity', kind:'attacker', label:'A', position:[10,12]});
store.recordCoachObservation({statement:'A ocupa aquest espai només en el cas.',status:'case_only'});
const report = store.runPreflight();
store.validate('coach');
const snapshot = store.snapshot();
process.stdout.write(JSON.stringify({draftStatus:draft.status, generated:snapshot.generatedGeometry, referenceMeta:snapshot.coachReferenceGeometry.meta, geometryStatus:snapshot.geometryState.status, canValidate:report.can_validate, validation:snapshot.validation.status, observations:snapshot.coachObservations}));
""")

    assert result["draftStatus"] == "in_construction"
    assert result["generated"] is None
    assert result["referenceMeta"]["format"] == "TRACA_coach_reference_geometry"
    assert result["referenceMeta"]["canonical_promotion"] is False
    assert result["geometryStatus"] == "validated"
    assert result["canValidate"] is True
    assert result["validation"] == "validated_case"
    assert result["observations"][-1]["status"] == "case_only"
    assert result["observations"][-1]["canonical_promotion"] is False


def test_preflight_blocks_errors_but_not_questions_or_warnings() -> None:
    result = _run_node(_store_prelude() + """
store.createCase({name:'Preflight', description:'Passada i va desconeguda.'});
store.setInterpretation({provider:'local_rule_provider',status:'provisional',concepts:[],unknown_concepts:[{id:'U1',label:'passada i va',definition:'',knowledge_state:'unknown'}],unresolved:[],notes:[]});
const withoutGeometry = store.runPreflight();
store.startCoachReference({court:{width_m:20,half_length_m:20},goal:{width_m:3,height_m:2},markings:{goal_area_radius_m:6,free_throw_distance_m:9,free_throw_segment_m:.15,free_throw_gap_m:.15,penalty_line_length_m:1,goalkeeper_line_length_m:.15,penalty_line_distance_m:7,goalkeeper_line_distance_m:4}});
store.addManualPrimitive({primitive_type:'entity',kind:'attacker',id:'OUT',position:[25,12]});
store.addManualPrimitive({primitive_type:'path',kind:'feint',id:'BAD_FEINT',points:[[10,15],[10,10]]});
const withErrors = store.runPreflight();
let blocked = false; try { store.validate('coach'); } catch (error) { blocked = error.message === 'WORKSPACE_VALIDATION_BLOCKED'; }
process.stdout.write(JSON.stringify({
  warningCanValidate:withoutGeometry.can_validate,
  warningCodes:withoutGeometry.diagnostics.map(x=>x.code),
  errorCanValidate:withErrors.can_validate,
  errorCodes:withErrors.diagnostics.filter(x=>x.level==='error').map(x=>x.code), blocked
}));
""")

    assert result["warningCanValidate"] is True
    assert "UNKNOWN_CONCEPT_UNDEFINED" in result["warningCodes"]
    assert "GEOMETRY_UNAVAILABLE" in result["warningCodes"]
    assert result["errorCanValidate"] is False
    assert "ENTITY_OUT_OF_COURT" in result["errorCodes"]
    assert "FEINT_DIRECTION_MISSING" in result["errorCodes"]
    assert result["blocked"] is True


def test_validation_never_promotes_and_promotion_uses_only_selected_corrections() -> None:
    result = _run_node(_store_prelude() + """
const first = store.applyCorrection({target:{layer:'spatial',ref:'spatial:annotation:one',property:'statement'},before:'sobre defensor',after:'interval 1-2',reason:'és un interval'});
const second = store.applyCorrection({target:{layer:'semantic',ref:'semantic:action:one',property:'kind'},before:'moviment',after:'finta',reason:'canvia el significat'});
let beforeValidationBlocked = false;
try { store.createPromotion({type:'spatial_rule_candidate',scope:'CONCEPT',title:'x',definition:'y',correction_refs:[first.id]}); } catch (error) { beforeValidationBlocked = true; }
store.validate('coach');
const afterValidation = store.snapshot();
const candidate = store.createPromotion({type:'spatial_rule_candidate',scope:'CONCEPT',scope_ref:'interval',title:'Atacar interval',definition:'Relació espacial candidata',reason:'Revisió explícita',correction_refs:[first.id]});
const snapshot = store.snapshot();
process.stdout.write(JSON.stringify({beforeValidationBlocked, beforeCandidates:afterValidation.knowledgeLibrary.spatial_rule_candidates.length, candidate, semanticCandidates:snapshot.knowledgeLibrary.semantic_rule_candidates.length, learned:store.whatLearned()}));
""")

    assert result["beforeValidationBlocked"] is True
    assert result["beforeCandidates"] == 0
    assert result["candidate"]["status"] == "candidate"
    assert result["candidate"]["canonical_promotion"] is False
    assert result["candidate"]["correction_refs"] == [result["candidate"]["source_corrections"][0]["id"]]
    assert len(result["candidate"]["source_corrections"]) == 1
    assert result["candidate"]["source_corrections"][0]["target"]["layer"] == "spatial"
    assert result["semanticCandidates"] == 0
    assert result["learned"]["canonical_changes"] == 0


def test_export_import_preserves_explanations_and_reference_authority() -> None:
    result = _run_node(_store_prelude() + """
const IO = require('./interface/js/import-export.js');
store.createCase({name:'Portable',description:'Acció manual'});
store.applyCorrection({target:{layer:'semantic',ref:'semantic:annotation:a',property:'statement'},before:'A',after:'B',reason:'motiu del tècnic',concept_refs:['action.a'],context_refs:['training']});
store.validate('coach');
const payload = IO.exportPackage(store.snapshot(), ()=> '2026-08-11T11:00:00.000Z');
const second = Store.createWorkspaceStore({initialCase:specimen,initialGeometry:geometry,visualGrammar:Visual.createVisualGrammar(),clock:()=> '2026-08-11T12:00:00.000Z'});
second.restorePackage(IO.parsePackage(JSON.stringify(payload)));
const restored = second.snapshot();
process.stdout.write(JSON.stringify({version:payload.version, canonical:payload.metadata.canonical_promotion, generated:restored.generatedGeometry, description:restored.currentCase.description, event:restored.corrections[0], validation:restored.validation.status}));
""")

    assert result["version"] == "0.4.0"
    assert result["canonical"] is False
    assert result["generated"] is None
    assert result["description"] == "Acció manual"
    assert result["event"]["coach_explanation"] == "motiu del tècnic"
    assert result["event"]["concept_refs"] == ["action.a"]
    assert result["event"]["context_refs"] == ["training"]
    assert result["validation"] == "validated_case"


def test_visual_case_override_does_not_change_base_dictionary() -> None:
    result = _run_node(_store_prelude() + """
const before = store.snapshot();
store.applyCorrection({target:{layer:'visual',ref:'visual:primitive:movement',property:'stroke'},before:before.workingVisualGrammar.paths.movement.stroke,after:'#123456',reason:'millor contrast'});
const after = store.snapshot();
process.stdout.write(JSON.stringify({base:after.baseVisualGrammar.paths.movement.stroke,working:after.workingVisualGrammar.paths.movement.stroke,overrides:after.caseVisualOverrides,library:after.knowledgeLibrary.validated_visual_dictionary.length}));
""")

    assert result["base"] == "#173f33"
    assert result["working"] == "#123456"
    assert len(result["overrides"]) == 1
    assert result["library"] == 0


def test_undo_redo_and_uvof015_regression_remain_stable() -> None:
    result = _run_node(_store_prelude() + """
const initial = JSON.stringify(store.snapshot().workingGeometry);
const branch = store.snapshot().workingGeometry.branches[0];
store.setAlternative(branch.id, branch.alternatives[3].id);
store.applyCorrection({target:{layer:'geometry',ref:'geometry:participant_state:STATE_ESQ_A_CURRENT',property:'position'},operation:'move',after:[3,13],reason:'test'});
store.undo(); const undone = store.snapshot().workingGeometry.entities.find(x=>x.id==='A_ESQ').position;
store.redo(); const redone = store.snapshot().workingGeometry.entities.find(x=>x.id==='A_ESQ').position;
store.reset(); const snapshot = store.snapshot();
process.stdout.write(JSON.stringify({zones:snapshot.workingGeometry.zones.length,spaces:snapshot.workingGeometry.spaces.length,branches:snapshot.workingGeometry.branches.length,alternatives:snapshot.workingGeometry.branches.reduce((n,b)=>n+b.alternatives.length,0),reset:initial===JSON.stringify(snapshot.workingGeometry),undone,redone}));
""")

    assert result == {"zones": 3, "spaces": 6, "branches": 3, "alternatives": 12,
                      "reset": True, "undone": [4.175, 14.1], "redone": [3, 13]}


def test_visual_grammar_and_renderer_preserve_tactical_line_meaning() -> None:
    result = _run_node("""
const Visual = require('./interface/js/visual-grammar.js');
const Renderer = require('./interface/js/renderer.js');
const grammar = Visual.createVisualGrammar();
const segmented = {segments:[{type:'cubic',start:[1,2],control1:[2,2],control2:[2,4],end:[3,4]},{type:'line',start:[3,4],end:[5,6]}]};
process.stdout.write(JSON.stringify({entityKinds:Object.keys(grammar.entities),pathKinds:Object.keys(grammar.paths),passDash:grammar.paths.pass.dash,feintMode:grammar.paths.feint.path_mode,preserveVertices:grammar.paths.feint.preserve_vertices,legacy:Renderer.pathData([[1,2],[3,4],[5,6]]),segmented:Renderer.pathData(segmented)}));
""")

    assert set(result["entityKinds"]) >= {"attacker", "defender", "goalkeeper", "generic_participant", "generic_material"}
    assert set(result["pathKinds"]) >= {"movement", "pass", "shot", "feint", "generic_action"}
    assert result["passDash"]
    assert result["feintMode"] == "functional_segments"
    assert result["preserveVertices"] is True
    assert result["legacy"] == "M 1 2 L 3 4 L 5 6"
    assert result["segmented"] == "M 1 2 C 2 2 2 4 3 4 L 5 6"


def test_moving_a_future_state_updates_connected_paths_with_one_primary_event() -> None:
    result = _run_node(_store_prelude() + """
const branch = store.snapshot().workingGeometry.branches[0];
const alternative = branch.alternatives[0];
const target = alternative.from_state_ref;
const before = store.snapshot().workingGeometry.participant_states.find(x=>x.id===target).position;
const event = store.applyCorrection({target:{layer:'geometry',ref:`geometry:participant_state:${target}`,property:'position'},operation:'move',after:[2.9,10.4],reason:'ajust de recepció'});
const snapshot = store.snapshot();
const updated = snapshot.workingGeometry.branches[0].alternatives[0];
process.stdout.write(JSON.stringify({count:snapshot.corrections.length,before,event,approachEnd:updated.approach_path.segments.at(-1).end,actionStart:updated.segments[0].start,passEnd:updated.return_pass.segments.at(-1).end,generatedStart:snapshot.generatedGeometry.branches[0].alternatives[0].segments[0].start}));
""")

    assert result["count"] == 1
    assert result["event"]["change_role"] == "primary"
    assert len(result["event"]["derived_effects"]) == 3
    assert result["approachEnd"] == [2.9, 10.4]
    assert result["actionStart"] == [2.9, 10.4]
    assert result["passEnd"] == [2.9, 10.4]
    assert result["generatedStart"] == result["before"]


def test_pass_display_is_trimmed_to_symbols_without_mutating_resolved_geometry() -> None:
    result = _run_node("""
const fs = require('fs');
const Renderer = require('./interface/js/renderer.js');
const Visual = require('./interface/js/visual-grammar.js');
const geometry = JSON.parse(fs.readFileSync('./exercises/TR-UVOF-015/geometry.json', 'utf8'));
const path = geometry.common_paths.find(x=>x.kind==='initial_pass');
const before = JSON.stringify(path);
const display = Renderer.pathForDisplay(path, geometry, Visual.createVisualGrammar(), 'pass');
process.stdout.write(JSON.stringify({sourceStart:path.segments[0].start,displayStart:display.segments[0].start,sourceEnd:path.segments.at(-1).end,displayEnd:display.segments.at(-1).end,unchanged:before===JSON.stringify(path)}));
""")

    assert result["unchanged"] is True
    assert result["displayStart"] != result["sourceStart"]
    assert result["displayEnd"] != result["sourceEnd"]


def test_movement_display_is_also_anchored_between_current_and_future_icons() -> None:
    result = _run_node("""
const fs = require('fs');
const Renderer = require('./interface/js/renderer.js');
const Visual = require('./interface/js/visual-grammar.js');
const geometry = JSON.parse(fs.readFileSync('./exercises/TR-UVOF-015/geometry.json', 'utf8'));
const path = geometry.branches[0].alternatives[0].approach_path;
const display = Renderer.pathForDisplay(path, geometry, Visual.createVisualGrammar(), 'movement_without_ball');
process.stdout.write(JSON.stringify({sourceStart:path.segments[0].start,displayStart:display.segments[0].start,sourceEnd:path.segments.at(-1).end,displayEnd:display.segments.at(-1).end}));
""")

    assert result["displayStart"] != result["sourceStart"]
    assert result["displayEnd"] != result["sourceEnd"]


def test_only_future_states_connected_to_visible_paths_are_exposed() -> None:
    result = _run_node("""
const fs = require('fs');
const Dependencies = require('./interface/js/geometry-dependencies.js');
const geometry = JSON.parse(fs.readFileSync('./exercises/TR-UVOF-015/geometry.json', 'utf8'));
const selected = Object.fromEntries(geometry.branches.map(branch=>[branch.id, branch.alternatives[0].id]));
const paths = [...geometry.common_paths];
geometry.branches.forEach(branch=>{ const alternative=branch.alternatives[0]; paths.push(alternative.approach_path, alternative.return_pass, alternative); });
const connected = new Set(paths.flatMap(path=>[path.from_state_ref,path.to_state_ref]));
const visible = Dependencies.visibleFutureStates(geometry, selected);
process.stdout.write(JSON.stringify({ids:visible.map(state=>state.id),allConnected:visible.every(state=>connected.has(state.id)),futureCount:geometry.participant_states.filter(state=>state.status==='future').length}));
""")

    assert len(result["ids"]) == 6
    assert result["allConnected"] is True
    assert result["futureCount"] > len(result["ids"])


def test_preflight_rejects_a_pass_linked_to_the_wrong_receiver_state() -> None:
    result = _run_node("""
const fs = require('fs');
const Store = require('./interface/js/store.js');
const Visual = require('./interface/js/visual-grammar.js');
const geometry = JSON.parse(fs.readFileSync('./exercises/TR-UVOF-015/geometry.json', 'utf8'));
geometry.branches[0].alternatives[0].return_pass.to_participant_ref = 'P_ESQ';
const store = Store.createWorkspaceStore({initialCase:{id:'TR-UVOF-015',name:'x',description:'x'},initialGeometry:geometry,visualGrammar:Visual.createVisualGrammar()});
const report = store.runPreflight();
process.stdout.write(JSON.stringify({canValidate:report.can_validate,codes:report.diagnostics.map(item=>item.code)}));
""")

    assert result["canValidate"] is False
    assert "PASS_IDENTITY_LINK_INVALID" in result["codes"]


def test_preflight_rejects_distinct_run_and_pass_reception_states() -> None:
    result = _run_node("""
const fs = require('fs');
const Store = require('./interface/js/store.js');
const Visual = require('./interface/js/visual-grammar.js');
const geometry = JSON.parse(fs.readFileSync('./exercises/TR-UVOF-015/geometry.json', 'utf8'));
const alternative = geometry.branches[0].alternatives[0];
alternative.approach_path.to_state_ref = alternative.to_state_ref;
const store = Store.createWorkspaceStore({initialCase:{id:'TR-UVOF-015',name:'x',description:'x'},initialGeometry:geometry,visualGrammar:Visual.createVisualGrammar()});
const report = store.runPreflight();
process.stdout.write(JSON.stringify({canValidate:report.can_validate,codes:report.diagnostics.map(item=>item.code)}));
""")

    assert result["canValidate"] is False
    assert "RECEPTION_STATE_NOT_SHARED" in result["codes"]


def test_training_case_and_correction_schemas_are_valid() -> None:
    try:
        from jsonschema import Draft202012Validator
    except (ImportError, ModuleNotFoundError):
        pytest.skip("jsonschema no està complet en l’entorn local")
    correction_schema = json.loads((ROOT / "schema/traca.correction-event.schema.v0.1.json").read_text(encoding="utf-8"))
    case_schema = json.loads((ROOT / "schema/traca.training-case.schema.v0.1.json").read_text(encoding="utf-8"))

    Draft202012Validator.check_schema(correction_schema)
    Draft202012Validator.check_schema(case_schema)
