from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
LOCAL_NODE = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
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
const Composer=require('./interface/js/representation-composer.js');
const Preflight=require('./interface/js/composition-preflight.js');
const UI=require('./interface/js/inspection-ui.js');
const mainCase={json.dumps(MAIN_CASE)};
const profile={{court:{{width_m:20,half_length_m:20}},goal:{{width_m:3,height_m:2}},markings:{{goal_area_radius_m:6,free_throw_distance_m:9,free_throw_segment_m:.15,free_throw_gap_m:.15,penalty_line_length_m:1,goalkeeper_line_length_m:.15,penalty_line_distance_m:7,goalkeeper_line_distance_m:4}}}};
const provenance={{authority:'coach_explicit_input',status:'explicit',source_refs:['coach_input:test']}};
function emptyIR(overrides={{}}){{return {{meta:{{format:'TRACA_tactical_ir',version:'0.1.0',case_id:'TEST',source_revision:'R1'}},participants:[],participant_states:[],balls:[],materials:[],spaces:[],actions:[],decisions:[],phases:[],ball_flow:[],relations:[],...overrides}};}}
function emptyPlan(overrides={{}}){{return {{participant_states:[],actions:[],applied_knowledge:[],ball_flow:{{diagnostics:[]}},constraint_conflicts:[],questions:[],...overrides}};}}
"""
    completed = subprocess.run(
        [_node(), "-e", prelude + body],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def test_int12_creates_stable_structural_defensive_references_without_geometry() -> None:
    result = _run_node("""
const ir=Provider.buildTacticalIR('El lateral ataca l’interval 1–2.',[],{case_id:'INT12'});
const composed=Composer.compose({tacticalIR:ir,courtProfile:profile});
process.stdout.write(JSON.stringify({participants:ir.participants,space:ir.spaces[0],composition:composed.composition_status,geometry:composed.geometry}));
""")
    participants = {item["id"]: item for item in result["participants"]}
    assert result["space"]["delimiter_refs"] == ["D1", "D2"]
    assert participants["D1"]["presence"] == "structural_reference"
    assert participants["D2"]["presence"] == "structural_reference"
    assert participants["D1"]["functional_participation"] == "delimiter_only"
    assert participants["D1"]["authority"] == "derived_from_validated_rule"
    assert "position" not in participants["D1"]
    assert result["composition"] != "blocked"
    assert result["geometry"] is None


def test_int23_creates_d3_structural_but_keeps_explicit_d2_and_feint_ready() -> None:
    result = _run_node("""
const text='El lateral fa una finta contra D2 de l’interval 1–2 al 2–3.';
const ir=Provider.buildTacticalIR(text,[],{case_id:'FEINT'});
const composed=Composer.compose({tacticalIR:ir,courtProfile:profile});
process.stdout.write(JSON.stringify({participants:ir.participants,spaces:ir.spaces,feint:ir.actions[0],composition:composed.composition_status,geometry:composed.geometry_status}));
""")
    participants = {item["id"]: item for item in result["participants"]}
    assert participants["D1"]["presence"] == "structural_reference"
    assert participants["D2"]["presence"] == "explicit"
    assert participants["D3"]["presence"] == "structural_reference"
    assert result["feint"]["opponent_ref"] == "D2"
    assert result["feint"]["initial_space_ref"] == "INT_12"
    assert result["feint"]["target_space_ref"] == "INT_23"
    assert result["composition"] == "ready"
    assert result["geometry"] == "needs_input"


def test_later_explicit_mention_promotes_same_d1_identity_without_duplicate() -> None:
    result = _run_node("""
const ir=Provider.buildTacticalIR('El lateral ataca l’interval 1–2. D1 surt a defensar.',[],{case_id:'PROMOTION'});
process.stdout.write(JSON.stringify(ir.participants.filter(item=>item.id==='D1')));
""")
    assert len(result) == 1
    assert result[0]["id"] == "D1"
    assert result[0]["presence"] == "explicit"
    assert result[0]["functional_participation"] == "declared"
    assert result[0]["authority"] == "coach_explicit_input"
    assert result[0]["structural_delimiter_refs"] == ["INT_12"]


def test_structural_reference_cannot_be_used_as_active_opponent() -> None:
    result = _run_node("""
const ir=Provider.buildTacticalIR('El lateral ataca l’interval 1–2.',[],{case_id:'PASSIVE'});
const plan=emptyPlan({actions:[{id:'A1',semantic_type:'feint',status:'composed',actor_ref:'L',opponent_ref:'D1'}]});
const report=Preflight.run(plan,ir);
process.stdout.write(JSON.stringify({sourceOpponent:ir.actions.map(item=>item.opponent_ref),status:report.status,codes:report.diagnostics.map(item=>item.code)}));
""")
    assert result["sourceOpponent"] == []
    assert result["status"] == "blocked"
    assert "STRUCTURAL_REFERENCE_USED_AS_ACTIVE_PARTICIPANT" in result["codes"]


def test_validated_structural_derivation_is_not_a_missing_delimiter() -> None:
    result = _run_node("""
const ir=emptyIR({spaces:[{id:'INT_12',delimiter_refs:['D1','D2'],delimiter_derivations:[
 {delimiter_ref:'D1',entity_kind:'defender',presence:'structural_reference',authority:'derived_from_validated_rule',status:'validated',source_refs:['canonical:INT_12']},
 {delimiter_ref:'D2',entity_kind:'defender',presence:'structural_reference',authority:'derived_from_validated_rule',status:'validated',source_refs:['canonical:INT_12']}
],...provenance}]});
const report=Preflight.run(emptyPlan(),ir);
process.stdout.write(JSON.stringify(report));
""")
    assert result["status"] == "ready"
    assert result["diagnostics"] == []


def test_unknown_delimiters_without_validated_derivation_still_block() -> None:
    result = _run_node("""
const ir=emptyIR({spaces:[{id:'SPACE_X',delimiter_refs:['UNKNOWN_A','UNKNOWN_B'],...provenance}]});
const composed=Composer.compose({tacticalIR:ir,courtProfile:profile});
const diagnostic=UI.diagnosticsFor({derivations:{},interpretation:{tactical_ir:ir},composition:composed});
process.stdout.write(JSON.stringify({status:composed.composition_status,codes:composed.preflight.diagnostics.map(item=>item.code),reasons:diagnostic.composition.reasons,participants:ir.participants}));
""")
    assert result["status"] == "blocked"
    assert result["codes"] == ["SPACE_DELIMITER_MISSING", "SPACE_DELIMITER_MISSING"]
    assert "UNKNOWN_A" in result["reasons"][0]
    assert result["participants"] == []


def test_material_delimiter_does_not_gain_defensive_equivalence() -> None:
    result = _run_node("""
const material={id:'C1',kind:'cone',function:'passive_marker',...provenance};
const ir=emptyIR({participants:[{id:'PV',kind:'attacker',team:'attack',...provenance}],materials:[material],spaces:[{id:'SPACE_C1',delimiter_refs:['C1','COURT_GOAL_LINE'],...provenance}]});
const delimiterReport=Preflight.run(emptyPlan(),ir);
const activeReport=Preflight.run(emptyPlan({actions:[{id:'B1',semantic_type:'block',status:'composed',actor_ref:'PV',blocked_defender_ref:'C1'}]}),ir);
process.stdout.write(JSON.stringify({delimiter:delimiterReport,active:activeReport}));
""")
    assert result["delimiter"]["status"] == "ready"
    assert result["active"]["status"] == "blocked"
    assert "MATERIAL_OPPONENT_EQUIVALENCE_MISSING" in [item["code"] for item in result["active"]["diagnostics"]]


def test_main_case_is_ready_with_shared_state_and_four_of_four_coverage() -> None:
    result = _run_node("""
const ir=Provider.buildTacticalIR(mainCase,[],{case_id:'MAIN'});
const composed=Composer.compose({tacticalIR:ir,courtProfile:profile});
const actions=Object.fromEntries(composed.plan.actions.map(item=>[item.id,item]));
process.stdout.write(JSON.stringify({status:composed.composition_status,coverage:composed.coverage,questions:composed.questions,passTarget:actions.A001.to_state_ref,reception:actions.A002.state_ref,feintStart:actions.A003.from_state_ref}));
""")
    assert result["status"] == "ready"
    assert result["coverage"]["label"] == "4/4"
    assert result["coverage"]["actions_unresolved"] == 0
    assert result["questions"] == []
    assert result["passTarget"] == result["reception"] == result["feintStart"]


def test_main_case_geometry_remains_independent_and_does_not_invent_coordinates() -> None:
    result = _run_node("""
const ir=Provider.buildTacticalIR(mainCase,[],{case_id:'MAIN'});
const composed=Composer.compose({tacticalIR:ir,courtProfile:profile});
process.stdout.write(JSON.stringify({composition:composed.composition_status,geometryStatus:composed.geometry_status,geometry:composed.geometry,positions:ir.participants.filter(item=>item.position).map(item=>item.id)}));
""")
    assert result == {
        "composition": "ready",
        "geometryStatus": "needs_input",
        "geometry": None,
        "positions": [],
    }


def test_diagnostic_projects_reception_space_and_human_geometry_reason() -> None:
    result = _run_node("""
const ir=Provider.buildTacticalIR(mainCase,[],{case_id:'MAIN'});
const composed=Composer.compose({tacticalIR:ir,courtProfile:profile});
const diagnostic=UI.diagnosticsFor({derivations:{},interpretation:{tactical_ir:ir},composition:composed});
process.stdout.write(JSON.stringify({summary:diagnostic.composition,reception:diagnostic.actions.find(item=>item.type==='reception'),feint:diagnostic.actions.find(item=>item.type==='feint'),preflight:diagnostic.payloads.spatialConstraints.preflight}));
""")
    assert result["reception"]["finalSpace"] == ["INT_12"]
    assert result["feint"]["initialSpace"] == ["INT_12"]
    assert result["feint"]["finalSpace"] == ["INT_23"]
    assert result["summary"]["status"] == "ready"
    assert result["summary"]["geometry"] == "needs_input"
    assert any("INT_12 és entre D1 i D2" in reason for reason in result["summary"]["reasons"])
    assert result["preflight"]["status"] == "ready"
