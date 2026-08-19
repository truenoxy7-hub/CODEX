(function (root, factory) {
  const knowledge = factory();
  if (typeof module === "object" && module.exports) module.exports = knowledge;
  root.TRACA_LOCAL_KNOWLEDGE = knowledge;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  return {
  version: "0.1.0",
  concepts: [
    { id: "role.central", label: "central", category: "participant_role", aliases: ["central", "ce"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#rols-ofensius" },
    { id: "role.lateral", label: "lateral", category: "participant_role", aliases: ["lateral", "laterals"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#rols-ofensius" },
    { id: "role.pivot", label: "pivot", category: "participant_role", aliases: ["pivot", "pv"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#rols-ofensius" },
    { id: "role.extrem", label: "extrem", category: "participant_role", aliases: ["extrem", "extrems"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#rols-ofensius" },
    { id: "role.passer", label: "passador", category: "participant_role", aliases: ["passador", "passadora"], canonical_ref: "docs/DOMAIN_MODEL.md#6-flux-de-pilota" },
    { id: "role.goalkeeper", label: "porter", category: "participant_role", aliases: ["porter", "portera"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md" },
    { id: "defense.first", label: "primer defensor", category: "defensive_role", aliases: ["primer defensor", "1r defensor", "d1"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#rols-defensius" },
    { id: "defense.second", label: "segon defensor", category: "defensive_role", aliases: ["segon defensor", "2n defensor", "d2"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#rols-defensius" },
    { id: "defense.third", label: "tercer defensor", category: "defensive_role", aliases: ["tercer defensor", "3r defensor", "d3"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#rols-defensius" },
    { id: "defense.advanced", label: "avançat defensiu", category: "defensive_role", aliases: ["avançat", "avancat"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#rols-defensius" },
    { id: "action.one_v_one", label: "1x1", category: "action", aliases: ["1x1", "1v1", "1 contra 1"], canonical_ref: "docs/DOMAIN_MODEL.md#1x1--finta" },
    { id: "action.two_v_one", label: "2x1", category: "action", aliases: ["2x1", "2v1", "2 contra 1"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#2x1" },
    { id: "action.two_v_two", label: "2x2", category: "action", aliases: ["2x2", "2v2", "2 contra 2"], canonical_ref: "corpus/uvof.semantic.json" },
    { id: "action.pass", label: "passada", category: "action", aliases: ["passa", "passada", "passar"], canonical_ref: "docs/DOMAIN_MODEL.md#6-flux-de-pilota" },
    { id: "action.reception", label: "recepció", category: "action", aliases: ["rep", "rebre", "recepcio", "recepció"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md" },
    { id: "action.feint", label: "finta", category: "action", aliases: ["finta", "fintar"], canonical_ref: "docs/DOMAIN_MODEL.md#1x1--finta" },
    { id: "action.block", label: "bloqueig", category: "action", aliases: ["bloqueig", "bloqueja", "bloquejar"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#bloqueig-estatic" },
    { id: "action.slide", label: "lliscament", category: "action", aliases: ["lliscament", "llisca", "lliscar"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#lliscament" },
    { id: "action.exchange", label: "permuta", category: "action", aliases: ["permuta"], canonical_ref: "docs/DOMAIN_MODEL.md#10-permuta" },
    { id: "action.cross", label: "encreuament", category: "action", aliases: ["encreuament", "encreua", "creuament"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#encreuament" },
    { id: "action.continuity", label: "continuïtat", category: "action", aliases: ["continuitat", "continuïtat", "continua"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md" },
    { id: "action.finish", label: "finalització", category: "action", aliases: ["finalitza", "finalitzacio", "finalització", "llança", "llencament", "llançament"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md" },
    { id: "space.interval_12", label: "interval 1–2", category: "space", aliases: ["1-2", "1–2", "12"], canonical_ref: "docs/DOMAIN_MODEL.md#3-espais-i-intervals" },
    { id: "space.interval_23", label: "interval 2–3", category: "space", aliases: ["2-3", "2–3", "23"], canonical_ref: "docs/DOMAIN_MODEL.md#3-espais-i-intervals" },
    { id: "space.interval_33", label: "interval 3–3", category: "space", aliases: ["3-3", "3–3", "33"], canonical_ref: "docs/DOMAIN_MODEL.md#3-espais-i-intervals" },
    { id: "defense.system_60", label: "defensa 6:0", category: "tactical_context", aliases: ["6:0", "6-0"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#sistemes-defensius" },
    { id: "defense.system_51", label: "defensa 5:1", category: "tactical_context", aliases: ["5:1", "5-1"], canonical_ref: "docs/HANDBALL_KNOWLEDGE.md#sistemes-defensius" },
    { id: "material.cone", label: "con", category: "material", aliases: ["con", "cons"], canonical_ref: "docs/DOMAIN_MODEL.md#2-referencia-oposicional" },
    { id: "material.bench", label: "banc", category: "material", aliases: ["banc", "banqueta"], canonical_ref: "docs/DOMAIN_MODEL.md#2-referencia-oposicional" },
    { id: "material.cylinder", label: "cilindre", category: "material", aliases: ["cilindre", "xirimbolo"], canonical_ref: "docs/DOMAIN_MODEL.md#2-referencia-oposicional" },
    { id: "ball", label: "pilota", category: "material", aliases: ["pilota", "pilotes"], canonical_ref: "docs/DOMAIN_MODEL.md#6-flux-de-pilota" }
  ],
  candidate_phrases: [
    { label: "passada i va", aliases: ["passada i va", "passa i va"], reason: "Frase explícita sense definició canònica completa al vocabulari actual." }
  ]
  };
});
