#!/usr/bin/env node
'use strict';
// Read-only diagnostic reproductions. Run with Node from any directory.
// node reproduce_findings.cjs /path/to/CODEX /path/to/TRACA_Base_coneixement_grafics_v0_1.json
const fs = require('fs');
const path = require('path');
const repo = path.resolve(process.argv[2] || process.cwd());
const knowledge = path.resolve(process.argv[3] || path.join(__dirname, '..', 'TRACA_Base_coneixement_grafics_v0_1.json'));
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const report = {format:'TRACA_review_reproductions',version:'1.0.0',baseline_commit:'8074dc56efd73e62f8764bc14a6264215daad005',results:[]};
function probe(id, run) {
  try { report.results.push({id, executed:true, ...run()}); }
  catch (error) { report.results.push({id,executed:false,error:String(error.message || error)}); }
}
probe('REVIEW_KB_REAL_SCHEMA', () => {
  const K = require(path.join(repo,'interface/js/graphic-knowledge-base.js'));
  const source = read(knowledge);
  const actual = K.validate(source);
  return {expected:'Actual 0.2.0 source is structurally accepted; index entries resolve to existing cases; test_catalog is recognized.',observed:actual,
    defect_reproduced:!actual.valid || (actual.warnings || []).some(x=>x.code==='TEST_CATALOG_UNAVAILABLE'),
    actual_test_catalog_size:source.test_catalog.length,
    actual_coach_validation_ids:source.internal_corpus.coach_validations.map(x=>x.id)};
});
probe('REVIEW_STATIONARY_PLAYER_IN_AREA', () => {
  const C = require(path.join(repo,'interface/js/representation-composer.js'));
  const profile = read(path.join(repo,'config/handball-court.ihf-2025.json'));
  const ir = read(path.join(repo,'examples/general-geometry/a1-pass-reception.tactical-ir.json'));
  const base = read(path.join(repo,'examples/general-geometry/a1-pass-reception.geometry.json'));
  ir.participants.find(x=>x.id==='CE').position=[10,5.5];
  ir.participants.find(x=>x.id==='L').position=[15,12];
  ir.participant_states=[{...base.participant_states.find(x=>x.state_key!=='S0'),position:[13,10]}];
  const result=C.compose({tacticalIR:ir,courtProfile:profile});
  return {expected:'CE is a stationary field attacker inside the central goal area; result must not claim valid/ready geometry. Preserve it as an editable diagnosed draft.',
    observed:{composition:result.composition_status,geometry_status:result.geometry_status,validation:result.geometry?.validation,
      positions:result.geometry?.participant_states.map(x=>({id:x.id,position:x.position}))},
    defect_reproduced:result.geometry_status==='ready' && result.geometry?.validation?.geometry==='valid'};
});
for (const slug of ['a2-reception-feint-2x1','a3-opposite-side']) {
  probe(`REVIEW_FEINT_SEQUENCE_${slug}`, () => {
    const g=read(path.join(repo,'examples/general-geometry',`${slug}.geometry.json`));
    const p=g.common_paths.find(x=>x.kind==='feint');
    const defender=g.participant_states.find(x=>x.participant_ref===p.opponent_ref);
    if (!p.segments.every(x=>x.type==='line')) return {expected:'Use an independent curve-aware sequence checker after refactoring.',defect_reproduced:null,needs_new_checker:true,reason:'This diagnostic only interpolates the straight segments of the reviewed baseline.'};
    const start=p.segments[0].start;
    const end=p.segments[p.segments.length-1].end;
    const d=defender.position;
    const crossings=p.segments.flatMap((s,i)=>{
      if ((s.start[1]-d[1])*(s.end[1]-d[1])>=0) return [];
      const t=(d[1]-s.start[1])/(s.end[1]-s.start[1]);
      return [{segment:i,position:[s.start[0]+t*(s.end[0]-s.start[0]),d[1]],toward_goal:s.end[1]<s.start[1]}];
    });
    const first=crossings.find(x=>x.toward_goal);
    const initialSide=Math.sign(start[0]-d[0]), targetSide=Math.sign(end[0]-d[0]);
    return {expected:'In these declared opposite-interval cases, attack the contiguous interval before surpassing D2. Validate order and side, not only the endpoint.',
      observed:{defender:d,start,end,functional_points:p.functional_points,crossings,reported_geometry:g.validation?.geometry},
      defect_reproduced:!!first && initialSide!==targetSide && Math.sign(first.position[0]-d[0])===initialSide};
  });
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if (report.results.some(x=>!x.executed)) process.exitCode=2;
