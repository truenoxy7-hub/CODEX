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
    pytest.skip("Node no està disponible")


def _run_node(script: str) -> dict:
    completed = subprocess.run([_node(), "-e", script], cwd=ROOT, check=True, capture_output=True, text=True)
    return json.loads(completed.stdout)


PROFILE = """
const profile={court:{width_m:20,half_length_m:20},goal:{width_m:3,height_m:2},markings:{goal_area_radius_m:6,free_throw_distance_m:9,free_throw_segment_m:.15,free_throw_gap_m:.15,penalty_line_length_m:1,goalkeeper_line_length_m:.15,penalty_line_distance_m:7,goalkeeper_line_distance_m:4}};
"""


def test_visual_dictionary_is_evidence_backed_and_imports_the_complete_inventory() -> None:
    document = json.loads((ROOT / "knowledge/visual-functional-dictionary.v0.1.json").read_text(encoding="utf-8"))
    schema = json.loads((ROOT / "schema/traca.visual-functional-dictionary.schema.v0.1.json").read_text(encoding="utf-8"))
    try:
        from jsonschema import Draft202012Validator
    except (ImportError, ModuleNotFoundError):
        pytest.skip("jsonschema no està disponible")

    Draft202012Validator.check_schema(schema)
    Draft202012Validator(schema).validate(document)
    evidence = {item["id"] for item in document["evidence"]}
    assert all(entry["evidence_refs"] and set(entry["evidence_refs"]) <= evidence for entry in document["entries"])
    assert document["meta"]["reported_inventory_evidence_count"] == 103
    assert document["meta"]["imported_inventory_evidence_count"] == 103
    assert sum(item["source_ref"] == "SRC_INVENTORY_REPRESENTATIONS_V0_1" for item in document["evidence"]) == 103
    assert sum(item["source_ref"] == "SRC_COACH_GRAPHIC_LEGEND" for item in document["evidence"]) == 13
    assert "no poden omplir slots obligatoris" in document["meta"]["limitation"]
    two_v_one = next(entry for entry in document["entries"] if entry["concept"] == "two_v_one")
    assert two_v_one["type"] == "no_specific_glyph"
    assert two_v_one["visual"]["dedicated_glyph"] is False


def test_dictionary_drives_shapes_and_functional_path_styles() -> None:
    result = _run_node("""
const Visual=require('./interface/js/visual-grammar.js');
const Renderer=require('./interface/js/renderer.js');
const dictionary=require('./interface/data/visual-functional-dictionary.js');
const grammar=Visual.createVisualGrammar(dictionary);
const dribble={segments:[{type:'line',start:[2,10],end:[8,6]}]};
    process.stdout.write(JSON.stringify({attacker:grammar.entities.attacker.shape,defender:grammar.entities.defender.shape,pass:grammar.paths.pass,move:grammar.paths.movement,shot:grammar.paths.shot,dribble:grammar.paths.dribble,future:grammar.states.future,wavy:Renderer.wavyPathData(dribble),straight:Renderer.pathData(dribble)}));
""")

    assert result["attacker"] == "circle"
    assert result["defender"] == "triangle"
    assert result["pass"]["dash"]
    assert result["move"]["dash"] is None
    assert result["shot"]["render_mode"] == "double_stroke"
    assert result["dribble"]["line"] == "wavy"
    assert result["future"]["fill"] == "none"
    assert result["future"]["dash"]
    assert result["wavy"] != result["straight"]


def test_canonical_case_has_priority_and_ambiguous_visual_evidence_is_inactive() -> None:
    result = _run_node("""
const Resolver=require('./interface/js/knowledge-resolver.js');
const dictionary=require('./interface/data/visual-functional-dictionary.js');
dictionary.entries.push({id:'AMB',concept:'ambiguous_symbol',status:'ambiguous',authority:'coach_validated',evidence_refs:[dictionary.evidence[0].id]});
const canonicalCase={id:'CANON',case_type:'canonical_specimen',description:'doble suport',canonical_concepts:[{id:'canonical.only',label:'canònic',category:'action',knowledge_state:'validated'}]};
const library={coach_validated_local_knowledge:[{id:'LOCAL',semantic_ref:'local.rule',label:'doble suport',definition:'x',aliases:['doble suport'],category:'action',status:'validated',evidence_refs:['LOCAL-E']} ]};
const resolved=Resolver.resolve(canonicalCase,{canonicalCases:[canonicalCase],canonicalKnowledge:{concepts:[]},dictionary,library});
process.stdout.write(JSON.stringify({provider:resolved.provider,concepts:resolved.concepts.map(x=>x.id),active:resolved.visual_rules.map(x=>x.id)}));
""")

    assert result["provider"] == "canonical_case_provider"
    assert result["concepts"] == ["canonical.only"]
    assert "AMB" not in result["active"]


def test_composer_shares_reception_state_between_run_and_pass() -> None:
    result = _run_node(PROFILE + """
const Resolver=require('./interface/js/knowledge-resolver.js');
const Composer=require('./interface/js/representation-composer.js');
const knowledge=require('./interface/data/handball-knowledge.js');
const dictionary=require('./interface/data/visual-functional-dictionary.js');
const currentCase={id:'CASE-A',description:'Central passa al lateral i el lateral rep en carrera'};
const interpretation=Resolver.resolve(currentCase,{canonicalKnowledge:knowledge,dictionary,library:{}});
const composed=Composer.compose({currentCase,interpretation,answers:{},courtProfile:profile});
const movement=composed.plan.visual_primitives.find(item=>item.type==='movement_path');
const pass=composed.plan.visual_primitives.find(item=>item.type==='pass_path');
process.stdout.write(JSON.stringify({status:composed.status,geometryStatus:composed.geometry_status,movementTarget:movement.to_state_ref,passTarget:pass.to_state_ref,passReceiver:pass.to_participant_ref,geometry:composed.geometry,primitives:composed.used_primitives}));
""")

    assert result["status"] == "ready"
    assert result["geometryStatus"] == "needs_input"
    assert result["movementTarget"] == result["passTarget"]
    assert result["passReceiver"] == "L"
    assert result["geometry"] is None
    assert set(result["primitives"]) == {"movement_path", "pass_path"}


def test_composer_asks_direct_questions_instead_of_guessing_pass_identities() -> None:
    result = _run_node(PROFILE + """
const Resolver=require('./interface/js/knowledge-resolver.js');
const Composer=require('./interface/js/representation-composer.js');
const knowledge=require('./interface/data/handball-knowledge.js');
const dictionary=require('./interface/data/visual-functional-dictionary.js');
const currentCase={id:'CASE-B',description:'Es fa una passada i després una recepció'};
const interpretation=Resolver.resolve(currentCase,{canonicalKnowledge:knowledge,dictionary,library:{}});
const composed=Composer.compose({currentCase,interpretation,answers:{},courtProfile:profile});
process.stdout.write(JSON.stringify({status:composed.status,geometry:composed.geometry,questions:composed.questions.map(q=>q.id)}));
""")

    assert result == {
        "status": "needs_input",
        "geometry": None,
        "questions": ["A001:actor_ref", "A001:receiver_ref", "A002:actor_ref"],
    }


def test_validated_coach_knowledge_is_reused_but_case_only_and_candidates_are_not() -> None:
    result = _run_node("""
const Store=require('./interface/js/store.js');
const Visual=require('./interface/js/visual-grammar.js');
const Resolver=require('./interface/js/knowledge-resolver.js');
const knowledge=require('./interface/data/handball-knowledge.js');
const dictionary=require('./interface/data/visual-functional-dictionary.js');
const store=Store.createWorkspaceStore({initialCase:{id:'A',name:'A',description:'Acció de doble suport',source_refs:['coach_input']},visualGrammar:Visual.createVisualGrammar(dictionary),idFactory:(()=>{let n=0;return()=>`CASE-fixed-${++n}`})()});
store.applyCorrection({target:{layer:'semantic',ref:'semantic:annotation:double_support',property:'statement'},before:'desconegut',after:'doble suport',reason:'criteri del tècnic'});
store.recordCoachObservation({statement:'Aquesta posició és només del cas.',status:'case_only'});
store.saveExercise('coach');
store.addCoachValidatedKnowledge({label:'doble suport',definition:'Acció validada de doble suport.',aliases:['doble suport'],category:'action',semantic_ref:'action.double_support',correction_refs:store.snapshot().corrections.map(x=>x.id)});
store.createCase({name:'B',description:'Ara fem doble suport'});
const beforeCandidate=Resolver.resolve(store.snapshot().currentCase,{canonicalKnowledge:knowledge,dictionary,library:store.snapshot().knowledgeLibrary});
    const libraryWithCandidate=store.snapshot().knowledgeLibrary;
    libraryWithCandidate.semantic_rule_candidates.push({id:'C1',title:'doble suport candidat',aliases:['doble suport'],status:'candidate'});
const afterCandidate=Resolver.resolve(store.snapshot().currentCase,{canonicalKnowledge:knowledge,dictionary,library:libraryWithCandidate});
process.stdout.write(JSON.stringify({provider:beforeCandidate.provider,learned:beforeCandidate.concepts.filter(x=>x.source==='coach_validated_local_knowledge'),suggestions:afterCandidate.suggestions,caseOnlyCount:store.snapshot().coachObservations.length,localCount:store.snapshot().knowledgeLibrary.coach_validated_local_knowledge.length,evidenceCount:store.snapshot().knowledgeLibrary.evidence_records.length}));
""")

    assert result["provider"] == "knowledge_resolver"
    assert result["learned"][0]["id"] == "action.double_support"
    assert result["localCount"] == 1
    assert result["evidenceCount"] == 1
    assert result["caseOnlyCount"] == 0  # reset with the new case; it never entered reusable knowledge
    assert result["suggestions"][0]["knowledge_state"] == "candidate"


def test_text_change_invalidates_all_current_derivations_and_blocks_old_geometry() -> None:
    result = _run_node(PROFILE + """
const Store=require('./interface/js/store.js');const Visual=require('./interface/js/visual-grammar.js');const Resolver=require('./interface/js/knowledge-resolver.js');const Composer=require('./interface/js/representation-composer.js');const knowledge=require('./interface/data/handball-knowledge.js');const dictionary=require('./interface/data/visual-functional-dictionary.js');
const store=Store.createWorkspaceStore({initialCase:{id:'A',name:'A',description:'Central passa al lateral',source_refs:['coach_input']},visualGrammar:Visual.createVisualGrammar(dictionary)});
let snapshot=store.snapshot();const interpreted=Resolver.resolve(snapshot.currentCase,{canonicalKnowledge:knowledge,dictionary,library:snapshot.knowledgeLibrary});store.setInterpretation(interpreted);snapshot=store.snapshot();const composed=Composer.compose({currentCase:snapshot.currentCase,interpretation:snapshot.interpretation,answers:{},courtProfile:profile});store.setCompositionResult(composed,'primitive_composer');
store.updateCase({description:'Central passa al pivot'});const changed=store.snapshot();const report=store.runPreflight();
process.stdout.write(JSON.stringify({statuses:Object.fromEntries(Object.entries(changed.derivations).map(([k,v])=>[k,v.status])),geometryState:changed.geometryState.status,canValidate:report.can_validate,codes:report.diagnostics.map(x=>x.code)}));
""")

    assert result["statuses"]["interpretation"] == "stale"
    assert result["statuses"]["semantic"] == "stale"
    assert result["statuses"]["geometry"] == "unavailable"
    assert result["geometryState"] == "unavailable"
    assert result["canValidate"] is False
    assert "SOURCE_DERIVATION_STALE" in result["codes"]


def test_drafts_validated_cases_and_durable_identity_are_separate() -> None:
    result = _run_node("""
const Store=require('./interface/js/store.js');const Visual=require('./interface/js/visual-grammar.js');
let n=0;const store=Store.createWorkspaceStore({initialCase:{id:'NEW',name:'New',description:'text',source_refs:['coach_input']},visualGrammar:Visual.createVisualGrammar(),idFactory:()=>`CASE-durable-${++n}`});
const uid=store.snapshot().currentCase.case_uid;store.saveCase({status:'in_construction'});const afterDraft=store.snapshot();store.saveExercise('coach');const afterValidation=store.snapshot();
process.stdout.write(JSON.stringify({uid,sameUid:uid===afterValidation.currentCase.case_uid,draftsBefore:afterDraft.knowledgeLibrary.drafts.length,validBefore:afterDraft.knowledgeLibrary.validated_cases.length,draftsAfter:afterValidation.knowledgeLibrary.drafts.length,validAfter:afterValidation.knowledgeLibrary.validated_cases.length,status:afterValidation.knowledgeLibrary.validated_cases[0].status}));
""")

    assert result == {"uid": "CASE-durable-1", "sameUid": True, "draftsBefore": 1, "validBefore": 0, "draftsAfter": 0, "validAfter": 1, "status": "validated"}


@pytest.mark.parametrize("legacy_version", ["0.2.0", "0.3.0"])
def test_legacy_packages_migrate_to_v05(legacy_version: str) -> None:
    result = _run_node(f"""
const Store=require('./interface/js/store.js');const Visual=require('./interface/js/visual-grammar.js');const IO=require('./interface/js/import-export.js');
const legacy={{format:'TRACA_training_case',version:'{legacy_version}',metadata:{{exported_at:'2026-08-11T00:00:00.000Z',application:'TRAÇA',canonical_promotion:false}},case:{{id:'OLD',name:'Old',description:'old'}},description:'old',source_refs:[],interpretation:{{status:'unknown',concepts:[],unknown_concepts:[],unresolved:[]}},semantic_model:{{status:'unknown',participants:[],materials:[],spaces:[],actions:[],decisions:[],phases:[],annotations:[]}},spatial_model:{{status:'unknown',relations:[],annotations:[]}},geometry_state:{{status:'unavailable',resolver:null}},generated_geometry:null,coach_reference_geometry:null,working_geometry:null,base_visual_grammar:Visual.createVisualGrammar(),case_visual_overrides:[],corrections:[],coach_observations:[],validated_geometry:null,validated_visual_grammar:null,selected_alternatives:{{}},validation:{{status:'pending',correction_count:0,counts_by_layer:{{}},preflight:null}},knowledge_library:{{validated_cases:[{{id:'DRAFT',name:'Legacy draft',status:'in_construction'}}]}}}};
const store=Store.createWorkspaceStore({{initialCase:{{id:'N',name:'N',description:''}},visualGrammar:Visual.createVisualGrammar(),idFactory:()=> 'CASE-migrated'}});store.restorePackage(IO.parsePackage(JSON.stringify(legacy)));const snapshot=store.snapshot();const exported=IO.exportPackage(snapshot);
process.stdout.write(JSON.stringify({{uid:snapshot.currentCase.case_uid,drafts:snapshot.knowledgeLibrary.drafts.length,validated:snapshot.knowledgeLibrary.validated_cases.length,version:exported.version,hasDerivations:Boolean(exported.derivations),hasComposition:Boolean(exported.composition)}}));
""")

    assert result == {"uid": "CASE-migrated", "drafts": 1, "validated": 0, "version": "0.5.0", "hasDerivations": True, "hasComposition": True}
