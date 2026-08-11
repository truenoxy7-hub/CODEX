(function (root, factory) {
  const dictionary = factory();
  if (typeof module === "object" && module.exports) module.exports = dictionary;
  root.TRACA_VISUAL_FUNCTIONAL_DICTIONARY = dictionary;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  return {
  "$schema": "../schema/traca.visual-functional-dictionary.schema.v0.1.json",
  "meta": {
    "id": "TRACA_visual_functional_dictionary",
    "version": "0.1.0",
    "status": "operational_with_audited_inventory",
    "reported_inventory_evidence_count": 103,
    "imported_inventory_evidence_count": 103,
    "limitation": "S'han importat i classificat les 103 evidències de l'inventari. Les evidències candidates, ambigües o superades es conserven per traçabilitat però no poden omplir slots obligatoris ni generar geometria."
  },
  "authority_order": [
    "coach_validated",
    "graphic_legend",
    "canonical_validated",
    "semantic_validated",
    "spatial_validated",
    "repeated_observation",
    "candidate",
    "inference"
  ],
  "sources": [
    {
      "id": "SRC_COACH_ITERATION_2026_08_11",
      "authority": "coach_validated",
      "status": "available",
      "ref": "coach_instruction:2026-08-11#visual-functional-dictionary"
    },
    {
      "id": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "authority": "repeated_observation",
      "status": "available",
      "ref": "coach_attachment:INVENTARI_DE_REPRESENTACIONS_TRACA.md",
      "reported_evidence_count": 103,
      "imported_evidence_count": 103
    },
    {
      "id": "SRC_COACH_GRAPHIC_LEGEND",
      "authority": "graphic_legend",
      "status": "available",
      "ref": "coach_attachment:AEB796E5-F49A-4466-A62E-79AA36F44AD4.png"
    }
  ],
  "evidence": [
    {
      "id": "E_COACH_ATTACKER",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "Atacant: cercle de contorn continu."
    },
    {
      "id": "E_COACH_BALL_OWNER",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "Atacant amb pilota: atacant més pilota adjacent."
    },
    {
      "id": "E_COACH_DEFENDER",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "Defensor: triangle de contorn continu."
    },
    {
      "id": "E_COACH_MOVEMENT",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "Moviment sense pilota: línia contínua amb fletxa."
    },
    {
      "id": "E_COACH_PASS",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "Passada: línia discontínua amb fletxa."
    },
    {
      "id": "E_COACH_PASS_FEINT",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "Finta de passada: passada discontínua amb marca obliqua."
    },
    {
      "id": "E_COACH_SHOT",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "Llançament: fletxa reforçada de doble traç."
    },
    {
      "id": "E_COACH_SHOT_FEINT",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "Finta de llançament: llançament amb marca obliqua."
    },
    {
      "id": "E_COACH_FEINT",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "Finta: trajectòria amb canvi de direcció perceptible i fletxa."
    },
    {
      "id": "E_COACH_BLOCK",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "Bloqueig o pantalla: atacant amb marca perpendicular pròxima a la relació bloquejada."
    },
    {
      "id": "E_COACH_DEFENSIVE_BLOCK",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "Blocatge: defensor, recorregut i marca perpendicular final."
    },
    {
      "id": "E_COACH_TEMPORAL_STATE",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "Posició abans o després: contorn discontinu del participant."
    },
    {
      "id": "E_COACH_DRIBBLE",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "Desplaçament en bot: trajectòria ondulada amb fletxa."
    },
    {
      "id": "E_COACH_NO_GLYPH_2X1",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "El 2x1 es compon amb participants i accions; no té glif propi."
    },
    {
      "id": "E_COACH_RELATIONAL_SPACE",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "L'espai tàctic és una relació interna i no una primitiva visible."
    },
    {
      "id": "E_COACH_CROSSING",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "L'encreuament és funcional: un jugador ataca l'espai contrari al del primer."
    },
    {
      "id": "E_COACH_PIVOT_SLIDE",
      "source_ref": "SRC_COACH_ITERATION_2026_08_11",
      "statement": "El lliscament del pivot és curt, lateral i manté relació amb 6 m."
    },
    {
      "id": "E_LEGEND_ATTACKER",
      "source_ref": "SRC_COACH_GRAPHIC_LEGEND",
      "statement": "Atacant: cercle de contorn continu."
    },
    {
      "id": "E_LEGEND_BALL_OWNER",
      "source_ref": "SRC_COACH_GRAPHIC_LEGEND",
      "statement": "Atacant amb pilota: cercle i punt petit adjacent."
    },
    {
      "id": "E_LEGEND_DEFENDER",
      "source_ref": "SRC_COACH_GRAPHIC_LEGEND",
      "statement": "Defensor: triangle de contorn continu."
    },
    {
      "id": "E_LEGEND_MOVEMENT",
      "source_ref": "SRC_COACH_GRAPHIC_LEGEND",
      "statement": "Desplaçament sense pilota: línia contínua amb fletxa."
    },
    {
      "id": "E_LEGEND_PASS",
      "source_ref": "SRC_COACH_GRAPHIC_LEGEND",
      "statement": "Passada: línia discontínua amb fletxa."
    },
    {
      "id": "E_LEGEND_PASS_FEINT",
      "source_ref": "SRC_COACH_GRAPHIC_LEGEND",
      "statement": "Finta de passada: passada discontínua amb marca obliqua curta."
    },
    {
      "id": "E_LEGEND_SHOT",
      "source_ref": "SRC_COACH_GRAPHIC_LEGEND",
      "statement": "Llançament a porteria: fletxa de doble traç continu."
    },
    {
      "id": "E_LEGEND_SHOT_FEINT",
      "source_ref": "SRC_COACH_GRAPHIC_LEGEND",
      "statement": "Finta de llançament: llançament amb marca obliqua curta."
    },
    {
      "id": "E_LEGEND_FEINT",
      "source_ref": "SRC_COACH_GRAPHIC_LEGEND",
      "statement": "Finta: trajectòria amb canvi de direcció perceptible i fletxa."
    },
    {
      "id": "E_LEGEND_BLOCK",
      "source_ref": "SRC_COACH_GRAPHIC_LEGEND",
      "statement": "Bloqueig o pantalla: atacant amb marca perpendicular pròxima."
    },
    {
      "id": "E_LEGEND_DEFENSIVE_BLOCK",
      "source_ref": "SRC_COACH_GRAPHIC_LEGEND",
      "statement": "Blocatge: defensor, recorregut i marca perpendicular final."
    },
    {
      "id": "E_LEGEND_TEMPORAL_STATE",
      "source_ref": "SRC_COACH_GRAPHIC_LEGEND",
      "statement": "Posició abans o després: contorn discontinu del participant."
    },
    {
      "id": "E_LEGEND_DRIBBLE",
      "source_ref": "SRC_COACH_GRAPHIC_LEGEND",
      "statement": "Desplaçament en bot: trajectòria ondulada amb fletxa."
    },
    {
      "id": "EV-ENT-001-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La mateixa convenció queda explicitada per la llegenda i per validació directa/prèvia de l’entrenador; no s’estén més enllà del seu abast.",
      "label": "atacant/defensor",
      "classification": "confirmada_per_ambdós",
      "exercise_ref": "TR-UVOF-001"
    },
    {
      "id": "EV-LINE-001-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La mateixa convenció queda explicitada per la llegenda i per validació directa/prèvia de l’entrenador; no s’estén més enllà del seu abast.",
      "label": "moviment/passada",
      "classification": "confirmada_per_ambdós",
      "exercise_ref": "TR-UVOF-001"
    },
    {
      "id": "EV-TEMP-001-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Les còpies locals són coherents amb 14 UVOF, però la llegenda només confirma la convenció normativa abans/després, no tots els cercles sòlids heretats.",
      "label": "estat temporal",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-001"
    },
    {
      "id": "EV-FINTA-001-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "El significat és conegut, però la representació local o la composició encara no queda prou discriminada.",
      "label": "finta en U",
      "classification": "candidat",
      "exercise_ref": "TR-UVOF-001"
    },
    {
      "id": "EV-2X1-001-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La nova validació fixa el significat o la composició; el cas UVOF només n’aporta context, no una regla geomètrica.",
      "label": "superioritats",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-001"
    },
    {
      "id": "EV-MAT-001-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La nova validació fixa el significat o la composició; el cas UVOF només n’aporta context, no una regla geomètrica.",
      "label": "materials",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-001"
    },
    {
      "id": "EV-SPACE-001-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "intervals",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-001"
    },
    {
      "id": "EV-ORG-001-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "dues bandes",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-001"
    },
    {
      "id": "EV-ORG-002-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "bandes",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-002"
    },
    {
      "id": "EV-MAT-002-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La nova validació fixa el significat o la composició; el cas UVOF només n’aporta context, no una regla geomètrica.",
      "label": "xirimbolo",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-002"
    },
    {
      "id": "EV-TEMP-002-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Observació repetida; la llegenda temporal és normativa, però no valida automàticament cada còpia sòlida del corpus.",
      "label": "estats de `L`",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-002"
    },
    {
      "id": "EV-FINTA-002-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "finta",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-002"
    },
    {
      "id": "EV-ENCR-002-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La definició funcional descarta el simple tall de línies; el gràfic no permet aïllar interacció, ordre i atac de l’espai contrari.",
      "label": "encreuament/continuïtat",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-002"
    },
    {
      "id": "EV-FLOW-002-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Superada com a dubte de lectura: la passada té codi discontínuu; aquí hi ha una omissió local, no una convenció alternativa.",
      "label": "flux absent",
      "classification": "superada",
      "exercise_ref": "TR-UVOF-002"
    },
    {
      "id": "EV-SPACE-002-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "intervals",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-002"
    },
    {
      "id": "EV-UNASSIGN-002-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "cons",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-002"
    },
    {
      "id": "EV-FORM-003-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "6x6/6:0",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-003"
    },
    {
      "id": "EV-TEMP-003-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Observació repetida; la identitat exacta de cada còpia continua depenent de la semàntica.",
      "label": "estats successius",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-003"
    },
    {
      "id": "EV-PASS-003-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "pilota i branques",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-003"
    },
    {
      "id": "EV-FINTA-003-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "1x1 bilateral",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-003"
    },
    {
      "id": "EV-BLOCK-003-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Símbol i significat funcional confirmats per llegenda i entrenador; UVOF003 queda com a ús local no prou net, no com a font del símbol.",
      "label": "bloqueig estàtic",
      "classification": "confirmada_per_ambdós",
      "exercise_ref": "TR-UVOF-003"
    },
    {
      "id": "EV-ENCR-003-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La definició funcional descarta el simple tall de línies; l’assignació local continua sense discriminants suficients.",
      "label": "encreuament i canvi de banda",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-003"
    },
    {
      "id": "EV-2X1-003-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La nova validació fixa el significat o la composició; el cas UVOF només n’aporta context, no una regla geomètrica.",
      "label": "superioritats",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-003"
    },
    {
      "id": "EV-SPACE-003-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "amplitud i intervals",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-003"
    },
    {
      "id": "EV-ORG-004-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "variants",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-004"
    },
    {
      "id": "EV-POSS-004-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La mateixa convenció queda explicitada per la llegenda i per validació directa/prèvia de l’entrenador; no s’estén més enllà del seu abast.",
      "label": "possessió",
      "classification": "confirmada_per_ambdós",
      "exercise_ref": "TR-UVOF-004"
    },
    {
      "id": "EV-PASS-004-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La mateixa convenció queda explicitada per la llegenda i per validació directa/prèvia de l’entrenador; no s’estén més enllà del seu abast.",
      "label": "passada/devolució",
      "classification": "confirmada_per_ambdós",
      "exercise_ref": "TR-UVOF-004"
    },
    {
      "id": "EV-REC-004-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "recepció en carrera",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-004"
    },
    {
      "id": "EV-HAND-004-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "El significat és conegut, però la representació local o la composició encara no queda prou discriminada.",
      "label": "handicap de D2",
      "classification": "candidat",
      "exercise_ref": "TR-UVOF-004"
    },
    {
      "id": "EV-2X1-004-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "continuïtat",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-004"
    },
    {
      "id": "EV-UNASSIGN-004-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "cons addicionals",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-004"
    },
    {
      "id": "EV-FORM-005-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "5:1",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-005"
    },
    {
      "id": "EV-PV-005-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "El significat és conegut, però la representació local o la composició encara no queda prou discriminada.",
      "label": "pivot i banda alliberada",
      "classification": "candidat",
      "exercise_ref": "TR-UVOF-005"
    },
    {
      "id": "EV-FLOW-005-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Superada com a buit de codi: el gràfic és incomplet, però les primitives necessàries ja són conegudes.",
      "label": "acció no representada",
      "classification": "superada",
      "exercise_ref": "TR-UVOF-005"
    },
    {
      "id": "EV-SPACE-005-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "El significat és conegut, però la representació local o la composició encara no queda prou discriminada.",
      "label": "finalització 6 m",
      "classification": "candidat",
      "exercise_ref": "TR-UVOF-005"
    },
    {
      "id": "EV-ENT-006-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "participants/estats",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-006"
    },
    {
      "id": "EV-MAT-006-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La nova validació fixa el significat o la composició; el cas UVOF només n’aporta context, no una regla geomètrica.",
      "label": "dos cilindres",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-006"
    },
    {
      "id": "EV-POSS-006-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "possessió temporal",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-006"
    },
    {
      "id": "EV-PASS-006-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "flux local i canvi de banda",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-006"
    },
    {
      "id": "EV-FINTA-006-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "1x1/encreuaments",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-006"
    },
    {
      "id": "EV-2X1-006-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La nova validació fixa el significat o la composició; el cas UVOF només n’aporta context, no una regla geomètrica.",
      "label": "continuïtats",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-006"
    },
    {
      "id": "EV-BAND-006-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "El significat és conegut, però la representació local o la composició encara no queda prou discriminada.",
      "label": "canvi de focus",
      "classification": "candidat",
      "exercise_ref": "TR-UVOF-006"
    },
    {
      "id": "EV-ENT-007-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "participants temporals",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-007"
    },
    {
      "id": "EV-MAT-007-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La nova validació fixa el significat o la composició; el cas UVOF només n’aporta context, no una regla geomètrica.",
      "label": "cilindre substitut",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-007"
    },
    {
      "id": "EV-MOVE-007-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La mateixa convenció queda explicitada per la llegenda i per validació directa/prèvia de l’entrenador; no s’estén més enllà del seu abast.",
      "label": "moviment sense pilota definida",
      "classification": "confirmada_per_ambdós",
      "exercise_ref": "TR-UVOF-007"
    },
    {
      "id": "EV-SEQ-007-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "dues activacions",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-007"
    },
    {
      "id": "EV-2X1-007-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "dos 2x1",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-007"
    },
    {
      "id": "EV-UNASSIGN-007-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "cons",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-007"
    },
    {
      "id": "EV-FORM-008-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "5:1",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-008"
    },
    {
      "id": "EV-PASS-008-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La mateixa convenció queda explicitada per la llegenda i per validació directa/prèvia de l’entrenador; no s’estén més enllà del seu abast.",
      "label": "CE→L_OPOSAT",
      "classification": "confirmada_per_ambdós",
      "exercise_ref": "TR-UVOF-008"
    },
    {
      "id": "EV-REC-008-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "recepció en moviment",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-008"
    },
    {
      "id": "EV-CONC-008-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "El significat és conegut, però la representació local o la composició encara no queda prou discriminada.",
      "label": "concentració",
      "classification": "candidat",
      "exercise_ref": "TR-UVOF-008"
    },
    {
      "id": "EV-1X1-008-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "atac posterior",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-008"
    },
    {
      "id": "EV-POSS-008-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Superada com a buit de codi: la llegenda defineix atacant amb pilota; UVOF008 n’omet la marca.",
      "label": "possessió no marcada",
      "classification": "superada",
      "exercise_ref": "TR-UVOF-008"
    },
    {
      "id": "EV-MAT-009-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La nova validació fixa el significat o la composició; el cas UVOF només n’aporta context, no una regla geomètrica.",
      "label": "dos bancs",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-009"
    },
    {
      "id": "EV-MAT-009-B",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La nova validació fixa el significat o la composició; el cas UVOF només n’aporta context, no una regla geomètrica.",
      "label": "cilindre restringit",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-009"
    },
    {
      "id": "EV-POSS-009-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "tres pilotes / dues icones",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-009"
    },
    {
      "id": "EV-PERM-009-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "permuta central–lateral",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-009"
    },
    {
      "id": "EV-FLOW-009-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "fluxos independents",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-009"
    },
    {
      "id": "EV-1X1-009-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "El significat és conegut, però la representació local o la composició encara no queda prou discriminada.",
      "label": "banc exterior i 2x1",
      "classification": "candidat",
      "exercise_ref": "TR-UVOF-009"
    },
    {
      "id": "EV-SHOT-009-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Superada la hipòtesi «tir = passada amb destí porteria»: la llegenda dona al llançament un doble traç propi.",
      "label": "llançament",
      "classification": "superada",
      "exercise_ref": "TR-UVOF-009"
    },
    {
      "id": "EV-SLIDE-009-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La definició entrenador-validada confirma trajectòria curta/lateral de PV lligada a l’àrea i al defensor; falta resoldre’n la composició geomètrica.",
      "label": "lliscament",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-009"
    },
    {
      "id": "EV-PERM-010-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "permuta",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-010"
    },
    {
      "id": "EV-PASS-010-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Superada la confusió global tir/passada; la superposició local d’UVOF010 continua sent una desviació del codi normatiu.",
      "label": "segona acció",
      "classification": "superada",
      "exercise_ref": "TR-UVOF-010"
    },
    {
      "id": "EV-BENCH-010-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La nova validació fixa el significat o la composició; el cas UVOF només n’aporta context, no una regla geomètrica.",
      "label": "banc",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-010"
    },
    {
      "id": "EV-CON-010-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "El significat és conegut, però la representació local o la composició encara no queda prou discriminada.",
      "label": "ancoratge de PV",
      "classification": "candidat",
      "exercise_ref": "TR-UVOF-010"
    },
    {
      "id": "EV-SLIDE-010-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Mateix resultat: concepte confirmat, composició geomètrica encara pendent.",
      "label": "lliscament",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-010"
    },
    {
      "id": "EV-BRANCH-010-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Superada com a requisit visual: les alternatives no necessiten glif ni separador.",
      "label": "dues opcions tancades",
      "classification": "superada",
      "exercise_ref": "TR-UVOF-010"
    },
    {
      "id": "EV-UNASSIGN-010-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "restes visuals",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-010"
    },
    {
      "id": "EV-FORM-011-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "relació 4x4",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-011"
    },
    {
      "id": "EV-POSS-011-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La mateixa convenció queda explicitada per la llegenda i per validació directa/prèvia de l’entrenador; no s’estén més enllà del seu abast.",
      "label": "possessió inicial",
      "classification": "confirmada_per_ambdós",
      "exercise_ref": "TR-UVOF-011"
    },
    {
      "id": "EV-PERM-011-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "permuta",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-011"
    },
    {
      "id": "EV-FLOW-011-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Superada com a dubte de lectura: la passada té codi discontínuu; aquí hi ha una omissió local, no una convenció alternativa.",
      "label": "L→EXT→L",
      "classification": "superada",
      "exercise_ref": "TR-UVOF-011"
    },
    {
      "id": "EV-1X1-011-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "El significat és conegut, però la representació local o la composició encara no queda prou discriminada.",
      "label": "inici i continuïtat",
      "classification": "candidat",
      "exercise_ref": "TR-UVOF-011"
    },
    {
      "id": "EV-PERM-012-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "permuta",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-012"
    },
    {
      "id": "EV-POSS-012-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "dues pilotes",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-012"
    },
    {
      "id": "EV-BENCH-012-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La nova validació fixa el significat o la composició; el cas UVOF només n’aporta context, no una regla geomètrica.",
      "label": "banc condicionant",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-012"
    },
    {
      "id": "EV-PASS-012-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "dos fluxos",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-012"
    },
    {
      "id": "EV-REC-012-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "recepcions funcionals",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-012"
    },
    {
      "id": "EV-2X1-012-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La nova validació fixa el significat o la composició; el cas UVOF només n’aporta context, no una regla geomètrica.",
      "label": "dues superioritats",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-012"
    },
    {
      "id": "EV-SLIDE-012-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Mateix resultat: concepte confirmat, composició geomètrica encara pendent.",
      "label": "lliscament de PV",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-012"
    },
    {
      "id": "EV-EXT-012-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "El significat és conegut, però la representació local o la composició encara no queda prou discriminada.",
      "label": "resolució exterior",
      "classification": "candidat",
      "exercise_ref": "TR-UVOF-012"
    },
    {
      "id": "EV-UNASSIGN-012-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "cons",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-012"
    },
    {
      "id": "EV-FORM-013-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "El significat és conegut, però la representació local o la composició encara no queda prou discriminada.",
      "label": "4x4 + passador",
      "classification": "candidat",
      "exercise_ref": "TR-UVOF-013"
    },
    {
      "id": "EV-PERM-013-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "permuta",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-013"
    },
    {
      "id": "EV-PASS-013-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "passada i opció a PV",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-013"
    },
    {
      "id": "EV-REC-013-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "recepció central",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-013"
    },
    {
      "id": "EV-INT-013-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "interval 2–3",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-013"
    },
    {
      "id": "EV-SLIDE-013-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Mateix resultat: concepte confirmat, composició geomètrica encara pendent.",
      "label": "lliscament de PV",
      "classification": "confirmada_per_entrenador",
      "exercise_ref": "TR-UVOF-013"
    },
    {
      "id": "EV-UNASSIGN-013-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La primitiva pot ser coneguda, però el mapping local d’actors, línies, materials o seqüència continua sense resoldre.",
      "label": "con",
      "classification": "ambigua",
      "exercise_ref": "TR-UVOF-013"
    },
    {
      "id": "EV-FORM-014-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "6:0",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-014"
    },
    {
      "id": "EV-PERM-014-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "permuta inicial",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-014"
    },
    {
      "id": "EV-PASS-014-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La mateixa convenció queda explicitada per la llegenda i per validació directa/prèvia de l’entrenador; no s’estén més enllà del seu abast.",
      "label": "habilitació",
      "classification": "confirmada_per_ambdós",
      "exercise_ref": "TR-UVOF-014"
    },
    {
      "id": "EV-OPEN-014-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Superada com a buit visual: les alternatives poden romandre només a la semàntica.",
      "label": "joc obert",
      "classification": "superada",
      "exercise_ref": "TR-UVOF-014"
    },
    {
      "id": "EV-TEMP-014-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Observació repetida; l’assignació d’identitats entre còpies continua parcial.",
      "label": "estats repetits",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-014"
    },
    {
      "id": "EV-ZONE-015-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "tres zones",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-015"
    },
    {
      "id": "EV-DEF-015-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "un defensor per zona",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-015"
    },
    {
      "id": "EV-REP-015-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "El significat és conegut, però la representació local o la composició encara no queda prou discriminada.",
      "label": "exemplar replicat",
      "classification": "candidat",
      "exercise_ref": "TR-UVOF-015"
    },
    {
      "id": "EV-PASS-015-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La mateixa convenció queda explicitada per la llegenda i per validació directa/prèvia de l’entrenador; no s’estén més enllà del seu abast.",
      "label": "passada i devolució",
      "classification": "confirmada_per_ambdós",
      "exercise_ref": "TR-UVOF-015"
    },
    {
      "id": "EV-REC-015-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "recepció orientada",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-015"
    },
    {
      "id": "EV-1X1-015-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "El significat és conegut, però la representació local o la composició encara no queda prou discriminada.",
      "label": "elecció posterior",
      "classification": "candidat",
      "exercise_ref": "TR-UVOF-015"
    },
    {
      "id": "EV-SPACE-015-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "La correspondència es repeteix en diversos UVOF i continua coherent; no es promociona a regla canònica.",
      "label": "dos espais",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-015"
    },
    {
      "id": "EV-TEMP-015-A",
      "source_ref": "SRC_INVENTORY_REPRESENTATIONS_V0_1",
      "statement": "Observació repetida; la relació inicial/futura és clara, encara que el glif local no sigui el discontinu normatiu.",
      "label": "atacant inicial/futur",
      "classification": "observació_repetida",
      "exercise_ref": "TR-UVOF-015"
    }
  ],
  "theme": {
    "id": "traca_default_court_theme",
    "status": "default_style",
    "colors_are_semantic": false,
    "colors": {
      "attacker": {
        "fill": "#2f70c9",
        "stroke": "#123e79",
        "text": "#ffffff"
      },
      "defender": {
        "fill": "#ef5b55",
        "stroke": "#8f2624",
        "text": "#ffffff"
      },
      "movement": "#173f33",
      "pass": "#d55832",
      "shot": "#a51f28"
    }
  },
  "entries": [
    {
      "id": "VF_ATTACKER",
      "concept": "attacker",
      "definition": "Participant d'atac representat per un cercle de contorn continu.",
      "type": "primitive",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_COACH_GRAPHIC_LEGEND",
        "SRC_INVENTORY_REPRESENTATIONS_V0_1"
      ],
      "evidence_refs": [
        "E_COACH_ATTACKER",
        "E_LEGEND_ATTACKER",
        "EV-ENT-001-A"
      ],
      "visual": {
        "primitive": "participant",
        "shape": "circle",
        "outline": "continuous"
      },
      "semantic_refs": [
        "role.attacker"
      ],
      "notes": [
        "El color pertany al tema, no al significat tàctic."
      ]
    },
    {
      "id": "VF_ATTACKER_WITH_BALL",
      "concept": "attacker_with_ball",
      "definition": "Atacant que té possessió de pilota.",
      "type": "composition",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_COACH_GRAPHIC_LEGEND",
        "SRC_INVENTORY_REPRESENTATIONS_V0_1"
      ],
      "evidence_refs": [
        "E_COACH_BALL_OWNER",
        "E_LEGEND_BALL_OWNER",
        "EV-POSS-004-A",
        "EV-POSS-011-A"
      ],
      "visual": {
        "compose": [
          "attacker",
          "ball"
        ],
        "ball_anchor": "adjacent"
      },
      "semantic_refs": [
        "ball.possession"
      ],
      "notes": []
    },
    {
      "id": "VF_DEFENDER",
      "concept": "defender",
      "definition": "Participant defensiu representat per un triangle de contorn continu.",
      "type": "primitive",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_COACH_GRAPHIC_LEGEND",
        "SRC_INVENTORY_REPRESENTATIONS_V0_1"
      ],
      "evidence_refs": [
        "E_COACH_DEFENDER",
        "E_LEGEND_DEFENDER",
        "EV-ENT-001-A"
      ],
      "visual": {
        "primitive": "participant",
        "shape": "triangle",
        "outline": "continuous"
      },
      "semantic_refs": [
        "role.defender"
      ],
      "notes": []
    },
    {
      "id": "VF_MOVEMENT_WITHOUT_BALL",
      "concept": "movement_without_ball",
      "definition": "Desplaçament d'un participant sense possessió.",
      "type": "primitive",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_COACH_GRAPHIC_LEGEND",
        "SRC_INVENTORY_REPRESENTATIONS_V0_1"
      ],
      "evidence_refs": [
        "E_COACH_MOVEMENT",
        "E_LEGEND_MOVEMENT",
        "EV-MOVE-007-A"
      ],
      "visual": {
        "line": "continuous",
        "marker": "arrow"
      },
      "semantic_refs": [
        "action.movement_without_ball"
      ],
      "notes": []
    },
    {
      "id": "VF_PASS",
      "concept": "pass",
      "definition": "Transferència de pilota d'un emissor a un receptor identificats.",
      "type": "primitive",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_COACH_GRAPHIC_LEGEND",
        "SRC_INVENTORY_REPRESENTATIONS_V0_1"
      ],
      "evidence_refs": [
        "E_COACH_PASS",
        "E_LEGEND_PASS",
        "EV-LINE-001-A",
        "EV-PASS-004-A"
      ],
      "visual": {
        "line": "dashed",
        "marker": "arrow"
      },
      "semantic_refs": [
        "action.pass"
      ],
      "notes": [
        "Els extrems estan ancorats als estats de l'emissor i el receptor."
      ]
    },
    {
      "id": "VF_PASS_FEINT",
      "concept": "pass_feint",
      "definition": "Finta que simula una passada sense completar la transferència.",
      "type": "composition",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_COACH_GRAPHIC_LEGEND"
      ],
      "evidence_refs": [
        "E_COACH_PASS_FEINT",
        "E_LEGEND_PASS_FEINT"
      ],
      "visual": {
        "compose": [
          "pass",
          "oblique_cancellation_mark"
        ]
      },
      "semantic_refs": [
        "action.pass_feint"
      ],
      "notes": []
    },
    {
      "id": "VF_SHOT",
      "concept": "shot",
      "definition": "Llançament a porteria.",
      "type": "primitive",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_COACH_GRAPHIC_LEGEND"
      ],
      "evidence_refs": [
        "E_COACH_SHOT",
        "E_LEGEND_SHOT"
      ],
      "visual": {
        "line": "double_stroke",
        "marker": "arrow"
      },
      "semantic_refs": [
        "action.shot"
      ],
      "notes": []
    },
    {
      "id": "VF_SHOT_FEINT",
      "concept": "shot_feint",
      "definition": "Finta que simula un llançament.",
      "type": "composition",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_COACH_GRAPHIC_LEGEND"
      ],
      "evidence_refs": [
        "E_COACH_SHOT_FEINT",
        "E_LEGEND_SHOT_FEINT"
      ],
      "visual": {
        "compose": [
          "shot",
          "oblique_cancellation_mark"
        ]
      },
      "semantic_refs": [
        "action.shot_feint"
      ],
      "notes": []
    },
    {
      "id": "VF_FEINT",
      "concept": "feint",
      "definition": "Acció amb atac inicial, compromís, canvi perceptible de direcció i ritme i sortida per l'espai contigu.",
      "type": "primitive",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_COACH_GRAPHIC_LEGEND"
      ],
      "evidence_refs": [
        "E_COACH_FEINT",
        "E_LEGEND_FEINT"
      ],
      "visual": {
        "line": "functional_curve",
        "marker": "arrow",
        "direction_change": "required"
      },
      "semantic_refs": [
        "action.feint"
      ],
      "notes": [
        "El renderer no inventa ni suavitza el canvi de direcció."
      ]
    },
    {
      "id": "VF_BLOCK_SCREEN",
      "concept": "block_screen",
      "definition": "Relació de bloqueig o pantalla d'un atacant sobre una referència oposicional.",
      "type": "composition",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_COACH_GRAPHIC_LEGEND",
        "SRC_INVENTORY_REPRESENTATIONS_V0_1"
      ],
      "evidence_refs": [
        "E_COACH_BLOCK",
        "E_LEGEND_BLOCK",
        "EV-BLOCK-003-A"
      ],
      "visual": {
        "compose": [
          "attacker",
          "perpendicular_block_mark"
        ],
        "proximity": "participant_diameter"
      },
      "semantic_refs": [
        "action.block"
      ],
      "notes": [
        "La relació actor-oponent ha d'existir abans de representar-la."
      ]
    },
    {
      "id": "VF_DEFENSIVE_BLOCK",
      "concept": "defensive_block",
      "definition": "Recorregut defensiu que acaba amb una marca perpendicular.",
      "type": "composition",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_COACH_GRAPHIC_LEGEND"
      ],
      "evidence_refs": [
        "E_COACH_DEFENSIVE_BLOCK",
        "E_LEGEND_DEFENSIVE_BLOCK"
      ],
      "visual": {
        "compose": [
          "defender",
          "movement",
          "terminal_perpendicular_mark"
        ]
      },
      "semantic_refs": [
        "action.defensive_block"
      ],
      "notes": []
    },
    {
      "id": "VF_TEMPORAL_STATE",
      "concept": "participant_temporal_state",
      "definition": "Posició anterior o posterior del mateix participant.",
      "type": "primitive",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_COACH_GRAPHIC_LEGEND"
      ],
      "evidence_refs": [
        "E_COACH_TEMPORAL_STATE",
        "E_LEGEND_TEMPORAL_STATE"
      ],
      "visual": {
        "shape": "participant_shape",
        "outline": "dashed",
        "fill": "none"
      },
      "semantic_refs": [
        "participant_state"
      ],
      "notes": []
    },
    {
      "id": "VF_DRIBBLE",
      "concept": "dribble",
      "definition": "Desplaçament amb possessió i bot de pilota.",
      "type": "primitive",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_COACH_GRAPHIC_LEGEND"
      ],
      "evidence_refs": [
        "E_COACH_DRIBBLE",
        "E_LEGEND_DRIBBLE"
      ],
      "visual": {
        "line": "wavy",
        "marker": "arrow"
      },
      "semantic_refs": [
        "action.dribble"
      ],
      "notes": [
        "El renderer projecta una ona sobre la geometria funcional sense alterar-la."
      ]
    },
    {
      "id": "VF_TWO_V_ONE",
      "concept": "two_v_one",
      "definition": "Superioritat de dos atacants contra una referència defensiva.",
      "type": "no_specific_glyph",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_INVENTORY_REPRESENTATIONS_V0_1"
      ],
      "evidence_refs": [
        "E_COACH_NO_GLYPH_2X1",
        "EV-2X1-001-A",
        "EV-2X1-003-A",
        "EV-2X1-012-A"
      ],
      "visual": {
        "compose": [
          "two_attackers",
          "one_defender",
          "states",
          "relations",
          "paths_as_needed"
        ],
        "dedicated_glyph": false
      },
      "semantic_refs": [
        "action.two_v_one"
      ],
      "notes": [
        "El renderer no escriu 2x1 ni crea una icona específica."
      ]
    },
    {
      "id": "VF_RELATIONAL_SPACE",
      "concept": "relational_tactical_space",
      "definition": "Espai definit per relacions entre delimitadors.",
      "type": "relational",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11"
      ],
      "evidence_refs": [
        "E_COACH_RELATIONAL_SPACE"
      ],
      "visual": {
        "render_default": false,
        "control_overlay": "subtle_anchor_only"
      },
      "semantic_refs": [
        "space.interval",
        "space.exterior",
        "relation.behind"
      ],
      "notes": [
        "Només els límits físics reals es dibuixen."
      ]
    },
    {
      "id": "VF_CROSSING",
      "concept": "crossing",
      "definition": "Un jugador es creua funcionalment amb un altre per atacar l'espai contrari al que atacava el primer.",
      "type": "relational",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11"
      ],
      "evidence_refs": [
        "E_COACH_CROSSING"
      ],
      "visual": {
        "dedicated_glyph": false,
        "universal_geometry": "unresolved"
      },
      "semantic_refs": [
        "action.cross"
      ],
      "notes": [
        "No equival a dues línies que simplement es tallen."
      ]
    },
    {
      "id": "VF_PIVOT_SLIDE",
      "concept": "pivot_slide",
      "definition": "Trajectòria curta i lateral del pivot, pròxima a 6 m i funcionalment vinculada a l'àrea.",
      "type": "relational",
      "authority": "coach_validated",
      "status": "validated",
      "source_refs": [
        "SRC_COACH_ITERATION_2026_08_11",
        "SRC_INVENTORY_REPRESENTATIONS_V0_1"
      ],
      "evidence_refs": [
        "E_COACH_PIVOT_SLIDE",
        "EV-SLIDE-009-A",
        "EV-SLIDE-010-A",
        "EV-SLIDE-012-A",
        "EV-SLIDE-013-A"
      ],
      "visual": {
        "primitive": "movement",
        "universal_geometry": "unresolved"
      },
      "semantic_refs": [
        "action.slide",
        "role.pivot",
        "court.goal_area_6m"
      ],
      "notes": [
        "No fixa una coordenada única."
      ]
    }
  ]
};
});
