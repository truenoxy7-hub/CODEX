(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_WORKSPACE_PREFLIGHT = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
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
    if (!snapshot.currentCase || !String(snapshot.currentCase.description || "").trim()) {
      diagnostics.push(diagnostic("error", "CASE_DESCRIPTION_REQUIRED", "El cas no té descripció. Afegeix el text que l’entrenador vol treballar."));
    }
    const geometry = snapshot.workingGeometry || snapshot.coachReferenceGeometry;
    if (geometry && geometry.court) {
      const identityItems = [
        ...(geometry.entities || []),
        ...(geometry.zones || []),
        ...(geometry.spaces || []),
        ...(geometry.common_paths || []),
        ...(geometry.branches || []),
        ...(geometry.branches || []).flatMap((branch) => branch.alternatives || [])
      ];
      const identityCounts = identityItems.reduce((counts, item) => ({ ...counts, [item.id]: (counts[item.id] || 0) + 1 }), {});
      Object.entries(identityCounts).filter(([, count]) => count > 1).forEach(([id]) => diagnostics.push(diagnostic("error", "DUPLICATE_GEOMETRY_ID", `L’identificador ${id} està duplicat. Cada element gràfic necessita una identitat estable.`, { target_ref: `geometry:identity:${id}`, actions: ["Reanomenar un dels elements"] })));
      (geometry.entities || []).forEach((entity) => {
        if (pointOutside(entity.position, geometry.court)) diagnostics.push(diagnostic("error", "ENTITY_OUT_OF_COURT", `${entity.id} ha quedat fora dels límits de la pista.`, { target_ref: `geometry:entity:${entity.id}`, actions: ["Corregir el gràfic"] }));
      });
      const zones = new Map((geometry.zones || []).map((zone) => [zone.id, zone]));
      const paths = [...(geometry.common_paths || [])];
      (geometry.branches || []).forEach((branch) => (branch.alternatives || []).forEach((alternative) => paths.push({ ...alternative, zone_ref: branch.zone_ref })));
      paths.forEach((path) => {
        if ((path.points || []).some((point) => pointOutside(point, geometry.court))) diagnostics.push(diagnostic("error", "PATH_OUT_OF_COURT", `La trajectòria ${path.id} surt fora dels límits de la pista.`, { target_ref: `geometry:path:${path.id}`, actions: ["Corregir el gràfic"] }));
        if (path.kind === "feint" && !hasDirectionalChange(path.points)) diagnostics.push(diagnostic("error", "FEINT_DIRECTION_MISSING", `La trajectòria ${path.id} està marcada com a finta però ja no mostra un canvi de direcció.`, { target_ref: `semantic:action:${path.id}`, actions: ["Corregir el gràfic", "Registrar que la interpretació semàntica era incorrecta"] }));
        const zone = zones.get(path.zone_ref);
        if (path.kind === "feint" && zone && zone.defensive_line && !crossesDefensiveLine(path.points, zone.defensive_line[0][1])) diagnostics.push(diagnostic("error", "FEINT_NO_SUPERATION", `La finta ${path.id} no travessa la línia defensiva que el cas declara com a criteri de superació.`, { target_ref: `geometry:alternative:${path.id}`, actions: ["Corregir el gràfic", "Registrar que la relació espacial estava mal interpretada"] }));
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
