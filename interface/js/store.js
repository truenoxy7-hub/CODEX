(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const utils = isNode ? require("./utils.js") : root.TRACA_UTILS;
  const corrections = isNode ? require("./corrections.js") : root.TRACA_CORRECTIONS;
  const api = factory(utils, corrections);
  if (isNode) module.exports = api;
  root.TRACA_STORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, correctionsApi) {
  "use strict";

  const WORKSPACE_VERSION = "0.2.0";

  function defaultLibrary() {
    return {
      validated_cases: [],
      pattern_candidates: [],
      general_rule_candidates: [],
      semantic_rules: [],
      spatial_rules: [],
      geometry_rules: [],
      visual_dictionary: []
    };
  }

  function defaultAlternatives(geometry) {
    const selected = {};
    (geometry.branches || []).forEach((branch) => {
      if (branch.alternatives && branch.alternatives[0]) selected[branch.id] = branch.alternatives[0].id;
    });
    return selected;
  }

  function createWorkspaceStore(options) {
    const now = options.clock || (() => new Date().toISOString());
    const listeners = new Set();
    let generatedGeometry = utils.deepFreeze(utils.deepClone(options.generatedGeometry));
    let generatedVisualGrammar = utils.deepFreeze(utils.deepClone(options.visualGrammar));
    let sequence = 0;
    let state = {
      version: WORKSPACE_VERSION,
      currentCase: utils.deepClone(options.specimen),
      workingGeometry: utils.deepClone(generatedGeometry),
      workingVisualGrammar: utils.deepClone(generatedVisualGrammar),
      corrections: [],
      redoStack: [],
      selectedElement: null,
      selectedAlternatives: defaultAlternatives(generatedGeometry),
      validation: { status: "pending", validated_at: null, correction_count: 0, counts_by_layer: {} },
      validatedGeometry: null,
      validatedVisualGrammar: null,
      knowledgeLibrary: defaultLibrary(),
      ui: { mode: "description", view: "control", bottomPanel: "history", mobilePanel: "court" }
    };

    function emit() {
      const current = snapshot();
      listeners.forEach((listener) => listener(current));
    }

    function recompute(reopen) {
      if (reopen !== false) {
        state.corrections = state.corrections.map((event) => ({ ...event, status: "draft" }));
      }
      state.workingGeometry = utils.deepClone(generatedGeometry);
      state.workingVisualGrammar = utils.deepClone(generatedVisualGrammar);
      state.corrections.forEach((event) => {
        correctionsApi.applyEvent(state.workingGeometry, state.workingVisualGrammar, event);
      });
      state.validation = {
        status: state.corrections.length ? "changes_pending" : "pending",
        validated_at: null,
        correction_count: state.corrections.length,
        counts_by_layer: {}
      };
      state.validatedGeometry = null;
      state.validatedVisualGrammar = null;
    }

    function snapshot() {
      return utils.deepClone({
        ...state,
        generatedGeometry,
        generatedVisualGrammar
      });
    }

    function subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    function applyCorrection(input) {
      const target = utils.deepClone(input.target);
      const before = input.before === undefined
        ? correctionsApi.readTarget(state.workingGeometry, state.workingVisualGrammar, target)
        : utils.deepClone(input.before);
      sequence += 1;
      const event = correctionsApi.createEvent({
        ...input,
        id: input.id || `CORR-${state.currentCase.id}-${String(sequence).padStart(4, "0")}`,
        timestamp: input.timestamp || now(),
        target,
        before
      });
      correctionsApi.applyEvent(state.workingGeometry, state.workingVisualGrammar, event);
      state.corrections.push(event);
      state.redoStack = [];
      state.validation = { status: "changes_pending", validated_at: null, correction_count: state.corrections.length, counts_by_layer: {} };
      state.validatedGeometry = null;
      state.validatedVisualGrammar = null;
      emit();
      return utils.deepClone(event);
    }

    function undo() {
      if (!state.corrections.length) return false;
      state.redoStack.push(state.corrections.pop());
      recompute();
      emit();
      return true;
    }

    function redo() {
      if (!state.redoStack.length) return false;
      state.corrections.push(state.redoStack.pop());
      recompute();
      emit();
      return true;
    }

    function reset() {
      state.corrections = [];
      state.redoStack = [];
      state.selectedElement = null;
      state.selectedAlternatives = defaultAlternatives(generatedGeometry);
      recompute();
      emit();
    }

    function setSelection(selection) {
      state.selectedElement = selection ? utils.deepClone(selection) : null;
      emit();
    }

    function setAlternative(branchId, alternativeId) {
      const branch = (state.workingGeometry.branches || []).find((item) => item.id === branchId);
      if (!branch || !(branch.alternatives || []).some((item) => item.id === alternativeId)) return false;
      state.selectedAlternatives[branchId] = alternativeId;
      emit();
      return true;
    }

    function setUi(patch) {
      state.ui = { ...state.ui, ...utils.deepClone(patch) };
      emit();
    }

    function validate(author) {
      state.corrections = state.corrections.map((event) => ({ ...event, status: "validated" }));
      const counts = {};
      state.corrections.forEach((event) => { counts[event.target.layer] = (counts[event.target.layer] || 0) + 1; });
      state.validation = {
        status: "validated_case",
        validated_at: now(),
        validated_by: author || "coach",
        correction_count: state.corrections.length,
        counts_by_layer: counts
      };
      state.validatedGeometry = utils.deepClone(state.workingGeometry);
      state.validatedVisualGrammar = utils.deepClone(state.workingVisualGrammar);
      emit();
      return utils.deepClone(state.validation);
    }

    function caseRecord() {
      if (state.validation.status !== "validated_case") throw new Error("CASE_MUST_BE_VALIDATED");
      return {
        id: state.currentCase.id,
        name: state.currentCase.name,
        saved_at: now(),
        validation: utils.deepClone(state.validation),
        corrections: utils.deepClone(state.corrections),
        geometry: utils.deepClone(state.validatedGeometry)
      };
    }

    function saveValidatedCase() {
      const record = caseRecord();
      const index = state.knowledgeLibrary.validated_cases.findIndex((item) => item.id === record.id);
      if (index >= 0) state.knowledgeLibrary.validated_cases[index] = record;
      else state.knowledgeLibrary.validated_cases.push(record);
      emit();
      return utils.deepClone(record);
    }

    function createCandidate(kind, input) {
      if (state.validation.status !== "validated_case") throw new Error("CASE_MUST_BE_VALIDATED");
      const key = kind === "pattern" ? "pattern_candidates" : "general_rule_candidates";
      const prefix = kind === "pattern" ? "PAT" : "RULE";
      const candidate = {
        id: `${prefix}-${state.currentCase.id}-${String(state.knowledgeLibrary[key].length + 1).padStart(3, "0")}`,
        source_case_id: state.currentCase.id,
        status: "candidate",
        created_at: now(),
        title: String(input && input.title || (kind === "pattern" ? "Patró reutilitzable" : "Proposta de regla general")),
        reason: String(input && input.reason || "Promoció explícita del tècnic"),
        correction_refs: state.corrections.map((event) => event.id)
      };
      state.knowledgeLibrary[key].push(candidate);
      emit();
      return utils.deepClone(candidate);
    }

    function promotePattern(input) { return createCandidate("pattern", input); }
    function proposeGeneralRule(input) { return createCandidate("general", input); }

    function restorePackage(payload) {
      if (!payload || payload.format !== "TRACA_training_case" || payload.version !== "0.2.0") {
        throw new Error("TRAINING_CASE_PACKAGE_INVALID");
      }
      generatedGeometry = utils.deepFreeze(utils.deepClone(payload.generated_geometry));
      generatedVisualGrammar = utils.deepFreeze(utils.deepClone(payload.generated_visual_grammar));
      state.currentCase = utils.deepClone(payload.case);
      state.corrections = utils.deepClone(payload.corrections || []);
      state.redoStack = [];
      state.knowledgeLibrary = { ...defaultLibrary(), ...utils.deepClone(payload.knowledge_library || {}) };
      state.selectedAlternatives = defaultAlternatives(generatedGeometry);
      sequence = state.corrections.length;
      recompute(false);
      if (payload.validation && payload.validation.status === "validated_case") {
        state.validation = utils.deepClone(payload.validation);
        state.validatedGeometry = utils.deepClone(payload.validated_geometry || state.workingGeometry);
        state.validatedVisualGrammar = utils.deepClone(payload.validated_visual_grammar || state.workingVisualGrammar);
      }
      emit();
    }

    if (options.persistedState && options.persistedState.format === "TRACA_training_case") {
      restorePackage(options.persistedState);
    }

    return {
      snapshot, subscribe, applyCorrection, undo, redo, reset, setSelection, setAlternative,
      setUi, validate, saveValidatedCase, promotePattern, proposeGeneralRule, restorePackage
    };
  }

  return { WORKSPACE_VERSION, defaultLibrary, createWorkspaceStore };
});
