from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[1]
LOCAL_NODE = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
SCHEMA = json.loads((ROOT / "schema/traca.geometry.schema.v0.4.json").read_text(encoding="utf-8"))
DEMO_TEXT = (
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
    prelude = r"""
const Provider=require('./interface/js/interpretation-provider.js');
const Composer=require('./interface/js/representation-composer.js');
const Resolver=require('./interface/js/generic-geometry-resolver.js');
const profile=require('./config/handball-court.ihf-2025.json');
const provenance={authority:'coach_explicit_input',status:'explicit',source_refs:['coach_input:test']};
function participant(id,team,role){return {id,label:id,team,kind:team==='defense'?'defender':'attacker',role:role||null,...provenance};}
function qualitative(actions, options={}) {
  const ids=options.ids||{sender:'CE_X',receiver:'L_X',pivot:'PV_X',d1:'DX1',d2:'DX2',d3:'DX3',s12:'SPACE_A',s23:'SPACE_B'};
  return {
    meta:{format:'TRACA_tactical_ir',version:'0.1.0',case_id:options.caseId||'QUALITATIVE',source_revision:'R1',knowledge_version:'K1'},
    participants:[participant(ids.sender,'attack','central'),participant(ids.receiver,'attack','lateral'),participant(ids.pivot,'attack','pivot'),participant(ids.d1,'defense','first'),participant(ids.d2,'defense','second'),participant(ids.d3,'defense','third')],
    participant_states:[],balls:[{id:'BALL_X',holder_ref:ids.sender,...provenance}],materials:[],
    spaces:[
      {id:ids.s12,label:'initial',delimiter_refs:options.reverse?[ids.d3,ids.d2]:[ids.d1,ids.d2],authority:'canonical_spatial',status:'validated',source_refs:['space:initial']},
      {id:ids.s23,label:'target',delimiter_refs:options.reverse?[ids.d2,ids.d1]:[ids.d2,ids.d3],authority:'canonical_spatial',status:'validated',source_refs:['space:target']}
    ],
    actions:actions(ids).map(action=>({...provenance,...action})),decisions:[],phases:[],ball_flow:[],relations:[]
  };
}
"""
    completed = subprocess.run(
        [_node(), "-e", prelude + body],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def _schema_errors(geometry: dict) -> list[str]:
    return [error.message for error in Draft202012Validator(SCHEMA).iter_errors(geometry)]


def test_a1_pass_and_reception_resolve_without_input_coordinates() -> None:
    result = _run_node(r"""
const ir=qualitative(ids=>[
  {id:'PASS_X',type:'pass',actor_ref:ids.sender,receiver_ref:ids.receiver,ball_ref:'BALL_X'},
  {id:'RECEIVE_X',type:'reception',actor_ref:ids.receiver,mode:'in_motion',after:['PASS_X']}
]);
const result=Composer.compose({tacticalIR:ir,courtProfile:profile});
const pass=result.plan.actions.find(item=>item.id==='PASS_X');
const reception=result.plan.actions.find(item=>item.id==='RECEIVE_X');
process.stdout.write(JSON.stringify({composition:result.composition_status,status:result.geometry_status,geometry:result.geometry,passState:pass.to_state_ref,receptionState:reception.state_ref,inputCoordinates:ir.participants.filter(item=>item.position).length}));
""")

    assert result["composition"] == result["status"] == "ready"
    assert result["inputCoordinates"] == 0
    assert result["passState"] == result["receptionState"]
    assert result["geometry"]["result"]["obligations_pending"] == 0
    assert result["geometry"]["validation"]["geometry"] == "valid"
    assert result["geometry"]["validation"]["tactical"] == "not_validated_by_coach"
    assert len(result["geometry"]["balls"]) == 1
    assert _schema_errors(result["geometry"]) == []


def test_a2_demo_preserves_identity_ball_spaces_and_open_2x1() -> None:
    result = _run_node(
        f"""
const text={json.dumps(DEMO_TEXT)};
const ir=Provider.buildTacticalIR(text,[],{{case_id:'DEMO',knowledge_version:'K1'}});
const result=Composer.compose({{tacticalIR:ir,courtProfile:profile}});
process.stdout.write(JSON.stringify({{composition:result.composition_status,status:result.geometry_status,geometry:result.geometry,plan:result.plan,inputCoordinates:ir.participants.filter(item=>item.position).length}}));
"""
    )

    geometry = result["geometry"]
    paths = {path["kind"]: path for path in geometry["common_paths"]}
    pass_action = next(item for item in result["plan"]["actions"] if item["operator_id"] == "pass")
    reception = next(item for item in result["plan"]["actions"] if item["operator_id"] == "reception")
    feint = next(item for item in result["plan"]["actions"] if item["operator_id"] == "feint")
    relation = next(item for item in result["plan"]["actions"] if item["operator_id"] == "numerical_relation")

    assert result["composition"] == result["status"] == "ready"
    assert result["inputCoordinates"] == 0
    assert pass_action["to_state_ref"] == reception["state_ref"] == feint["from_state_ref"]
    assert paths["pass"]["to_state_ref"] == paths["movement_without_ball"]["to_state_ref"] == paths["feint"]["from_state_ref"]
    assert [point["role"] for point in paths["feint"]["functional_points"]] == ["commitment", "direction_break", "clearance", "exit"]
    assert relation["attacker_refs"] == ["L", "PV"]
    assert relation["defender_refs"] == ["D3"]
    assert not any(path["kind"] in {"shot", "return_pass"} for path in geometry["common_paths"])
    assert geometry["result"]["status"] == "ready"
    assert geometry["result"]["geometry_validation_status"] == "valid"
    assert geometry["result"]["tactical_validation_status"] == "not_validated_by_coach"
    assert geometry["result"]["obligations_total"] == geometry["result"]["obligations_resolved"]
    assert geometry["result"]["obligations_pending"] == geometry["result"]["incompatible_count"] == 0
    assert geometry["balls"][0]["ball_ref"] == paths["pass"]["ball_ref"] == "B1"
    assert geometry["ball_flow"][0]["path_ref"] == paths["pass"]["id"]
    assert _schema_errors(geometry) == []


@pytest.mark.parametrize("reverse", [False, True])
def test_a3_identifier_and_side_variants_use_relations_not_templates(reverse: bool) -> None:
    result = _run_node(
        f"""
const ir=qualitative(ids=>[
  {{id:'P_CUSTOM',type:'pass',actor_ref:ids.sender,receiver_ref:ids.receiver,ball_ref:'BALL_X'}},
  {{id:'R_CUSTOM',type:'reception',actor_ref:ids.receiver,mode:'in_motion',space_ref:ids.s12,after:['P_CUSTOM']}},
  {{id:'F_CUSTOM',type:'feint',actor_ref:ids.receiver,opponent_ref:ids.d2,initial_space_ref:ids.s12,target_space_ref:ids.s23,after:['R_CUSTOM']}},
  {{id:'N_CUSTOM',type:'numerical_relation',subtype:'2x1',attacker_refs:[ids.receiver,ids.pivot],defender_refs:[{f'ids.d1' if reverse else 'ids.d3'}],after:['F_CUSTOM']}}
],{{reverse:{str(reverse).lower()},caseId:'VARIANT-{str(reverse).upper()}'}});
const result=Composer.compose({{tacticalIR:ir,courtProfile:profile}});
process.stdout.write(JSON.stringify({{status:result.geometry_status,geometry:result.geometry}}));
"""
    )

    assert result["status"] == "ready"
    assert result["geometry"]["meta"]["case_id"].startswith("VARIANT-")
    assert result["geometry"]["result"]["obligations_pending"] == 0
    assert all("TR-UVOF" not in json.dumps(item) for item in result["geometry"]["layout_policy"]["decisions"])
    assert _schema_errors(result["geometry"]) == []


def test_manual_anchor_conflict_is_reported_instead_of_silently_moved() -> None:
    result = _run_node(r"""
const ir=qualitative(ids=>[
  {id:'P',type:'pass',actor_ref:ids.sender,receiver_ref:ids.receiver,ball_ref:'BALL_X'},
  {id:'R',type:'reception',actor_ref:ids.receiver,mode:'in_motion',space_ref:ids.s12,state_ref:'RECEPTION_STATE',after:['P']}
]);
ir.participant_states=[{id:'RECEPTION_STATE',participant_ref:'L_X',state_key:'RECEPTION_STATE',space_ref:'SPACE_A',position:[19,18],status:'future',authority:'coach_explicit_input',source_refs:['coach_input:test']}];
const result=Composer.compose({tacticalIR:ir,courtProfile:profile});
process.stdout.write(JSON.stringify({status:result.geometry_status,geometry:result.geometry}));
""")

    assert result["status"] == "blocked"
    assert "MANUAL_ANCHOR_RELATION_CONFLICT" in {item["code"] for item in result["geometry"]["diagnostics"]}
    assert result["geometry"]["participant_states"]
    assert _schema_errors(result["geometry"]) == []


def test_compatible_manual_anchor_is_preserved() -> None:
    result = _run_node(r"""
const ir=qualitative(ids=>[
  {id:'P',type:'pass',actor_ref:ids.sender,receiver_ref:ids.receiver,ball_ref:'BALL_X'},
  {id:'R',type:'reception',actor_ref:ids.receiver,mode:'in_motion',space_ref:ids.s12,state_ref:'RECEPTION_STATE',after:['P']}
]);
ir.participant_states=[{id:'RECEPTION_STATE',participant_ref:'L_X',state_key:'RECEPTION_STATE',space_ref:'SPACE_A',position:[8,9.95],status:'future',authority:'coach_explicit_input',source_refs:['coach_input:test']}];
const result=Composer.compose({tacticalIR:ir,courtProfile:profile});
const state=result.geometry.participant_states.find(item=>item.id==='RECEPTION_STATE');
process.stdout.write(JSON.stringify({status:result.geometry_status,state,diagnostics:result.geometry.diagnostics}));
""")

    assert result["status"] == "ready"
    assert result["state"]["position"] == [8, 9.95]
    assert result["state"]["layout_decision_ref"] == "LAYOUT_EXPLICIT_RECEPTION_STATE"
    assert result["diagnostics"] == []


def test_legacy_uvof015_adapter_preserves_regression_and_matches_general_schema() -> None:
    result = _run_node(r"""
const legacy=require('./exercises/TR-UVOF-015/geometry.json');
const adapted=Resolver.adaptLegacyGeometry(legacy);
process.stdout.write(JSON.stringify({adapted,branches:adapted.branches.length,alternatives:adapted.branches.reduce((total,branch)=>total+branch.alternatives.length,0)}));
""")

    assert result["adapted"]["meta"]["adapted_from"]["version"] == "0.2.1"
    assert result["branches"] == 3
    assert result["alternatives"] == 12
    assert len(result["adapted"]["balls"]) == 3
    assert len(result["adapted"]["ball_flow"]) == 15
    assert result["adapted"]["validation"]["geometry"] == "invalid"
    assert result["adapted"]["result"]["status"] == "blocked"
    assert "LEGACY_GEOMETRY_VALIDATION_FAILED" in {item["code"] for item in result["adapted"]["diagnostics"]}
    assert _schema_errors(result["adapted"]) == []


def test_general_geometry_schema_itself_is_valid() -> None:
    Draft202012Validator.check_schema(SCHEMA)


def test_court_geometry_distinguishes_straight_section_and_goalpost_arcs() -> None:
    result = _run_node(r"""
const Court=require('./interface/js/court-geometry.js');
process.stdout.write(JSON.stringify({
  straightInside:Court.isInsideGoalArea(profile,[10,5.9]),
  straightOutside:Court.isInsideGoalArea(profile,[10,6.1]),
  leftArcBoundary:Court.goalAreaBoundaryY(profile,4),
  leftArcInside:Court.isInsideGoalArea(profile,[4,3.8]),
  leftArcOutside:Court.isInsideGoalArea(profile,[4,4.1]),
  rightArcBoundary:Court.goalAreaBoundaryY(profile,16),
  rightArcInside:Court.isInsideGoalArea(profile,[16,3.8]),
  rightArcOutside:Court.isInsideGoalArea(profile,[16,4.1])
}));
""")

    assert result["straightInside"] is True
    assert result["straightOutside"] is False
    assert result["leftArcBoundary"] == pytest.approx(result["rightArcBoundary"])
    assert result["leftArcInside"] is result["rightArcInside"] is True
    assert result["leftArcOutside"] is result["rightArcOutside"] is False


def test_invalid_ground_exit_inside_goal_area_is_detected() -> None:
    result = _run_node(
        f"""
const text={json.dumps(DEMO_TEXT)};
const ir=Provider.buildTacticalIR(text,[],{{case_id:'INVALID_AREA',knowledge_version:'K1'}});
const composed=Composer.compose({{tacticalIR:ir,courtProfile:profile}});
const invalid=JSON.parse(JSON.stringify(composed.geometry));
const feint=invalid.common_paths.find(path=>path.kind==='feint');
feint.segments[feint.segments.length-1].end=[10,5.5];
const report=Resolver.validateResolvedGeometry(invalid,profile,invalid.layout_policy.parameters);
process.stdout.write(JSON.stringify(report));
"""
    )

    assert result["geometry"] == "invalid"
    failed = [item for item in result["checks"] if item["status"] == "failed"]
    assert any(item["kind"] == "ground_path_physical_area" for item in failed)
    assert any(item["details"].get("nearest_point") for item in failed)


def test_feint_validation_checks_shape_and_defender_clearance() -> None:
    result = _run_node(
        f"""
const ir=Provider.buildTacticalIR({json.dumps(DEMO_TEXT)},[],{{case_id:'FEINT_SHAPE',knowledge_version:'K1'}});
const geometry=Composer.compose({{tacticalIR:ir,courtProfile:profile}}).geometry;
const check=geometry.validation.checks.find(item=>item.kind==='functional_feint');
const path=geometry.common_paths.find(item=>item.kind==='feint');
process.stdout.write(JSON.stringify({{check,path}}));
"""
    )

    assert result["check"]["status"] == "passed"
    assert result["check"]["details"]["commitment_break_distance_m"] >= 0.45
    assert result["check"]["details"]["direction_change_degrees"] >= 28
    assert result["check"]["details"]["defender_clearance_m"] >= 0.58
    points = {point["role"]: point["position"] for point in result["path"]["functional_points"]}
    assert points["commitment"] != points["direction_break"]


def test_reordering_participants_and_attacker_set_keeps_each_position() -> None:
    result = _run_node(
        f"""
const source=Provider.buildTacticalIR({json.dumps(DEMO_TEXT)},[],{{case_id:'ORDER_BASE',knowledge_version:'K1'}});
const variant=JSON.parse(JSON.stringify(source));
variant.participants.reverse();
variant.actions.find(item=>item.type==='numerical_relation').attacker_refs.reverse();
function positions(geometry){{return Object.fromEntries(geometry.participant_states.map(state=>[state.id,state.position]));}}
const base=Composer.compose({{tacticalIR:source,courtProfile:profile}});
const reordered=Composer.compose({{tacticalIR:variant,courtProfile:profile}});
process.stdout.write(JSON.stringify({{base:positions(base.geometry),reordered:positions(reordered.geometry),status:reordered.geometry_status}}));
"""
    )

    assert result["status"] == "ready"
    assert result["reordered"] == result["base"]


def test_opaque_identifier_renaming_preserves_equivalent_geometry() -> None:
    result = _run_node(r"""
function actions(ids){return [
  {id:'PASS',type:'pass',actor_ref:ids.sender,receiver_ref:ids.receiver,ball_ref:'BALL_X'},
  {id:'RECEIVE',type:'reception',actor_ref:ids.receiver,mode:'in_motion',space_ref:ids.s12,after:['PASS']},
  {id:'FEINT',type:'feint',actor_ref:ids.receiver,opponent_ref:ids.d2,initial_space_ref:ids.s12,target_space_ref:ids.s23,after:['RECEIVE']},
  {id:'RELATION',type:'numerical_relation',subtype:'2x1',attacker_refs:[ids.receiver,ids.pivot],defender_refs:[ids.d3],after:['FEINT']}
];}
const originalIds={sender:'CE_A',receiver:'L_A',pivot:'PV_A',d1:'DEF_A',d2:'DEF_B',d3:'DEF_C',s12:'SPACE_LEFT',s23:'SPACE_RIGHT'};
const renamedIds={sender:'P_91',receiver:'P_17',pivot:'P_42',d1:'Q_8',d2:'Q_3',d3:'Q_6',s12:'R_4',s23:'R_2'};
const original=Composer.compose({tacticalIR:qualitative(actions,{ids:originalIds,caseId:'ORIGINAL'}),courtProfile:profile}).geometry;
const renamed=Composer.compose({tacticalIR:qualitative(actions,{ids:renamedIds,caseId:'RENAMED'}),courtProfile:profile}).geometry;
function participantPositions(geometry,ids){
  const states=Object.fromEntries(geometry.participant_states.map(item=>[item.participant_ref,item.position]));
  return ['sender','receiver','pivot','d1','d2','d3'].map(role=>states[ids[role]]);
}
process.stdout.write(JSON.stringify({
  original:participantPositions(original,originalIds),
  renamed:participantPositions(renamed,renamedIds),
  originalPaths:original.common_paths.map(path=>path.segments),
  renamedPaths:renamed.common_paths.map(path=>path.segments)
}));
""")

    assert result["renamed"] == result["original"]
    assert result["renamedPaths"] == result["originalPaths"]


def test_a2_and_explicit_opposite_side_are_geometric_mirrors() -> None:
    opposite = (
        "El central passa al lateral. El lateral rep en carrera a l’interval 2–3, "
        "fa una finta contra D2 i surt cap a l’interval 1–2. "
        "Després juga un 2x1 amb el pivot contra D1."
    )
    result = _run_node(
        f"""
function geometry(text,id){{return Composer.compose({{tacticalIR:Provider.buildTacticalIR(text,[],{{case_id:id,knowledge_version:'K1'}}),courtProfile:profile}}).geometry;}}
function byParticipant(candidate,ref){{return candidate.participant_states.find(state=>state.participant_ref===ref && state.state_key!=='S0') || candidate.participant_states.find(state=>state.participant_ref===ref);}}
const a2=geometry({json.dumps(DEMO_TEXT)},'A2');
const a3=geometry({json.dumps(opposite)},'A3');
process.stdout.write(JSON.stringify({{
  reception2:a2.common_paths.find(path=>path.kind==='pass').segments[0].end,
  reception3:a3.common_paths.find(path=>path.kind==='pass').segments[0].end,
  exit2:a2.common_paths.find(path=>path.kind==='feint').segments.at(-1).end,
  exit3:a3.common_paths.find(path=>path.kind==='feint').segments.at(-1).end,
  pivot2:a2.entities.find(item=>item.id==='PV').position,
  pivot3:a3.entities.find(item=>item.id==='PV').position,
  status2:a2.result.status,status3:a3.result.status
}}));
"""
    )

    assert result["status2"] == result["status3"] == "ready"
    for left, right in (("reception2", "reception3"), ("exit2", "exit3"), ("pivot2", "pivot3")):
        assert result[left][0] + result[right][0] == pytest.approx(20)
        assert result[left][1] == pytest.approx(result[right][1])


def test_unconnected_two_v_one_stays_pending_instead_of_false_success() -> None:
    result = _run_node(r"""
const ir=qualitative(ids=>[
  {id:'REL_ONLY',type:'numerical_relation',subtype:'2x1',attacker_refs:[ids.receiver,ids.pivot],defender_refs:[ids.d3]}
]);
const composed=Composer.compose({tacticalIR:ir,courtProfile:profile});
process.stdout.write(JSON.stringify({status:composed.geometry_status,geometry:composed.geometry}));
""")

    assert result["status"] == "partial"
    assert result["geometry"]["validation"]["geometry"] == "pending"
    assert "GEOMETRY_VALIDATION_PENDING" in {item["code"] for item in result["geometry"]["diagnostics"]}


def test_committed_general_geometry_examples_are_valid_and_rendered() -> None:
    examples = ROOT / "examples/general-geometry"
    geometries = sorted(examples.glob("*.geometry.json"))

    assert [item.name for item in geometries] == [
        "a1-pass-reception.geometry.json",
        "a2-reception-feint-2x1.geometry.json",
        "a3-opposite-side.geometry.json",
    ]
    for geometry_file in geometries:
        geometry = json.loads(geometry_file.read_text(encoding="utf-8"))
        svg = geometry_file.with_name(geometry_file.name.replace(".geometry.json", ".svg")).read_text(encoding="utf-8")
        assert _schema_errors(geometry) == []
        assert geometry["result"]["obligations_pending"] == 0
        assert 'xmlns="http://www.w3.org/2000/svg"' in svg
        assert "exercise-path" in svg
        assert f'Representació editable de {geometry["meta"]["case_id"]}' in svg

    a2_svg = (examples / "a2-reception-feint-2x1.svg").read_text(encoding="utf-8")
    a2_geometry = json.loads((examples / "a2-reception-feint-2x1.geometry.json").read_text(encoding="utf-8"))
    assert a2_svg.count('data-ball-ref="B1"') == 1
    assert 'class="contextual-reference-node"' in a2_svg
    assert 'data-active-participant="false"' in a2_svg
    assert len(a2_geometry["relations"][0]["participants"]) == 3
    assert not any(entity["id"] == "D1" for entity in a2_geometry["entities"])
