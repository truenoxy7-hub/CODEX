from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[1]
LOCAL_NODE = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
SCHEMA = json.loads((ROOT / "schema/traca.geometry.schema.v0.3.json").read_text(encoding="utf-8"))
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
    assert [point["role"] for point in paths["feint"]["functional_points"]] == ["commitment", "direction_break", "exit"]
    assert relation["attacker_refs"] == ["L", "PV"]
    assert relation["defender_refs"] == ["D3"]
    assert not any(path["kind"] in {"shot", "return_pass"} for path in geometry["common_paths"])
    assert geometry["result"] == {
        "status": "ready",
        "obligations_total": 6,
        "obligations_resolved": 6,
        "obligations_pending": 0,
        "incompatible_count": 0,
    }
    assert _schema_errors(geometry) == []


@pytest.mark.parametrize("reverse", [False, True])
def test_a3_identifier_and_side_variants_use_relations_not_templates(reverse: bool) -> None:
    result = _run_node(
        f"""
const ir=qualitative(ids=>[
  {{id:'P_CUSTOM',type:'pass',actor_ref:ids.sender,receiver_ref:ids.receiver,ball_ref:'BALL_X'}},
  {{id:'R_CUSTOM',type:'reception',actor_ref:ids.receiver,mode:'in_motion',space_ref:ids.s12,after:['P_CUSTOM']}},
  {{id:'F_CUSTOM',type:'feint',actor_ref:ids.receiver,opponent_ref:ids.d2,initial_space_ref:ids.s12,target_space_ref:ids.s23,after:['R_CUSTOM']}},
  {{id:'N_CUSTOM',type:'numerical_relation',subtype:'2x1',attacker_refs:[ids.receiver,ids.pivot],defender_refs:[ids.d3],after:['F_CUSTOM']}}
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


def test_legacy_uvof015_adapter_preserves_regression_and_matches_general_schema() -> None:
    result = _run_node(r"""
const legacy=require('./exercises/TR-UVOF-015/geometry.json');
const adapted=Resolver.adaptLegacyGeometry(legacy);
process.stdout.write(JSON.stringify({adapted,branches:adapted.branches.length,alternatives:adapted.branches.reduce((total,branch)=>total+branch.alternatives.length,0)}));
""")

    assert result["adapted"]["meta"]["adapted_from"]["version"] == "0.2.0"
    assert result["branches"] == 3
    assert result["alternatives"] == 12
    assert _schema_errors(result["adapted"]) == []


def test_general_geometry_schema_itself_is_valid() -> None:
    Draft202012Validator.check_schema(SCHEMA)


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
