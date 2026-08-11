window.TRACA_UVOF015_CASE = {
  id: "TR-UVOF-015",
  name: "Tres 1x1 per zones sense bot",
  status: "validated_coach",
  exercise_type: "duels_per_zones",
  description: "Tres zones delimitades on es juguen simultàniament tres duels 1x1. A cada zona, l’atacant amb pilota passa al passador, inicia la cursa sense pilota, rep orientat i resol amb llibertat absoluta. Pot continuar per l’espai inicial si obté avantatge o fer una finta cap a l’espai contigu si el defensor tanca. Sense bot.",
  engine_notice: "UVOF015 disposa d’un provider i un resolutor canònics. Els textos nous passen pel provider parcial i no hereten aquesta geometria.",
  semantic_ref: "corpus/uvof.semantic.json#/exercicis/14",
  spatial_ref: "exercises/TR-UVOF-015/spatial-relations.json",
  geometry_ref: "exercises/TR-UVOF-015/geometry.json",
  source_refs: [
    "FITXA ORIGINAL / BATERÍA D'ACTIVITATS · fila 18 · =INDEX(UVUOF;15)",
    "corpus/uvof.semantic.json#/exercicis/14",
    "exercises/TR-UVOF-015/spatial-relations.json",
    "exercises/TR-UVOF-015/geometry.json"
  ],
  organization: {
    zones: 3,
    duels: 3,
    execution: "simultània i replicada",
    draggable_entities: 16,
    decision_branches: 3,
    alternatives: 12
  },
  participants: {
    attack: ["A_ESQ", "A_CE", "A_DRE", "P_ESQ", "P_CE", "P_DRE"],
    defense: ["D_ESQ", "D_CE", "D_DRE"]
  },
  materials: ["LIM_0", "LIM_1", "LIM_2", "LIM_3"],
  balls: ["B_ESQ", "B_CE", "B_DRE"],
  phases: [
    { id: "F1.1", title: "Passada inicial", detail: "Cada atacant passa al passador de la mateixa zona." },
    { id: "F1.2", title: "Cursa i recepció", detail: "Inicia en carrera sense pilota i rep la devolució orientat." },
    { id: "F1.3", title: "Decisió 1x1", detail: "Escull lliurement un dels dos espais del defensor." },
    { id: "F1.4", title: "Resolució", detail: "Continua si té avantatge o canvia direcció i ritme si el defensor tanca." }
  ],
  conditions: [
    "Tres duels simultanis amb oposició real",
    "Dues opcions espacials per defensor",
    "Superació en travessar la línia defensiva",
    "Bot prohibit"
  ],
  invariants: [
    "No es fixa cap interval defensiu concret.",
    "La llibertat inicial i la resolució no estan predeterminades.",
    "Passada i devolució precedeixen el duel.",
    "La representació pot replicar una pilota a cada zona."
  ],
  future_capabilities: [
    "múltiples estats",
    "posicions futures",
    "bancs, cons i cilindres",
    "pivot i extrem",
    "passada, finta, 2x1 i recuperació",
    "subaccions i simetria"
  ],
  canonical_concepts: [
    { id: "action.one_v_one", label: "1x1", category: "action", knowledge_state: "validated", source: "canonical_case_provider", canonical_concept_ref: "docs/DOMAIN_MODEL.md#1x1--finta" },
    { id: "action.pass", label: "passada", category: "action", knowledge_state: "validated", source: "canonical_case_provider", canonical_concept_ref: "docs/DOMAIN_MODEL.md#6-flux-de-pilota" },
    { id: "action.reception", label: "recepció orientada", category: "action", knowledge_state: "validated", source: "canonical_case_provider", canonical_concept_ref: "corpus/uvof.semantic.json#/exercicis/14/fases/0" },
    { id: "action.feint", label: "finta", category: "action", knowledge_state: "validated", source: "canonical_case_provider", canonical_concept_ref: "docs/DOMAIN_MODEL.md#1x1--finta" },
    { id: "role.passer", label: "passador", category: "participant_role", knowledge_state: "validated", source: "canonical_case_provider", canonical_concept_ref: "corpus/uvof.semantic.json#/exercicis/14/participants" },
    { id: "material.cone", label: "con", category: "material", knowledge_state: "validated", source: "canonical_case_provider", canonical_concept_ref: "corpus/uvof.semantic.json#/exercicis/14/materials" }
  ]
};
