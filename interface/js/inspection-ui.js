(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_INSPECTION_UI = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const ADVANCED_PANELS = new Set(["inspector", "dock"]);

  function isAdvancedPanel(panel) {
    return panel.classList.contains("advanced-zone") || ADVANCED_PANELS.has(panel.dataset.panel);
  }

  function createPanelController(options) {
    const panels = Array.from(options.panels || []);
    const tabs = Array.from(options.tabs || []);
    const body = options.body;
    const toggle = options.toggle;
    const fallbackPanel = options.fallbackPanel || "court";
    let activePanel = (tabs.find((item) => item.classList.contains("is-active")) || {}).dataset?.mobilePanel || fallbackPanel;
    let advancedOpen = Boolean(body && body.classList.contains("is-advanced"));

    function syncAdvanced(open) {
      advancedOpen = Boolean(open);
      if (body) body.classList.toggle("is-advanced", advancedOpen);
      panels.forEach((panel) => {
        if (isAdvancedPanel(panel)) panel.hidden = !advancedOpen;
      });
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(advancedOpen));
        toggle.textContent = advancedOpen ? "Amagar avançat" : "Mode avançat";
      }
    }

    function activate(panelName) {
      if (!panels.some((panel) => panel.dataset.panel === panelName)) return;
      const target = panels.find((panel) => panel.dataset.panel === panelName);
      if (isAdvancedPanel(target) && !advancedOpen) syncAdvanced(true);
      activePanel = panelName;
      tabs.forEach((item) => item.classList.toggle("is-active", item.dataset.mobilePanel === panelName));
      panels.forEach((panel) => panel.classList.toggle("is-mobile-active", panel.dataset.panel === panelName));
    }

    function setAdvanced(open) {
      syncAdvanced(open);
      const active = panels.find((panel) => panel.dataset.panel === activePanel);
      if (!advancedOpen && active && isAdvancedPanel(active)) activate(fallbackPanel);
    }

    tabs.forEach((button) => button.addEventListener("click", () => activate(button.dataset.mobilePanel)));
    if (toggle) toggle.addEventListener("click", () => setAdvanced(!advancedOpen));
    syncAdvanced(advancedOpen);
    activate(activePanel);

    return {
      activate,
      setAdvanced,
      state: () => ({ activePanel, advancedOpen })
    };
  }

  function list(value) {
    if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined && item !== "");
    return value === null || value === undefined || value === "" ? [] : [value];
  }

  function firstValues(action, fields) {
    return [...new Set(fields.flatMap((field) => list(action[field])))];
  }

  function actionSummary(action) {
    const actor = firstValues(action, ["actor_ref", "actor_refs", "participant_refs", "attacker_refs", "blocker_ref", "sender_ref"]);
    const companions = firstValues(action, [
      "receiver_ref", "target_ref", "target_goal_ref", "partner_ref", "to_participant_ref"
    ]).filter((item) => !actor.includes(item));
    const crossing = ["cross", "crossing"].includes(action.semantic_type || action.type)
      ? {
          firstActor: action.first_actor_ref || action.crosses_relative_to || null,
          initialAttack: action.initial_attack_relation || action.initial_space_ref || null,
          crossingActor: action.crossing_actor_ref || null,
          relativeTo: action.crosses_relative_to || action.first_actor_ref || null,
          targetSpace: action.target_space_ref || null
        }
      : null;
    return {
      id: action.id || null,
      type: action.semantic_type || action.type || action.subtype || null,
      actor,
      target: companions,
      opponent: firstValues(action, ["opponent_ref", "blocked_defender_ref", "defender_ref", "defender_refs"]),
      initialSpace: firstValues(action, ["initial_space_ref", "start_space_ref", "from_space_ref", "initial_attack_relation"]),
      finalSpace: firstValues(action, ["target_space_ref", "end_space_ref", "to_space_ref", "space_ref"]),
      originState: firstValues(action, ["from_state_ref", "from_state_refs"]),
      destinationState: firstValues(action, ["to_state_ref", "to_state_refs", "state_ref"]),
      authority: action.authority || null,
      status: action.status || null,
      ...(crossing ? { crossing } : {})
    };
  }

  function delimiterRefs(space) {
    return space && (space.delimiter_refs || space.relation && space.relation.delimiter_refs) || [];
  }

  function humanDiagnosticReasons(composition, tacticalIR, plan) {
    const reasons = [];
    const preflight = composition.preflight || plan && plan.preflight || {};
    (preflight.diagnostics || []).filter((item) => item.level === "error").forEach((item) => {
      if (item.code === "SPACE_DELIMITER_MISSING") {
        reasons.push(`${item.space_ref} depèn del delimitador ${item.target_ref}, que TRAÇA no pot derivar d’una relació validada.`);
      } else if (item.message) reasons.push(item.message);
    });
    const geometryStatus = composition.geometry_status || plan && plan.geometry_status;
    if (![null, undefined, "ready", "blocked"].includes(geometryStatus)) {
      (tacticalIR && tacticalIR.spaces || []).forEach((space) => {
        const delimiters = delimiterRefs(space);
        if (delimiters.length === 2) reasons.push(`Sé que ${space.id} és entre ${delimiters[0]} i ${delimiters[1]}, però encara no hi ha prou informació espacial per posicionar-los.`);
      });
      (composition.unresolved || []).forEach((reason) => {
        if (reason && /\s/.test(reason) && !/^A\d+:[a-z_]+$/i.test(reason)) reasons.push(reason);
      });
    }
    return [...new Set(reasons)];
  }

  function staleSnapshot(snapshot) {
    const derivations = snapshot.derivations || {};
    return ["interpretation", "semantic", "spatial"].some((key) => derivations[key] && derivations[key].status === "stale") ||
      Boolean(snapshot.composition && snapshot.composition.status === "stale");
  }

  function diagnosticsFor(snapshot) {
    const stale = staleSnapshot(snapshot || {});
    const composition = snapshot && snapshot.composition || {};
    const tacticalIR = composition.tactical_ir || snapshot && snapshot.interpretation && snapshot.interpretation.tactical_ir || null;
    const plan = composition.plan || null;
    const current = !stale && Boolean(tacticalIR || plan);

    if (!current) {
      return {
        current: false,
        stale,
        message: stale
          ? "El text ha canviat. Torna a generar per inspeccionar dades actuals."
          : "Genera una representació per inspeccionar el compositor.",
        composition: {
          status: stale ? "pendent de regenerar" : composition.composition_status || composition.status || "no iniciada",
          geometry: stale ? null : composition.geometry_status || null,
          total: null, composed: null, pending: null, coverage: null, reasons: []
        },
        actions: [],
        payloads: {
          tacticalIR: null,
          compositionPlan: null,
          spatialConstraints: null,
          questions: null,
          ballFlow: null
        }
      };
    }

    const coverage = plan && plan.coverage || composition.coverage || {};
    const total = Number.isFinite(coverage.actions_total) ? coverage.actions_total : (plan && plan.actions || []).length;
    const composed = Number.isFinite(coverage.actions_composed)
      ? coverage.actions_composed
      : (plan && plan.actions || []).filter((action) => action.status === "composed").length;
    const pending = Number.isFinite(total) && Number.isFinite(composed) ? Math.max(0, total - composed) : null;
    const tacticalActions = new Map((tacticalIR && tacticalIR.actions || []).map((action) => [action.id, action]));
    const planActions = plan && plan.actions || [];
    const actions = planActions.length
      ? planActions.map((action) => actionSummary({ ...(tacticalActions.get(action.id) || {}), ...action }))
      : [...tacticalActions.values()].map(actionSummary);
    const preflight = composition.preflight || plan && plan.preflight || null;

    return {
      current: true,
      stale: false,
      message: null,
      composition: {
        status: composition.composition_status || composition.status || plan && plan.composition_status || null,
        geometry: composition.geometry_status || plan && plan.geometry_status || null,
        total,
        composed,
        pending,
        coverage: coverage.label || (Number.isFinite(total) && Number.isFinite(composed) ? `${composed}/${total}` : null),
        reasons: humanDiagnosticReasons(composition, tacticalIR, plan)
      },
      actions,
      payloads: {
        tacticalIR,
        compositionPlan: plan,
        spatialConstraints: plan ? {
          constraints: plan.constraints || [],
          constraint_conflicts: plan.constraint_conflicts || [],
          preflight
        } : null,
        questions: {
          questions: composition.questions || plan && plan.questions || [],
          active_question: composition.active_question || null,
          answers: snapshot.clarificationAnswers || {},
          auto_derivations: composition.auto_derivations || [],
          applied_answers: composition.applied_answers || [],
          unresolved: composition.unresolved || [],
          missing_slots: plan && plan.missing_slots || []
        },
        ballFlow: plan && plan.ball_flow || null
      }
    };
  }

  return { ADVANCED_PANELS, isAdvancedPanel, createPanelController, actionSummary, humanDiagnosticReasons, diagnosticsFor };
});
