from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
LOCAL_NODE = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
CASE = "El lateral fa una finta i després juga un 2x1 amb el pivot."
MAIN_CASE = (
    "El central passa al lateral. El lateral rep en carrera a l’interval 1–2, "
    "fa una finta contra D2 i surt cap a l’interval 2–3. "
    "Després juga un 2x1 amb el pivot contra D3."
)


def _node() -> str:
    executable = shutil.which("node")
    if executable:
        return executable
    if LOCAL_NODE.is_file():
        return str(LOCAL_NODE)
    pytest.skip("Node no està disponible")


def _run_node(body: str) -> dict:
    prelude = f"""
const Provider=require('./interface/js/interpretation-provider.js');
const Clarifier=require('./interface/js/clarification-orchestrator.js');
const Composer=require('./interface/js/representation-composer.js');
const UI=require('./interface/js/inspection-ui.js');
const caseText={json.dumps(CASE)};
const mainCase={json.dumps(MAIN_CASE)};
const profile={{court:{{width_m:20,half_length_m:20}},goal:{{width_m:3,height_m:2}},markings:{{goal_area_radius_m:6,free_throw_distance_m:9,free_throw_segment_m:.15,free_throw_gap_m:.15,penalty_line_length_m:1,goalkeeper_line_length_m:.15,penalty_line_distance_m:7,goalkeeper_line_distance_m:4}}}};
function sourceIR(text=caseText){{return Provider.buildTacticalIR(text,[],{{case_id:'CLARIFICATION'}});}}
function record(value, revision){{return {{value,source_revision:revision,authority:'coach_explicit_input',status:'explicit'}};}}
function compose(ir, answers={{}}){{return Composer.compose({{tacticalIR:ir,answers,courtProfile:profile}});}}
"""
    completed = subprocess.run(
        [_node(), "-e", prelude + body],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def test_initial_question_has_canonical_options_without_turning_them_into_facts() -> None:
    result = _run_node("""
const ir=sourceIR();const composed=compose(ir);
process.stdout.write(JSON.stringify({active:composed.active_question,all:composed.questions.map(item=>item.id),participants:composed.tactical_ir.participants.map(item=>item.id),spaces:composed.tactical_ir.spaces,coverage:composed.coverage}));
""")
    assert result["active"]["label"] == "Contra quin defensor fa la finta?"
    assert [item["value"] for item in result["active"]["options"]] == ["D1", "D2", "D3"]
    assert len(result["all"]) == 4
    assert result["participants"] == ["L", "PV"]
    assert result["spaces"] == []
    assert result["coverage"]["label"] == "0/2"


def test_answer_materializes_d2_and_filters_initial_intervals() -> None:
    result = _run_node("""
const ir=sourceIR();const answers={'A001:opponent_ref':record('D2',ir.meta.source_revision)};const composed=compose(ir,answers);
process.stdout.write(JSON.stringify({active:composed.active_question,d2:composed.tactical_ir.participants.filter(item=>item.id==='D2'),opponent:composed.tactical_ir.actions[0].opponent_ref,source:composed.tactical_ir.actions[0].slot_source_refs.opponent_ref}));
""")
    assert result["active"]["label"] == "Quin espai ataca inicialment?"
    assert [item["value"] for item in result["active"]["options"]] == ["INT_12", "INT_23"]
    assert len(result["d2"]) == 1
    assert result["d2"][0]["presence"] == "explicit"
    assert result["d2"][0]["authority"] == "coach_explicit_input"
    assert result["opponent"] == "D2"
    assert result["source"] == ["coach_answer:A001:opponent_ref"]


def test_interval_answer_materializes_space_and_derives_only_unique_feint_target() -> None:
    result = _run_node("""
const ir=sourceIR();const rev=ir.meta.source_revision;const answers={'A001:opponent_ref':record('D2',rev),'A001:initial_space_ref':record('INT_12',rev)};const composed=compose(ir,answers);const participants=Object.fromEntries(composed.tactical_ir.participants.map(item=>[item.id,item]));
process.stdout.write(JSON.stringify({active:composed.active_question,questions:composed.questions.map(item=>item.id),action:composed.tactical_ir.actions[0],spaces:composed.tactical_ir.spaces,participants,derivations:composed.auto_derivations}));
""")
    assert result["active"]["label"] == "Quin és el defensor del 2x1?"
    assert result["questions"] == ["A002:defender_refs"]
    assert result["action"]["initial_space_ref"] == "INT_12"
    assert result["action"]["target_space_ref"] == "INT_23"
    assert result["action"]["slot_authority"]["target_space_ref"] == "derived_from_validated_rule"
    assert [item["id"] for item in result["spaces"]] == ["INT_12", "INT_23"]
    assert result["spaces"][0]["delimiter_refs"] == ["D1", "D2"]
    assert result["participants"]["D1"]["presence"] == "structural_reference"
    assert result["participants"]["D3"]["presence"] == "structural_reference"
    assert result["derivations"][0]["value"] == "INT_23"


def test_two_v_one_defender_is_not_inferred_and_full_progression_becomes_ready() -> None:
    result = _run_node("""
const ir=sourceIR();const rev=ir.meta.source_revision;const partialAnswers={'A001:opponent_ref':record('D2',rev),'A001:initial_space_ref':record('INT_12',rev)};const partial=compose(ir,partialAnswers);const complete=compose(ir,{...partialAnswers,'A002:defender_refs':record(['D3'],rev)});const participants=complete.tactical_ir.participants.filter(item=>item.id==='D3');
process.stdout.write(JSON.stringify({partialDefenders:partial.tactical_ir.actions[1].defender_refs,active:partial.active_question.label,status:complete.composition_status,geometry:complete.geometry_status,coverage:complete.coverage,questions:complete.questions,d3:participants,relation:complete.plan.actions.find(item=>item.id==='A002')}));
""")
    assert result["partialDefenders"] == []
    assert result["active"] == "Quin és el defensor del 2x1?"
    assert result["status"] == "ready"
    assert result["geometry"] == "needs_input"
    assert result["coverage"]["label"] == "2/2"
    assert result["questions"] == []
    assert len(result["d3"]) == 1
    assert result["d3"][0]["presence"] == "explicit"
    assert result["relation"]["attacker_refs"] == ["L", "PV"]
    assert result["relation"]["defender_refs"] == ["D3"]


def test_structural_identity_is_promoted_in_place_when_selected() -> None:
    result = _run_node("""
const ir=sourceIR();const first=Clarifier.prepare(ir,{'A001:initial_space_ref':record('INT_12',ir.meta.source_revision)}).tacticalIR;const second=Clarifier.prepare(first,{'A001:opponent_ref':record('D2',ir.meta.source_revision)}).tacticalIR;process.stdout.write(JSON.stringify(second.participants.filter(item=>item.id==='D2')));
""")
    assert len(result) == 1
    assert result[0]["presence"] == "explicit"
    assert result[0]["structural_delimiter_refs"] == ["INT_12", "INT_23"]


def test_non_unique_or_incompatible_target_is_not_auto_selected() -> None:
    result = _run_node("""
const ir=sourceIR('El lateral fa una finta.');const rev=ir.meta.source_revision;const composed=compose(ir,{'A001:opponent_ref':record('D1',rev),'A001:initial_space_ref':record('INT_12',rev)});process.stdout.write(JSON.stringify({derived:composed.auto_derivations,active:composed.active_question,action:composed.tactical_ir.actions[0]}));
""")
    assert result["derived"] == []
    assert result["active"]["slot"] == "target_space_ref"
    assert "target_space_ref" not in result["action"]


def test_stale_answer_is_ignored_and_text_change_clears_store_answers() -> None:
    result = _run_node("""
const Store=require('./interface/js/store.js');const Visual=require('./interface/js/visual-grammar.js');const ir=sourceIR();const ignored=compose(ir,{'A001:opponent_ref':record('D2','OLD-REVISION')});const store=Store.createWorkspaceStore({initialCase:{id:'CASE',name:'Case',description:caseText,source_refs:['coach_input']},visualGrammar:Visual.createVisualGrammar()});store.setClarificationAnswer('A001:opponent_ref','D2');const before=store.snapshot().clarificationAnswers;store.updateCase({description:'El lateral fa una finta.'});const after=store.snapshot().clarificationAnswers;process.stdout.write(JSON.stringify({active:ignored.active_question.id,participants:ignored.tactical_ir.participants.map(item=>item.id),before,after}));
""")
    assert result["active"] == "A001:opponent_ref"
    assert result["participants"] == ["L", "PV"]
    assert result["before"]["A001:opponent_ref"]["source_revision"]
    assert result["after"] == {}


def test_numerical_relation_questions_use_natural_cardinality() -> None:
    result = _run_node("""
const provenance={authority:'coach_explicit_input',status:'explicit',source_refs:['coach_input:test']};const participants=['L','PV','CE'].map((id,index)=>({id,label:id,role:index===1?'pivot':'lateral',kind:'attacker',team:'attack',...provenance}));const ir={meta:{source_revision:'R1'},participants,participant_states:[],balls:[],materials:[],spaces:[],actions:[{id:'A1',type:'numerical_relation',subtype:'2x1',attacker_refs:['L','PV'],defender_refs:[],...provenance},{id:'A2',type:'numerical_relation',subtype:'2x2',attacker_refs:['L','PV'],defender_refs:[],...provenance},{id:'A3',type:'numerical_relation',subtype:'3x2',attacker_refs:['L','PV','CE'],defender_refs:[],...provenance}],decisions:[],phases:[],ball_flow:[],relations:[]};const composed=compose(ir);process.stdout.write(JSON.stringify(Object.fromEntries(composed.questions.map(item=>[item.id,item.label]))));
""")
    assert result == {
        "A1:defender_refs": "Quin és el defensor del 2x1?",
        "A2:defender_refs": "Quins són els dos defensors del 2x2?",
        "A3:defender_refs": "Quins són els dos defensors del 3x2?",
    }


def test_candidate_is_only_a_suggestion_and_never_applied() -> None:
    result = _run_node("""
const ir=sourceIR('El lateral fa una finta.');const candidate={id:'CANDIDATE',action_ref:'A001',slot:'opponent_ref',value:'D2',label:'D2',authority:'candidate',status:'candidate',source_refs:['candidate:test']};const composed=Composer.compose({tacticalIR:ir,knowledgeFacts:[candidate],courtProfile:profile});process.stdout.write(JSON.stringify({active:composed.active_question,suggestion:composed.active_question.suggested_answer,opponent:composed.tactical_ir.actions[0].opponent_ref,participants:composed.tactical_ir.participants.map(item=>item.id)}));
""")
    assert result["active"]["id"] == "A001:opponent_ref"
    assert result["suggestion"]["value"] == "D2"
    assert result["opponent"] is None
    assert result["participants"] == ["L"]


def test_advanced_diagnostic_exposes_pending_active_answers_options_and_derivations() -> None:
    result = _run_node("""
const ir=sourceIR();const rev=ir.meta.source_revision;const answers={'A001:opponent_ref':record('D2',rev),'A001:initial_space_ref':record('INT_12',rev)};const composed=compose(ir,answers);const diagnostics=UI.diagnosticsFor({derivations:{},interpretation:{tactical_ir:ir},clarificationAnswers:answers,composition:composed});process.stdout.write(JSON.stringify(diagnostics.payloads.questions));
""")
    assert result["active_question"]["id"] == "A002:defender_refs"
    assert result["questions"][0]["options"]
    assert result["answers"]["A001:opponent_ref"]["value"] == "D2"
    assert result["auto_derivations"][0]["value"] == "INT_23"
    assert len(result["applied_answers"]) == 2


def test_explicit_main_case_remains_ready_without_questions() -> None:
    result = _run_node("""
const ir=sourceIR(mainCase);const composed=compose(ir);process.stdout.write(JSON.stringify({status:composed.composition_status,geometry:composed.geometry_status,coverage:composed.coverage,questions:composed.questions,active:composed.active_question}));
""")
    assert result == {
        "status": "ready",
        "geometry": "needs_input",
        "coverage": {
            "actions_total": 4,
            "actions_composed": 4,
            "actions_unresolved": 0,
            "actions_unsupported": 0,
            "ratio": 1,
            "label": "4/4",
        },
        "questions": [],
        "active": None,
    }
