/* Supported qualitative subgraphs. No coordinates and no layout by exercise ID. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_CORPUS_ADAPTER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const copy = x => JSON.parse(JSON.stringify(x));
  function adapt(exercise, spatial) {
    const scenes = [], unresolved = [];
    const participants = new Map((exercise.participants || []).map(p => [p.id, p]));
    const source = `exercises/${exercise.id}/spatial-relations.json`;
    for (const [index, flow] of (spatial.fluxos_pilota || []).entries()) {
      const from = participants.get(flow.posseidor_inicial), to = participants.get(flow.posseidor_final);
      const ref = `${source}#/fluxos_pilota/${index}`;
      if (!from || !to || from.id === to.id || !flow.pilota_id || flow.estat_coneixement !== "validat") {
        unresolved.push({ ref, code: "PASS_BINDING_UNRESOLVED", missing: [!from && "passador", !to && "receptor", from && to && from.id === to.id && "receptor_distint", !flow.pilota_id && "pilota", flow.estat_coneixement !== "validat" && "autoritat_validada"].filter(Boolean) }); continue;
      }
      // Each flow is a separate scene: alternatives and repetitions are NEVER
      // flattened into a single sequence or a single initial ball inventory.
      const authority = { authority: "coach_explicit_input", status: "validated", source_refs: [ref] };
      const p = person => ({ id: person.id, label: person.id, role: person.rol_inicial, kind: person.equip === "defensa" ? "defender" : "attacker", team: person.equip === "defensa" ? "defense" : "attack", ...authority });
      const pass = { id: `${flow.id}:pass`, type: "pass", actor_ref: from.id, receiver_ref: to.id, ball_ref: flow.pilota_id, ...authority };
      const actions = [pass];
      const reception = (spatial.transicions || []).find(t => t.tipus === "recepcio" && t.actor === to.id && t.trajectoria_id === flow.trajectoria_id && t.fase_ref === flow.fase_ref && t.estat_coneixement === "validat" && (t.qualificadors || []).includes("en_carrera"));
      if (reception) actions.push({ id: `${flow.id}:receive`, type: "reception", actor_ref: to.id, mode: "in_motion", after: [pass.id], ...authority, source_refs: [ref, `${source}#/transicions/${spatial.transicions.indexOf(reception)}`] });
      scenes.push({ id: flow.id, scope: { phase_ref: flow.fase_ref, trajectory_ref: flow.trajectoria_id, ball_ref: flow.pilota_id, qualifiers: copy(flow.qualificadors || []), source_ref: ref }, tacticalIR: {
        meta: { format: "TRACA_tactical_ir", version: "0.1.0", case_id: exercise.id, source_revision: "corpus_validated", knowledge_version: "corpus" },
        participants: [p(from), p(to)], participant_states: [], balls: [{ id: flow.pilota_id, holder_ref: from.id, ...authority }], materials: [], spaces: [], actions, decisions: [], phases: [], ball_flow: [], relations: []
      } });
    }
    for (const transition of spatial.transicions || []) {
      if (transition.tipus === "recepcio" && scenes.some(s => s.tacticalIR.actions.some(a => a.type === "reception" && a.actor_ref === transition.actor) && s.scope.trajectory_ref === transition.trajectoria_id)) continue;
      unresolved.push({ ref: `${source}#${transition.id}`, code: transition.tipus === "resolucio" ? "OPEN_RESOLUTION_PRESERVED" : "QUALITATIVE_OPERATOR_BINDING_PENDING", type: transition.tipus, reason: transition.tipus === "resolucio" ? "La decisió conserva passada/llançament/continuïtat oberts." : `Falta adaptar el marc relacional ${transition.tipus} a l’operador (origen, destí, referència i condició); la geometria es deriva de relacions qualitatives.` });
    }
    if (!scenes.length) unresolved.push({ code: "NO_VALIDATED_PASS_SUBGRAPH", reason: "No hi ha flux passador–receptor–pilota validat en aquest contracte; la situació completa requereix adaptar els seus operadors." });
    return { status: scenes.length ? "partial" : "needs_operator_adapter", scenes, unresolved, preserved: { semantic: copy(exercise), spatial: copy(spatial) } };
  }
  return { adapt };
});
