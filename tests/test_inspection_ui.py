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


def test_mobile_tabs_unhide_and_activate_advanced_and_data_panels() -> None:
    result = _run_node(r"""
const UI=require('./interface/js/inspection-ui.js');
function classList(initial=[]) {
  const values=new Set(initial);
  return {
    contains:value=>values.has(value),
    toggle:(value,force)=>{const next=force===undefined?!values.has(value):Boolean(force);if(next)values.add(value);else values.delete(value);return next;}
  };
}
function element(dataset={},classes=[],hidden=false) {
  const listeners={};
  return {
    dataset,hidden,classList:classList(classes),textContent:'',attributes:{},
    setAttribute(name,value){this.attributes[name]=value;},
    addEventListener(name,handler){listeners[name]=handler;},
    click(){listeners.click();}
  };
}
const panels=['flow','court','inspector','dock'].map(name=>element({panel:name},[
  ...(['flow','court'].includes(name)?['is-mobile-active']:[]),
  ...(['inspector','dock'].includes(name)?['advanced-zone']:[])
],['inspector','dock'].includes(name)));
const tabs=['flow','court','inspector','dock'].map(name=>element({mobilePanel:name},name==='court'?['is-active']:[]));
const body=element();const toggle=element();
const controller=UI.createPanelController({body,toggle,tabs,panels,fallbackPanel:'court'});
tabs[2].click();
const advanced={
  hidden:panels[2].hidden,
  active:panels[2].classList.contains('is-mobile-active'),
  body:body.classList.contains('is-advanced')
};
tabs[3].click();
const data={
  hidden:panels[3].hidden,
  active:panels[3].classList.contains('is-mobile-active'),
  advancedActive:panels[2].classList.contains('is-mobile-active')
};
toggle.click();
const closed={
  inspectorHidden:panels[2].hidden,
  dockHidden:panels[3].hidden,
  fallbackActive:panels[1].classList.contains('is-mobile-active'),
  state:controller.state()
};
process.stdout.write(JSON.stringify({advanced,data,closed}));
""")

    assert result["advanced"] == {"hidden": False, "active": True, "body": True}
    assert result["data"] == {"hidden": False, "active": True, "advancedActive": False}
    assert result["closed"] == {
        "inspectorHidden": True,
        "dockHidden": True,
        "fallbackActive": True,
        "state": {"activePanel": "court", "advancedOpen": False},
    }


def test_diagnostics_expose_current_tactical_ir_plan_and_store_sections() -> None:
    result = _run_node(r"""
const UI=require('./interface/js/inspection-ui.js');
const Store=require('./interface/js/store.js');
const Visual=require('./interface/js/visual-grammar.js');
const tacticalIR={
  meta:{format:'TRACA_tactical_ir',version:'0.1.0',source_revision:'REV-CURRENT'},
  participants:[],participant_states:[],balls:[],materials:[],spaces:[],decisions:[],phases:[],ball_flow:[],relations:[],
  actions:[{id:'ACTION-REAL',type:'feint',actor_ref:'L',opponent_ref:'D2',initial_space_ref:'INT_12',target_space_ref:'INT_23',authority:'coach_explicit_input',source_refs:['coach_input:test']}]
};
const action={id:'ACTION-REAL',semantic_type:'feint',actor_ref:'L',opponent_ref:'D2',initial_space_ref:'INT_12',target_space_ref:'INT_23',from_state_ref:'STATE-L-0',to_state_ref:'STATE-L-1',authority:'coach_explicit_input',status:'composed'};
const plan={
  meta:{fingerprint:'PLAN-REAL'},actions:[action],constraints:[{id:'CONSTRAINT-REAL'}],constraint_conflicts:[],
  questions:[{id:'QUESTION-REAL'}],missing_slots:[{action_ref:'ACTION-REAL',slot:'partner_ref'}],
  ball_flow:{states:[{id:'BALL-REAL'}],transitions:[]},coverage:{actions_total:1,actions_composed:1,actions_unresolved:0,actions_unsupported:0,ratio:1,label:'1/1'},
  composition_status:'ready',geometry_status:'needs_input'
};
const store=Store.createWorkspaceStore({initialCase:{id:'CASE',name:'Case',description:'text actual',source_refs:['coach_input']},visualGrammar:Visual.createVisualGrammar()});
store.setInterpretation({status:'resolved',concepts:[],unknown_concepts:[],unresolved:[],tactical_ir:tacticalIR});
store.setCompositionResult({status:'ready',composition_status:'ready',geometry_status:'needs_input',plan,questions:plan.questions,unresolved:['UNRESOLVED-REAL'],coverage:plan.coverage},'test');
const diagnostics=UI.diagnosticsFor(store.snapshot());
process.stdout.write(JSON.stringify(diagnostics));
""")

    assert result["current"] is True
    assert result["payloads"]["tacticalIR"]["actions"][0]["id"] == "ACTION-REAL"
    assert result["payloads"]["compositionPlan"]["meta"]["fingerprint"] == "PLAN-REAL"
    assert result["payloads"]["spatialConstraints"]["constraints"][0]["id"] == "CONSTRAINT-REAL"
    assert result["payloads"]["questions"]["questions"][0]["id"] == "QUESTION-REAL"
    assert result["payloads"]["questions"]["unresolved"] == ["UNRESOLVED-REAL"]
    assert result["payloads"]["ballFlow"]["states"][0]["id"] == "BALL-REAL"
    assert result["composition"] == {
        "status": "ready", "geometry": "needs_input", "total": 1,
        "composed": 1, "pending": 0, "coverage": "1/1",
    }
    assert result["actions"][0] == {
        "id": "ACTION-REAL", "type": "feint", "actor": ["L"], "target": [],
        "opponent": ["D2"], "initialSpace": ["INT_12"], "finalSpace": ["INT_23"],
        "originState": ["STATE-L-0"], "destinationState": ["STATE-L-1"],
        "authority": "coach_explicit_input", "status": "composed",
    }


def test_diagnostics_drop_old_store_data_immediately_after_text_change() -> None:
    result = _run_node(r"""
const UI=require('./interface/js/inspection-ui.js');
const Store=require('./interface/js/store.js');
const Visual=require('./interface/js/visual-grammar.js');
const tacticalIR={meta:{format:'TRACA_tactical_ir',version:'0.1.0'},participants:[],participant_states:[],balls:[],materials:[],spaces:[],actions:[{id:'OLD-ACTION-SECRET',type:'pass'}],decisions:[],phases:[],ball_flow:[],relations:[]};
const plan={meta:{fingerprint:'OLD-PLAN-SECRET'},actions:[],constraints:[],constraint_conflicts:[],questions:[],missing_slots:[],ball_flow:{states:[],transitions:[]},coverage:{actions_total:0,actions_composed:0,label:'0/0'}};
const store=Store.createWorkspaceStore({initialCase:{id:'CASE',name:'Case',description:'text inicial',source_refs:['coach_input']},visualGrammar:Visual.createVisualGrammar()});
store.setInterpretation({status:'resolved',concepts:[],unknown_concepts:[],unresolved:[],tactical_ir:tacticalIR});
store.setCompositionResult({status:'ready',composition_status:'ready',geometry_status:'needs_input',plan,coverage:plan.coverage},'test');
const before=UI.diagnosticsFor(store.snapshot());
store.updateCase({description:'text canviat'});
const after=UI.diagnosticsFor(store.snapshot());
process.stdout.write(JSON.stringify({beforeCurrent:before.current,after,serialized:JSON.stringify(after)}));
""")

    assert result["beforeCurrent"] is True
    assert result["after"]["current"] is False
    assert result["after"]["stale"] is True
    assert all(value is None for value in result["after"]["payloads"].values())
    assert "OLD-ACTION-SECRET" not in result["serialized"]
    assert "OLD-PLAN-SECRET" not in result["serialized"]
