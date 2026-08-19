from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
LOCAL_NODE = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
MAIN_CASE = "El central ataca l’interval 1–2. El lateral fa un encreuament amb el central per atacar l’interval 2–3."


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
const UI=require('./interface/js/inspection-ui.js');
function composeText(text,answers={}) {
  const ir=Provider.buildTacticalIR(text,[],{case_id:'CROSSING'});
  return {ir,result:Composer.compose({tacticalIR:ir,answers})};
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


def test_main_crossing_recovers_functional_roles_and_actor_scoped_context() -> None:
    result = _run_node(
        f"""
const value=composeText({json.dumps(MAIN_CASE)});
const action=value.ir.actions[0];
const attack=value.ir.relations.find(item=>item.type==='attacks_space');
process.stdout.write(JSON.stringify({{
  participants:value.ir.participants.filter(item=>['CE','L'].includes(item.id)).map(item=>item.id),
  spaces:value.ir.spaces.map(item=>item.id), action, attack,
  questions:value.result.questions, coverage:value.result.coverage,
  composition:value.result.composition_status, geometry:value.result.geometry_status,
  plan:value.result.plan.actions[0]
}}));
"""
    )
    action = result["action"]
    assert result["participants"] == ["CE", "L"]
    assert set(result["spaces"]) == {"INT_12", "INT_23"}
    assert action["first_actor_ref"] == "CE"
    assert action["crossing_actor_ref"] == "L"
    assert action["actor_refs"] == ["CE", "L"]
    assert action["crosses_relative_to"] == "CE"
    assert action["initial_attack_relation"] == "INT_12"
    assert action["target_space_ref"] == "INT_23"
    assert action["slot_authority"]["initial_attack_relation"] == "derived_from_validated_rule"
    assert result["attack"]["actor_ref"] == "CE"
    assert result["attack"]["space_ref"] == "INT_12"
    assert result["attack"]["before_action_ref"] == action["id"]
    assert result["questions"] == []
    assert result["coverage"]["label"] == "1/1"
    assert result["composition"] == "ready"
    assert result["geometry"] == "needs_input"
    assert result["plan"]["first_actor_ref"] == "CE"
    assert result["plan"]["crossing_actor_ref"] == "L"


def test_subordinate_text_order_has_same_functional_meaning() -> None:
    text = "El lateral fa un encreuament amb el central després que el central ataqui l’interval 1–2, per atacar l’interval 2–3."
    result = _run_node(
        f"""
const value=composeText({json.dumps(text)});process.stdout.write(JSON.stringify({{action:value.ir.actions[0],status:value.result.composition_status,questions:value.result.questions}}));
"""
    )
    assert result["action"]["first_actor_ref"] == "CE"
    assert result["action"]["crossing_actor_ref"] == "L"
    assert result["action"]["initial_attack_relation"] == "INT_12"
    assert result["action"]["target_space_ref"] == "INT_23"
    assert result["status"] == "ready"
    assert result["questions"] == []


@pytest.mark.parametrize(
    ("text", "initial", "target", "question_slots"),
    [
        ("El lateral fa un encreuament amb el central.", None, None, ["initial_attack_relation", "target_space_ref"]),
        ("El lateral fa un encreuament amb el central per atacar l’interval 2–3.", None, "INT_23", ["initial_attack_relation"]),
        ("El central ataca l’interval 1–2. El lateral fa un encreuament amb el central.", "INT_12", None, ["target_space_ref"]),
    ],
)
def test_incomplete_crossing_only_asks_for_missing_spaces(
    text: str, initial: str | None, target: str | None, question_slots: list[str]
) -> None:
    result = _run_node(
        f"""
const value=composeText({json.dumps(text)});const action=value.ir.actions[0];process.stdout.write(JSON.stringify({{
  first:action.first_actor_ref,crossing:action.crossing_actor_ref,initial:action.initial_attack_relation||null,target:action.target_space_ref||null,
  slots:value.result.questions.map(item=>item.slot),active:value.result.active_question&&value.result.active_question.slot,
  states:value.result.questions.map(item=>item.orchestration_status)
}}));
"""
    )
    assert result["first"] == "CE"
    assert result["crossing"] == "L"
    assert result["initial"] == initial
    assert result["target"] == target
    assert result["slots"] == question_slots
    assert result["active"] == question_slots[0]
    if len(question_slots) == 2:
        assert result["states"] == ["available", "waiting_dependency"]


def test_context_lookup_uses_referenced_actor_not_global_latest_attack() -> None:
    text = "El central ataca l’interval 1–2. L’extrem ataca l’interval 2–3. El lateral fa un encreuament amb el central."
    result = _run_node(
        f"""
const value=composeText({json.dumps(text)});const action=value.ir.actions[0];process.stdout.write(JSON.stringify({{initial:action.initial_attack_relation,context:action.context_relation_ref,relations:value.ir.relations.filter(item=>item.type==='attacks_space'),active:value.result.active_question.slot}}));
"""
    )
    assert result["initial"] == "INT_12"
    assert next(item for item in result["relations"] if item["id"] == result["context"])["actor_ref"] == "CE"
    assert result["active"] == "target_space_ref"


def test_explicit_movement_invalidates_prior_attack_context() -> None:
    text = "El central ataca l’interval 1–2. El central es mou cap a l’interval 2–3. El lateral fa un encreuament amb el central per atacar l’interval 2–3."
    result = _run_node(
        f"""
const value=composeText({json.dumps(text)});const action=value.ir.actions[0];process.stdout.write(JSON.stringify({{initial:action.initial_attack_relation||null,resolution:action.context_resolution,active:value.result.active_question.slot}}));
"""
    )
    assert result["initial"] is None
    assert result["resolution"]["status"] == "invalidated"
    assert result["active"] == "initial_attack_relation"


def test_conflicting_explicit_initial_space_is_preserved_and_blocks() -> None:
    text = "El central ataca l’interval 1–2. El lateral fa un encreuament amb el central des de l’interval 2–3 per atacar l’interval 3–3."
    result = _run_node(
        f"""
const value=composeText({json.dumps(text)});const action=value.ir.actions[0];process.stdout.write(JSON.stringify({{initial:action.initial_attack_relation,conflicts:action.context_conflicts,status:value.result.composition_status,codes:value.result.preflight.diagnostics.map(item=>item.code)}}));
"""
    )
    assert result["initial"] == "INT_23"
    assert result["conflicts"][0]["contextual_space_ref"] == "INT_12"
    assert result["conflicts"][0]["source_refs"]
    assert result["status"] == "blocked"
    assert "COMPOSITION_OPERATOR_CONFLICT" in result["codes"]


def test_progressive_answers_resolve_initial_then_target_without_invention() -> None:
    text = "El lateral fa un encreuament amb el central."
    result = _run_node(
        f"""
const first=composeText({json.dumps(text)});const revision=first.ir.meta.source_revision;
const second=Composer.compose({{tacticalIR:first.ir,answers:{{'A001:initial_attack_relation':{{value:'INT_12',source_revision:revision}}}}}});
const third=Composer.compose({{tacticalIR:first.ir,answers:{{'A001:initial_attack_relation':{{value:'INT_12',source_revision:revision}},'A001:target_space_ref':{{value:'INT_23',source_revision:revision}}}}}});
process.stdout.write(JSON.stringify({{first:first.result.active_question.slot,second:second.active_question.slot,secondTarget:second.tactical_ir.actions[0].target_space_ref||null,thirdStatus:third.composition_status,thirdQuestions:third.questions,actors:third.plan.actions[0].actor_refs}}));
"""
    )
    assert result == {
        "first": "initial_attack_relation",
        "second": "target_space_ref",
        "secondTarget": None,
        "thirdStatus": "ready",
        "thirdQuestions": [],
        "actors": ["CE", "L"],
    }


def test_crossing_diagnostic_projects_functional_roles_and_spaces() -> None:
    result = _run_node(
        f"""
const value=composeText({json.dumps(MAIN_CASE)});const diagnostics=UI.diagnosticsFor({{composition:value.result}});process.stdout.write(JSON.stringify(diagnostics.actions[0]));
"""
    )
    assert result["initialSpace"] == ["INT_12"]
    assert result["finalSpace"] == ["INT_23"]
    assert result["crossing"] == {
        "firstActor": "CE",
        "initialAttack": "INT_12",
        "crossingActor": "L",
        "relativeTo": "CE",
        "targetSpace": "INT_23",
    }


def test_required_regressions_keep_their_semantic_results() -> None:
    cases = {
        "one": "El central passa al lateral. El lateral rep en carrera a l’interval 1–2, fa una finta contra D2 i surt cap a l’interval 2–3. Després juga un 2x1 amb el pivot contra D3.",
        "three": "El central passa al lateral. Després el pivot passa a l’extrem.",
        "four": "L’extrem passa al central. Després el central i el lateral fan una permuta central-lateral.",
    }
    result = _run_node(
        f"""
const texts={json.dumps(cases)};const output={{}};for(const [key,text] of Object.entries(texts)){{const value=composeText(text);output[key]={{coverage:value.result.coverage.label,status:value.result.composition_status,geometry:value.result.geometry_status,questions:value.result.questions.length,actions:value.result.plan.actions}};}}process.stdout.write(JSON.stringify(output));
"""
    )
    assert result["one"] == {
        "coverage": "4/4", "status": "ready", "geometry": "needs_input", "questions": 0,
        "actions": result["one"]["actions"],
    }
    assert result["three"]["coverage"] == "2/2"
    assert result["three"]["status"] == "blocked"
    assert result["four"]["coverage"] == "2/2"
    assert result["four"]["status"] == "ready"
    assert result["four"]["geometry"] == "needs_input"
    permutation = next(item for item in result["four"]["actions"] if item["semantic_type"] == "permutation")
    assert permutation["participant_refs"] == ["CE", "L"]
    assert permutation["ball_flow_independent"] is True


def test_regression_ambiguous_feint_flow_still_reaches_ready() -> None:
    text = "El lateral fa una finta i després juga un 2x1 amb el pivot."
    result = _run_node(
        f"""
const value=composeText({json.dumps(text)});const revision=value.ir.meta.source_revision;
const answers={{
 'A001:opponent_ref':{{value:'D2',source_revision:revision}},
 'A001:initial_space_ref':{{value:'INT_12',source_revision:revision}},
 'A002:defender_refs':{{value:['D3'],source_revision:revision}}
}};
const complete=Composer.compose({{tacticalIR:value.ir,answers}});process.stdout.write(JSON.stringify({{derived:complete.auto_derivations,status:complete.composition_status,coverage:complete.coverage,questions:complete.questions}}));
"""
    )
    assert result["derived"][0]["value"] == "INT_23"
    assert result["status"] == "ready"
    assert result["coverage"]["label"] == "2/2"
    assert result["questions"] == []
