(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const utils = isNode ? require("./utils.js") : root.TRACA_UTILS;
  const corrections = isNode ? require("./corrections.js") : root.TRACA_CORRECTIONS;
  const dependencies = isNode ? require("./geometry-dependencies.js") : root.TRACA_GEOMETRY_DEPENDENCIES;
  const manual = isNode ? require("./manual-geometry.js") : root.TRACA_MANUAL_GEOMETRY;
  const promotion = isNode ? require("./promotion.js") : root.TRACA_PROMOTION;
  const preflight = isNode ? require("./workspace-preflight.js") : root.TRACA_WORKSPACE_PREFLIGHT;
  const api = factory(utils, corrections, dependencies, manual, promotion, preflight);
  if (isNode) module.exports = api;
  root.TRACA_STORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, correctionsApi, dependenciesApi, manualApi, promotionApi, preflightApi) {
  "use strict";

  const WORKSPACE_VERSION = "0.3.0";

  function emptyInterpretation() {
    return { provider: null, providers: [], status: "unknown", concepts: [], unknown_concepts: [], unresolved: [], notes: [] };
  }

  function emptySemanticModel() {
    return { status: "unknown", participants: [], materials: [], spaces: [], actions: [], decisions: [], phases: [], annotations: [] };
  }

  function emptySpatialModel() {
    return { status: "unknown", relations: [], annotations: [] };
  }

  function defaultLibrary() {
    return {
      validated_cases: [],
      tactical_pattern_candidates: [],
      semantic_rule_candidates: [],
      spatial_rule_candidates: [],
      geometry_rule_candidates: [],
      visual_rule_candidates: [],
      vocabulary_concept_candidates: [],
      validated_visual_dictionary: [],
      unresolved_knowledge: []
    };
  }

  function defaultAlternatives(geometry) {
    const selected = {};
    ((geometry && geometry.branches) || []).forEach((branch) => {
      if (branch.alternatives && branch.alternatives[0]) selected[branch.id] = branch.alternatives[0].id;
    });
    return selected;
  }

  function geometryStatus(generated, reference, corrections, validated) {
    if (validated && (generated || reference)) return "validated";
    if (corrections.some((event) => event.target.layer === "geometry")) return "corrected";
    if (generated) return "generated";
    if (reference) return "coach_reference";
    return "unavailable";
  }

  function createWorkspaceStore(options) {
    const now = options.clock || (() => new Date().toISOString());
    const listeners = new Set();
    const initialCase = options.initialCase || options.specimen;
    const initialGeometry = options.initialGeometry || options.generatedGeometry;
    if (!initialCase) throw new Error("INITIAL_CASE_REQUIRED");
    let generatedGeometry = initialGeometry ? utils.deepFreeze(utils.deepClone(initialGeometry)) : null;
    let coachReferenceGeometry = null;
    let baseVisualGrammar = utils.deepFreeze(utils.deepClone(options.visualGrammar));
    let baseInterpretation = emptyInterpretation();
    let baseSemanticModel = emptySemanticModel();
    let baseSpatialModel = emptySpatialModel();
    let correctionSequence = 0;
    let caseSequence = 0;
    let promotionSequence = 0;
    let state = {
      version: WORKSPACE_VERSION,
      currentCase: utils.deepClone(initialCase),
      interpretation: emptyInterpretation(),
      semanticModel: emptySemanticModel(),
      spatialModel: emptySpatialModel(),
      geometryState: { status: generatedGeometry ? "generated" : "unavailable", resolver: generatedGeometry ? "uvof015_resolver" : null },
      workingGeometry: utils.deepClone(generatedGeometry),
      workingVisualGrammar: utils.deepClone(baseVisualGrammar),
      caseVisualOverrides: [],
      corrections: [],
      redoStack: [],
      coachObservations: [],
      selectedElement: null,
      selectedAlternatives: defaultAlternatives(generatedGeometry),
      validation: { status: "pending", validated_at: null, correction_count: 0, counts_by_layer: {}, preflight: null },
      validatedGeometry: null,
      validatedVisualGrammar: null,
      knowledgeLibrary: defaultLibrary(),
      ui: { mode: "description", view: generatedGeometry ? "corrected" : "control", bottomPanel: "history", mobilePanel: "court" }
    };

    function snapshot() {
      return utils.deepClone({
        ...state,
        generatedGeometry,
        coachReferenceGeometry,
        baseVisualGrammar
      });
    }

    function emit() {
      const current = snapshot();
      listeners.forEach((listener) => listener(current));
    }

    function findSemanticItem(model, id) {
      const keys = ["participants", "materials", "spaces", "actions", "decisions", "phases"];
      for (const key of keys) {
        const item = (model[key] || []).find((candidate) => candidate.id === id);
        if (item) return item;
      }
      return null;
    }

    function applyConceptual(event) {
      const parts = event.target.ref.split(":");
      const collection = parts[1];
      const id = parts.slice(2).join(":");
      if (event.target.layer === "semantic" && collection === "concept") {
        const concept = [...state.interpretation.concepts, ...state.interpretation.unknown_concepts].find((item) => item.id === id);
        if (concept) utils.writePath(concept, event.target.property, event.after);
        return;
      }
      if (event.target.layer === "semantic" && collection === "item" && event.target.property === "item") {
        const key = `${event.after.collection}s`;
        if (!state.semanticModel[key]) state.semanticModel[key] = [];
        state.semanticModel[key].push(utils.deepClone(event.after));
        return;
      }
      if (event.target.layer === "semantic") {
        const item = findSemanticItem(state.semanticModel, id);
        if (item) utils.writePath(item, event.target.property, event.after);
        else state.semanticModel.annotations.push({ id, statement: utils.deepClone(event.after), event_ref: event.id });
        return;
      }
      if (event.target.layer === "spatial") {
        const relation = state.spatialModel.relations.find((item) => item.id === id);
        if (relation) utils.writePath(relation, event.target.property, event.after);
        else state.spatialModel.annotations.push({ id, statement: utils.deepClone(event.after), event_ref: event.id });
      }
    }

    function recompute(reopen) {
      if (reopen !== false) state.corrections = state.corrections.map((event) => ({ ...event, status: "draft" }));
      state.interpretation = utils.deepClone(baseInterpretation);
      state.semanticModel = utils.deepClone(baseSemanticModel);
      state.spatialModel = utils.deepClone(baseSpatialModel);
      state.workingGeometry = utils.deepClone(generatedGeometry || coachReferenceGeometry);
      state.workingVisualGrammar = utils.deepClone(baseVisualGrammar);
      state.caseVisualOverrides = [];
      state.corrections.forEach((event) => {
        if (event.target.layer === "semantic" || event.target.layer === "spatial") applyConceptual(event);
        else if (state.workingGeometry || event.target.layer === "visual") correctionsApi.applyEvent(state.workingGeometry, state.workingVisualGrammar, event);
        if (event.target.layer === "visual") state.caseVisualOverrides.push({ event_ref: event.id, target: utils.deepClone(event.target), value: utils.deepClone(event.after) });
      });
      if (state.workingGeometry) dependenciesApi.reconcileGeometry(state.workingGeometry);
      state.validation = { status: state.corrections.length ? "changes_pending" : "pending", validated_at: null, correction_count: state.corrections.length, counts_by_layer: {}, preflight: null };
      state.validatedGeometry = null;
      state.validatedVisualGrammar = null;
      state.geometryState.status = geometryStatus(generatedGeometry, coachReferenceGeometry, state.corrections, false);
    }

    function subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    function nextCaseId() {
      caseSequence += 1;
      const year = String(now()).slice(0, 4) || "LOCAL";
      return `CASE-${year}-${String(caseSequence).padStart(4, "0")}`;
    }

    function resetCaseState(currentCase, geometry, resolver) {
      generatedGeometry = geometry ? utils.deepFreeze(utils.deepClone(geometry)) : null;
      coachReferenceGeometry = null;
      baseInterpretation = emptyInterpretation();
      baseSemanticModel = emptySemanticModel();
      baseSpatialModel = emptySpatialModel();
      correctionSequence = 0;
      state.currentCase = utils.deepClone(currentCase);
      state.corrections = [];
      state.redoStack = [];
      state.coachObservations = [];
      state.selectedElement = null;
      state.selectedAlternatives = defaultAlternatives(generatedGeometry);
      state.geometryState = { status: generatedGeometry ? "generated" : "unavailable", resolver: resolver || null };
      state.ui = { ...state.ui, mode: "description", view: generatedGeometry ? "corrected" : "control" };
      recompute(false);
      emit();
    }

    function createCase(input) {
      const description = String(input.description || "");
      const currentCase = {
        id: input.id || nextCaseId(),
        name: String(input.name || "").trim() || "Cas sense títol",
        case_type: "learning_case",
        status: "in_construction",
        description,
        notes: String(input.notes || ""),
        origin: "coach_input",
        tags: [],
        source_refs: input.source_refs || ["coach_input"],
        created_at: now()
      };
      resetCaseState(currentCase, null, null);
      return utils.deepClone(currentCase);
    }

    function loadCanonicalCase(currentCase, geometry, interpretation) {
      resetCaseState({ ...utils.deepClone(currentCase), case_type: "canonical_specimen" }, geometry, "uvof015_resolver");
      if (interpretation) setInterpretation(interpretation);
    }

    function updateCase(patch) {
      state.currentCase = { ...state.currentCase, ...utils.deepClone(patch) };
      state.validation = { ...state.validation, status: "changes_pending", preflight: null };
      emit();
    }

    function setInterpretation(result) {
      baseInterpretation = utils.deepClone(result || emptyInterpretation());
      if (state.currentCase.case_type === "learning_case") state.currentCase.origin = "coach_input";
      state.currentCase.tags = [...new Set([...(state.currentCase.tags || []), ...((result && result.suggested_tags) || [])])].slice(0, 8);
      baseSemanticModel = emptySemanticModel();
      baseSemanticModel.status = result.status === "validated" ? "validated" : result.status === "unresolved" ? "unknown" : "provisional";
      (result.concepts || []).forEach((concept) => {
        const item = { id: concept.id, label: concept.label, kind: concept.category, knowledge_state: concept.knowledge_state, source: concept.source, canonical_ref: concept.canonical_concept_ref || null };
        if (concept.category === "participant_role" || concept.category === "defensive_role") baseSemanticModel.participants.push(item);
        else if (concept.category === "material") baseSemanticModel.materials.push(item);
        else if (concept.category === "space") baseSemanticModel.spaces.push(item);
        else baseSemanticModel.actions.push(item);
      });
      recompute(false);
      emit();
    }

    function applyCorrection(input) {
      const target = utils.deepClone(input.target);
      const before = input.before === undefined ? correctionsApi.readTarget(state.workingGeometry, state.workingVisualGrammar, target) : utils.deepClone(input.before);
      const parsed = target.layer === "geometry" ? correctionsApi.parseRef(target.ref) : null;
      const derivedEffects = parsed && parsed.collection === "participant_state"
        ? dependenciesApi.derivedEffectsFor(state.workingGeometry, target.ref)
        : [];
      correctionSequence += 1;
      const event = correctionsApi.createEvent({
        ...input,
        id: input.id || `CORR-${state.currentCase.id}-${String(correctionSequence).padStart(4, "0")}`,
        timestamp: input.timestamp || now(),
        target,
        before,
        derived_effects: input.derived_effects || derivedEffects,
        coach_explanation: input.coach_explanation || input.reason || ""
      });
      state.corrections.push(event);
      state.redoStack = [];
      recompute(false);
      emit();
      return utils.deepClone(event);
    }

    function addSemanticItem(input) {
      const item = {
        id: input.id || `MANUAL-${utils.slug(input.collection || "item")}-${String(state.semanticModel[input.collection + "s"] ? state.semanticModel[input.collection + "s"].length + 1 : 1).padStart(3, "0")}`,
        collection: input.collection,
        label: input.label,
        kind: input.kind || "generic",
        role_temporal: input.role_temporal || null,
        details: input.details || "",
        knowledge_state: input.knowledge_state || "provisional",
        source: "coach"
      };
      applyCorrection({ target: { layer: "semantic", ref: `semantic:item:${item.id}`, property: "item" }, operation: "replace", before: null, after: item, reason: input.reason || "Element afegit pel tècnic", concept_refs: input.concept_refs || [] });
      return item;
    }

    function updateSemanticItem(id, property, after, reason) {
      const item = findSemanticItem(state.semanticModel, id);
      if (!item) throw new Error("SEMANTIC_ITEM_NOT_FOUND");
      return applyCorrection({ target: { layer: "semantic", ref: `semantic:item:${id}`, property }, operation: "replace", before: utils.deepClone(utils.readPath(item, property)), after, reason: reason || "Coneixement completat pel tècnic" });
    }

    function defineUnknownConcept(id, definition, reason) {
      const concept = state.interpretation.unknown_concepts.find((item) => item.id === id);
      if (!concept) throw new Error("UNKNOWN_CONCEPT_NOT_FOUND");
      return applyCorrection({ target: { layer: "semantic", ref: `semantic:concept:${id}`, property: "definition" }, operation: "replace", before: concept.definition || "", after: definition, reason: reason || "Definició aportada pel tècnic", concept_refs: [id] });
    }

    function addUnknownConcept(input) {
      const id = `UNKNOWN-COACH-${String(baseInterpretation.unknown_concepts.length + 1).padStart(3, "0")}`;
      baseInterpretation.unknown_concepts.push({ id, label: input.label, definition: input.definition || "", knowledge_state: "unknown", source: "coach", reason: input.reason || "Concepte introduït pel tècnic" });
      recompute(false);
      emit();
      return id;
    }

    function startCoachReference(profile) {
      if (!coachReferenceGeometry) coachReferenceGeometry = manualApi.createCoachReferenceGeometry(state.currentCase.id, profile);
      state.geometryState = { status: "coach_reference", resolver: null };
      state.selectedAlternatives = {};
      recompute(false);
      emit();
    }

    function addManualPrimitive(input) {
      if (!coachReferenceGeometry) throw new Error("COACH_REFERENCE_NOT_STARTED");
      coachReferenceGeometry = manualApi.addPrimitive(coachReferenceGeometry, input);
      const latest = input.primitive_type === "entity" ? coachReferenceGeometry.entities.at(-1) : input.primitive_type === "path" ? coachReferenceGeometry.common_paths.at(-1) : coachReferenceGeometry.zones.at(-1);
      state.coachObservations.push({ id: `OBS-${String(state.coachObservations.length + 1).padStart(3, "0")}`, type: "coach_reference_placement", statement: `${latest.id} s’ha afegit a la referència manual.`, target_ref: `coach_reference:${latest.id}`, status: "case_only", created_at: now() });
      recompute(false);
      emit();
      return utils.deepClone(latest);
    }

    function recordCoachObservation(input) {
      const statement = String(input.statement || "").trim();
      if (!statement) throw new Error("COACH_OBSERVATION_REQUIRED");
      const allowed = ["case_only", "promotion_intent", "visual_only"];
      const status = allowed.includes(input.status) ? input.status : "case_only";
      const observation = {
        id: `OBS-${String(state.coachObservations.length + 1).padStart(3, "0")}`,
        type: "coach_knowledge_observation",
        statement,
        target_ref: input.target_ref || (state.selectedElement && state.selectedElement.ref) || null,
        concept_refs: Array.isArray(input.concept_refs) ? input.concept_refs.slice() : [],
        relation_refs: Array.isArray(input.relation_refs) ? input.relation_refs.slice() : [],
        status,
        canonical_promotion: false,
        created_at: now()
      };
      state.coachObservations.push(observation);
      emit();
      return utils.deepClone(observation);
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
      recompute();
      emit();
    }

    function setSelection(selection) { state.selectedElement = selection ? utils.deepClone(selection) : null; emit(); }
    function setUi(patch) { state.ui = { ...state.ui, ...utils.deepClone(patch) }; emit(); }
    function updateCorrectionExplanation(id, explanation) {
      const event = state.corrections.find((item) => item.id === id);
      if (!event) return false;
      event.coach_explanation = String(explanation || "").trim();
      event.reason = event.coach_explanation || event.reason;
      emit();
      return true;
    }

    function setAlternative(branchId, alternativeId) {
      const branch = ((state.workingGeometry && state.workingGeometry.branches) || []).find((item) => item.id === branchId);
      if (!branch || !(branch.alternatives || []).some((item) => item.id === alternativeId)) return false;
      state.selectedAlternatives[branchId] = alternativeId;
      emit();
      return true;
    }

    function runPreflight() {
      const report = preflightApi.run(snapshot());
      state.validation.preflight = utils.deepClone(report);
      emit();
      return report;
    }

    function validate(author) {
      const report = preflightApi.run(snapshot());
      if (!report.can_validate) {
        state.validation = { ...state.validation, status: "blocked", preflight: report };
        emit();
        const error = new Error("WORKSPACE_VALIDATION_BLOCKED");
        error.report = report;
        throw error;
      }
      state.corrections = state.corrections.map((event) => ({ ...event, status: "validated" }));
      const counts = {};
      state.corrections.forEach((event) => { counts[event.target.layer] = (counts[event.target.layer] || 0) + 1; });
      state.validation = { status: "validated_case", validated_at: now(), validated_by: author || "coach", correction_count: state.corrections.length, counts_by_layer: counts, preflight: report };
      state.validatedGeometry = utils.deepClone(state.workingGeometry);
      state.validatedVisualGrammar = utils.deepClone(state.workingVisualGrammar);
      state.geometryState.status = geometryStatus(generatedGeometry, coachReferenceGeometry, state.corrections, Boolean(state.workingGeometry));
      emit();
      return utils.deepClone(state.validation);
    }

    function caseRecord(status) {
      return {
        id: state.currentCase.id,
        name: state.currentCase.name,
        status: status || state.validation.status,
        saved_at: now(),
        case: utils.deepClone(state.currentCase),
        interpretation: utils.deepClone(state.interpretation),
        semantic_model: utils.deepClone(state.semanticModel),
        spatial_model: utils.deepClone(state.spatialModel),
        geometry_state: utils.deepClone(state.geometryState),
        corrections: utils.deepClone(state.corrections),
        coach_observations: utils.deepClone(state.coachObservations),
        geometry: utils.deepClone(state.validatedGeometry || state.workingGeometry)
      };
    }

    function saveCase(optionsInput) {
      const record = caseRecord(optionsInput && optionsInput.status || (state.validation.status === "validated_case" ? "validated" : "in_construction"));
      const index = state.knowledgeLibrary.validated_cases.findIndex((item) => item.id === record.id);
      if (index >= 0) state.knowledgeLibrary.validated_cases[index] = record;
      else state.knowledgeLibrary.validated_cases.push(record);
      const unresolvedRecord = {
        id: `UNRESOLVED-${state.currentCase.id}`,
        source_case_id: state.currentCase.id,
        status: "case_only",
        unresolved: utils.deepClone(state.interpretation.unresolved || []),
        unknown_concepts: utils.deepClone((state.interpretation.unknown_concepts || []).filter((item) => !String(item.definition || "").trim())),
        coach_observations: utils.deepClone(state.coachObservations),
        updated_at: now()
      };
      const unresolvedIndex = state.knowledgeLibrary.unresolved_knowledge.findIndex((item) => item.id === unresolvedRecord.id);
      const hasUnresolved = unresolvedRecord.unresolved.length || unresolvedRecord.unknown_concepts.length || unresolvedRecord.coach_observations.length;
      if (hasUnresolved && unresolvedIndex >= 0) state.knowledgeLibrary.unresolved_knowledge[unresolvedIndex] = unresolvedRecord;
      else if (hasUnresolved) state.knowledgeLibrary.unresolved_knowledge.push(unresolvedRecord);
      else if (unresolvedIndex >= 0) state.knowledgeLibrary.unresolved_knowledge.splice(unresolvedIndex, 1);
      emit();
      return utils.deepClone(record);
    }

    function createPromotion(input) {
      if (state.validation.status !== "validated_case") throw new Error("PROMOTION_REQUIRES_VALIDATED_CASE");
      promotionSequence += 1;
      const candidate = promotionApi.build(input, state.corrections, now(), `CAND-${String(promotionSequence).padStart(4, "0")}`);
      candidate.source_case_id = state.currentCase.id;
      state.knowledgeLibrary[promotionApi.libraryKey(candidate.type)].push(candidate);
      emit();
      return utils.deepClone(candidate);
    }

    function whatLearned() {
      const correctionCounts = state.corrections.reduce((counts, event) => ({ ...counts, [event.target.layer]: (counts[event.target.layer] || 0) + 1 }), {});
      const candidates = Object.entries(state.knowledgeLibrary)
        .filter(([key]) => key.endsWith("_candidates"))
        .flatMap(([, items]) => items)
        .filter((item) => item.source_case_id === state.currentCase.id);
      return {
        case_specific: correctionCounts,
        candidate_knowledge: candidates.map((item) => ({ id: item.id, type: item.type, title: item.title })),
        unresolved: [...(state.interpretation.unresolved || []), ...(state.interpretation.unknown_concepts || []).filter((item) => !item.definition)],
        coach_observations: utils.deepClone(state.coachObservations),
        canonical_changes: 0
      };
    }

    function restorePackage(payload) {
      if (!payload || payload.format !== "TRACA_training_case" || !["0.2.0", "0.3.0"].includes(payload.version)) throw new Error("TRAINING_CASE_PACKAGE_INVALID");
      generatedGeometry = payload.generated_geometry ? utils.deepFreeze(utils.deepClone(payload.generated_geometry)) : null;
      coachReferenceGeometry = utils.deepClone(payload.coach_reference_geometry || null);
      baseVisualGrammar = utils.deepFreeze(utils.deepClone(payload.base_visual_grammar || payload.generated_visual_grammar || options.visualGrammar));
      baseInterpretation = utils.deepClone(payload.interpretation || emptyInterpretation());
      baseSemanticModel = utils.deepClone(payload.semantic_model || emptySemanticModel());
      baseSpatialModel = utils.deepClone(payload.spatial_model || emptySpatialModel());
      state.currentCase = utils.deepClone(payload.case);
      state.corrections = utils.deepClone(payload.corrections || []);
      state.redoStack = [];
      state.coachObservations = utils.deepClone(payload.coach_observations || []);
      state.knowledgeLibrary = { ...defaultLibrary(), ...utils.deepClone(payload.knowledge_library || {}) };
      state.selectedAlternatives = utils.deepClone(payload.selected_alternatives || defaultAlternatives(generatedGeometry));
      state.geometryState = utils.deepClone(payload.geometry_state || { status: geometryStatus(generatedGeometry, coachReferenceGeometry, state.corrections, false), resolver: generatedGeometry ? "imported" : null });
      correctionSequence = state.corrections.length;
      recompute(false);
      if (payload.validation && payload.validation.status === "validated_case") {
        state.validation = utils.deepClone(payload.validation);
        state.validatedGeometry = utils.deepClone(payload.validated_geometry || state.workingGeometry);
        state.validatedVisualGrammar = utils.deepClone(payload.validated_visual_grammar || state.workingVisualGrammar);
      }
      emit();
    }

    if (options.persistedState && options.persistedState.format === "TRACA_training_case") restorePackage(options.persistedState);

    return {
      snapshot, subscribe, createCase, loadCanonicalCase, updateCase, setInterpretation,
      applyCorrection, addSemanticItem, updateSemanticItem, defineUnknownConcept, addUnknownConcept,
      startCoachReference, addManualPrimitive, recordCoachObservation, undo, redo, reset, setSelection, setUi, setAlternative,
      updateCorrectionExplanation, runPreflight, validate, saveCase, createPromotion, whatLearned, restorePackage
    };
  }

  return { WORKSPACE_VERSION, emptyInterpretation, emptySemanticModel, emptySpatialModel, defaultLibrary, createWorkspaceStore };
});
