(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const escape = (value) => window.TRACA_UTILS.escapeHtml(value);
  const canonicalExamples = [{ caseData: window.TRACA_UVOF015_CASE, geometry: window.TRACA_UVOF015_GEOMETRY }];
  const persistedAtOpen = window.TRACA_PERSISTENCE.load();
  const initialCase = {
    id: "CASE-NEW",
    name: "Cas sense títol",
    case_type: "learning_case",
    status: "in_construction",
    description: "",
    notes: "",
    origin: "coach_input",
    tags: [],
    source_refs: ["coach_input"]
  };
  const store = window.TRACA_STORE.createWorkspaceStore({
    initialCase,
    initialGeometry: null,
    visualGrammar: window.TRACA_VISUAL_GRAMMAR.createVisualGrammar(window.TRACA_VISUAL_FUNCTIONAL_DICTIONARY),
    initialLibrary: persistedAtOpen && persistedAtOpen.knowledge_library
  });
  const editor = window.TRACA_EDITOR.createEditor({ container: $("#court-stage"), store });
  let toastTimer = null;
  let handledCorrectionCount = 0;
  let pendingReusable = [];
  let diagnosticPayloads = {};

  const elements = {
    description: $("#description"), nameInput: $("#case-name-input"), notes: $("#case-notes"), metadata: $("#case-metadata"),
    caseId: $("#case-id"), caseName: $("#case-name"), provider: $("#provider-label"), understood: $("#understood-list"),
    questions: $("#clarification-questions"), questionCount: $("#question-count"), suggestions: $("#resolver-suggestions"),
    derivationAlert: $("#derivation-alert"), courtStage: $("#court-stage"), noGeometry: $("#no-geometry"), courtHelp: $("#court-help"),
    undo: $("#undo"), redo: $("#redo"), reset: $("#reset"), reusePrompt: $("#reuse-prompt"), saveMessage: $("#save-message"),
    toast: $("#toast"), announcer: $("#announcer"), exerciseList: $("#exercise-list"),
    inspectorEmpty: $("#inspector-empty"), inspectorForm: $("#inspector-form"), selectionType: $("#selection-type"),
    selectedId: $("#selected-id"), selectedRef: $("#selected-ref"), positionFields: $("#position-fields"),
    positionX: $("#position-x"), positionY: $("#position-y"), entityKindField: $("#entity-kind-field"), entityKind: $("#entity-kind"),
    pathKindField: $("#path-kind-field"), pathKind: $("#path-kind"), visualColorField: $("#visual-color-field"), visualColor: $("#visual-color"),
    correctionReason: $("#correction-reason"), deleteManual: $("#delete-manual"), sourceRefs: $("#source-ref-list"),
    manualTools: $("#manual-tools"), manualType: $("#manual-primitive-type"), manualKind: $("#manual-kind"), manualLabel: $("#manual-label"),
    resolverMessage: $("#resolver-message"), branches: $("#branch-selectors"), history: $("#history-list"), historyCount: $("#history-count"),
    validation: $("#validation-summary"), library: $("#library-summary"), traceability: $("#traceability-summary"),
    builderCollection: $("#builder-collection"), builderKind: $("#builder-kind"), builderLabel: $("#builder-label"),
    builderDetails: $("#builder-details"), builderState: $("#builder-state"), builderCurrent: $("#builder-current-list"),
    promotionType: $("#promotion-type"), promotionScope: $("#promotion-scope"), promotionCorrections: $("#promotion-corrections"),
    importFile: $("#import-file"), compositionDiagnosticsStatus: $("#composition-diagnostics-status"),
    compositionHumanSummary: $("#composition-human-summary"), compositionActionsSummary: $("#composition-actions-summary")
  };

  function toast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    elements.announcer.textContent = message;
    toastTimer = setTimeout(() => { elements.toast.hidden = true; }, 3600);
  }

  function readCaseForm() {
    return {
      description: elements.description.value,
      name: elements.nameInput.value.trim() || "Cas sense títol",
      notes: elements.notes.value
    };
  }

  function syncCaseForm(snapshot) {
    elements.description.value = snapshot.currentCase.description || "";
    elements.nameInput.value = snapshot.currentCase.name === "Cas sense títol" ? "" : snapshot.currentCase.name || "";
    elements.notes.value = snapshot.currentCase.notes || "";
  }

  function resolverOptions(snapshot) {
    return {
      canonicalCases: canonicalExamples.map((item) => item.caseData),
      canonicalKnowledge: window.TRACA_LOCAL_KNOWLEDGE,
      dictionary: window.TRACA_VISUAL_FUNCTIONAL_DICTIONARY,
      library: snapshot.knowledgeLibrary
    };
  }

  function generateCurrentCase() {
    store.updateCase(readCaseForm());
    let snapshot = store.snapshot();
    if (!snapshot.currentCase.description.trim()) {
      toast("Escriu primer la situació que vols representar.");
      elements.description.focus();
      return;
    }
    const result = window.TRACA_KNOWLEDGE_RESOLVER.resolve(snapshot.currentCase, resolverOptions(snapshot));
    store.setInterpretation(result);
    snapshot = store.snapshot();
    if (snapshot.currentCase.case_type !== "canonical_specimen") {
      const composition = window.TRACA_REPRESENTATION_COMPOSER.compose({
        currentCase: snapshot.currentCase,
        tacticalIR: snapshot.interpretation.tactical_ir,
        interpretation: snapshot.interpretation,
        answers: snapshot.clarificationAnswers,
        courtProfile: window.TRACA_COURT_PROFILE
      });
      store.setCompositionResult(composition, "global_composition_pipeline");
      const message = composition.composition_status === "blocked"
        ? "Hi ha una contradicció entre relacions validades. Cal revisar-la abans de continuar."
        : composition.composition_status === "needs_input"
          ? "He compost el que sé. Em falta una resposta directa per continuar."
          : composition.composition_status === "partial"
            ? `Representació parcial: ${composition.coverage.label} accions compostes.`
            : composition.geometry_status === "ready"
              ? "Representació generada a partir de relacions resoltes."
              : "He compost totes les accions, però em falta informació espacial per dibuixar-les sense inventar.";
      toast(message);
    } else {
      toast("Exemple canònic carregat per comprovar regressions.");
    }
  }

  function renderIdentity(snapshot) {
    elements.caseId.textContent = snapshot.currentCase.short_code || snapshot.currentCase.id;
    elements.caseName.textContent = snapshot.currentCase.name;
    const tags = (snapshot.currentCase.tags || []).join(" · ") || "pendents de generar";
    elements.metadata.textContent = `Origen: entrada de l’entrenador · Etiquetes automàtiques: ${tags}`;
    elements.provider.textContent = snapshot.interpretation.provider || "Encara no generat";
    const stale = Object.entries(snapshot.derivations || {}).some(([key, value]) => key !== "source" && value.status === "stale");
    elements.derivationAlert.hidden = !stale;
    elements.saveMessage.className = "save-message";
    if (stale) elements.saveMessage.textContent = "El text ha canviat: torna a generar abans de guardar.";
  }

  function renderUnderstanding(snapshot) {
    const concepts = snapshot.interpretation.concepts || [];
    const coverage = snapshot.composition.coverage;
    const coverageCopy = coverage ? `<p class="composition-coverage"><strong>${escape(coverage.label)} accions compostes</strong>${coverage.actions_unsupported ? ` · ${coverage.actions_unsupported} encara no suportada${coverage.actions_unsupported === 1 ? "" : "s"}` : ""}${snapshot.composition.geometry_status && snapshot.composition.geometry_status !== "ready" ? ` · geometria: ${escape(snapshot.composition.geometry_status)}` : ""}</p>` : "";
    elements.understood.innerHTML = concepts.length
      ? `<div class="understood-grid">${concepts.map((item) => `<span class="understood-item ${item.knowledge_state === "validated" ? "" : "is-provisional"}">${escape(item.label)}${item.source === "coach_validated_local_knowledge" ? " · après" : ""}</span>`).join("")}</div>${coverageCopy}`
      : '<p class="empty-copy">Encara no hi ha cap concepte resolt.</p>';
    const activeQuestion = snapshot.composition.active_question || null;
    const questions = activeQuestion ? [activeQuestion] : [];
    const unresolved = [...(snapshot.interpretation.unknown_concepts || []), ...(snapshot.interpretation.unresolved || [])];
    elements.questionCount.textContent = String(questions.length || (unresolved.length ? 1 : 0));
    const questionMarkup = questions.map((question) => `<article class="question-card"><strong>${escape(question.label)}</strong>${question.multiple ? `<span class="empty-copy">Tria ${question.required_count} opcions.</span>` : ""}${question.suggested_answer ? `<span class="empty-copy">Suggeriment: ${escape(question.suggested_answer.label)}. No s’ha aplicat.</span>` : ""}<div class="answer-options">${question.options.map((option) => `<button class="button button-secondary" type="button" data-answer-question="${escape(question.id)}" data-answer-value="${escape(option.value)}" data-answer-multiple="${question.multiple ? "true" : "false"}" data-answer-limit="${question.maximum_count || 1}">${escape(option.label)}</button>`).join("")}</div></article>`).join("");
    const unresolvedMarkup = !questions.length && unresolved.length ? `<article class="question-card"><strong>${escape(unresolved[0].label || unresolved[0].reason || "Concepte pendent")}</strong><span class="empty-copy">Es conserva com a no resolt; no s’ha inventat cap regla.</span></article>` : "";
    elements.questions.innerHTML = questionMarkup || unresolvedMarkup || '<p class="empty-copy">Cap pregunta pendent.</p>';
    elements.questions.querySelectorAll("[data-answer-question]").forEach((button) => button.addEventListener("click", () => {
      const questionId = button.dataset.answerQuestion;
      if (button.dataset.answerMultiple === "true") {
        const record = store.snapshot().clarificationAnswers[questionId];
        const current = record && typeof record === "object" && !Array.isArray(record) && Object.prototype.hasOwnProperty.call(record, "value") ? record.value : record;
        const selected = Array.isArray(current) ? current.slice() : current ? [current] : [];
        const value = button.dataset.answerValue;
        const next = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value].slice(-(Number(button.dataset.answerLimit) || 1));
        store.setClarificationAnswer(questionId, next);
      } else store.setClarificationAnswer(questionId, button.dataset.answerValue);
      generateCurrentCase();
    }));
    const suggestions = snapshot.interpretation.suggestions || [];
    elements.suggestions.innerHTML = suggestions.map((item) => `<p class="suggestion">Suggeriment candidat — ${escape(item.label)}. No s’ha aplicat.</p>`).join("");
  }

  function geometryForView(snapshot) {
    if (snapshot.derivations.geometry && snapshot.derivations.geometry.status === "stale") return null;
    return snapshot.ui.view === "generated" ? snapshot.generatedGeometry : snapshot.workingGeometry;
  }

  function renderCourt(snapshot) {
    const geometry = geometryForView(snapshot);
    elements.courtStage.hidden = !geometry;
    elements.noGeometry.hidden = Boolean(geometry);
    $$('[data-view]').forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === snapshot.ui.view);
      button.disabled = ["generated", "compare"].includes(button.dataset.view) && !snapshot.generatedGeometry;
    });
    elements.undo.disabled = !snapshot.corrections.length;
    elements.redo.disabled = !snapshot.redoStack.length;
    elements.reset.disabled = !snapshot.corrections.length;
    if (!geometry) return;
    window.TRACA_RENDERER.render(elements.courtStage, {
      geometry,
      visualGrammar: snapshot.workingVisualGrammar,
      selectedAlternatives: snapshot.selectedAlternatives,
      selection: snapshot.selectedElement,
      view: snapshot.ui.view === "control" ? "control" : "clean",
      comparisonGeometry: snapshot.ui.view === "compare" ? snapshot.generatedGeometry : null
    });
    if (snapshot.ui.view === "control" || snapshot.ui.view === "corrected") editor.bind();
    elements.courtHelp.textContent = snapshot.coachReferenceGeometry && !snapshot.generatedGeometry
      ? "Referència manual: moure no crea coneixement tàctic. No és generatedGeometry."
      : "Arrossega una icona o un estat futur; les trajectòries i passades vinculades s’actualitzen juntes.";
  }

  function primitiveForSelection(resolved, snapshot) {
    if (!resolved) return null;
    if (resolved.parsed.collection === "entity") {
      const style = snapshot.workingVisualGrammar.entities[resolved.object.kind];
      return style ? { ref: `visual:entity:${resolved.object.kind}`, style } : null;
    }
    if (["common_path", "alternative", "approach_path", "return_pass"].includes(resolved.parsed.collection)) {
      const primitive = window.TRACA_VISUAL_GRAMMAR.primitiveForPath(resolved.object.kind, snapshot.workingVisualGrammar);
      const style = snapshot.workingVisualGrammar.paths[primitive];
      return style ? { ref: `visual:primitive:${primitive}`, style } : null;
    }
    return null;
  }

  function renderInspector(snapshot) {
    const resolved = snapshot.workingGeometry && snapshot.selectedElement ? window.TRACA_EDITOR.resolveSelection(snapshot, snapshot.selectedElement) : null;
    elements.inspectorEmpty.hidden = Boolean(resolved);
    elements.inspectorForm.hidden = !resolved;
    elements.selectionType.textContent = resolved ? resolved.parsed.collection : "Sense selecció";
    if (!resolved) return;
    elements.selectedId.textContent = resolved.object.label || resolved.object.id;
    elements.selectedRef.textContent = resolved.ref;
    const isPosition = ["entity", "participant_state"].includes(resolved.parsed.collection);
    const isEntity = resolved.parsed.collection === "entity";
    const isPath = ["common_path", "alternative", "approach_path", "return_pass"].includes(resolved.parsed.collection);
    elements.positionFields.hidden = !isPosition;
    if (isPosition) {
      const linked = isEntity && resolved.object.state_ref ? (snapshot.workingGeometry.participant_states || []).find((item) => item.id === resolved.object.state_ref) : null;
      const position = (linked || resolved.object).position;
      elements.positionX.value = position[0]; elements.positionY.value = position[1];
    }
    elements.entityKindField.hidden = !isEntity;
    elements.pathKindField.hidden = !isPath;
    if (isEntity) elements.entityKind.value = resolved.object.kind;
    if (isPath) elements.pathKind.value = resolved.object.kind;
    const visual = primitiveForSelection(resolved, snapshot);
    elements.visualColorField.hidden = !visual;
    if (visual) elements.visualColor.value = visual.style.stroke || visual.style.fill;
    elements.sourceRefs.innerHTML = (resolved.source_refs || []).map((ref) => `<li>${escape(ref)}</li>`).join("") || "<li>coach_input</li>";
    elements.deleteManual.hidden = !(snapshot.coachReferenceGeometry && !snapshot.generatedGeometry);
  }

  function diagnosticValue(value) {
    if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
    return value === null || value === undefined || value === "" ? "—" : String(value);
  }

  function renderCompositionDiagnostics(snapshot) {
    const diagnostics = window.TRACA_INSPECTION_UI.diagnosticsFor(snapshot);
    const summary = diagnostics.composition;
    diagnosticPayloads = diagnostics.payloads;
    elements.compositionDiagnosticsStatus.textContent = diagnostics.stale ? "Cal regenerar" : diagnostics.current ? "Actual" : "No generat";
    const reasonMarkup = summary.reasons && summary.reasons.length ? `<h4>MOTIU</h4><ul class="diagnostics-reasons">${summary.reasons.map((reason) => `<li>${escape(reason)}</li>`).join("")}</ul>` : "";
    elements.compositionHumanSummary.innerHTML = `${diagnostics.message ? `<p class="diagnostics-message ${diagnostics.stale ? "is-stale" : ""}">${escape(diagnostics.message)}</p>` : ""}<h4>COMPOSICIÓ</h4><dl class="diagnostics-facts"><div><dt>estat</dt><dd>${escape(diagnosticValue(summary.status))}</dd></div><div><dt>geometria</dt><dd>${escape(diagnosticValue(summary.geometry))}</dd></div><div><dt>accions totals</dt><dd>${escape(diagnosticValue(summary.total))}</dd></div><div><dt>accions compostes</dt><dd>${escape(diagnosticValue(summary.composed))}</dd></div><div><dt>accions pendents</dt><dd>${escape(diagnosticValue(summary.pending))}</dd></div><div><dt>cobertura</dt><dd>${escape(diagnosticValue(summary.coverage))}</dd></div></dl>${reasonMarkup}`;
    elements.compositionActionsSummary.innerHTML = `<h4>ACCIONS</h4>${diagnostics.actions.length ? diagnostics.actions.map((action) => `<article class="diagnostic-action"><header><strong>${escape(diagnosticValue(action.type))}</strong><span>${escape(diagnosticValue(action.id))}</span></header><dl><div><dt>actor</dt><dd>${escape(diagnosticValue(action.actor))}</dd></div><div><dt>objectiu / receptor / company</dt><dd>${escape(diagnosticValue(action.target))}</dd></div><div><dt>defensor / oponent</dt><dd>${escape(diagnosticValue(action.opponent))}</dd></div><div><dt>espai inicial</dt><dd>${escape(diagnosticValue(action.initialSpace))}</dd></div><div><dt>espai final</dt><dd>${escape(diagnosticValue(action.finalSpace))}</dd></div><div><dt>estat origen</dt><dd>${escape(diagnosticValue(action.originState))}</dd></div><div><dt>estat destí</dt><dd>${escape(diagnosticValue(action.destinationState))}</dd></div><div><dt>autoritat</dt><dd>${escape(diagnosticValue(action.authority))}</dd></div><div><dt>status</dt><dd>${escape(diagnosticValue(action.status))}</dd></div></dl></article>`).join("") : '<p class="empty-copy">No hi ha accions actuals per inspeccionar.</p>'}`;
    const outputIds = {
      tacticalIR: "#diagnostic-tactical-ir",
      compositionPlan: "#diagnostic-composition-plan",
      spatialConstraints: "#diagnostic-spatial-constraints",
      questions: "#diagnostic-questions",
      ballFlow: "#diagnostic-ball-flow"
    };
    Object.entries(outputIds).forEach(([key, selector]) => {
      $(selector).textContent = JSON.stringify(diagnostics.payloads[key], null, 2);
      const button = $(`[data-copy-diagnostic="${key}"]`);
      if (button) button.disabled = diagnostics.payloads[key] === null;
    });
  }

  function renderAdvanced(snapshot) {
    renderCompositionDiagnostics(snapshot);
    elements.manualTools.hidden = !snapshot.coachReferenceGeometry;
    $("#start-manual-layout").disabled = Boolean(snapshot.generatedGeometry);
    elements.resolverMessage.textContent = snapshot.generatedGeometry
      ? `Compositor global + geometria resolta (${snapshot.geometryState.resolver || "pipeline"}).`
      : snapshot.composition.plan
        ? `Composició ${snapshot.composition.composition_status}; geometria ${snapshot.composition.geometry_status}. TRAÇA no inventarà les relacions espacials pendents.`
        : snapshot.coachReferenceGeometry ? "Referència manual de l’entrenador. No és generatedGeometry." : "Encara no hi ha un pla de composició per a aquest cas.";
    elements.branches.innerHTML = "";
    ((snapshot.workingGeometry && snapshot.workingGeometry.branches) || []).forEach((branch, index) => {
      const label = document.createElement("label");
      label.textContent = `Duel ${index + 1}`;
      const select = document.createElement("select");
      (branch.alternatives || []).forEach((alternative) => select.insertAdjacentHTML("beforeend", `<option value="${escape(alternative.id)}">${escape(alternative.kind)}</option>`));
      select.value = snapshot.selectedAlternatives[branch.id];
      select.addEventListener("change", () => store.setAlternative(branch.id, select.value));
      label.appendChild(select); elements.branches.appendChild(label);
    });
    elements.historyCount.textContent = String(snapshot.corrections.length);
    elements.history.innerHTML = snapshot.corrections.length ? snapshot.corrections.map((event) => `<article class="history-item"><strong>${escape(event.machine_explanation)}</strong><p>${escape(event.coach_explanation || "Correcció directa")}</p><small>${escape(event.id)} · ${escape(event.status)}</small></article>`).join("") : '<p class="empty-copy">Encara no hi ha correccions.</p>';
    const report = snapshot.validation.preflight;
    elements.validation.innerHTML = report ? report.diagnostics.map((item) => `<article class="diagnostic is-${item.level}"><strong>${escape(item.code)}</strong>${escape(item.message)}</article>`).join("") : '<p class="empty-copy">Encara no s’ha executat el preflight.</p>';
    const groups = window.TRACA_KNOWLEDGE_LIBRARY.inspectableItems(snapshot.knowledgeLibrary);
    elements.library.innerHTML = groups.map((group) => `<details class="library-section"><summary>${escape(group.label)} · ${group.items.length}</summary>${group.items.map((item) => `<article><strong>${escape(item.label || item.title || item.name || item.id)}</strong><p>${escape(item.definition || item.status || "")}</p></article>`).join("") || '<p class="empty-copy">Buit</p>'}</details>`).join("");
    const traceableComposition = snapshot.composition.status === "stale"
      ? { status: "stale", message: "La composició anterior s’ha ocultat perquè el text ha canviat." }
      : snapshot.composition;
    elements.traceability.innerHTML = `<pre>${escape(JSON.stringify({ case_uid: snapshot.currentCase.case_uid, derivations: snapshot.derivations, composition: traceableComposition, geometry_state: snapshot.geometryState }, null, 2))}</pre>`;
    const groupsKeys = ["participants", "materials", "spaces", "actions", "decisions", "phases"];
    elements.builderCurrent.innerHTML = groupsKeys.flatMap((key) => (snapshot.semanticModel[key] || []).map((item) => `<p class="builder-item"><strong>${escape(item.label)}</strong> · ${escape(item.knowledge_state)}</p>`)).join("") || '<p class="empty-copy">Model encara buit.</p>';
    elements.promotionCorrections.innerHTML = snapshot.corrections.map((event) => `<label><input type="checkbox" value="${escape(event.id)}" /> ${escape(event.machine_explanation)}</label>`).join("") || '<p class="empty-copy">No hi ha correccions seleccionables.</p>';
  }

  function renderReuse(snapshot) {
    if (snapshot.corrections.length < handledCorrectionCount) handledCorrectionCount = snapshot.corrections.length;
    elements.reusePrompt.hidden = !snapshot.corrections.length || snapshot.corrections.length <= handledCorrectionCount;
    const repeated = store.whatLearned().repetition_suggestions || [];
    const copy = elements.reusePrompt.querySelector("p");
    if (copy) copy.textContent = repeated.length ? repeated[0].message : "Cap correcció es converteix en regla automàticament.";
  }

  function render(snapshot) {
    renderIdentity(snapshot);
    renderUnderstanding(snapshot);
    renderCourt(snapshot);
    renderInspector(snapshot);
    renderAdvanced(snapshot);
    renderReuse(snapshot);
  }

  function updateManualKinds() {
    const kinds = elements.manualType.value === "entity" ? window.TRACA_MANUAL_GEOMETRY.ENTITY_KINDS : elements.manualType.value === "path" ? window.TRACA_MANUAL_GEOMETRY.PATH_KINDS : ["spatial_zone"];
    elements.manualKind.innerHTML = kinds.map((kind) => `<option value="${kind}">${kind.replaceAll("_", " ")}</option>`).join("");
  }

  const builderKinds = {
    participant: ["attacker", "defender", "pivot", "goalkeeper", "temporary_role"], material: ["cone", "bench", "cylinder", "ball"],
    space: ["interval", "zone", "functional_space"], action: ["pass", "movement", "reception", "shot", "feint", "block", "cross"],
    decision: ["mandatory", "preferred", "available", "open"], phase: ["previous", "subsequent", "simultaneous", "conditional"]
  };
  function updateBuilderKinds() { elements.builderKind.innerHTML = builderKinds[elements.builderCollection.value].map((kind) => `<option value="${kind}">${kind}</option>`).join(""); }

  function renderExercises() {
    const snapshot = store.snapshot();
    const section = (title, key) => `<section class="exercise-group"><h3>${title}</h3>${(snapshot.knowledgeLibrary[key] || []).map((record, index) => `<button class="exercise-row" type="button" data-library-key="${key}" data-library-index="${index}"><span><strong>${escape(record.name || record.id)}</strong><small>${escape(record.short_code || record.id)} · ${escape(record.saved_at || "")}</small></span><span>Obrir →</span></button>`).join("") || '<p class="empty-copy">Cap cas.</p>'}</section>`;
    elements.exerciseList.innerHTML = section("Esborranys", "drafts") + section("Validats", "validated_cases");
    elements.exerciseList.querySelectorAll("[data-library-key]").forEach((button) => button.addEventListener("click", () => {
      const current = store.snapshot();
      const record = current.knowledgeLibrary[button.dataset.libraryKey][Number(button.dataset.libraryIndex)];
      store.loadSavedCase(record); syncCaseForm(store.snapshot()); $("#exercises-dialog").close(); toast("Exercici obert.");
    }));
  }

  elements.entityKind.innerHTML = window.TRACA_MANUAL_GEOMETRY.ENTITY_KINDS.map((kind) => `<option value="${kind}">${kind}</option>`).join("");
  elements.pathKind.innerHTML = window.TRACA_MANUAL_GEOMETRY.PATH_KINDS.map((kind) => `<option value="${kind}">${kind}</option>`).join("");
  window.TRACA_PROMOTION.TYPES.forEach((type) => elements.promotionType.insertAdjacentHTML("beforeend", `<option value="${type}">${type}</option>`));
  window.TRACA_PROMOTION.SCOPES.forEach((scope) => elements.promotionScope.insertAdjacentHTML("beforeend", `<option value="${scope}">${scope}</option>`));
  updateManualKinds(); updateBuilderKinds();

  window.TRACA_INSPECTION_UI.createPanelController({
    body: document.body,
    toggle: $("#toggle-advanced"),
    tabs: $$('[data-mobile-panel]'),
    panels: $$('[data-panel]'),
    fallbackPanel: "court"
  });

  elements.description.addEventListener("input", () => store.updateCase({ description: elements.description.value }));
  elements.nameInput.addEventListener("change", () => store.updateCase({ name: elements.nameInput.value.trim() || "Cas sense títol" }));
  elements.notes.addEventListener("change", () => store.updateCase({ notes: elements.notes.value }));
  $("#generate-case").addEventListener("click", generateCurrentCase);
  $("#save-exercise").addEventListener("click", () => {
    store.updateCase(readCaseForm());
    try {
      store.saveExercise("coach");
      pendingReusable.forEach((item) => store.addCoachValidatedKnowledge(item));
      if (pendingReusable.length) store.saveCase({ status: "validated" });
      const learned = pendingReusable.length;
      pendingReusable = [];
      handledCorrectionCount = store.snapshot().corrections.length;
      const savedSnapshot = store.snapshot();
      const unresolvedCount = (savedSnapshot.interpretation.unresolved || []).length + (savedSnapshot.interpretation.unknown_concepts || []).length;
      elements.saveMessage.className = "save-message is-success";
      const pendingText = unresolvedCount ? ` Queden ${unresolvedCount} punt${unresolvedCount === 1 ? "" : "s"} sense resoldre.` : "";
      elements.saveMessage.textContent = (learned ? `Exercici validat i guardat. ${learned} criteri reutilitzable ja pot ajudar en casos futurs.` : "Exercici validat i guardat.") + pendingText;
      toast(elements.saveMessage.textContent);
    } catch (error) {
      const report = error.report || store.runPreflight();
      const first = report.diagnostics.find((item) => item.level === "error");
      elements.saveMessage.className = "save-message is-error";
      elements.saveMessage.textContent = first ? first.message : "No s’ha pogut guardar aquesta versió.";
      toast(elements.saveMessage.textContent);
    }
  });
  $("#save-draft").addEventListener("click", () => { store.updateCase(readCaseForm()); store.saveCase({ status: "in_construction" }); toast("Esborrany guardat, encara no validat."); });
  $("#new-case").addEventListener("click", () => { store.createCase({ name: "Cas sense títol", description: "", notes: "" }); pendingReusable = []; handledCorrectionCount = 0; syncCaseForm(store.snapshot()); elements.description.focus(); toast("Nou cas en blanc."); });
  $("#exercises").addEventListener("click", () => { renderExercises(); $("#exercises-dialog").showModal(); });
  $$('[data-close-dialog]').forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
  $$('[data-view]').forEach((button) => button.addEventListener("click", () => { if (!button.disabled) store.setUi({ view: button.dataset.view }); }));
  $$('[data-dock]').forEach((button) => button.addEventListener("click", () => {
    $$('[data-dock]').forEach((item) => item.classList.toggle("is-active", item === button));
    $$('[data-dock-content]').forEach((section) => { section.hidden = section.dataset.dockContent !== button.dataset.dock; });
  }));
  elements.undo.addEventListener("click", () => store.undo()); elements.redo.addEventListener("click", () => store.redo()); elements.reset.addEventListener("click", () => store.reset());

  $("#reuse-case-only").addEventListener("click", () => {
    store.recordCoachObservation({ statement: "Les correccions actuals s’apliquen només a aquest cas.", status: "case_only" });
    handledCorrectionCount = store.snapshot().corrections.length; renderReuse(store.snapshot()); toast("Canvi conservat només en aquest cas.");
  });
  $("#reuse-rule").addEventListener("click", () => $("#reuse-dialog").showModal());
  $("#reuse-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const label = $("#reuse-label").value.trim(), definition = $("#reuse-definition").value.trim();
    if (!label || !definition) return;
    pendingReusable.push({ label, definition, aliases: $("#reuse-aliases").value.split(",").map((item) => item.trim()).filter(Boolean), category: $("#reuse-category").value, correction_refs: store.snapshot().corrections.map((item) => item.id) });
    handledCorrectionCount = store.snapshot().corrections.length; $("#reuse-dialog").close(); event.currentTarget.reset(); renderReuse(store.snapshot()); toast("El criteri s’activarà només quan guardis i validis el cas.");
  });

  elements.inspectorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const snapshot = store.snapshot();
    const resolved = window.TRACA_EDITOR.resolveSelection(snapshot, snapshot.selectedElement);
    if (!resolved) return;
    const reason = elements.correctionReason.value.trim() || "Correcció directa de l’entrenador";
    let changes = 0;
    if (["entity", "participant_state"].includes(resolved.parsed.collection)) {
      const linked = resolved.parsed.collection === "entity" && resolved.object.state_ref ? (snapshot.workingGeometry.participant_states || []).find((item) => item.id === resolved.object.state_ref) : null;
      const object = linked || resolved.object;
      const ref = linked ? `geometry:participant_state:${linked.id}` : resolved.ref;
      const after = [Number(elements.positionX.value), Number(elements.positionY.value)];
      if (!window.TRACA_UTILS.sameValue(object.position, after)) { store.applyCorrection({ target: { layer: "geometry", ref, property: "position" }, operation: "move", before: object.position, after, reason }); changes += 1; }
    }
    if (resolved.parsed.collection === "entity" && elements.entityKind.value !== resolved.object.kind) { store.applyCorrection({ target: { layer: "geometry", ref: resolved.ref, property: "kind" }, operation: "replace", before: resolved.object.kind, after: elements.entityKind.value, reason }); changes += 1; }
    if (["common_path", "alternative", "approach_path", "return_pass"].includes(resolved.parsed.collection) && elements.pathKind.value !== resolved.object.kind) { store.applyCorrection({ target: { layer: "geometry", ref: resolved.ref, property: "kind" }, operation: "replace", before: resolved.object.kind, after: elements.pathKind.value, reason }); changes += 1; }
    const visual = primitiveForSelection(resolved, snapshot);
    if (visual) { const property = visual.style.stroke ? "stroke" : "fill"; if (elements.visualColor.value !== visual.style[property]) { store.applyCorrection({ target: { layer: "visual", ref: visual.ref, property }, operation: "replace", before: visual.style[property], after: elements.visualColor.value, reason }); changes += 1; } }
    toast(changes ? `${changes} correcció${changes === 1 ? "" : "ns"} aplicada${changes === 1 ? "" : "des"}.` : "No hi havia cap canvi.");
  });
  elements.deleteManual.addEventListener("click", () => {
    const snapshot = store.snapshot(); const resolved = window.TRACA_EDITOR.resolveSelection(snapshot, snapshot.selectedElement);
    if (resolved) { store.removeManualPrimitive(resolved.object.id); toast("Element manual eliminat."); }
  });

  $("#start-manual-layout").addEventListener("click", () => { try { store.startCoachReference(window.TRACA_COURT_PROFILE); store.setUi({ view: "control" }); toast("Referència manual iniciada."); } catch (_error) { toast("Aquest cas ja té geometria generada; corregeix-la directament."); } });
  elements.manualType.addEventListener("change", updateManualKinds);
  $("#add-manual-primitive").addEventListener("click", () => { store.addManualPrimitive({ primitive_type: elements.manualType.value, kind: elements.manualKind.value, label: elements.manualLabel.value }); elements.manualLabel.value = ""; toast("Primitiva manual afegida."); });
  $("#open-semantic-builder").addEventListener("click", () => $("#semantic-builder-dialog").showModal());
  elements.builderCollection.addEventListener("change", updateBuilderKinds);
  $("#builder-add").addEventListener("click", () => { if (!elements.builderLabel.value.trim()) return; store.addSemanticItem({ collection: elements.builderCollection.value, kind: elements.builderKind.value, label: elements.builderLabel.value.trim(), details: elements.builderDetails.value, knowledge_state: elements.builderState.value }); elements.builderLabel.value = ""; elements.builderDetails.value = ""; toast("Element afegit al model del cas."); });

  $("#run-preflight").addEventListener("click", () => { const report = store.runPreflight(); toast(report.can_validate ? "Comprovació superada." : "Hi ha errors que cal resoldre."); });
  $("#load-example").addEventListener("click", () => { const example = canonicalExamples[0]; const interpretation = window.TRACA_KNOWLEDGE_RESOLVER.resolve({ ...example.caseData, case_type: "canonical_specimen" }, resolverOptions(store.snapshot())); store.loadCanonicalCase(example.caseData, example.geometry, interpretation); syncCaseForm(store.snapshot()); toast("UVOF015 carregat només com a exemple i regressió."); });
  $("#continue-last").addEventListener("click", () => { if (!persistedAtOpen) { toast("No hi ha cap sessió anterior."); return; } store.restorePackage(persistedAtOpen); syncCaseForm(store.snapshot()); toast("Darrer cas recuperat."); });
  $("#open-promotion").addEventListener("click", () => { if (store.snapshot().validation.status !== "validated_case") { toast("Primer cal guardar i validar el cas."); return; } $("#promotion-dialog").showModal(); });
  $("#promotion-form").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const refs = [...elements.promotionCorrections.querySelectorAll("input:checked")].map((input) => input.value);
      store.createPromotion({ type: elements.promotionType.value, scope: elements.promotionScope.value, scope_ref: $("#promotion-scope-ref").value, title: $("#promotion-title").value, definition: $("#promotion-definition").value, reason: $("#promotion-reason").value, examples: $("#promotion-examples").value, correction_refs: refs });
      $("#promotion-dialog").close(); event.currentTarget.reset(); toast("Candidat creat. Encara no decideix cap interpretació.");
    } catch (_error) { toast("Completa els camps obligatoris."); }
  });
  $("#export-case").addEventListener("click", () => window.TRACA_IMPORT_EXPORT.downloadPackage(store.snapshot()));
  $$('[data-copy-diagnostic]').forEach((button) => button.addEventListener("click", async () => {
    const payload = diagnosticPayloads[button.dataset.copyDiagnostic];
    if (payload === null || payload === undefined) return;
    const content = JSON.stringify(payload, null, 2);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(content);
      else {
        const temporary = document.createElement("textarea");
        temporary.value = content;
        temporary.setAttribute("readonly", "");
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";
        document.body.appendChild(temporary);
        temporary.select();
        document.execCommand("copy");
        temporary.remove();
      }
      toast(`${button.closest("[data-diagnostic-block]").querySelector("summary").textContent} copiat.`);
    } catch (_error) {
      toast("No s’ha pogut copiar aquest bloc.");
    }
  }));
  $("#import-trigger").addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", async () => { const file = elements.importFile.files[0]; if (!file) return; try { store.restorePackage(window.TRACA_IMPORT_EXPORT.parsePackage(await file.text())); syncCaseForm(store.snapshot()); toast("Cas importat i migrat si era necessari."); } catch (error) { toast(`Importació rebutjada: ${error.message}`); } finally { elements.importFile.value = ""; } });

  store.subscribe((snapshot) => {
    window.TRACA_PERSISTENCE.save(window.TRACA_IMPORT_EXPORT.exportPackage(snapshot));
    render(snapshot);
  });
  syncCaseForm(store.snapshot());
  render(store.snapshot());
})();
