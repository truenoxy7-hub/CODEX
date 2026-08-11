(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports ? require("./geometry-dependencies.js") : root.TRACA_GEOMETRY_DEPENDENCIES;
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_WORKSPACE_PREFLIGHT = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (dependenciesApi) {
  "use strict";

  function diagnostic(level, code, message, options) {
    return { level, code, message, actions: options && options.actions || [], target_ref: options && options.target_ref || null };
  }

  function pointOutside(point, court) {
    return !Array.isArray(point) || point.length !== 2 || point[0] < 0 || point[0] > court.width_m || point[1] < 0 || point[1] > court.half_length_m;
  }

  function hasDirectionalChange(points) {
    if (!Array.isArray(points) || points.length < 3) return false;
    const vectors = [];
    for (let index = 1; index < points.length; index += 1) {
      const dx = points[index][0] - points[index - 1][0];
      const dy = points[index][1] - points[index - 1][1];
      const length = Math.hypot(dx, dy);
      if (length > 0.05) vectors.push([dx / length, dy / length]);
    }
    return vectors.some((vector, index) => index && (vector[0] * vectors[index - 1][0] + vector[1] * vectors[index - 1][1]) < 0.94);
  }

  function crossesDefensiveLine(points, y) {
    const values = (points || []).map((point) => point[1]);
    return values.length > 1 && Math.min(...values) < y && Math.max(...values) > y;
  }

  function run(snapshot) {
    const diagnostics = [];
    const staleLayers = Object.entries(snapshot.derivations || {}).filter(([key, value]) => key !== "source" && value && value.status === "stale").map(([key]) => key);
    if (staleLayers.length) diagnostics.push(diagnostic("error", "SOURCE_DERIVATION_STALE", `El text ha canviat i ${staleLayers.join(", ")} encara provenen de la versió anterior. Torna a generar abans de guardar.`, { actions: ["Tornar a generar"] }));
    if (!snapshot.currentCase || !String(snapshot.currentCase.description || "").trim()) {
      diagnostics.push(diagnostic("error", "CASE_DESCRIPTION_REQUIRED", "El cas no té descripció. Afegeix el text que l’entrenador vol treballar."));
    }
    if (snapshot.composition && (snapshot.composition.composition_status === "needs_input" || snapshot.composition.status === "needs_input")) {
      diagnostics.push(diagnostic("error", "COMPOSITION_ANSWER_REQUIRED", "Falta una resposta directa per poder representar l’acció sense inventar-la.", { actions: ["Respondre la pregunta"] }));
    }
    if (snapshot.composition && (snapshot.composition.composition_status === "blocked" || snapshot.composition.status === "blocked")) {
      diagnostics.push(diagnostic("error", "COMPOSITION_BLOCKED", "La composició conté una contradicció estructural. Cal resoldre-la abans de validar el cas.", { actions: ["Revisar el diagnòstic de composició"] }));
    }
    const geometry = snapshot.workingGeometry || snapshot.coachReferenceGeometry;
    if (geometry && geometry.court) {
      const identityItems = [
        ...(geometry.entities || []),
        ...(geometry.participant_states || []),
        ...(geometry.zones || []),
        ...(geometry.spaces || []),
        ...(geometry.common_paths || []),
        ...(geometry.branches || []),
        ...(geometry.branches || []).flatMap((branch) => (branch.alternatives || []).flatMap((alternative) => [alternative, alternative.approach_path, alternative.return_pass].filter(Boolean)))
      ];
      const identityCounts = identityItems.reduce((counts, item) => ({ ...counts, [item.id]: (counts[item.id] || 0) + 1 }), {});
      Object.entries(identityCounts).filter(([, count]) => count > 1).forEach(([id]) => diagnostics.push(diagnostic("error", "DUPLICATE_GEOMETRY_ID", `L’identificador ${id} està duplicat. Cada element gràfic necessita una identitat estable.`, { target_ref: `geometry:identity:${id}`, actions: ["Reanomenar un dels elements"] })));
      (geometry.entities || []).forEach((entity) => {
        if (pointOutside(entity.position, geometry.court)) diagnostics.push(diagnostic("error", "ENTITY_OUT_OF_COURT", `${entity.id} ha quedat fora dels límits de la pista.`, { target_ref: `geometry:entity:${entity.id}`, actions: ["Corregir el gràfic"] }));
      });
      const states = new Map((geometry.participant_states || []).map((state) => [state.id, state]));
      const participants = new Map((geometry.entities || []).map((entity) => [entity.id, entity]));
      (geometry.participant_states || []).forEach((state) => {
        if (pointOutside(state.position, geometry.court)) diagnostics.push(diagnostic("error", "PARTICIPANT_STATE_OUT_OF_COURT", `${state.id} ha quedat fora dels límits de la pista.`, { target_ref: `geometry:participant_state:${state.id}`, actions: ["Corregir l’estat"] }));
        if (!participants.has(state.participant_ref)) diagnostics.push(diagnostic("error", "PARTICIPANT_STATE_OWNER_MISSING", `${state.id} referencia un participant inexistent.`, { target_ref: `geometry:participant_state:${state.id}`, actions: ["Reparar la identitat"] }));
      });
      (geometry.entities || []).filter((entity) => entity.state_ref).forEach((entity) => {
        const state = states.get(entity.state_ref);
        if (!state || state.participant_ref !== entity.id) diagnostics.push(diagnostic("error", "ENTITY_STATE_LINK_INVALID", `${entity.id} no està vinculat a un estat propi vàlid.`, { target_ref: `geometry:entity:${entity.id}`, actions: ["Reparar la dependència"] }));
      });
      const zones = new Map((geometry.zones || []).map((zone) => [zone.id, zone]));
      const paths = [...(geometry.common_paths || [])];
      (geometry.branches || []).forEach((branch) => (branch.alternatives || []).forEach((alternative) => {
        const receptionStateRefs = [alternative.from_state_ref, alternative.approach_path && alternative.approach_path.to_state_ref, alternative.return_pass && alternative.return_pass.to_state_ref];
        if (receptionStateRefs.some((ref) => !ref) || new Set(receptionStateRefs).size !== 1) diagnostics.push(diagnostic("error", "RECEPTION_STATE_NOT_SHARED", `${alternative.id} no comparteix un únic destí entre cursa, passada i inici de l’acció.`, { target_ref: `geometry:alternative:${alternative.id}`, actions: ["Unificar l’estat de recepció"] }));
        paths.push({ ...alternative, zone_ref: branch.zone_ref });
        if (alternative.approach_path) paths.push({ ...alternative.approach_path, zone_ref: branch.zone_ref });
        if (alternative.return_pass) paths.push({ ...alternative.return_pass, zone_ref: branch.zone_ref });
      }));
      paths.forEach((path) => {
        const points = dependenciesApi.sampledPoints(path);
        if (points.some((point) => pointOutside(point, geometry.court))) diagnostics.push(diagnostic("error", "PATH_OUT_OF_COURT", `La trajectòria ${path.id} surt fora dels límits de la pista.`, { target_ref: `geometry:path:${path.id}`, actions: ["Corregir el gràfic"] }));
        const explicitBreak = (path.functional_points || []).some((point) => point.role === "direction_break");
        if (path.kind === "feint" && ((!path.segments && !hasDirectionalChange(points)) || (path.segments && (!explicitBreak || !hasDirectionalChange(points))))) diagnostics.push(diagnostic("error", "FEINT_DIRECTION_MISSING", `La trajectòria ${path.id} està marcada com a finta però ja no mostra un canvi de direcció funcional.`, { target_ref: `semantic:action:${path.id}`, actions: ["Corregir el gràfic", "Registrar que la interpretació semàntica era incorrecta"] }));
        if (path.from_state_ref && !states.has(path.from_state_ref)) diagnostics.push(diagnostic("error", "PATH_FROM_STATE_MISSING", `${path.id} no té un estat d’origen vàlid.`, { target_ref: `geometry:path:${path.id}`, actions: ["Reparar la dependència"] }));
        if (path.to_state_ref && !states.has(path.to_state_ref)) diagnostics.push(diagnostic("error", "PATH_TO_STATE_MISSING", `${path.id} no té un estat de destí vàlid.`, { target_ref: `geometry:path:${path.id}`, actions: ["Reparar la dependència"] }));
        const fromState = states.get(path.from_state_ref), toState = states.get(path.to_state_ref);
        if (path.action_type === "movement" && (!path.actor_ref || !fromState || !toState || fromState.participant_ref !== path.actor_ref || toState.participant_ref !== path.actor_ref)) diagnostics.push(diagnostic("error", "PATH_ACTOR_STATE_LINK_INVALID", `${path.id} no connecta dos estats del participant que executa la trajectòria.`, { target_ref: `geometry:path:${path.id}`, actions: ["Reparar la trajectòria"] }));
        if (path.action_type === "pass" && (!path.from_participant_ref || !path.to_participant_ref || !fromState || !toState || fromState.participant_ref !== path.from_participant_ref || toState.participant_ref !== path.to_participant_ref || path.anchor_mode !== "symbol_perimeter")) diagnostics.push(diagnostic("error", "PASS_IDENTITY_LINK_INVALID", `${path.id} no conserva l’emissor, el receptor, els seus estats i l’ancoratge visual de la passada.`, { target_ref: `geometry:path:${path.id}`, actions: ["Reparar la passada"] }));
        const zone = zones.get(path.zone_ref);
        if (path.kind === "feint" && zone && zone.defensive_line && !crossesDefensiveLine(points, zone.defensive_line[0][1])) diagnostics.push(diagnostic("error", "FEINT_NO_SUPERATION", `La finta ${path.id} no travessa la línia defensiva que el cas declara com a criteri de superació.`, { target_ref: `geometry:alternative:${path.id}`, actions: ["Corregir el gràfic", "Registrar que la relació espacial estava mal interpretada"] }));
      });
      identityItems.forEach((item) => {
        const refs = item.source_refs || (item.source_ref ? [item.source_ref] : []);
        if (!refs.length) diagnostics.push(diagnostic("warning", "SOURCE_REFERENCE_MISSING", `${item.id} no declara d’on prové la seva interpretació o col·locació.`, { target_ref: `geometry:identity:${item.id}`, actions: ["Afegir una font", "Mantenir-lo només com a referència del cas"] }));
      });
    }
    (snapshot.corrections || []).forEach((event) => {
      if ((event.target.layer === "semantic" || event.target.layer === "spatial") && event.status !== "validated") diagnostics.push(diagnostic("warning", "CONCEPTUAL_CORRECTION_PENDING", `${event.machine_explanation || event.id} Encara és una anotació pendent de validació.`, { target_ref: event.target.ref, actions: ["Revisar la interpretació"] }));
    });
    const unknown = snapshot.interpretation && snapshot.interpretation.unknown_concepts || [];
    unknown.forEach((concept) => {
      if (!String(concept.definition || "").trim()) diagnostics.push(diagnostic("warning", "UNKNOWN_CONCEPT_UNDEFINED", `«${concept.label}» és un concepte desconegut sense definició. El cas es pot validar, però no es pot promocionar com a vocabulari reutilitzable.`, { target_ref: `semantic:concept:${concept.id}`, actions: ["Definir el concepte", "Deixar-lo només al cas"] }));
    });
    if (!geometry) diagnostics.push(diagnostic("info", "GEOMETRY_UNAVAILABLE", "No hi ha resolutor geomètric per a aquest cas. Això no bloqueja la validació semàntica ni el guardat del cas."));
    if (!diagnostics.length) diagnostics.push(diagnostic("info", "WORKSPACE_READY", "No s’han detectat contradiccions estructurals en l’estat actual."));
    return {
      status: diagnostics.some((item) => item.level === "error") ? "blocked" : diagnostics.some((item) => item.level === "warning") ? "warnings" : "ready",
      can_validate: !diagnostics.some((item) => item.level === "error"),
      diagnostics,
      summary: diagnostics.reduce((counts, item) => ({ ...counts, [item.level]: (counts[item.level] || 0) + 1 }), { error: 0, warning: 0, info: 0 })
    };
  }

  return { run, hasDirectionalChange, crossesDefensiveLine };
});
