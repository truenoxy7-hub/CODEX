"""Revision-2 acceptance checks. Test approvals are fixtures, never coach evidence."""
from __future__ import annotations

import importlib.util
import json
import subprocess
from pathlib import Path

import pytest

from test_integral_graphics_engine import ROOT, node, run_node

PRELUDE = r"""
const assert=require('node:assert/strict');
const Store=require('./interface/js/store.js'), Visual=require('./interface/js/visual-grammar.js'), IO=require('./interface/js/import-export.js');
const Board=require('./interface/js/whiteboard.js'), Dependencies=require('./interface/js/geometry-dependencies.js'), Learning=require('./interface/js/learning-criteria.js');
const Renderer=require('./interface/js/renderer.js'), Editor=require('./interface/js/editor.js'), Manual=require('./interface/js/manual-geometry.js');
const Composer=require('./interface/js/representation-composer.js'), Provider=require('./interface/js/interpretation-provider.js');
const profile=require('./config/handball-court.ihf-2025.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const makeStore=()=>Store.createWorkspaceStore({initialCase:{id:'TEST',name:'Test fixture only',description:''},visualGrammar:Visual.createVisualGrammar(),courtProfile:profile});
const generate=(text)=>Composer.compose({tacticalIR:Provider.buildTacticalIR(text,[],{case_id:'TEST'}),courtProfile:profile});
const a1=()=>generate('El central passa al lateral. El lateral rep en carrera.');
"""


def check(source):
    return run_node(PRELUDE + source + "\nprocess.stdout.write(JSON.stringify({passed:true}));")


def test_ed_atomic_undo_redo_roundtrip_for_all_manual_operations():
    check(r"""
const s=makeStore(); s.startCoachReference(profile);
for(const kind of ['attacker','defender','ball','cone','bench','cylinder'])s.addManualPrimitive({primitive_type:'entity',kind});
assert.equal(s.snapshot().workingGeometry.entities.length,6);
s.undo();assert.equal(s.snapshot().workingGeometry.entities.length,5);s.redo();
const bench=s.snapshot().workingGeometry.entities.find(e=>e.kind==='bench'), ref=`geometry:entity:${bench.id}`;
const before=clone(s.snapshot().workingGeometry);
s.commitGeometry(Board.move(before,ref,[2,1]),'move');s.undo();assert.deepEqual(s.snapshot().workingGeometry,before);s.redo();
s.applyCorrection({target:{layer:'geometry',ref,property:'angle'},before:0,after:25});s.undo();assert.equal(Board.target(s.snapshot().workingGeometry,ref).angle,0);s.redo();
s.commitGeometry(Board.cloneSelection(s.snapshot().workingGeometry,[ref],false).geometry,'duplicate');s.undo();s.redo();
assert.equal(s.snapshot().workingGeometry.entities.length,7);
s.commitGeometry(Board.remove(s.snapshot().workingGeometry,ref),'delete');s.undo();assert.equal(s.snapshot().workingGeometry.entities.length,7);
s.commitGeometry(Manual.createCoachReferenceGeometry('TEST',profile),'clear');s.undo();assert.equal(s.snapshot().workingGeometry.entities.length,7);
const payload=IO.exportPackage(s.snapshot()), restored=makeStore();restored.restorePackage(IO.parsePackage(JSON.stringify(payload)));
assert.deepEqual(restored.snapshot().workingGeometry,s.snapshot().workingGeometry);assert(restored.snapshot().canRedo);restored.redo();assert.equal(restored.snapshot().workingGeometry.entities.length,0);
assert.notEqual(restored.snapshot().validation.status,'validated_case');
""")


def test_ed_quadratic_shared_endpoints_snap_and_clone_graph():
    check(r"""
let geometry=a1().geometry;
const pass=geometry.common_paths.find(p=>p.kind==='pass'), reception=geometry.participant_states.find(s=>s.id===pass.to_state_ref);
const after=[reception.position[0]+1,reception.position[1]+.6];
const moved=Board.handle(geometry,`geometry:common_path:${pass.id}`,`segments.${pass.segments.length-1}.end`,after);
for(const p of Dependencies.allPaths(moved).filter(p=>p.to_state_ref===reception.id))assert.deepEqual(p.segments.at(-1).end,after);
const linked={...moved.balls[0],holder_state_ref:reception.id};moved.balls.push(linked);Dependencies.reconcileGeometry(moved);assert.equal(linked.position[0],after[0]+.38);
assert.throws(()=>Board.move(geometry,`geometry:common_path:${pass.id}`,[1,1]),/DETACH/);
assert(!Board.target(Board.detach(geometry,`geometry:common_path:${pass.id}`),`geometry:common_path:${pass.id}`).to_state_ref);
const mirrored=Board.cloneSelection(geometry,null,true), allIds=[...mirrored.geometry.entities,...mirrored.geometry.participant_states,...mirrored.geometry.common_paths].map(x=>x.id);assert.equal(allIds.length,new Set(allIds).size);
for(const p of mirrored.geometry.common_paths.filter(p=>p.cloned_from)){assert(mirrored.mapping[Board.target(geometry,`geometry:common_path:${p.cloned_from}`).to_state_ref]===p.to_state_ref);}
const manual=Manual.addPrimitive(Manual.createCoachReferenceGeometry('T',profile),{primitive_type:'path',kind:'pass'});
assert.equal(manual.common_paths[0].segments[0].type,'quadratic');assert.match(Renderer.pathData(manual.common_paths[0]),/ Q /);
assert.deepEqual(Board.snap([10,14],geometry.court,'6'),[10,6]);assert.deepEqual(Board.snap([10,14],geometry.court,'9'),[10,9]);
const arc=Board.snap([3,10],geometry.court,'6');assert(Math.abs(Math.hypot(arc[0]-8.5,arc[1])-6)<1e-8);
const clipped=Board.snap([-9,2],geometry.court,'9');assert(clipped[0]>=0);assert(Math.abs(Math.hypot(clipped[0]-8.5,clipped[1])-9)<1e-8);
""")


def test_ed_pointer_capture_offset_final_up_cancel_and_keyboard_guard():
    check(r"""
const s=makeStore();s.startCoachReference(profile);const a=s.addManualPrimitive({primitive_type:'entity',kind:'attacker',position:[8,10]});
const handlers={},ref=`geometry:entity:${a.id}`;let captured=null;
const svg={querySelector:()=>null,getScreenCTM:()=>({inverse:()=>({})}),createSVGPoint:()=>({x:0,y:0,matrixTransform(){return {x:this.x,y:this.y};}})};
const container={ownerDocument:{querySelector:()=>null},contains:()=>true,querySelector:()=>svg,focus(){},addEventListener:(k,fn)=>handlers[k]=fn,setPointerCapture:id=>captured=id,hasPointerCapture:id=>captured===id,releasePointerCapture:()=>captured=null};
const node={dataset:{ref,kind:'entity'},classList:{contains:()=>false},closest(){return this;}};
global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
const editor=Editor.createEditor({container,store:s,onPreview(){}});editor.bind();editor.bind();
const event=(x,y,id=1)=>({button:0,pointerId:id,isPrimary:true,clientX:x,clientY:y,target:node,preventDefault(){}});
const baseline=s.snapshot().history.past.length;
handlers.pointerdown(event(8.25,10.2));handlers.pointermove(event(9.25,11.2,2));assert.equal(captured,1);
handlers.pointermove(event(9.25,11.2));handlers.pointerup(event(10.25,12.2));
assert.deepEqual(s.snapshot().workingGeometry.entities[0].position,[10,12]);assert.equal(s.snapshot().history.past.length,baseline+1);assert(!editor.active);
handlers.pointerdown(event(10,12));handlers.pointermove(event(14,15));handlers.pointercancel(event(14,15));assert.deepEqual(s.snapshot().workingGeometry.entities[0].position,[10,12]);
handlers.pointerdown(event(10,12));handlers.lostpointercapture(event(11,14));assert(!editor.active);assert.equal(s.snapshot().history.past.length,baseline+1);
assert(!Editor.keyboardAllowed({target:{closest:()=>({})}},container));
assert(!Editor.keyboardAllowed({target:{closest:()=>null}},{contains:()=>false}));
""")


def test_sv_stale_incomplete_drafts_and_revision_scoped_approval():
    check(r"""
const s=makeStore();s.setCompositionResult(a1());s.approveAction('A001','test fixture');const revision=s.snapshot().revision;assert.equal(s.snapshot().actionApprovals.A001.revision,revision);
const before=clone(s.snapshot().workingGeometry);s.updateCase({description:'Text nou no resolt'});assert.deepEqual(s.snapshot().workingGeometry,before);assert.deepEqual(s.snapshot().actionApprovals,{});
s.saveCase();assert.notEqual(s.snapshot().validation.status,'validated_case');assert.deepEqual(s.snapshot().knowledgeLibrary.drafts[0].geometry,before);
s.setCompositionResult({status:'needs_input',geometry:null});assert.deepEqual(s.snapshot().workingGeometry,before);
""")


def test_gn_three_way_regeneration_preserves_edits_conflicts_late_and_undo():
    check(r"""
const s=makeStore();const result=a1();s.setCompositionResult(result);const entity=result.geometry.entities[0],ref=`geometry:entity:${entity.id}`;
s.applyCorrection({target:{layer:'geometry',ref,property:'label'},before:entity.label,after:'Corregit'});
const original=clone(s.snapshot().workingGeometry), token=s.beginRegeneration(), proposal=s.proposeRegeneration(token,result);assert.equal(proposal.conflicts.length,0);s.acceptRegeneration({});assert.equal(s.snapshot().workingGeometry.entities[0].label,'Corregit');s.undo();assert.deepEqual(s.snapshot().workingGeometry,original);
const incoming=clone(result);incoming.geometry.entities[0].label='Canvi del generador';const t=s.beginRegeneration(), conflict=s.proposeRegeneration(t,incoming);assert(conflict.conflicts.length);assert.throws(()=>s.acceptRegeneration({}),/CONFLICTS_PENDING/);
const retry=s.beginRegeneration(), next=s.proposeRegeneration(retry,incoming);s.acceptRegeneration(Object.fromEntries(next.conflicts.map(c=>[c.path,'keep'])));assert.equal(s.snapshot().workingGeometry.entities[0].label,'Corregit');s.undo();
const late=s.beginRegeneration();s.updateCase({description:'Una altra revisió'});assert.equal(s.proposeRegeneration(late,result).status,'obsolete');
const cancelled=s.beginRegeneration();s.cancelRegeneration();assert.equal(s.proposeRegeneration(cancelled,result).status,'obsolete');
""")


def test_lr_typed_criterion_new_ids_positions_mirror_and_negative_cases():
    check(r"""
const s=makeStore();s.setCompositionResult(a1());const before=s.snapshot(),pass=before.workingGeometry.common_paths.find(p=>p.kind==='pass'),state=before.workingGeometry.participant_states.find(s=>s.id===pass.to_state_ref);
const event=s.applyCorrection({target:{layer:'geometry',ref:`geometry:participant_state:${state.id}`,property:'position'},before:state.position,after:[state.position[0]+1,state.position[1]+.5],source_refs:['test_fixture_only']});
const registered=s.registerCriterion(event.id,{label:'TEST ONLY relative',definition:'fixture'});assert.equal(registered.state,'registered');assert.equal(registered.effect.type,'relative_position');
const approved=s.approveCriterion(registered.id,'test fixture');assert.equal(approved.state,'executable');
const newGeometry=clone(a1().geometry);const ids=new Set([...newGeometry.entities,...newGeometry.participant_states,...newGeometry.common_paths].map(x=>x.id));
function rename(value){if(typeof value==='string'&&ids.has(value))return 'NEW_'+value;if(Array.isArray(value))return value.map(rename);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rename(v)]));return value;}
const renamed=rename(newGeometry);Board.transformPoints(renamed,p=>[p[0]-.4,p[1]+1]);
const applied=Learning.apply(renamed,[approved],{case_uid:'NEW_CASE_TEST',revision:1});assert.equal(applied.applications.length,1);assert.notDeepEqual(applied.geometry.participant_states,renamed.participant_states);assert(applied.applications[0].target_ref.startsWith('NEW_'));
const mirrored=clone(renamed);Board.transformPoints(mirrored,p=>[20-p[0],p[1]]);const other=Learning.apply(mirrored,[approved]);assert.equal(other.applications.length,1);assert(Math.abs(other.applications[0].after[0]+applied.applications[0].after[0]-20)<1e-8);
assert.equal(Learning.apply(renamed,[registered]).applications.length,0);assert.equal(Learning.apply(renamed,[{...approved,revoked:true}]).applications.length,0);
const incompatible=clone(renamed);incompatible.common_paths=incompatible.common_paths.filter(p=>p.kind!=='pass');assert.equal(Learning.apply(incompatible,[approved]).applications.length,0);
const contradictory=clone(approved);contradictory.id='TEST_CONFLICT';contradictory.effect.lateral_m+=1;const conflict=Learning.apply(renamed,[approved,contradictory]);assert.equal(conflict.conflicts.length,1);assert.equal(conflict.applications.length,0);
s.revokeCriterion(approved.id);assert(s.snapshot().knowledgeLibrary.criteria[0].revoked);assert.equal(applied.geometry.learning_applied.length,1);
const unknown=Learning.derive(s.snapshot(),{...event,target:{...event.target,property:'label'},before:'A',after:'B'},{id:'TEST_UNSUPPORTED'});assert.equal(Learning.approve(unknown,'test fixture',1).state,'coach_approved');
""")


def test_ge_full_curves_stationary_and_feint_sequence():
    check(r"""
const V=require('./interface/js/generic-geometry-resolver.js');
const g=clone(a1().geometry);g.entities[0].position=[10,5.5];assert.equal(V.validateResolvedGeometry(g).geometry,'invalid');
const path=g.common_paths.find(p=>p.kind==='movement_without_ball');path.segments=[{type:'quadratic',start:[7,10],control:[10,-8],end:[13,10]}];assert(V.validateResolvedGeometry(g).checks.some(c=>c.kind==='ground_path_physical_area'&&c.status==='failed'));
for(const name of ['a2-reception-feint-2x1','a3-opposite-side']){const geometry=require('./examples/general-geometry/'+name+'.geometry.json');assert.equal(geometry.validation.geometry,'valid');assert(geometry.validation.checks.some(c=>c.kind==='feint_sequence'&&c.status==='passed'));const bad=clone(geometry),p=bad.common_paths.find(p=>p.kind==='feint');p.functional_points.find(p=>p.role==='clearance').position[1]=5;assert(V.validateResolvedGeometry(bad).checks.some(c=>c.kind==='feint_sequence'&&c.status==='failed'));}
""")


def test_ex_clean_export_dimensions_unique_ids_and_temporal_legend():
    check(r"""
const {MiniDocument,MiniElement}=require('./scripts/lib/minidom.js'),doc=new MiniDocument();doc.createElement=name=>new MiniElement(name,doc);
const s=makeStore();s.setCompositionResult(a1());s.setSelection({ref:`geometry:common_path:${s.snapshot().workingGeometry.common_paths[0].id}`});
const svg=Renderer.cleanSvg(s.snapshot(),doc),xml=Renderer.serializeSvg(svg);assert(!xml.includes('path-handle'));assert(!xml.includes('is-selected'));assert(!xml.includes('comparison-ghost'));assert(xml.includes('font-family="Arial, sans-serif"'));assert(xml.includes('width="1200"'));
assert(xml.includes('workspace_revision'));assert(xml.includes(s.snapshot().currentCase.case_uid));
const second=Renderer.serializeSvg(Renderer.cleanSvg(s.snapshot(),doc));const ids=xml.match(/id="[^"]+"/g);assert(ids.every(id=>!second.includes(id)));
const sheet=Renderer.renderSymbolSheet(new MiniElement('div',doc),{}).serialize();assert.equal((sheet.match(/data-canonical-ref=/g)||[]).length,14);
const past=sheet.split('data-concept="past_position"')[1].split('data-concept=')[0];assert(past.includes('data-temporal-status="past"'));assert(!past.includes('fill-opacity="0.68"'));
""")


def test_gn_derived_validation_is_not_a_coach_regeneration_conflict():
    check(r"""
const Regen=require('./interface/js/regeneration.js');
const base=clone(a1().geometry),local=clone(base),incoming=clone(base);
local.validation={geometry:'invalid',checks:[{status:'failed'}]};incoming.validation={geometry:'valid',checks:[{status:'passed'}]};
const result=Regen.merge(base,local,incoming);assert.equal(result.conflicts.length,0);assert.deepEqual(result.geometry.validation,incoming.validation);
local.entities[0].label='Coach';incoming.entities[0].label='Proposal';
const conflict=Regen.merge(base,local,incoming);assert.equal(conflict.conflicts.length,1);assert(conflict.conflicts[0].path.endsWith('/label'));assert.equal(conflict.geometry.entities[0].label,'Coach');
""")


def test_th_confirmed_model_keeps_selectable_provisional_theory():
    check(r"""
const s=makeStore(),result=a1();result.model_provenance={mode:'test_double'};
s.setCompositionResult(result);
const snap=s.snapshot();assert.equal(snap.interpretation.provider,'Doble de prova confirmat');
assert.equal(snap.semanticModel.actions.length,result.tactical_ir.actions.length);
assert(snap.semanticModel.actions.every(x=>x.knowledge_state==='provisional'&&x.source==='coach_confirmed_model_proposal'));
assert.notEqual(snap.validation.status,'validated_case');assert(snap.workingGeometry.common_paths.some(p=>p.action_ref===snap.semanticModel.actions[0].id));
""")


def test_ed_transform_is_frozen_for_pointer_session_even_if_selection_changes_layout():
    check(r"""
const s=makeStore();s.startCoachReference(profile);const a=s.addManualPrimitive({primitive_type:'entity',kind:'attacker',position:[8,10]});
let offset=0;const handlers={},node={dataset:{ref:`geometry:entity:${a.id}`},classList:{contains:()=>false},closest(){return this;}};
const svg={querySelector:()=>null,getScreenCTM:()=>({inverse:()=>({offset})}),createSVGPoint:()=>({x:0,y:0,matrixTransform(m){return {x:this.x,y:this.y-m.offset};}})};
const container={ownerDocument:{querySelector:()=>null},contains:()=>true,querySelector:()=>svg,focus(){},addEventListener:(k,f)=>handlers[k]=f,setPointerCapture(){},hasPointerCapture:()=>false,releasePointerCapture(){}};
Editor.createEditor({container,store:s,onPreview(){offset=2;}}).bind();const event=(x,y)=>({button:0,pointerId:1,pointerType:'touch',isPrimary:true,clientX:x,clientY:y,target:node,preventDefault(){}});
handlers.pointerdown(event(8.2,10.2));handlers.pointerup(event(8.2,10.2));assert.deepEqual(s.snapshot().workingGeometry.entities[0].position,[8,10]);
offset=0;handlers.pointerdown(event(8.2,10.2));handlers.pointerup(event(9.2,11.2));assert.deepEqual(s.snapshot().workingGeometry.entities[0].position,[9,11]);
""")


def test_ed_temporal_state_has_hitbox_only_in_edit_view():
    check(r"""
const {MiniDocument,MiniElement}=require('./scripts/lib/minidom.js'),d=new MiniDocument(),s=makeStore();s.setCompositionResult(a1());
const xml=Renderer.render(new MiniElement('div',d),{geometry:s.snapshot().workingGeometry,view:'control',visualGrammar:s.snapshot().workingVisualGrammar}).serialize();
assert(xml.includes('class="entity-hitbox"'));d.createElement=n=>new MiniElement(n,d);assert(!Renderer.serializeSvg(Renderer.cleanSvg(s.snapshot(),d)).includes('entity-hitbox'));
""")


def test_ex_png_failures_clipboard_image_and_honest_fallback_release_urls():
    run_node(PRELUDE + r"""
(async()=>{
const released=[],downloads=[];global.URL={createObjectURL:()=>`blob:${Math.random()}`,revokeObjectURL:u=>released.push(u)};
global.Image=class{set src(v){queueMicrotask(()=>this.onload());}};
const canvas={getContext:()=>({scale(){},fillRect(){},drawImage(){}}),toBlob:fn=>fn(new Blob(['PNG'],{type:'image/png'}))};
const doc={createElement:n=>n==='canvas'?canvas:{click(){downloads.push(this.download);}},querySelector:()=>null};
const svg={ownerDocument:doc,getAttribute:()=> '0 0 20 20',serialize:()=>'<svg xmlns="http://www.w3.org/2000/svg"/>'};
Object.defineProperty(global,'navigator',{configurable:true,value:{clipboard:{write:async items=>assert.equal(items[0].value['image/png'].type,'image/png')}}});global.ClipboardItem=class{constructor(value){this.value=value;}};
assert.equal((await Renderer.copyPng(svg,'fixture.png')).status,'copied_image');assert.equal(downloads.length,0);assert.equal(released.length,1);
global.navigator.clipboard.write=async()=>{throw Error('DENIED')};assert.equal((await Renderer.copyPng(svg,'fixture.png')).status,'downloaded_fallback');assert.deepEqual(downloads,['fixture.png']);
canvas.getContext=()=>null;await assert.rejects(Renderer.pngBlob(svg),/CANVAS_UNAVAILABLE/);
canvas.getContext=()=>({scale(){},fillRect(){}});global.Image=class{set src(v){queueMicrotask(()=>this.onerror());}};const before=released.length;await assert.rejects(Renderer.pngBlob(svg),/SVG_LOAD_FAILED/);assert.equal(released.length,before+1);
process.stdout.write(JSON.stringify({passed:true}));
})().catch(e=>{process.stderr.write(e.stack);process.exitCode=1;});
""")


def test_kb_real_index_validation_scope_counts_and_selective_activation():
    check(r"""
const K=require('./interface/js/graphic-knowledge-base.js'),kb=require('./sources/revision2/TRACA_Base_coneixement_grafics_v0_1.json');
assert(K.validate(kb).valid);assert.equal(K.validate(kb).summary.evidence_status_counts['CONFIRMADA PER ENTRENADOR'],16);
const actual=K.query(kb,'VAL-ENT-004').find(r=>r.id==='VAL-ENT-004');assert(actual.scope.includes('sense glif'));assert.deepEqual(actual.source_refs,['SRC-INTERNAL-AUDIT-001']);
const activated=K.adaptOperational(kb,{activated_records:['VAL-ENT-004','R01']});assert.deepEqual(activated.facts.map(f=>f.id),['VAL-ENT-004']);assert.equal(activated.rejected.length,1);assert.equal(kb.meta.runtime_import_allowed,false);
const bad=clone(kb);bad.case_index[0].json_pointer='/cases/3';assert(!K.validate(bad).valid);
""")


@pytest.mark.parametrize("version", ["0.2.0", "0.3.0", "0.4.0", "0.5.0", "0.6.0"])
def test_sv_all_package_versions_open_without_implicit_approval(version):
    check(f"""
const s=makeStore();s.startCoachReference(profile);s.addManualPrimitive({{primitive_type:'entity',kind:'bench'}});const payload=IO.exportPackage(s.snapshot());payload.version='{version}';
const restored=makeStore();restored.restorePackage(IO.parsePackage(JSON.stringify(payload)));assert.equal(restored.snapshot().workingGeometry.entities[0].kind,'bench');assert.notEqual(restored.snapshot().validation.status,'validated_case');
""")


def server_module():
    spec = importlib.util.spec_from_file_location("traca_workspace_server", ROOT / "scripts/workspace_server.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def package():
    return run_node(PRELUDE + "const s=makeStore();s.startCoachReference(profile);s.addManualPrimitive({primitive_type:'entity',kind:'bench'});process.stdout.write(JSON.stringify(IO.exportPackage(s.snapshot())));")


def test_sv_sqlite_restart_revision_conflicts_and_exact_backups(tmp_path):
    module = server_module()
    database = tmp_path / "workspace.sqlite3"
    first = module.Repository(database)
    payload = package()
    uid = payload["case"]["case_uid"]
    assert first.save(payload, 0)[0] == 200
    second = module.Repository(database)
    assert second.get(uid)["payload"] == payload
    local = json.loads(json.dumps(payload))
    local["case"]["description"] = "stale draft is valid to save"
    assert second.save(local, 1)[1]["revision"] == 2
    code, conflict = first.save(payload, 1)
    assert code == 409
    assert conflict["incoming"] == payload
    assert conflict["current"]["payload"] == local
    with second.connect() as db:
        assert db.execute("SELECT COUNT(*) FROM conflicts").fetchone()[0] == 1
        assert db.execute("SELECT COUNT(*) FROM versions").fetchone()[0] == 2
    legacy = package()
    legacy["version"] = "0.2.0"
    del legacy["case"]["case_uid"]
    imported = first.import_legacy(legacy)
    assert first.import_legacy(legacy)["status"] == "already_imported"
    with first.connect() as db:
        backup = db.execute("SELECT original FROM migrations WHERE digest=?", (imported["backup_digest"],)).fetchone()[0]
    assert json.loads(backup) == legacy
    with pytest.raises(ValueError, match="EXPECTED_REVISION"):
        first.save(payload, None)


def test_sv_client_offline_recovers_and_conflict_never_claims_saved():
    check(r"""
(async()=>{
const P=require('./interface/js/persistence.js'),data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
const statuses=[],s=makeStore();s.startCoachReference(profile);let online=false,conflict=false;
const fetch=async(path,opts)=>{if(!online)throw Error('offline');if(path==='/api/session')return {ok:true,json:async()=>({token:'TEST'})};if(path==='/api/latest')return {ok:true,json:async()=>({workspace:null})};return {ok:!conflict,status:conflict?409:200,json:async()=>conflict?{status:'conflict',incoming:JSON.parse(opts.body).payload,current:{revision:2,payload:JSON.parse(opts.body).payload}}:{status:'saved',revision:1}};};
const p=P.createClient({storage,fetch,delay:100000,onStatus:s=>statuses.push(s.status)});await p.initialize();p.schedule(IO.exportPackage(s.snapshot()));assert.equal(await p.flush(),false);assert.equal(p.pending,1);assert.equal(statuses.at(-1),'offline');assert(data.get(P.PENDING_KEY));
online=true;assert(await p.flush());assert.equal(p.pending,0);conflict=true;s.updateCase({description:'Concurrent change'});p.schedule(IO.exportPackage(s.snapshot()));assert.equal(await p.flush(),false);assert.equal(statuses.at(-1),'conflict');
process.stdout.write(JSON.stringify({passed:true}));
})();
""".replace("process.stdout.write(JSON.stringify({passed:true}));", ""))


def test_lr_result_constraints_feint_binding_and_revocation_reopen():
    check(r"""
const s=makeStore();s.setCompositionResult(a1());const pass=s.snapshot().workingGeometry.common_paths.find(p=>p.kind==='pass'),state=s.snapshot().workingGeometry.participant_states.find(x=>x.id===pass.to_state_ref);
const e=s.applyCorrection({target:{layer:'geometry',ref:`geometry:participant_state:${state.id}`,property:'position'},before:state.position,after:[state.position[0]+.5,state.position[1]+.5]});
const c=s.registerCriterion(e.id,{label:'TEST ONLY relative'});s.approveCriterion(c.id,'test fixture');const historical=IO.exportPackage(s.snapshot());
const dangerous={...s.snapshot().knowledgeLibrary.criteria[0],effect:{type:'relative_position',lateral_m:1000,depth_m:-1000}};
const refused=Learning.apply(a1().geometry,[dangerous]);assert.equal(refused.applications.length,0);assert(refused.rejected.some(r=>r.reason==='GEOMETRY_CONSTRAINT_VIOLATION'));assert.deepEqual(refused.geometry,a1().geometry);
assert.equal(Learning.derive(s.snapshot(),e,{type:'feint_sequence'}).implementation,'pending');
s.revokeCriterion(c.id);s.restorePackage(historical);assert(s.snapshot().knowledgeLibrary.criteria.find(x=>x.id===c.id).revoked);assert.equal(Learning.apply(a1().geometry,s.snapshot().knowledgeLibrary.criteria).applications.length,0);
const f=generate('El central passa al lateral. El lateral rep en carrera a l’interval 1–2, fa una finta contra D2 i surt cap a l’interval 2–3. Després juga un 2x1 amb el pivot contra D3.');s.createCase({name:'TEST ONLY sequential'});s.setCompositionResult(f);
const feint=s.snapshot().workingGeometry.common_paths.find(p=>p.kind==='feint');const correction=s.applyCorrection({target:{layer:'geometry',ref:`geometry:common_path:${feint.id}`,property:'label'},before:feint.label,after:'TEST ONLY'});
const sequential=s.registerCriterion(correction.id,{type:'feint_sequence',label:'TEST ONLY canonical order'});const approved=s.approveCriterion(sequential.id,'test fixture');
const checked=Learning.apply(f.geometry,[approved]);assert.equal(checked.applications[0].result,'passed');assert(checked.validation[0].checks.some(c=>c.kind==='feint_sequence'));
""")


def test_gn_failed_acceptance_is_retryable_and_case_open_cancels_old_response():
    check(r"""
const s=makeStore();const base=a1();s.setCompositionResult(base);const entity=base.geometry.entities[0];s.applyCorrection({target:{layer:'geometry',ref:`geometry:entity:${entity.id}`,property:'label'},before:entity.label,after:'TEST only local'});
const incoming=clone(base);incoming.geometry.entities[0].label='TEST only remote';const token=s.beginRegeneration(),review=s.proposeRegeneration(token,incoming),revision=s.snapshot().revision;
assert.throws(()=>s.acceptRegeneration({}),/CONFLICTS_PENDING/);assert.equal(s.snapshot().revision,revision);assert.equal(s.snapshot().regeneration.token.id,token.id);
s.acceptRegeneration(Object.fromEntries(review.conflicts.map(c=>[c.path,'keep'])));assert.equal(s.snapshot().workingGeometry.entities[0].label,'TEST only local');
const late=s.beginRegeneration(),other=makeStore();other.startCoachReference(profile);s.restorePackage(IO.exportPackage(other.snapshot()));assert.equal(s.proposeRegeneration(late,base).status,'obsolete');
""")


def test_ge_full_court_bottom_area_and_scoped_action_approval():
    check(r"""
const V=require('./interface/js/generic-geometry-resolver.js');const g=Manual.addPrimitive(Manual.createCoachReferenceGeometry('TEST',profile),{primitive_type:'entity',kind:'attacker',position:[10,34.5]});assert.equal(V.validateResolvedGeometry(g).geometry,'invalid');
g.entities[0].position=[10,31];const full=Manual.addPrimitive(g,{primitive_type:'path',kind:'movement_without_ball',points:[[8,30],[10,35],[12,30]]});assert(V.validateResolvedGeometry(full).checks.some(c=>c.kind==='ground_path_physical_area'&&c.status==='failed'));
const s=makeStore();s.setCompositionResult(a1());s.approveAction('A001','test fixture');const ce=s.snapshot().workingGeometry.entities.find(e=>e.id==='CE');
s.applyCorrection({target:{layer:'geometry',ref:`geometry:entity:${ce.id}`,property:'label'},before:ce.label,after:'TEST CE'});assert.equal(s.snapshot().actionApprovals.A001.revision,s.snapshot().revision);
s.applyCorrection({target:{layer:'geometry',ref:`geometry:participant_state:${ce.state_ref}`,property:'position'},before:ce.position,after:[10,5.5]});assert.throws(()=>s.approveAction('A001','test fixture'),/APPROVAL_BLOCKED/);assert.equal(s.snapshot().workingGeometry.validation.geometry,'invalid');s.saveCase();
""")


def test_ed_copy_remaps_actions_ball_offset_and_delete_exposes_broken_relation():
    check(r"""
const geometry=generate('El central passa al lateral. El lateral rep en carrera a l’interval 1–2, fa una finta contra D2 i surt cap a l’interval 2–3. Després juga un 2x1 amb el pivot contra D3.').geometry;
const mirrored=Board.cloneSelection(geometry,null,true);const path=mirrored.geometry.common_paths.find(p=>p.cloned_from===geometry.common_paths[0].id);assert.notEqual(path.action_ref,geometry.common_paths[0].action_ref);assert.equal(path.source_action_ref,geometry.common_paths[0].action_ref);assert(mirrored.geometry.actions.some(a=>a.id===path.action_ref&&a.status==='unlinked_copy'));
const ball=mirrored.geometry.balls.find(b=>b.cloned_from===geometry.balls[0].id);assert.equal(ball.holder_offset[0],-.38);
const removed=Board.remove(geometry,'geometry:entity:D3');assert(!removed.entities.some(e=>e.id==='D3'));assert(removed.relations[0].unresolved_refs.length);assert(!removed.relations[0].participants.some(p=>p.participant_ref==='D3'));
const s=makeStore();s.setCompositionResult({...generate('El central passa al lateral.'),geometry:removed});assert(!s.runPreflight().can_validate);s.saveCase();
""")


def test_rg_corpus_qualitative_scenes_preserve_full_sources_and_separate_balls():
    check(r"""
const fs=require('fs'),Adapter=require('./interface/js/corpus-adapter.js'),corpus=require('./corpus/uvof.semantic.json');let scenes=0;
for(const e of corpus.exercicis){const spatial=JSON.parse(fs.readFileSync(`exercises/${e.id}/spatial-relations.json`)),adapted=Adapter.adapt(e,spatial);assert.deepEqual(adapted.preserved.semantic,e);assert.deepEqual(adapted.preserved.spatial,spatial);assert.notEqual(adapted.status,'complete');for(const scene of adapted.scenes){assert.equal(scene.tacticalIR.balls.length,1);assert.equal(scene.tacticalIR.balls[0].id,scene.scope.ball_ref);assert(!scene.tacticalIR.participants.some(p=>p.position));const result=Composer.compose({tacticalIR:scene.tacticalIR,courtProfile:profile});if(result.geometry)scenes++;}assert(!adapted.unresolved.some(u=>u.reason?.includes('falten coordenades d’entrada')));}
assert(scenes>20);
""")


def test_kb_activation_changes_only_optional_view_and_preserves_branches():
    check(r"""
const K=require('./interface/js/graphic-knowledge-base.js'),kb=require('./sources/revision2/TRACA_Base_coneixement_grafics_v0_1.json');const s=makeStore();s.loadCanonicalCase({id:'TEST015',name:'TEST ONLY',description:'Test'},require('./exercises/TR-UVOF-015/geometry.json'));const before=clone(s.snapshot().workingGeometry),fact=K.query(kb,'VAL-ENT-004').find(x=>x.id==='VAL-ENT-004');
s.activateKnowledge('VAL-ENT-004',true,fact);assert.equal(s.snapshot().ui.optionalAlternatives,'semantic_only');assert.deepEqual(s.snapshot().workingGeometry,before);
const {MiniDocument,MiniElement}=require('./scripts/lib/minidom.js'),d=new MiniDocument();const xml=Renderer.render(new MiniElement('div',d),{geometry:before,board:s.snapshot().ui,view:'clean',visualGrammar:s.snapshot().workingVisualGrammar}).serialize();assert(!xml.includes('data-ref="geometry:alternative:'));assert.equal(before.branches.reduce((n,b)=>n+b.alternatives.length,0),12);
""")


def test_sv_real_edited_package_and_corrections_satisfy_portable_schema():
    from jsonschema import Draft202012Validator
    from referencing import Registry, Resource

    registry = Registry()
    for path in (ROOT / "schema").glob("*.json"):
        contents = json.loads(path.read_text())
        if "$id" in contents and "$schema" in contents:
            registry = registry.with_resource(contents["$id"], Resource.from_contents(contents))
    edited = run_node(PRELUDE + r"""
const s=makeStore();s.setCompositionResult(a1());const state=s.snapshot().workingGeometry.participant_states.find(x=>x.status==='future');s.applyCorrection({target:{layer:'geometry',ref:`geometry:participant_state:${state.id}`,property:'position'},before:state.position,after:[state.position[0]+.5,state.position[1]+.5]});const c=s.registerCriterion(s.snapshot().corrections.at(-1).id,{label:'TEST ONLY schema'});s.approveCriterion(c.id,'test fixture');process.stdout.write(JSON.stringify(IO.exportPackage(s.snapshot())));
""")
    schema = json.loads((ROOT / "schema/traca.training-case.schema.v0.1.json").read_text())
    Draft202012Validator(schema, registry=registry).validate(edited)
