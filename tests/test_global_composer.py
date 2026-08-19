from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

from scripts.composer_coverage import report as composer_coverage_report


ROOT = Path(__file__).resolve().parents[1]
LOCAL_NODE = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"


def _node() -> str:
    executable = shutil.which("node")
    if executable:
        return executable
    if LOCAL_NODE.is_file():
        return str(LOCAL_NODE)
    pytest.skip("Node no està disponible")


def _run_node(body: str) -> dict:
    prelude = r"""
const Composer=require('./interface/js/representation-composer.js');
const profile={court:{width_m:20,half_length_m:20},goal:{width_m:3,height_m:2},markings:{goal_area_radius_m:6,free_throw_distance_m:9,free_throw_segment_m:.15,free_throw_gap_m:.15,penalty_line_length_m:1,goalkeeper_line_length_m:.15,penalty_line_distance_m:7,goalkeeper_line_distance_m:4}};
const provenance={authority:'coach_explicit_input',status:'explicit',source_refs:['coach_input:test']};
function participant(id, team, position, role){return {id,label:id,team,kind:team==='defense'?'defender':'attacker',role:role||null,position,...provenance};}
function base(actions, overrides={}){return {meta:{format:'TRACA_tactical_ir',version:'0.1.0',case_id:'TEST',source_revision:'R1',knowledge_version:'K1'},participants:[participant('A1','attack',[5,12]),participant('A2','attack',[10,12]),participant('PV','attack',[12,7],'pivot'),participant('D1','defense',[4,7]),participant('D2','defense',[8,7]),participant('D3','defense',[12,7]),participant('D4','defense',[16,7])],participant_states:[],balls:[{id:'B1',holder_ref:'A1',...provenance}],materials:[],spaces:[{id:'S12',label:'1-2',delimiter_refs:['D1','D2'],authority:'canonical_spatial',status:'validated',source_refs:['space:test']},{id:'S23',label:'2-3',delimiter_refs:['D2','D3'],authority:'canonical_spatial',status:'validated',source_refs:['space:test']},{id:'S34',label:'3-4',delimiter_refs:['D3','D4'],authority:'canonical_spatial',status:'validated',source_refs:['space:test']}],actions:actions.map(a=>({...provenance,...a})),decisions:[],phases:[],ball_flow:[],relations:[],...overrides};}
"""
    completed = subprocess.run([_node(), "-e", prelude + body], cwd=ROOT, check=True, capture_output=True, text=True)
    return json.loads(completed.stdout)


@pytest.mark.parametrize(
    ("action", "operator", "primitive"),
    [
        ({"id": "A", "type": "movement", "actor_ref": "A1", "to_position": [6, 10]}, "movement", "movement_path"),
        ({"id": "A", "type": "dribble", "actor_ref": "A1", "to_position": [6, 10], "ball_ref": "B1"}, "dribble", "dribble_path"),
        ({"id": "A", "type": "pass", "actor_ref": "A1", "receiver_ref": "A2", "ball_ref": "B1"}, "pass", "pass_path"),
        ({"id": "A", "type": "reception", "actor_ref": "A2", "mode": "stationary"}, "reception", None),
        ({"id": "A", "type": "shot", "actor_ref": "A1", "ball_ref": "B1"}, "shot", "shot_path"),
        ({"id": "A", "type": "feint", "actor_ref": "A1", "opponent_ref": "D2", "initial_space_ref": "S12", "target_space_ref": "S23", "to_position": [9, 6], "waypoints": [[7, 9], [8, 8]]}, "feint", "feint_path"),
        ({"id": "A", "type": "block", "actor_ref": "PV", "blocked_defender_ref": "D3"}, "block", "blocking_mark"),
        ({"id": "A", "type": "numerical_relation", "subtype": "2x1", "attacker_refs": ["A1", "A2"], "defender_refs": ["D1"]}, "numerical_relation", None),
        ({"id": "A", "type": "permutation", "participant_refs": ["A1", "A2"]}, "permutation", "movement_path"),
        ({"id": "A", "type": "crossing", "actor_refs": ["A1", "A2"], "initial_attack_relation": "S12", "target_space_ref": "S23"}, "crossing", "movement_path"),
        ({"id": "A", "type": "pivot_slide", "actor_ref": "PV", "to_position": [13, 7]}, "pivot_slide", "movement_path"),
    ],
)
def test_each_base_operator_composes_without_exercise_specific_code(action: dict, operator: str, primitive: str | None) -> None:
    result = _run_node(
        f"""
const result=Composer.compose({{tacticalIR:base({json.dumps([action])}),courtProfile:profile}});
process.stdout.write(JSON.stringify({{status:result.composition_status,geometry:result.geometry_status,operator:result.plan.actions[0].operator_id,actionStatus:result.plan.actions[0].status,primitives:result.plan.visual_primitives.map(x=>x.type),dedicatedGlyph:result.plan.actions[0].dedicated_glyph}}));
"""
    )
    assert result["status"] == "ready"
    assert result["operator"] == operator
    assert result["actionStatus"] == "composed"
    if primitive:
        assert primitive in result["primitives"]
    if operator == "numerical_relation":
        assert result["dedicatedGlyph"] is False


def test_pass_reception_feint_and_2x1_share_identity_state_and_ball_flow() -> None:
    result = _run_node(r"""
const actions=[
 {id:'P',type:'pass',actor_ref:'A1',receiver_ref:'A2',ball_ref:'B1'},
 {id:'R',type:'reception',actor_ref:'A2',mode:'in_motion',position:[9,10],after:['P']},
 {id:'F',type:'feint',actor_ref:'A2',opponent_ref:'D2',initial_space_ref:'S12',target_space_ref:'S23',to_position:[9,6],waypoints:[[8,9],[8.5,8]],after:['R']},
 {id:'N',type:'numerical_relation',subtype:'2x1',attacker_refs:['A2','PV'],defender_refs:['D3'],after:['F']}
];
const result=Composer.compose({tacticalIR:base(actions),courtProfile:profile});
const pass=result.plan.actions.find(x=>x.id==='P'), reception=result.plan.actions.find(x=>x.id==='R'), feint=result.plan.actions.find(x=>x.id==='F');
process.stdout.write(JSON.stringify({status:result.composition_status,coverage:result.coverage,passTarget:pass.to_state_ref,receptionState:reception.state_ref,feintStart:feint.from_state_ref,holder:result.plan.ball_flow.states.at(-1).holder_ref,transitions:result.plan.ball_flow.transitions.length,numerical:result.plan.actions.find(x=>x.id==='N')}));
""")
    assert result["status"] == "ready"
    assert result["coverage"]["label"] == "4/4"
    assert result["passTarget"] == result["receptionState"] == result["feintStart"]
    assert result["holder"] == "A2"
    assert result["transitions"] == 1
    assert result["numerical"]["attacker_refs"] == ["A2", "PV"]


def test_missing_slots_become_prioritized_questions_and_multiple_answers_are_arrays() -> None:
    result = _run_node(r"""
const tacticalIR=base([{id:'N',type:'numerical_relation',subtype:'2x1'},{id:'M',type:'movement',after:['N']}]);
const first=Composer.compose({tacticalIR,courtProfile:profile});
const second=Composer.compose({tacticalIR,courtProfile:profile,answers:{'N:attacker_refs':['A1','A2'],'N:defender_refs':['D1'],'M:actor_ref':'PV'}});
process.stdout.write(JSON.stringify({firstStatus:first.composition_status,questionIds:first.questions.map(x=>x.id),questionCounts:first.questions.map(x=>x.required_count),unlocks:first.questions.map(x=>x.unlock_count),secondStatus:second.composition_status,attackers:second.plan.actions[0].attacker_refs}));
""")
    assert result["firstStatus"] == "needs_input"
    assert result["questionIds"][:2] == ["N:attacker_refs", "N:defender_refs"]
    assert result["questionCounts"][:2] == [2, 1]
    assert result["unlocks"] == sorted(result["unlocks"], reverse=True)
    assert result["secondStatus"] == "ready"
    assert result["attackers"] == ["A1", "A2"]


def test_only_validated_knowledge_can_fill_a_required_slot() -> None:
    result = _run_node(r"""
const tacticalIR=base([{id:'M',type:'movement'}]);
const candidate={id:'K-C',slot:'actor_ref',value:'A1',authority:'candidate',status:'candidate',source_refs:['candidate:test']};
const validated={id:'K-V',slot:'actor_ref',value:'A1',authority:'validated_local_knowledge',status:'validated',source_refs:['coach:test']};
const one=Composer.compose({tacticalIR,knowledgeFacts:[candidate],courtProfile:profile});
const two=Composer.compose({tacticalIR,knowledgeFacts:[validated],courtProfile:profile});
process.stdout.write(JSON.stringify({candidateStatus:one.composition_status,suggestion:one.questions[0].suggested_answer,validatedStatus:two.composition_status,applied:two.plan.applied_knowledge.map(x=>x.id)}));
""")
    assert result["candidateStatus"] == "needs_input"
    assert result["suggestion"]["authority"] == "candidate"
    assert result["validatedStatus"] == "ready"
    assert result["applied"] == ["K-V"]


def test_contradictory_spaces_ball_holder_and_material_equivalence_block_composition() -> None:
    result = _run_node(r"""
const badFeint=Composer.compose({tacticalIR:base([{id:'F',type:'feint',actor_ref:'A1',opponent_ref:'D2',initial_space_ref:'S12',target_space_ref:'S34'}]),courtProfile:profile});
const badBall=Composer.compose({tacticalIR:base([{id:'P',type:'pass',actor_ref:'A1',receiver_ref:'A2',ball_ref:'B1'}],{balls:[{id:'B1',holder_ref:'A2',...provenance}]}),courtProfile:profile});
const material={id:'C1',kind:'cone',function:'passive_marker',authority:'coach_explicit_input',status:'explicit',source_refs:['coach:test']};
const badMaterial=Composer.compose({tacticalIR:base([{id:'B',type:'block',actor_ref:'PV',blocked_defender_ref:'C1'}],{materials:[material]}),courtProfile:profile});
const goodMaterial=Composer.compose({tacticalIR:base([{id:'B',type:'block',actor_ref:'PV',blocked_defender_ref:'C1'}],{materials:[{...material,opponent_equivalence:true}]}),courtProfile:profile});
process.stdout.write(JSON.stringify({feint:badFeint.composition_status,feintCodes:badFeint.preflight.diagnostics.map(x=>x.code),ball:badBall.composition_status,ballCodes:badBall.preflight.diagnostics.map(x=>x.code),material:badMaterial.composition_status,materialCodes:badMaterial.preflight.diagnostics.map(x=>x.code),goodMaterial:goodMaterial.composition_status}));
""")
    assert result["feint"] == "blocked"
    assert "FINTA_SPACES_NOT_CONTIGUOUS" in result["feintCodes"]
    assert result["ball"] == "blocked"
    assert "BALL_HOLDER_CONFLICT" in result["ballCodes"]
    assert result["material"] == "blocked"
    assert "MATERIAL_OPPONENT_EQUIVALENCE_MISSING" in result["materialCodes"]
    assert result["goodMaterial"] == "ready"


def test_geometry_is_only_resolved_from_explicit_or_relational_positions() -> None:
    result = _run_node(r"""
const noPositions=base([{id:'M',type:'movement',actor_ref:'A1',target_space_ref:'S12'}]);
noPositions.participants=noPositions.participants.map(({position,...item})=>item);
const unresolved=Composer.compose({tacticalIR:noPositions,courtProfile:profile});
const explicit=Composer.compose({tacticalIR:base([{id:'M',type:'movement',actor_ref:'A1',to_position:[7,9]}]),courtProfile:profile});
process.stdout.write(JSON.stringify({composition:unresolved.composition_status,geometry:unresolved.geometry_status,hasGeometry:Boolean(unresolved.geometry),explicitGeometry:explicit.geometry_status,path:explicit.geometry.common_paths[0].segments[0]}));
""")
    assert result == {
        "composition": "ready",
        "geometry": "needs_input",
        "hasGeometry": False,
        "explicitGeometry": "ready",
        "path": {"type": "line", "start": [5, 12], "end": [7, 9]},
    }


def test_same_input_is_deterministic_across_one_hundred_runs() -> None:
    result = _run_node(r"""
const tacticalIR=base([{id:'P',type:'pass',actor_ref:'A1',receiver_ref:'A2',ball_ref:'B1'}]);
const fingerprints=Array.from({length:100},()=>Composer.compose({tacticalIR,courtProfile:profile}).plan.meta.fingerprint);
process.stdout.write(JSON.stringify({unique:new Set(fingerprints).size,fingerprint:fingerprints[0]}));
""")
    assert result["unique"] == 1
    assert result["fingerprint"]


def test_partial_coverage_and_same_sender_receiver_are_reported_honestly() -> None:
    result = _run_node(r"""
const partial=Composer.compose({tacticalIR:base([{id:'M',type:'movement',actor_ref:'A1',to_position:[6,10]},{id:'X',type:'unknown_collective_action',after:['M']}]),courtProfile:profile});
const invalid=Composer.compose({tacticalIR:base([{id:'P',type:'pass',actor_ref:'A1',receiver_ref:'A1',ball_ref:'B1'}]),courtProfile:profile});
process.stdout.write(JSON.stringify({partialStatus:partial.composition_status,coverage:partial.coverage,invalidStatus:invalid.composition_status,reason:invalid.plan.actions[0].reason}));
""")
    assert result["partialStatus"] == "partial"
    assert result["coverage"] == {
        "actions_total": 2,
        "actions_composed": 1,
        "actions_unresolved": 0,
        "actions_unsupported": 1,
        "ratio": 0.5,
        "label": "1/2",
    }
    assert result["invalidStatus"] == "blocked"
    assert result["reason"] == "L’emissor i el receptor han de ser diferents."


def test_composer_modules_do_not_hardcode_exercise_ids_or_parse_free_text() -> None:
    modules = [
        ROOT / "interface/js/representation-composer.js",
        ROOT / "interface/js/clarification-orchestrator.js",
        ROOT / "interface/js/composition-operators.js",
        ROOT / "interface/js/generic-geometry-resolver.js",
    ]
    source = "\n".join(path.read_text(encoding="utf-8") for path in modules)
    assert "TR-UVOF" not in source
    assert ".description" not in source
    assert "match(" not in source
    assert "matchAll(" not in source


def test_visual_inventory_and_graphic_legend_are_fully_auditable() -> None:
    dictionary = json.loads((ROOT / "knowledge/visual-functional-dictionary.v0.1.json").read_text(encoding="utf-8"))
    inventory = [item for item in dictionary["evidence"] if item["source_ref"] == "SRC_INVENTORY_REPRESENTATIONS_V0_1"]
    legend = [item for item in dictionary["evidence"] if item["source_ref"] == "SRC_COACH_GRAPHIC_LEGEND"]
    counts: dict[str, int] = {}
    for item in inventory:
        counts[item["classification"]] = counts.get(item["classification"], 0) + 1
    assert len(inventory) == len({item["id"] for item in inventory}) == 103
    assert counts == {
        "confirmada_per_ambdós": 10,
        "confirmada_per_entrenador": 16,
        "observació_repetida": 30,
        "candidat": 13,
        "ambigua": 26,
        "superada": 8,
    }
    assert len(legend) == 13
    assert dictionary["meta"]["imported_inventory_evidence_count"] == 103


def test_tactical_ir_and_composition_plan_match_their_public_schemas() -> None:
    result = _run_node(r"""
const tacticalIR=base([{id:'P',type:'pass',actor_ref:'A1',receiver_ref:'A2',ball_ref:'B1'}]);
const result=Composer.compose({tacticalIR,courtProfile:profile});
process.stdout.write(JSON.stringify({tacticalIR,plan:result.plan}));
""")
    schema_dir = ROOT / "schema"
    tactical_schema = json.loads((schema_dir / "traca.tactical-ir.schema.v0.1.json").read_text(encoding="utf-8"))
    plan_schema = json.loads((schema_dir / "traca.composition-plan.schema.v0.1.json").read_text(encoding="utf-8"))
    assert list(Draft202012Validator(tactical_schema).iter_errors(result["tacticalIR"])) == []
    assert list(Draft202012Validator(plan_schema).iter_errors(result["plan"])) == []


def test_uvof_corpus_is_measured_as_an_acceptance_suite_without_geometry_templates() -> None:
    coverage = composer_coverage_report()
    assert coverage["totals"] == {
        "exercises": 15,
        "semantic_units": 203,
        "recognized_units": 175,
        "recognized_ratio": 0.8621,
        "relations_sufficient": 164,
        "composition_ratio": 0.8079,
        "generic_geometry_ready": 0,
    }
    assert [item["exercise_id"] for item in coverage["exercises"]] == [f"TR-UVOF-{index:03d}" for index in range(1, 16)]
    first = coverage["exercises"][0]
    assert first["operators"] == ["feint", "movement", "numerical_relation", "pass", "reception"]
    assert first["composition_coverage"] == 0.8


def test_critical_uvof_domain_regressions_remain_intact() -> None:
    corpus = json.loads((ROOT / "corpus/uvof.semantic.json").read_text(encoding="utf-8"))
    exercises = {item["id"]: item for item in corpus["exercicis"]}
    uvof001 = exercises["TR-UVOF-001"]
    sa2 = next(phase for phase in uvof001["fases"] if phase["id"] == "SA2")
    assert all("finta" not in action["accio"] for action in sa2["accions"])
    assert any("rebre_orientat_sense_bot" == action["accio"] for action in sa2["accions"])

    uvof010 = exercises["TR-UVOF-010"]
    assert any("lliscar_des_del_con_cap_a_lespai_lliure_si_D3_puja" == action["accio"] for phase in uvof010["fases"] for action in phase["accions"])

    uvof011 = exercises["TR-UVOF-011"]
    defenders = [participant["id"] for participant in uvof011["participants"] if participant["equip"] == "defensa"]
    assert len(defenders) == 4
    assert "DEF_4" not in defenders

    geometry = json.loads((ROOT / "exercises/TR-UVOF-015/geometry.json").read_text(encoding="utf-8"))
    assert len(geometry["zones"]) == 3
    assert len(geometry["spaces"]) == 6
    assert len(geometry["entities"]) == 16
    assert len(geometry["branches"]) == 3
    assert sum(len(branch["alternatives"]) for branch in geometry["branches"]) == 12


def test_v05_package_preserves_the_composition_plan_and_fingerprint() -> None:
    result = _run_node(r"""
const Store=require('./interface/js/store.js');
const Visual=require('./interface/js/visual-grammar.js');
const IO=require('./interface/js/import-export.js');
const tacticalIR=base([{id:'P',type:'pass',actor_ref:'A1',receiver_ref:'A2',ball_ref:'B1'}]);
const composed=Composer.compose({tacticalIR,courtProfile:profile});
const store=Store.createWorkspaceStore({initialCase:{id:'CASE',name:'Case',description:'A1 passa a A2',source_refs:['coach_input:test']},visualGrammar:Visual.createVisualGrammar()});
store.setCompositionResult(composed,'global_composer');
const payload=IO.exportPackage(store.snapshot(),()=> '2026-08-11T00:00:00.000Z');
const second=Store.createWorkspaceStore({initialCase:{id:'NEW',name:'New',description:''},visualGrammar:Visual.createVisualGrammar()});
second.restorePackage(IO.parsePackage(JSON.stringify(payload)));
process.stdout.write(JSON.stringify({version:payload.version,valid:IO.validatePackage(payload).valid,before:payload.composition.plan.meta.fingerprint,after:second.snapshot().composition.plan.meta.fingerprint,status:second.snapshot().composition.composition_status}));
""")
    assert result["version"] == "0.5.0"
    assert result["valid"] is True
    assert result["before"] == result["after"]
    assert result["status"] == "ready"
