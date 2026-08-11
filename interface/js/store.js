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

  const WORKSPACE_VERSION = "0.4.0";

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
      drafts: [],
      validated_cases: [],
      coach_validated_local_knowledge: [],
      evidence_records: [],
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

  function derivationState(description, geometryAvailable) {
    const revision = utils.fingerprint(description);
    return {
      source: { revision, status: "current" },
      interpretation: { derives_from: revision, status: "unknown" },
      semantic: { derives_from: revision, status: "unknown" },
      spatial: { derives_from: revision, status: "unknown" },
      geometry: { derives_from: revision, status: geometryAvailable ? "current" : "unavailable" }
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
    const newIdentity = options.idFactory || (() => utils.durableId("CASE"));
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
    const preparedInitialCase = {
      ...utils.deepClone(initialCase),
      case_uid: initialCase.case_uid || newIdentity(),
      short_code: initialCase.short_code || initialCase.id
    };
    let state = {
      version: WORKSPACE_VERSION,
      currentCase: preparedInitialCase,
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
      clarificationAnswers: {},
      composition: { status: generatedGeometry ? "canonical" : "not_started", questions: [], used_primitives: [], unresolved: [] },
      completeness: { semantic: "unknown", spatial: "unknown", geometry: generatedGeometry ? "available" : "unavailable", visual_validation: "not_reviewed" },
      derivations: derivationState(preparedInitialCase.description, Boolean(generatedGeometry)),
      selectedElement: null,
      selectedAlternatives: defaultAlternatives(generatedGeometry),
      validation: { status: "pending", validated_at: null, correction_count: 0, counts_by_layer: {}, preflight: null },
      validatedGeometry: null,
      validatedVisualGrammar: null,
      knowledgeLibrary: { ...defaultLibrary(), ...utils.deepClone(options.initialLibrary || {}) },
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
      state.geometryState.status = state.derivations.geometry.status === "stale" ? "stale" : geometryStatus(generatedGeometry, coachReferenceGeometry, state.corrections, false);
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
      state.currentCase = {
        ...utils.deepClone(currentCase),
        case_uid: currentCase.case_uid || newIdentity(),
        short_code: currentCase.short_code || currentCase.id
      };
      state.corrections = [];
      state.redoStack = [];
      state.coachObservations = [];
      state.clarificationAnswers = {};
      state.composition = { status: geometry ? "canonical" : "not_started", questions: [], used_primitives: [], unresolved: [] };
      state.completeness = { semantic: "unknown", spatial: "unknown", geometry: geometry ? "available" : "unavailable", visual_validation: "not_reviewed" };
      state.derivations = derivationState(state.currentCase.description, Boolean(geometry));
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
        case_uid: input.case_uid || newIdentity(),
        short_code: input.short_code || null,
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
      currentCase.short_code = currentCase.short_code || currentCase.id;
      resetCaseState(currentCase, null, null);
      return utils.deepClone(currentCase);
    }

    function loadCanonicalCase(currentCase, geometry, interpretation) {
      resetCaseState({ ...utils.deepClone(currentCase), case_type: "canonical_specimen" }, geometry, "uvof015_resolver");
      if (interpretation) setInterpretation(interpretation);
    }

    function updateCase(patch) {
      const previousRevision = utils.fingerprint(state.currentCase.description);
      state.currentCase = { ...state.currentCase, ...utils.deepClone(patch) };
      const nextRevision = utils.fingerprint(state.currentCase.description);
      if (previousRevision !== nextRevision) {
        state.derivations.source = { revision: nextRevision, status: "current" };
        ["interpretation", "semantic", "spatial", "geometry"].forEach((key) => {
          const previousStatus = state.derivations[key].status;
          state.derivations[key] = { ...state.derivations[key], status: previousStatus === "current" ? "stale" : previousStatus };
        });
        if (generatedGeometry || coachReferenceGeometry) state.geometryState.status = "stale";
        if (state.composition.status !== "not_started") state.composition = { ...state.composition, status: "stale" };
      }
      state.validation = { ...state.validation, status: "changes_pending", preflight: null };
      emit();
    }

    function setInterpretation(result) {
      const revision = utils.fingerprint(state.currentCase.description);
      baseInterpretation = { ...utils.deepClone(result || emptyInterpretation()), derives_from: revision };
      if (state.currentCase.case_type === "learning_case") state.currentCase.origin = "coach_input";
      state.currentCase.tags = [...new Set((result && result.suggested_tags) || [])].slice(0, 8);
      baseSemanticModel = emptySemanticModel();
      baseSemanticModel.status = result.status === "validated" ? "validated" : result.status === "unresolved" ? "unknown" : "provisional";
      const unresolvedCount = (result.unresolved || []).length + (result.unknown_concepts || []).length;
      state.completeness.semantic = !(result.concepts || []).length ? "unknown" : unresolvedCount ? "partial" : "complete";
      state.completeness.spatial = "unknown";
      (result.concepts || []).forEach((concept) => {
        const item = { id: concept.id, label: concept.label, kind: concept.category, knowledge_state: concept.knowledge_state, source: concept.source, canonical_ref: concept.canonical_concept_ref || null };
        if (concept.category === "participant_role" || concept.category === "defensive_role") baseSemanticModel.participants.push(item);
        else if (concept.category === "material") baseSemanticModel.materials.push(item);
        else if (concept.category === "space") baseSemanticModel.spaces.push(item);
        else baseSemanticModel.actions.push(item);
      });
      state.derivations.interpretation = { derives_from: revision, status: "current" };
      state.derivations.semantic = { derives_from: revision, status: "current" };
      state.derivations.spatial = { derives_from: revision, status: "unknown" };
      if (!generatedGeometry && !coachReferenceGeometry) state.derivations.geometry = { derives_from: revision, status: "unavailable" };
      recompute(false);
      emit();
    }

    function setCompositionResult(result, resolver) {
      const revision = utils.fingerprint(state.currentCase.description);
      state.composition = {
        status: result.status,
        questions: utils.deepClone(result.questions || []),
        used_primitives: utils.deepClone(result.used_primitives || []),
        unresolved: utils.deepClone(result.unresolved || []),
        relation: utils.deepClone(result.relation || null)
      };
      if (result.geometry) {
        generatedGeometry = utils.deepFreeze(utils.deepClone(result.geometry));
        coachReferenceGeometry = null;
        state.workingGeometry = utils.deepClone(generatedGeometry);
        state.selectedAlternatives = defaultAlternatives(generatedGeometry);
        state.geometryState = { status: "generated", resolver: resolver || "primitive_composer" };
        state.derivations.geometry = { derives_from: revision, status: "current" };
        state.completeness.geometry = "available";
        recompute(false);
      } else {
        generatedGeometry = null;
        state.workingGeometry = utils.deepClone(coachReferenceGeometry);
        state.geometryState = { status: coachReferenceGeometry ? "coach_reference" : "unavailable", resolver: null };
        state.derivations.geometry = { derives_from: revision, status: "unavailable" };
        state.completeness.geometry = "unavailable";
      }
      emit();
    }

    function setClarificationAnswer(questionId, value) {
      state.clarificationAnswers[questionId] = value;
      state.validation = { ...state.validation, status: "changes_pending", preflight: null };
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
      if (generatedGeometry) throw new Error("GENERATED_GEOMETRY_ALREADY_AVAILABLE");
      if (!coachReferenceGeometry) coachReferenceGeometry = manualApi.createCoachReferenceGeometry(state.currentCase.id, profile);
      state.geometryState = { status: "coach_reference", resolver: null };
      state.derivations.geometry = { derives_from: utils.fingerprint(state.currentCase.description), status: "current" };
      state.composition = { ...state.composition, status: "manual_reference" };
      state.completeness.geometry = "available";
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

    function removeManualPrimitive(id) {
      if (!coachReferenceGeometry) throw new Error("COACH_REFERENCE_NOT_STARTED");
      coachReferenceGeometry = manualApi.removePrimitive(coachReferenceGeometry, id);
      if (state.selectedElement && state.selectedElement.ref.endsWith(`:${id}`)) state.selectedElement = null;
      state.coachObservations.push({
        id: `OBS-${String(state.coachObservations.length + 1).padStart(3, "0")}`,
        type: "coach_reference_deletion",
        statement: `${id} s’ha eliminat de la referència manual.`,
        target_ref: `coach_reference:${id}`,
        status: "case_only",
        created_at: now()
      });
      recompute(false);
      emit();
      return true;
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
      state.completeness.visual_validation = "validated_for_case";
      state.geometryState.status = geometryStatus(generatedGeometry, coachReferenceGeometry, state.corrections, Boolean(state.workingGeometry));
      emit();
      return utils.deepClone(state.validation);
    }

    function caseRecord(status) {
      return {
        id: state.currentCase.id,
        case_uid: state.currentCase.case_uid,
        short_code: state.currentCase.short_code,
        name: state.currentCase.name,
        status: status || state.validation.status,
        saved_at: now(),
        case: utils.deepClone(state.currentCase),
        interpretation: utils.deepClone(state.interpretation),
        semantic_model: utils.deepClone(state.semanticModel),
        spatial_model: utils.deepClone(state.spatialModel),
        geometry_state: utils.deepClone(state.geometryState),
        generated_geometry: utils.deepClone(generatedGeometry),
        coach_reference_geometry: utils.deepClone(coachReferenceGeometry),
        derivations: utils.deepClone(state.derivations),
        clarification_answers: utils.deepClone(state.clarificationAnswers),
        composition: utils.deepClone(state.composition),
        completeness: utils.deepClone(state.completeness),
        validation: utils.deepClone(state.validation),
        corrections: utils.deepClone(state.corrections),
        coach_observations: utils.deepClone(state.coachObservations),
        geometry: utils.deepClone(state.validatedGeometry || state.workingGeometry)
      };
    }

    function saveCase(optionsInput) {
      const record = caseRecord(optionsInput && optionsInput.status || (state.validation.status === "validated_case" ? "validated" : "in_construction"));
      const destination = record.status === "validated" ? "validated_cases" : "drafts";
      const opposite = destination === "validated_cases" ? "drafts" : "validated_cases";
      const index = state.knowledgeLibrary[destination].findIndex((item) => item.case_uid === record.case_uid || item.id === record.id);
      if (index >= 0) state.knowledgeLibrary[destination][index] = record;
      else state.knowledgeLibrary[destination].push(record);
      state.knowledgeLibrary[opposite] = state.knowledgeLibrary[opposite].filter((item) => item.case_uid !== record.case_uid && item.id !== record.id);
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

    function loadSavedCase(record) {
      if (!record || !record.case) throw new Error("SAVED_CASE_INVALID");
      generatedGeometry = record.generated_geometry ? utils.deepFreeze(utils.deepClone(record.generated_geometry)) : null;
      coachReferenceGeometry = utils.deepClone(record.coach_reference_geometry || (!generatedGeometry ? record.geometry : null));
      baseInterpretation = utils.deepClone(record.interpretation || emptyInterpretation());
      baseSemanticModel = utils.deepClone(record.semantic_model || emptySemanticModel());
      baseSpatialModel = utils.deepClone(record.spatial_model || emptySpatialModel());
      state.currentCase = {
        ...utils.deepClone(record.case),
        case_uid: record.case.case_uid || record.case_uid || newIdentity(),
        short_code: record.case.short_code || record.short_code || record.id
      };
      state.corrections = utils.deepClone(record.corrections || []);
      state.redoStack = [];
      state.coachObservations = utils.deepClone(record.coach_observations || []);
      state.clarificationAnswers = utils.deepClone(record.clarification_answers || {});
      state.composition = utils.deepClone(record.composition || { status: generatedGeometry ? "generated" : coachReferenceGeometry ? "manual_reference" : "not_started", questions: [], used_primitives: [], unresolved: [] });
      state.completeness = utils.deepClone(record.completeness || { semantic: "unknown", spatial: "unknown", geometry: generatedGeometry || coachReferenceGeometry ? "available" : "unavailable", visual_validation: "not_reviewed" });
      state.derivations = utils.deepClone(record.derivations || derivationState(state.currentCase.description, Boolean(generatedGeometry || coachReferenceGeometry)));
      state.geometryState = utils.deepClone(record.geometry_state || { status: generatedGeometry ? "generated" : coachReferenceGeometry ? "coach_reference" : "unavailable", resolver: null });
      state.selectedAlternatives = defaultAlternatives(generatedGeometry || coachReferenceGeometry);
      correctionSequence = state.corrections.length;
      recompute(false);
      if (record.validation && record.validation.status === "validated_case") {
        state.validation = utils.deepClone(record.validation);
        state.validatedGeometry = utils.deepClone(record.geometry || state.workingGeometry);
        state.validatedVisualGrammar = utils.deepClone(state.workingVisualGrammar);
      }
      emit();
      return utils.deepClone(state.currentCase);
    }

    function saveExercise(author) {
      const validation = validate(author || "coach");
      const record = saveCase({ status: "validated" });
      return { validation, record };
    }

    function addCoachValidatedKnowledge(input) {
      if (state.validation.status !== "validated_case") throw new Error("REUSABLE_KNOWLEDGE_REQUIRES_VALIDATED_CASE");
      const label = String(input.label || "").trim();
      const definition = String(input.definition || "").trim();
      if (!label || !definition) throw new Error("REUSABLE_KNOWLEDGE_FIELDS_REQUIRED");
      const matchingIndex = state.knowledgeLibrary.coach_validated_local_knowledge.findIndex((candidate) =>
        utils.slug(candidate.label) === utils.slug(label)
        && candidate.category === (input.category || "action")
        && candidate.scope === (input.scope || "CONCEPT")
      );
      const previous = matchingIndex >= 0 ? state.knowledgeLibrary.coach_validated_local_knowledge[matchingIndex] : null;
      const id = input.id || previous && previous.id || newIdentity().replace(/^CASE-/, "LOCAL-KNOWLEDGE-");
      const evidenceId = `EVIDENCE-${id}`;
      const uniqueEvidenceId = previous ? `${evidenceId}-${String((previous.evidence_refs || []).length + 1).padStart(3, "0")}` : evidenceId;
      const aliases = [...new Set([label, ...(input.aliases || [])].map((value) => String(value || "").trim()).filter(Boolean))];
      const evidence = {
        id: uniqueEvidenceId,
        type: "coach_validated_case",
        source_case_id: state.currentCase.id,
        source_case_uid: state.currentCase.case_uid,
        statement: definition,
        correction_refs: utils.deepClone(input.correction_refs || []),
        recorded_at: now()
      };
      const item = {
        id,
        label,
        definition,
        aliases,
        category: input.category || "action",
        semantic_ref: input.semantic_ref || null,
        scope: input.scope || "CONCEPT",
        status: "validated",
        authority: "coach_validated",
        evidence_refs: [...new Set([...(previous && previous.evidence_refs || []), uniqueEvidenceId])],
        source_case_id: state.currentCase.id,
        source_case_uid: state.currentCase.case_uid,
        supporting_case_refs: [...new Set([...(previous && previous.supporting_case_refs || []), state.currentCase.case_uid])],
        source_correction_refs: [...new Set([...(previous && previous.source_correction_refs || []), ...(input.correction_refs || [])])],
        counterexample_refs: [...new Set([...(previous && previous.counterexample_refs || []), ...(input.counterexample_refs || [])])],
        created_at: previous && previous.created_at || now(),
        updated_at: now()
      };
      const existing = state.knowledgeLibrary.coach_validated_local_knowledge.findIndex((candidate) => candidate.id === id);
      if (existing >= 0) state.knowledgeLibrary.coach_validated_local_knowledge[existing] = item;
      else state.knowledgeLibrary.coach_validated_local_knowledge.push(item);
      const evidenceIndex = state.knowledgeLibrary.evidence_records.findIndex((candidate) => candidate.id === uniqueEvidenceId);
      if (evidenceIndex >= 0) state.knowledgeLibrary.evidence_records[evidenceIndex] = evidence;
      else state.knowledgeLibrary.evidence_records.push(evidence);
      emit();
      return utils.deepClone(item);
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
      const signature = (event) => `${event.target && event.target.layer}|${event.target && event.target.property}|${JSON.stringify(event.after)}`;
      const previousEvents = (state.knowledgeLibrary.validated_cases || []).flatMap((record) => record.corrections || []);
      const repetitionCounts = [...previousEvents, ...state.corrections].reduce((counts, event) => {
        const key = signature(event);
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {});
      const repetitionSuggestions = state.corrections.flatMap((event) => {
        const count = repetitionCounts[signature(event)] || 0;
        return count >= 3 ? [{ signature: signature(event), count, correction_ref: event.id, message: `Has fet una correcció equivalent en ${count} casos o versions. Vols convertir-la en criteri reutilitzable?` }] : [];
      });
      return {
        case_specific: correctionCounts,
        candidate_knowledge: candidates.map((item) => ({ id: item.id, type: item.type, title: item.title })),
        unresolved: [...(state.interpretation.unresolved || []), ...(state.interpretation.unknown_concepts || []).filter((item) => !item.definition)],
        coach_observations: utils.deepClone(state.coachObservations),
        repetition_suggestions: repetitionSuggestions,
        canonical_changes: 0
      };
    }

    function restorePackage(payload) {
      if (!payload || payload.format !== "TRACA_training_case" || !["0.2.0", "0.3.0", "0.4.0"].includes(payload.version)) throw new Error("TRAINING_CASE_PACKAGE_INVALID");
      generatedGeometry = payload.generated_geometry ? utils.deepFreeze(utils.deepClone(payload.generated_geometry)) : null;
      coachReferenceGeometry = utils.deepClone(payload.coach_reference_geometry || null);
      baseVisualGrammar = utils.deepFreeze(utils.deepClone(payload.base_visual_grammar || payload.generated_visual_grammar || options.visualGrammar));
      baseInterpretation = utils.deepClone(payload.interpretation || emptyInterpretation());
      baseSemanticModel = utils.deepClone(payload.semantic_model || emptySemanticModel());
      baseSpatialModel = utils.deepClone(payload.spatial_model || emptySpatialModel());
      state.currentCase = {
        ...utils.deepClone(payload.case),
        case_uid: payload.case.case_uid || newIdentity(),
        short_code: payload.case.short_code || payload.case.id
      };
      state.corrections = utils.deepClone(payload.corrections || []);
      state.redoStack = [];
      state.coachObservations = utils.deepClone(payload.coach_observations || []);
      const importedLibrary = { ...defaultLibrary(), ...utils.deepClone(payload.knowledge_library || {}) };
      if (payload.version !== "0.4.0") {
        const validated = [];
        (importedLibrary.validated_cases || []).forEach((record) => {
          if (record.status === "validated" || record.status === "validated_case" || record.validation && record.validation.status === "validated_case") validated.push(record);
          else importedLibrary.drafts.push(record);
        });
        importedLibrary.validated_cases = validated;
      }
      state.knowledgeLibrary = importedLibrary;
      state.selectedAlternatives = utils.deepClone(payload.selected_alternatives || defaultAlternatives(generatedGeometry));
      state.geometryState = utils.deepClone(payload.geometry_state || { status: geometryStatus(generatedGeometry, coachReferenceGeometry, state.corrections, false), resolver: generatedGeometry ? "imported" : null });
      state.clarificationAnswers = utils.deepClone(payload.clarification_answers || {});
      state.composition = utils.deepClone(payload.composition || { status: generatedGeometry ? "imported" : coachReferenceGeometry ? "manual_reference" : "not_started", questions: [], used_primitives: [], unresolved: [] });
      state.completeness = utils.deepClone(payload.completeness || { semantic: "unknown", spatial: "unknown", geometry: generatedGeometry || coachReferenceGeometry ? "available" : "unavailable", visual_validation: "not_reviewed" });
      state.derivations = utils.deepClone(payload.derivations || derivationState(state.currentCase.description, Boolean(generatedGeometry || coachReferenceGeometry)));
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
      setCompositionResult, setClarificationAnswer,
      startCoachReference, addManualPrimitive, removeManualPrimitive, recordCoachObservation, undo, redo, reset, setSelection, setUi, setAlternative,
      updateCorrectionExplanation, runPreflight, validate, saveCase, saveExercise, loadSavedCase, addCoachValidatedKnowledge, createPromotion, whatLearned, restorePackage
    };
  }

  return { WORKSPACE_VERSION, emptyInterpretation, emptySemanticModel, emptySpatialModel, defaultLibrary, derivationState, createWorkspaceStore };
});
