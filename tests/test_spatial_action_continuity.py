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
const mainCase={json.dumps(MAIN_CASE)};
const profile={{court:{{width_m:20,half_length_m:20}},goal:{{width_m:3,height_m:2}},markings:{{goal_area_radius_m:6,free_throw_distance_m:9,free_throw_segment_m:.15,free_throw_gap_m:.15,penalty_line_length_m:1,goalkeeper_line_length_m:.15,penalty_line_distance_m:7,goalkeeper_line_distance_m:4}}}};
const provenance={{authority:'coach_explicit_input',status:'explicit',source_refs:['coach_input:test']}};
function action(data){{return {{...provenance,...data}};}}
"""
    completed = subprocess.run(
        [_node(), "-e", prelude + body],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def test_reception_keeps_its_explicit_terminal_space() -> None:
    result = _run_node("""
const ir=Provider.buildTacticalIR(mainCase,[],{case_id:'MAIN'});
const reception=ir.actions.find(item=>item.type==='reception');
process.stdout.write(JSON.stringify(reception));
""")
    assert result["actor_ref"] == "L"
    assert result["mode"] == "in_motion"
    assert result["space_ref"] == "INT_12"
    assert result["slot_authority"]["space_ref"] == "coach_explicit_input"
    assert result["slot_source_refs"]["space_ref"]


def test_feint_keeps_the_explicit_forward_target() -> None:
    result = _run_node("""
const ir=Provider.buildTacticalIR(mainCase,[],{case_id:'MAIN'});
const feint=ir.actions.find(item=>item.type==='feint');
process.stdout.write(JSON.stringify(feint));
""")
    assert result["actor_ref"] == "L"
    assert result["opponent_ref"] == "D2"
    assert result["target_space_ref"] == "INT_23"
    assert result["slot_authority"]["target_space_ref"] == "coach_explicit_input"


def test_terminal_space_propagates_to_the_next_initial_space_with_traceability() -> None:
    result = _run_node("""
const ir=Provider.buildTacticalIR(mainCase,[],{case_id:'MAIN'});
const feint=ir.actions.find(item=>item.type==='feint');
process.stdout.write(JSON.stringify({feint,relations:ir.relations.filter(item=>item.type==='spatial_continuity')}));
""")
    feint = result["feint"]
    assert feint["initial_space_ref"] == "INT_12"
    assert feint["slot_authority"]["initial_space_ref"] == "derived_from_validated_rule"
    assert feint["spatial_derivations"][0]["predecessor_action_ref"] == "A002"
    assert result["relations"][0]["from_ref"] == "A002"
    assert result["relations"][0]["to_ref"] == "A003"


def test_continuity_is_applied_when_the_actor_is_the_same() -> None:
    result = _run_node("""
const actions=[
  action({id:'R',type:'reception',actor_ref:'L',space_ref:'INT_12'}),
  action({id:'F',type:'feint',actor_ref:'L',opponent_ref:'D2',target_space_ref:'INT_23',after:['R']})
];
const relations=Provider.resolveSpatialContinuity(actions);
process.stdout.write(JSON.stringify({actions,relations}));
""")
    assert result["actions"][1]["initial_space_ref"] == "INT_12"
    assert result["relations"][0]["type"] == "spatial_continuity"


def test_continuity_is_not_propagated_between_different_actors() -> None:
    result = _run_node("""
const ir=Provider.buildTacticalIR('El lateral rep a l’interval 1–2. El pivot fa una finta contra D2.',[],{case_id:'ACTOR-CHANGE'});
const feint=ir.actions.find(item=>item.type==='feint');
process.stdout.write(JSON.stringify({feint,relations:ir.relations.filter(item=>item.type.includes('spatial_continuity'))}));
""")
    assert result["feint"]["actor_ref"] == "PV"
    assert "initial_space_ref" not in result["feint"]
    assert result["relations"] == []


def test_intermediary_action_changes_the_terminal_space_used_next() -> None:
    result = _run_node("""
const actions=[
  action({id:'R',type:'reception',actor_ref:'L',space_ref:'INT_12'}),
  action({id:'M',type:'movement',actor_ref:'L',target_space_ref:'INT_23',after:['R']}),
  action({id:'F',type:'feint',actor_ref:'L',opponent_ref:'D3',target_space_ref:'INT_33',after:['M']})
];
Provider.resolveSpatialContinuity(actions);
process.stdout.write(JSON.stringify(actions));
""")
    assert result[1]["initial_space_ref"] == "INT_12"
    assert result[2]["initial_space_ref"] == "INT_23"


def test_explicit_conflict_is_not_overwritten_or_hidden() -> None:
    result = _run_node("""
const actions=[
  action({id:'R',type:'reception',actor_ref:'L',space_ref:'INT_12'}),
  action({id:'F',type:'feint',actor_ref:'L',opponent_ref:'D2',initial_space_ref:'INT_23',target_space_ref:'INT_33',after:['R'],slot_authority:{initial_space_ref:'coach_explicit_input'}})
];
const relations=Provider.resolveSpatialContinuity(actions);
process.stdout.write(JSON.stringify({actions,relations}));
""")
    feint = result["actions"][1]
    assert feint["initial_space_ref"] == "INT_23"
    assert feint["spatial_conflicts"][0]["predecessor_terminal_space_ref"] == "INT_12"
    assert feint["spatial_conflicts"][0]["status"] == "unresolved"
    assert result["relations"][0]["type"] == "spatial_continuity_conflict"


def test_main_case_composes_all_four_actions_without_spatial_questions() -> None:
    result = _run_node("""
const ir=Provider.buildTacticalIR(mainCase,[],{case_id:'MAIN'});
const composed=Composer.compose({tacticalIR:ir,courtProfile:profile});
process.stdout.write(JSON.stringify({actions:ir.actions.map(item=>({id:item.id,type:item.type,after:item.after||[]})),coverage:composed.coverage,questions:composed.questions}));
""")
    assert result["actions"] == [
        {"id": "A001", "type": "pass", "after": []},
        {"id": "A002", "type": "reception", "after": ["A001"]},
        {"id": "A003", "type": "feint", "after": ["A002"]},
        {"id": "A004", "type": "numerical_relation", "after": ["A003"]},
    ]
    assert result["coverage"]["label"] == "4/4"
    assert result["coverage"]["actions_unresolved"] == 0
    assert result["questions"] == []


def test_feint_without_spaces_does_not_invent_them() -> None:
    result = _run_node("""
const ir=Provider.buildTacticalIR('El lateral fa una finta contra D2.',[],{case_id:'NO-SPACES'});
const feint=ir.actions.find(item=>item.type==='feint');
process.stdout.write(JSON.stringify({feint,spaces:ir.spaces,relations:ir.relations.filter(item=>item.type.includes('spatial_continuity'))}));
""")
    assert "initial_space_ref" not in result["feint"]
    assert "target_space_ref" not in result["feint"]
    assert result["spaces"] == []
    assert result["relations"] == []


def test_composer_regressions_preserve_shared_state_and_no_2x1_glyph() -> None:
    result = _run_node("""
const ir=Provider.buildTacticalIR(mainCase,[],{case_id:'MAIN'});
const composed=Composer.compose({tacticalIR:ir,courtProfile:profile});
const pass=composed.plan.actions.find(item=>item.id==='A001');
const reception=composed.plan.actions.find(item=>item.id==='A002');
const feint=composed.plan.actions.find(item=>item.id==='A003');
const numerical=composed.plan.actions.find(item=>item.id==='A004');
process.stdout.write(JSON.stringify({passTarget:pass.to_state_ref,receptionState:reception.state_ref,feintStart:feint.from_state_ref,numericalGlyph:numerical.dedicated_glyph,numericalStatus:numerical.status}));
""")
    assert result["passTarget"] == result["receptionState"] == result["feintStart"]
    assert result["numericalGlyph"] is False
    assert result["numericalStatus"] == "composed"
