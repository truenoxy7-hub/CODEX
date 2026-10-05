#!/usr/bin/env node
"use strict";
// Technical fixtures only: no new coach or canonical approval.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const Store = require('../interface/js/store'), Visual = require('../interface/js/visual-grammar');
const IO = require('../interface/js/import-export'), Composer = require('../interface/js/representation-composer');
const Provider = require('../interface/js/interpretation-provider'), Learning = require('../interface/js/learning-criteria');
const Renderer = require('../interface/js/renderer'), Board = require('../interface/js/whiteboard');
const profile = require('../config/handball-court.ihf-2025.json');
const {MiniDocument,MiniElement} = require('./lib/minidom');
const output = path.resolve(__dirname,'../reports/revision2/demo');fs.mkdirSync(output,{recursive:true});
const text = 'El central passa al lateral. El lateral rep en carrera.';
const s = Store.createWorkspaceStore({initialCase:{id:'DEMO-SOURCE',name:'PROVA TÈCNICA — origen',description:text},visualGrammar:Visual.createVisualGrammar(),courtProfile:profile});
const ir = Provider.buildTacticalIR(text,[],{case_id:'DEMO-SOURCE'});
const original = Composer.compose({tacticalIR:ir,courtProfile:profile});s.setCompositionResult(original);
const pass = original.geometry.common_paths.find(p=>p.kind==='pass'), state = original.geometry.participant_states.find(x=>x.id===pass.to_state_ref);
const e = s.applyCorrection({target:{layer:'geometry',ref:`geometry:participant_state:${state.id}`,property:'position'},before:state.position,after:[state.position[0]+.5,state.position[1]+.4],reason:'Fixture tècnica, no aprovació tàctica'});
const candidate = s.registerCriterion(e.id,{label:'PROVA TÈCNICA — distància relativa',definition:'Executor de prova; no consigna tàctica'});
const approved = s.approveCriterion(candidate.id,'TEST_FIXTURE_NOT_COACH');
// Regenerate a different exercise with new opaque IDs and different initial positions.
function rename(v){if(typeof v==='string')return ['CE','L','B1','A001','A002'].includes(v)?`SECOND_${v}`:v;if(Array.isArray(v))return v.map(rename);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,rename(x)]));return v;}
const secondIR = rename(ir);secondIR.meta.case_id='DEMO-SECOND';
secondIR.participants.find(p=>p.id==='SECOND_CE').position=[9,14];
secondIR.participants.find(p=>p.id==='SECOND_L').position=[16,14];
const fresh = Composer.compose({tacticalIR:secondIR,courtProfile:profile});
assert(fresh.geometry);const result=Learning.apply(fresh.geometry,[approved],{case_uid:'DEMO-SECOND',revision:1});
assert.equal(result.applications.length,1);assert.notDeepEqual(result.applications[0].before,result.applications[0].after);
const mirror=JSON.parse(JSON.stringify(fresh.geometry));Board.transformPoints(mirror,p=>[20-p[0],p[1]]);
const reflected=Learning.apply(mirror,[approved]);assert.equal(reflected.applications.length,1);assert(Math.abs(result.applications[0].after[0]+reflected.applications[0].after[0]-20)<1e-8);
assert.equal(Learning.apply(fresh.geometry,[candidate]).applications.length,0);
assert.equal(Learning.apply(fresh.geometry,[{...approved,revoked:{author:'TEST_FIXTURE_NOT_COACH'}}]).applications.length,0);
function write(name,value){fs.writeFileSync(path.join(output,name),JSON.stringify(value,null,2)+'\n');}
function svg(name,geometry){const d=new MiniDocument(),host=new MiniElement('div',d);fs.writeFileSync(path.join(output,name),Renderer.serializeSvg(Renderer.render(host,{geometry,visualGrammar:s.snapshot().workingVisualGrammar,view:'clean',board:{orientation:'top'}})));}
svg('second-before.svg',fresh.geometry);svg('second-after.svg',result.geometry);svg('mirror-after.svg',reflected.geometry);
write('source-training-case.json',IO.exportPackage(s.snapshot()));
s.createCase({id:'DEMO-SECOND',name:'PROVA TÈCNICA — segon cas',description:text});s.setCompositionResult(fresh);
write('second-training-case.json',IO.exportPackage(s.snapshot()));
write('criterion-result.json',{fixture_only:true,coach_tactical_approval:false,criterion:approved,second_tactical_ir:secondIR,application:result.applications[0],mirror:reflected.applications[0],unapproved_applied:false,revoked_applied:false});
console.log('Revision-2 criterion demo: new IDs, initial positions, relative effect and mirror verified.');
