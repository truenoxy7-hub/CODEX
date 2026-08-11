(function exposeOneVOne(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TRACA_ONE_V_ONE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createOneVOneApi() {
  "use strict";

  const VERSION = "0.1.0";

  function normalize(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘]/g, "'")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function hasAny(text, expressions) {
    return expressions.some((expression) => expression.test(text));
  }

  function attackerFrom(text) {
    if (/lateral (?:esquerre|esquerra)/.test(text)) return { role: "lateral", side: "left", label: "Lateral esquerre", short_label: "LE" };
    if (/lateral (?:dret|dreta)/.test(text)) return { role: "lateral", side: "right", label: "Lateral dret", short_label: "LD" };
    if (/extrem (?:esquerre|esquerra)/.test(text)) return { role: "extrem", side: "left", label: "Extrem esquerre", short_label: "EE" };
    if (/extrem (?:dret|dreta)/.test(text)) return { role: "extrem", side: "right", label: "Extrem dret", short_label: "ED" };
    if (/\blateral\b/.test(text)) return { role: "lateral", side: null, label: "Lateral", short_label: "L" };
    if (/\bcentral\b/.test(text)) return { role: "central", side: "centre", label: "Central", short_label: "CE" };
    if (/\bextrem\b/.test(text)) return { role: "extrem", side: null, label: "Extrem", short_label: "EXT" };
    return { role: "attacker", side: null, label: "Atacant", short_label: "A" };
  }

  function defenderFrom(text) {
    if (hasAny(text, [/\b(?:1r|primer) defensiu\b/, /\bdefensor exterior\b/, /\bd1\b/])) return { role: "first", label: "1r defensiu", short_label: "D1" };
    if (hasAny(text, [/\b(?:2n|segon) defensiu\b/, /\bsegon defensor\b/, /\bd2\b/])) return { role: "second", label: "2n defensiu", short_label: "D2" };
    if (hasAny(text, [/\b(?:3r|tercer) defensiu\b/, /\bcentral defensiu\b/, /\bd3\b/])) return { role: "third", label: "3r defensiu", short_label: "D3" };
    if (/\bavancat defensiu\b|\bdefensor avancat\b/.test(text)) return { role: "advanced", label: "Avançat defensiu", short_label: "DA" };
    return { role: "defender", label: "Defensor", short_label: "D" };
  }

  function ballAndSupportFrom(text) {
    const supportNamed = /\b(?:passador|suport)\b/.test(text);
    const passAndReceive = /\bpassa\b/.test(text) && /\brep\b|\brebre\b|\brecepcio\b/.test(text);
    const receivesFromSupport = /\brep(?:\s+la pilota)?\s+(?:del|de la|d'un|d'una)\s+(?:passador|suport)\b/.test(text);
    const attackerHasBall = /\bamb pilota\b|\binicia\b[^.]{0,35}\bpilota\b|\bpilota a l'atacant\b/.test(text);

    if (supportNamed && passAndReceive) return { ball_start: "attacker", support: true, sequence: "give_and_go" };
    if (receivesFromSupport) return { ball_start: "support", support: true, sequence: "receive_from_support" };
    if (attackerHasBall) return { ball_start: "attacker", support: false, sequence: "direct_duel" };
    return { ball_start: "unspecified", support: supportNamed, sequence: supportNamed ? "receive_from_support" : "direct_duel" };
  }

  function dribbleFrom(text) {
    if (/\bsense bot\b|\bno (?:pot|poden) botar\b|\bevitar (?:el )?bot\b/.test(text)) return "forbidden";
    if (/\bamb bot\b|\bpot botar\b|\bbot lliure\b/.test(text)) return "allowed";
    return "unspecified";
  }

  function decisionFrom(text) {
    const freedom = hasAny(text, [
      /\bllibertat\b/,
      /\btria\b|\btriar\b|\bdecideix\b/,
      /\ben funcio (?:de|del) defensor\b/,
      /\binterior o exterior\b/,
      /\bdos espais\b|\bdos costats\b/,
    ]);
    const interior = /\bcap (?:a |al )?(?:l'interior|interior|centre)\b|\bnomes interior\b/.test(text);
    const exterior = /\bcap (?:a |a l')?(?:exterior|fora)\b|\bnomes exterior\b/.test(text);
    if (freedom || (interior && exterior)) return { value: "freedom", source: "text" };
    if (interior) return { value: "interior", source: "text" };
    if (exterior) return { value: "exterior", source: "text" };
    return { value: "freedom", source: "domain_default" };
  }

  function interpret(sourceText) {
    const source = String(sourceText || "").trim();
    const text = normalize(source);
    const numericRelations = Array.from(text.matchAll(/\b(\d)\s*(?:x|v|vs\.?)\s*(\d)\b/g));
    const explicitOneVOne = /\b1\s*(?:x|v|vs\.?)\s*1\b|\b1\s+contra\s+1\b|\bun contra un\b|\bduel individual\b/.test(text);
    const otherNumericalRelation = numericRelations.some((relation) => relation[1] !== "1" || relation[2] !== "1") || /\b(?:dos|tres|quatre|cinc|sis) contra (?:un|dos|tres|quatre|cinc|sis)\b/.test(text);
    const simultaneousZones = /\b(?:dues|tres|quatre|2|3|4) zones\b|\bsimultan/.test(text);

    if (!source) {
      return {
        version: VERSION,
        status: "unsupported",
        scope: "one_v_one",
        source_text: source,
        reason: "empty_description",
        message: "Escriu una situació abans d’interpretar-la.",
      };
    }
    if (!explicitOneVOne || otherNumericalRelation || simultaneousZones) {
      return {
        version: VERSION,
        status: "unsupported",
        scope: "one_v_one",
        source_text: source,
        reason: otherNumericalRelation || simultaneousZones ? "outside_first_scope" : "one_v_one_not_identified",
        message: "Aquest primer intèrpret necessita una única situació 1x1. La descripció no es representarà fins que l’abast sigui inequívoc.",
      };
    }

    const attacker = attackerFrom(text);
    const defender = defenderFrom(text);
    const ball = ballAndSupportFrom(text);
    const dribble = dribbleFrom(text);
    const decision = decisionFrom(text);
    const pending = [];
    const warnings = [];

    if (attacker.side === null && attacker.role === "lateral") pending.push("No s’ha especificat si el lateral és esquerre o dret; la disposició a pista serà provisional.");
    if (ball.ball_start === "unspecified") pending.push("No s’ha especificat qui té la pilota a l’inici.");
    if (dribble === "unspecified") pending.push("No s’ha especificat si es permet el bot.");
    if (decision.source === "domain_default") warnings.push("S’aplica el criteri general validat: en un 1x1 hi ha llibertat per resoldre segons el defensor.");
    if (/\bcons?\b|\bcilindre\b|\bbanc\b/.test(text)) warnings.push("El material o handicap es conserva al text però encara no es col·loca en aquesta primera geometria 1x1.");

    const phases = [];
    if (ball.support) {
      phases.push({
        title: ball.sequence === "give_and_go" ? "Passada i recepció" : "Recepció del suport",
        description: ball.sequence === "give_and_go"
          ? "L’atacant passa al suport, continua l’acció i rep abans d’entrar al duel."
          : "El suport facilita la pilota a l’atacant abans del duel.",
        tags: ["Passador", "Recepció", "Inici de l’acció"],
      });
    }
    phases.push({
      title: "Resolució del 1x1",
      description: decision.value === "freedom"
        ? "L’atacant interpreta el defensor i pot continuar per un espai o fintar cap a l’espai contigu."
        : `L’acció queda orientada cap a l’espai ${decision.value === "interior" ? "interior" : "exterior"}.`,
      tags: [
        decision.value === "freedom" ? "Llibertat de decisió" : `Sortida ${decision.value}`,
        dribble === "forbidden" ? "Sense bot" : dribble === "allowed" ? "Bot permès" : "Bot no especificat",
        "Superació del defensor",
      ],
    });

    return {
      version: VERSION,
      status: pending.length ? "needs_confirmation" : "ready_for_confirmation",
      scope: "one_v_one",
      source_text: source,
      facts: {
        organization: "1 duel 1x1",
        attacker,
        defender,
        ball_start: ball.ball_start,
        support: ball.support,
        sequence: ball.sequence,
        dribble,
        decision: decision.value,
      },
      phases,
      pending,
      warnings,
      evidence: {
        exercise_type: "text:1x1",
        attacker: attacker.role === "attacker" ? "generic_text_role" : "text_role",
        defender: defender.role === "defender" ? "generic_text_role" : "text_role",
        decision: decision.source,
      },
    };
  }

  function point(x, y) {
    return [Number(x.toFixed(2)), Number(y.toFixed(2))];
  }

  function buildGeometry(interpretation, courtProfile) {
    if (!interpretation || !["ready_for_confirmation", "needs_confirmation"].includes(interpretation.status)) {
      throw new Error("ONE_V_ONE_INTERPRETATION_NOT_CONFIRMABLE");
    }
    if (!courtProfile || !courtProfile.court || !courtProfile.markings || !courtProfile.goal) {
      throw new Error("COURT_PROFILE_MISSING");
    }

    const facts = interpretation.facts;
    const side = facts.attacker.side;
    const centreX = side === "left" ? 6.5 : side === "right" ? 13.5 : 10;
    const zoneLeft = centreX - 2.75;
    const zoneRight = centreX + 2.75;
    const outsideX = side === "right" ? centreX + 1.25 : centreX - 1.25;
    const insideX = side === "right" ? centreX - 1.25 : centreX + 1.25;
    const attackerY = facts.support ? 12.1 : 11.7;
    const defenderY = 8.15;
    const zoneId = "ZONE_1X1";
    const insideId = side ? "SPACE_INTERIOR" : "SPACE_A";
    const outsideId = side ? "SPACE_EXTERIOR" : "SPACE_B";
    const insideLabel = side ? "Espai interior" : "Espai A";
    const outsideLabel = side ? "Espai exterior" : "Espai B";
    const split = centreX;

    function polygonFor(x) {
      return x < split
        ? [point(zoneLeft, 5.4), point(split, 5.4), point(split, 10.2), point(zoneLeft, 10.2)]
        : [point(split, 5.4), point(zoneRight, 5.4), point(zoneRight, 10.2), point(split, 10.2)];
    }

    const entities = [
      { id: "ATTACKER", kind: "attacker", label: facts.attacker.short_label, position: point(centreX, attackerY), source_ref: "interpretation:facts.attacker", status: "derived" },
      { id: "DEFENDER", kind: "defender", label: facts.defender.short_label, position: point(centreX, defenderY), source_ref: "interpretation:facts.defender", status: "derived" },
    ];
    if (facts.ball_start !== "unspecified") {
      const ballPosition = facts.ball_start === "support" ? point(centreX + 0.48, 14.05) : point(centreX + 0.48, attackerY + 0.05);
      entities.push({ id: "BALL", kind: "ball", label: "P", position: ballPosition, source_ref: "interpretation:facts.ball_start", status: "derived" });
    }
    if (facts.support) {
      entities.push({ id: "SUPPORT", kind: "passer", label: "S", position: point(centreX, 14.05), source_ref: "interpretation:facts.support", status: "derived" });
    }

    const commonPaths = [];
    if (facts.support && facts.sequence === "give_and_go") {
      commonPaths.push({ id: "INITIAL_PASS", kind: "initial_pass", points: [point(centreX + 0.3, 12.0), point(centreX, 14.05)], source_refs: ["interpretation:facts.sequence"] });
      commonPaths.push({ id: "RUN_WITHOUT_BALL", kind: "run_without_ball", points: [point(centreX, 12.1), point(centreX, 10.9)], source_refs: ["interpretation:facts.sequence"] });
    }

    const duelStartY = facts.support ? 10.9 : attackerY;
    const alternativeSpecs = [
      { id: "CONTINUE_INTERIOR", kind: "continuation", initial: insideId, target: insideId, initialX: insideX, targetX: insideX, label: `Continua · ${insideLabel}` },
      { id: "FEINT_EXTERIOR_INTERIOR", kind: "feint", initial: outsideId, target: insideId, initialX: outsideX, targetX: insideX, label: `Finta · ${outsideLabel} → ${insideLabel}` },
      { id: "CONTINUE_EXTERIOR", kind: "continuation", initial: outsideId, target: outsideId, initialX: outsideX, targetX: outsideX, label: `Continua · ${outsideLabel}` },
      { id: "FEINT_INTERIOR_EXTERIOR", kind: "feint", initial: insideId, target: outsideId, initialX: insideX, targetX: outsideX, label: `Finta · ${insideLabel} → ${outsideLabel}` },
    ];
    const allowed = alternativeSpecs.filter((item) => {
      if (facts.decision === "interior") return item.target === insideId;
      if (facts.decision === "exterior") return item.target === outsideId;
      return true;
    });

    const alternatives = allowed.map((item) => ({
      id: item.id,
      source_ref: "interpretation:facts.decision",
      transition_ref: "domain:finta_or_continuation",
      kind: item.kind,
      label: item.label,
      initial_space_ref: item.initial,
      target_space_ref: item.target,
      points: item.kind === "feint"
        ? [point(centreX, duelStartY), point(item.initialX, 9.45), point((item.initialX + item.targetX) / 2, 8.75), point(item.targetX, 7.3), point(item.targetX, 5.75)]
        : [point(centreX, duelStartY), point(item.initialX, 9.35), point(item.targetX, 7.25), point(item.targetX, 5.75)],
      return_ball_points: facts.support
        ? [point(centreX, 14.05), point(centreX + (item.initialX < centreX ? -0.65 : 0.65), 12.75), point(centreX, 10.9)]
        : [],
      qualifiers: facts.dribble === "forbidden" ? ["sense_bot"] : facts.dribble === "allowed" ? ["bot_permes"] : ["bot_no_especificat"],
    }));

    return {
      meta: {
        format: "TRACA_geometria_provisional",
        version: VERSION,
        exercise_id: "DRAFT-1X1",
        status: "derived_from_confirmed_interpretation",
        source_text: interpretation.source_text,
      },
      court: {
        width_m: courtProfile.court.width_m,
        half_length_m: courtProfile.court.half_length_m,
        goal: courtProfile.goal,
        markings: courtProfile.markings,
        view_box: [-0.8, -1.0, 21.6, 21.8],
      },
      layout_policy: {
        id: "single_duel_v0.1",
        status: "provisional_render_policy",
        coordinate_system: "metres_origin_goal_line_left",
        attack_direction: "negative_y",
        notes: ["La posició exacta dins la pista és provisional.", "La geometria no afegeix participants ni materials absents del text."],
      },
      zones: [{
        id: zoneId,
        label: "Duel 1x1",
        source_ref: "interpretation:facts.organization",
        polygon: [point(zoneLeft, 5.4), point(zoneRight, 5.4), point(zoneRight, 14.8), point(zoneLeft, 14.8)],
        limit_refs: ["layout:left", "layout:right"],
        defender_ref: "DEFENDER",
        defensive_line: [point(zoneLeft, defenderY), point(zoneRight, defenderY)],
      }],
      spaces: [
        { id: insideId, label: insideLabel, source_ref: "interpretation:facts.decision", zone_ref: zoneId, defender_ref: "DEFENDER", polygon: polygonFor(insideX), center: point(insideX, 7.15) },
        { id: outsideId, label: outsideLabel, source_ref: "interpretation:facts.decision", zone_ref: zoneId, defender_ref: "DEFENDER", polygon: polygonFor(outsideX), center: point(outsideX, 7.15) },
      ],
      entities,
      common_paths: commonPaths,
      branches: [{ id: "BRANCH_1X1", source_ref: "interpretation:facts.decision", zone_ref: zoneId, alternatives }],
      traceability: [
        { geometry_ref: "geometry:zone:ZONE_1X1", source_refs: ["interpretation:facts.organization"] },
        { geometry_ref: "geometry:entity:ATTACKER", source_refs: ["interpretation:facts.attacker"] },
        { geometry_ref: "geometry:entity:DEFENDER", source_refs: ["interpretation:facts.defender"] },
        { geometry_ref: "geometry:branch:BRANCH_1X1", source_refs: ["interpretation:facts.decision"] },
      ],
    };
  }

  return { VERSION, normalize, interpret, buildGeometry };
});
