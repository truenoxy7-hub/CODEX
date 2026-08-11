(function () {
  "use strict";
  const canonicalExamples = [{ caseData: window.TRACA_UVOF015_CASE, geometry: window.TRACA_UVOF015_GEOMETRY, resolver: "uvof015_resolver" }];
  const initialExample = canonicalExamples[0];
  const knowledge = window.TRACA_LOCAL_KNOWLEDGE;
  const courtProfile = window.TRACA_COURT_PROFILE;
  const storedPackage = window.TRACA_PERSISTENCE.load();
  const persisted = storedPackage
    && storedPackage.case && storedPackage.case.case_type === "canonical_specimen"
    && storedPackage.generated_geometry && storedPackage.generated_geometry.meta
    && storedPackage.generated_geometry.meta.exercise_id === "TR-UVOF-015"
    && storedPackage.generated_geometry.meta.version !== initialExample.geometry.meta.version
    && !(storedPackage.corrections || []).length
      ? { ...storedPackage, generated_geometry: initialExample.geometry, working_geometry: initialExample.geometry, selected_alternatives: null }
      : storedPackage;
  const store = window.TRACA_STORE.createWorkspaceStore({
    initialCase: initialExample.caseData,
    initialGeometry: initialExample.geometry,
    visualGrammar: window.TRACA_VISUAL_GRAMMAR.createVisualGrammar(),
    persistedState: persisted
  });

  const $ = (selector) => document.querySelector(selector);
  const elements = {
    caseId: $("#case-id"), caseName: $("#case-name"), workspaceStatus: $("#workspace-status"),
    interpretationStatus: $("#interpretation-status"), spatialStatus: $("#spatial-status"), geometryStatus: $("#geometry-status"), knowledgeStatus: $("#knowledge-status"),
    caseNameInput: $("#case-name-input"), description: $("#description"), caseMetadata: $("#case-metadata"), caseNotes: $("#case-notes"), engineNotice: $("#engine-notice"),
    interpretationGroups: $("#interpretation-groups"), providerLabel: $("#provider-label"), semanticModelList: $("#semantic-model-list"),
    resolverLabel: $("#resolver-label"), resolverMessage: $("#resolver-message"), startManualLayout: $("#start-manual-layout"), manualTools: $("#manual-tools"), manualPrimitiveType: $("#manual-primitive-type"), manualKind: $("#manual-kind"), manualLabel: $("#manual-label"), manualObservationText: $("#manual-observation-text"), branchSelectors: $("#branch-selectors"),
    courtStage: $("#court-stage"), noGeometry: $("#no-geometry"), courtHelp: $("#court-help"),
    inspectorEmpty: $("#inspector-empty"), inspectorForm: $("#inspector-form"), selectionType: $("#selection-type"), selectedId: $("#selected-id"), selectedRef: $("#selected-ref"), positionFields: $("#position-fields"), positionX: $("#position-x"), positionY: $("#position-y"), pathKindField: $("#path-kind-field"), pathKind: $("#path-kind"), visualColorField: $("#visual-color-field"), visualColor: $("#visual-color"), correctionReason: $("#correction-reason"), sourceRefList: $("#source-ref-list"),
    undo: $("#undo"), redo: $("#redo"), reset: $("#reset"), correctionCount: $("#correction-count"), changeSummary: $("#change-summary"), historyCount: $("#history-count"), historyList: $("#history-list"),
    validationMiniStatus: $("#validation-mini-status"), preflightInline: $("#preflight-inline"), validateCase: $("#validate-case"), validationSummary: $("#validation-summary"),
    learnedSummary: $("#learned-summary"), learnedDock: $("#learned-dock"), librarySummary: $("#library-summary"), traceabilitySummary: $("#traceability-summary"),
    importFile: $("#import-file"), toast: $("#toast"), announcer: $("#announcer"),
    newCaseDialog: $("#new-case-dialog"), semanticBuilderDialog: $("#semantic-builder-dialog"), promotionDialog: $("#promotion-dialog"), conceptDialog: $("#concept-dialog"),
    builderCollection: $("#builder-collection"), builderKind: $("#builder-kind"), builderLabel: $("#builder-label"), builderDetails: $("#builder-details"), builderState: $("#builder-state"), builderCurrentList: $("#builder-current-list"),
    promotionType: $("#promotion-type"), promotionScope: $("#promotion-scope"), promotionCorrections: $("#promotion-corrections")
  };
  const editor = window.TRACA_EDITOR.createEditor({ container: elements.courtStage, store });
  let toastTimer = null;

  function escape(value) { return window.TRACA_UTILS.escapeHtml(value); }
  function toast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    elements.announcer.textContent = message;
    toastTimer = setTimeout(() => { elements.toast.hidden = true; }, 3500);
  }

  function canonicalInterpretation(currentCase) {
    return window.TRACA_INTERPRETATION.interpret(currentCase, { canonicalCases: canonicalExamples.map((item) => item.caseData), knowledge });
  }

  function readCaseForm() {
    return {
      name: elements.caseNameInput.value,
      description: elements.description.value,
      notes: elements.caseNotes.value
    };
  }

  function syncCaseForm(snapshot) {
    elements.caseNameInput.value = snapshot.currentCase.name || "";
    elements.description.value = snapshot.currentCase.description || "";
    const origin = snapshot.currentCase.origin === "coach_input" ? "Entrada de l’entrenador" : snapshot.currentCase.origin || "Font canònica";
    const tags = (snapshot.currentCase.tags || []).length ? snapshot.currentCase.tags.join(" · ") : "pendents d’analitzar";
    elements.caseMetadata.textContent = `Origen: ${origin} · Etiquetes automàtiques: ${tags}`;
    elements.caseNotes.value = snapshot.currentCase.notes || "";
  }

  function interpretCurrentCase() {
    store.updateCase(readCaseForm());
    const snapshot = store.snapshot();
    const result = window.TRACA_INTERPRETATION.interpret(snapshot.currentCase, { canonicalCases: canonicalExamples.map((item) => item.caseData), knowledge });
    store.setInterpretation(result);
    store.setUi({ mode: "interpretation" });
    toast(result.status === "validated" ? "Interpretació canònica carregada." : "Interpretació parcial preparada. Revisa i completa el coneixement pendent.");
  }

  function renderStatus(snapshot) {
    elements.caseId.textContent = snapshot.currentCase.id;
    elements.caseName.textContent = snapshot.currentCase.name;
    const origin = snapshot.currentCase.origin === "coach_input" ? "Entrada de l’entrenador" : snapshot.currentCase.origin || "Font canònica";
    const tags = (snapshot.currentCase.tags || []).length ? snapshot.currentCase.tags.join(" · ") : "pendents d’analitzar";
    elements.caseMetadata.textContent = `Origen: ${origin} · Etiquetes automàtiques: ${tags}`;
    const unknownCount = (snapshot.interpretation.unknown_concepts || []).length + (snapshot.interpretation.unresolved || []).length;
    elements.interpretationStatus.textContent = String(snapshot.interpretation.status || "unknown").toUpperCase();
    elements.spatialStatus.textContent = String(snapshot.spatialModel.status || "unknown").toUpperCase();
    elements.geometryStatus.textContent = snapshot.geometryState.status.replaceAll("_", " ").toUpperCase();
    elements.knowledgeStatus.textContent = `${unknownCount} ${unknownCount === 1 ? "PREGUNTA" : "PREGUNTES"}`;
    const validated = snapshot.validation.status === "validated_case";
    const blocked = snapshot.validation.status === "blocked";
    elements.workspaceStatus.className = `status-badge ${validated ? "is-validated" : blocked ? "is-changed" : "is-pending"}`;
    elements.workspaceStatus.textContent = validated ? "Cas validat" : blocked ? "Validació bloquejada" : snapshot.currentCase.status === "in_construction" ? "En construcció" : "Pendent";
  }

  function renderWorkflow(snapshot) {
    document.querySelectorAll("[data-mode]").forEach((button) => button.classList.toggle("is-active", button.dataset.mode === snapshot.ui.mode));
    document.querySelectorAll("[data-mode-content]").forEach((section) => { section.hidden = section.dataset.modeContent !== snapshot.ui.mode; });
  }

  function groupMarkup(title, state, items) {
    const content = items.length ? items.map((item) => `<span class="knowledge-chip" data-concept-id="${escape(item.id)}">${escape(item.label)}<small>${escape(item.canonical_concept_ref || item.reason || item.knowledge_state || state)}</small></span>`).join("") : '<span class="knowledge-chip">Cap element</span>';
    return `<section class="knowledge-group is-${state}"><header><strong>${escape(title)}</strong><span>${items.length}</span></header><div class="knowledge-chip-list">${content}</div></section>`;
  }

  function renderInterpretation(snapshot) {
    const validated = (snapshot.interpretation.concepts || []).filter((item) => item.knowledge_state === "validated");
    const provisional = (snapshot.interpretation.concepts || []).filter((item) => item.knowledge_state !== "validated");
    const unknown = snapshot.interpretation.unknown_concepts || [];
    const unresolved = snapshot.interpretation.unresolved || [];
    elements.providerLabel.textContent = snapshot.interpretation.provider || (snapshot.interpretation.providers || []).join(" + ") || "Encara no analitzat";
    elements.interpretationGroups.innerHTML = groupMarkup("Validat / conegut", "known", validated) + groupMarkup("Inferència provisional", "provisional", provisional) + groupMarkup("Desconegut / candidat", "unknown", unknown) + groupMarkup("No resolt", "unresolved", unresolved);
    elements.interpretationGroups.querySelectorAll("[data-concept-id]").forEach((node) => node.addEventListener("click", () => {
      const concept = unknown.find((item) => item.id === node.dataset.conceptId);
      if (!concept) return;
      const definition = window.prompt(`Defineix «${concept.label}»`, concept.definition || "");
      if (definition && definition !== concept.definition) store.defineUnknownConcept(concept.id, definition, "Definició aportada des de la interpretació parcial");
    }));
    const groups = ["participants", "materials", "spaces", "actions", "decisions", "phases"];
    elements.semanticModelList.innerHTML = groups.map((key) => `<div class="builder-item"><strong>${escape(key)}</strong><p>${(snapshot.semanticModel[key] || []).map((item) => escape(item.label)).join(", ") || "—"}</p></div>`).join("");
  }

  function renderResolver(snapshot) {
    const status = snapshot.geometryState.status;
    elements.resolverLabel.textContent = snapshot.geometryState.resolver || "NO RESOLVER AVAILABLE";
    elements.startManualLayout.hidden = status !== "unavailable";
    elements.manualTools.hidden = status !== "coach_reference";
    elements.branchSelectors.replaceChildren();
    if (snapshot.generatedGeometry) {
      elements.resolverMessage.className = "engine-notice is-info";
      elements.resolverMessage.textContent = "Resolutor canònic disponible. La geometria generada queda separada de les correccions.";
      (snapshot.workingGeometry.branches || []).forEach((branch, index) => {
        const label = document.createElement("label");
        label.textContent = `Duel ${index + 1} · ${branch.zone_ref}`;
        const select = document.createElement("select");
        select.dataset.branch = branch.id;
        (branch.alternatives || []).forEach((alternative) => {
          const option = document.createElement("option"); option.value = alternative.id; option.textContent = `${alternative.kind} · ${alternative.initial_space_ref} → ${alternative.target_space_ref}`; select.appendChild(option);
        });
        select.value = snapshot.selectedAlternatives[branch.id];
        select.addEventListener("change", () => store.setAlternative(branch.id, select.value));
        label.appendChild(select); elements.branchSelectors.appendChild(label);
      });
    } else if (status === "coach_reference") {
      elements.resolverMessage.className = "engine-notice is-info";
      elements.resolverMessage.textContent = "Referència visual de l’entrenador. No és generatedGeometry i cap coordenada es promociona automàticament.";
    } else {
      elements.resolverMessage.className = "engine-notice";
      elements.resolverMessage.textContent = "No hi ha resolutor per a aquest cas. Pots continuar la semàntica, guardar-lo o construir una referència manual.";
    }
  }

  function geometryForView(snapshot) {
    if (snapshot.ui.view === "generated") return snapshot.generatedGeometry;
    return snapshot.workingGeometry;
  }

  function renderCourt(snapshot) {
    const geometry = geometryForView(snapshot);
    elements.courtStage.hidden = !geometry;
    elements.noGeometry.hidden = Boolean(geometry);
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === snapshot.ui.view);
      button.disabled = (button.dataset.view === "generated" || button.dataset.view === "compare") && !snapshot.generatedGeometry;
    });
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
    elements.courtHelp.textContent = snapshot.coachReferenceGeometry && !snapshot.generatedGeometry ? "Referència manual: moure no crea coneixement tàctic." : snapshot.ui.view === "compare" ? "Ghost blanc = proposta generada; sòlid = versió corregida." : "Selecciona un element en vista Control per editar-lo.";
  }

  function primitiveForSelection(resolved, snapshot) {
    if (!resolved) return null;
    if (resolved.parsed.collection === "entity") {
      const style = snapshot.workingVisualGrammar.entities[resolved.object.kind];
      return style ? { ref: `visual:entity:${resolved.object.kind}`, style } : null;
    }
    if (resolved.parsed.collection === "common_path" || resolved.parsed.collection === "alternative" || resolved.parsed.collection === "return_pass") {
      const primitive = window.TRACA_VISUAL_GRAMMAR.primitiveForPath(resolved.object.kind, snapshot.workingVisualGrammar);
      const style = snapshot.workingVisualGrammar.paths[primitive];
      return style ? { ref: `visual:primitive:${primitive}`, style } : null;
    }
    return null;
  }

  function renderInspector(snapshot) {
    const resolved = window.TRACA_EDITOR.resolveSelection(snapshot, snapshot.selectedElement);
    elements.inspectorEmpty.hidden = Boolean(resolved);
    elements.inspectorForm.hidden = !resolved;
    elements.selectionType.textContent = resolved ? resolved.parsed.collection.replace("_", " ") : "Sense selecció";
    if (!resolved) return;
    elements.selectedId.textContent = resolved.object.id;
    elements.selectedRef.textContent = resolved.ref;
    const isEntity = resolved.parsed.collection === "entity";
    const isState = resolved.parsed.collection === "participant_state";
    const isPath = resolved.parsed.collection === "common_path" || resolved.parsed.collection === "alternative" || resolved.parsed.collection === "return_pass";
    const linkedState = isEntity && resolved.object.state_ref ? (snapshot.workingGeometry.participant_states || []).find((state) => state.id === resolved.object.state_ref) : null;
    const positionObject = linkedState || (isEntity || isState ? resolved.object : null);
    elements.positionFields.hidden = !positionObject;
    if (positionObject) { elements.positionX.value = positionObject.position[0]; elements.positionY.value = positionObject.position[1]; }
    elements.pathKindField.hidden = !isPath;
    if (isPath) {
      const kinds = ["movement", "movement_without_ball", "pass", "shot", "feint", "continuation", "future_position", "generic_action"];
      elements.pathKind.innerHTML = kinds.map((kind) => `<option value="${kind}">${kind.replaceAll("_", " ")}</option>`).join("");
      elements.pathKind.value = resolved.object.kind;
    }
    const visual = primitiveForSelection(resolved, snapshot);
    elements.visualColorField.hidden = !visual;
    if (visual) elements.visualColor.value = visual.style.stroke || visual.style.fill || "#173f33";
    elements.sourceRefList.innerHTML = resolved.source_refs.length ? resolved.source_refs.map((ref) => `<li>${escape(ref)}</li>`).join("") : "<li>Referència manual del tècnic</li>";
  }

  function layerCounts(corrections) {
    return corrections.reduce((counts, event) => ({ ...counts, [event.target.layer]: (counts[event.target.layer] || 0) + 1 }), { semantic: 0, spatial: 0, geometry: 0, visual: 0 });
  }

  function renderHistory(snapshot) {
    const counts = layerCounts(snapshot.corrections);
    elements.correctionCount.textContent = `${snapshot.corrections.length} canvis`;
    elements.historyCount.textContent = snapshot.corrections.length;
    elements.undo.disabled = !snapshot.corrections.length;
    elements.redo.disabled = !snapshot.redoStack.length;
    elements.reset.disabled = !snapshot.corrections.length;
    elements.changeSummary.innerHTML = [...Object.entries(counts), ["conceptes nous", (snapshot.interpretation.unknown_concepts || []).length]].map(([key, value]) => `<div><strong>${value}</strong><small>${escape(key)}</small></div>`).join("");
    elements.historyList.innerHTML = snapshot.corrections.length ? snapshot.corrections.slice().reverse().map((event) => {
      const derived = event.derived_effects || [];
      const derivedMarkup = derived.length ? `<details><summary>${derived.length} efecte${derived.length === 1 ? "" : "s"} automàtic${derived.length === 1 ? "" : "s"}</summary>${derived.map((effect) => `<p class="derived-effect">↳ ${escape(effect.explanation)} <small>${escape(effect.target_ref)}</small></p>`).join("")}</details>` : "";
      return `<article class="history-item"><header><strong>${escape(event.machine_explanation)}</strong><span>${escape(event.change_role || "primary")} · ${escape(event.target.layer)}</span></header><p>${escape(event.coach_explanation || "Sense motiu afegit")}</p>${derivedMarkup}<p>${escape(event.id)} · ${escape(event.status)}</p><button class="button button-quiet" type="button" data-edit-explanation="${escape(event.id)}">Editar motiu</button></article>`;
    }).join("") : '<p class="history-empty">Encara no hi ha correccions.</p>';
    elements.historyList.querySelectorAll("[data-edit-explanation]").forEach((button) => button.addEventListener("click", () => {
      const event = snapshot.corrections.find((item) => item.id === button.dataset.editExplanation);
      const explanation = window.prompt("Per què ho has canviat?", event.coach_explanation || "");
      if (explanation !== null) store.updateCorrectionExplanation(event.id, explanation);
    }));
  }

  function diagnosticsMarkup(report) {
    if (!report) return '<p class="history-empty">Executa el preflight abans de validar.</p>';
    return report.diagnostics.map((item) => `<article class="diagnostic is-${item.level}"><strong>${escape(item.level)} · ${escape(item.code)}</strong>${escape(item.message)}${item.actions.length ? `<small> Opcions: ${item.actions.map(escape).join(" · ")}</small>` : ""}</article>`).join("");
  }

  function renderValidation(snapshot) {
    const report = snapshot.validation.preflight;
    elements.validationMiniStatus.textContent = report ? report.status.toUpperCase() : "PENDENT";
    elements.preflightInline.innerHTML = diagnosticsMarkup(report);
    elements.validationSummary.innerHTML = report ? `<div class="validation-grid"><div class="summary-cell"><small>Estat</small><strong>${escape(report.status)}</strong></div><div class="summary-cell"><small>Errors</small><strong>${report.summary.error}</strong></div><div class="summary-cell"><small>Warnings</small><strong>${report.summary.warning}</strong></div><div class="summary-cell"><small>Pot validar</small><strong>${report.can_validate ? "Sí" : "No"}</strong></div></div><div class="preflight-list">${diagnosticsMarkup(report)}</div>` : diagnosticsMarkup(null);
    elements.validateCase.disabled = Boolean(report && !report.can_validate) || snapshot.validation.status === "validated_case";
  }

  function renderLearned(snapshot) {
    const learned = store.whatLearned();
    const counts = Object.entries(learned.case_specific).map(([key, value]) => `${value} ${key}`).join(" · ") || "cap correcció";
    const caseSummary = `${counts} · ${learned.coach_observations.length} observacions`;
    const markup = `<div class="validation-grid"><div class="summary-cell"><small>Cas específic</small><strong>${escape(caseSummary)}</strong></div><div class="summary-cell"><small>Nou coneixement candidat</small><strong>${learned.candidate_knowledge.length}</strong></div><div class="summary-cell"><small>No resolt</small><strong>${learned.unresolved.length}</strong></div><div class="summary-cell"><small>Canvis canònics</small><strong>0</strong></div></div>`;
    elements.learnedSummary.innerHTML = markup;
    elements.learnedDock.innerHTML = markup;
    $("#open-promotion").disabled = snapshot.validation.status !== "validated_case";
  }

  function renderLibrary(snapshot) {
    const groups = window.TRACA_KNOWLEDGE_LIBRARY.inspectableItems(snapshot.knowledgeLibrary);
    elements.librarySummary.innerHTML = groups.map((group) => `<details class="library-section"><summary>${escape(group.label)} · ${group.items.length}</summary>${group.items.length ? group.items.map((item) => `<article><strong>${escape(item.title || item.name || item.id)}</strong><p>${escape(item.definition || item.status || "")}</p><p>${escape(item.scope || "")}</p></article>`).join("") : '<p class="microcopy">Sense elements.</p>'}</details>`).join("");
  }

  function renderTraceability(snapshot) {
    elements.traceabilitySummary.innerHTML = `<div class="trace-grid"><div class="summary-cell"><small>Text</small><strong>${escape(snapshot.currentCase.origin || "coach")}</strong></div><div class="summary-cell"><small>Provider</small><strong>${escape(snapshot.interpretation.provider || "manual")}</strong></div><div class="summary-cell"><small>Geometria</small><strong>${escape(snapshot.geometryState.status)}</strong></div><div class="summary-cell"><small>Autoritat</small><strong>Entrenador</strong></div></div>`;
  }

  function renderBuilder(snapshot) {
    const groups = ["participants", "materials", "spaces", "actions", "decisions", "phases"];
    elements.builderCurrentList.innerHTML = groups.flatMap((key) => (snapshot.semanticModel[key] || []).map((item) => `<article class="builder-item"><header><strong>${escape(item.label)}</strong><span>${escape(item.knowledge_state)}</span></header><p>${escape(key)} · ${escape(item.kind || "")}</p>${item.knowledge_state !== "validated" ? `<button class="button button-quiet" type="button" data-confirm-semantic="${escape(item.id)}">Confirmar com a entrenador</button>` : ""}</article>`)).join("") || '<p class="microcopy">Encara no hi ha elements.</p>';
    elements.builderCurrentList.querySelectorAll("[data-confirm-semantic]").forEach((button) => button.addEventListener("click", () => store.updateSemanticItem(button.dataset.confirmSemantic, "knowledge_state", "validated", "Confirmació explícita de l’entrenador")));
  }

  function renderPromotion(snapshot) {
    elements.promotionCorrections.innerHTML = snapshot.corrections.length ? snapshot.corrections.map((event) => `<article class="promotion-item"><label><input type="checkbox" value="${escape(event.id)}" /><span><strong>${escape(event.machine_explanation)}</strong><small>${escape(event.coach_explanation)}</small></span></label></article>`).join("") : '<p class="microcopy">No hi ha correccions seleccionables. Un concepte candidat pot documentar-se igualment.</p>';
  }

  function renderMobile(snapshot) {
    document.querySelectorAll("[data-mobile-panel]").forEach((button) => button.classList.toggle("is-active", button.dataset.mobilePanel === snapshot.ui.mobilePanel));
    document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("is-mobile-active", panel.dataset.panel === snapshot.ui.mobilePanel));
  }

  function render(snapshot) {
    renderStatus(snapshot); renderWorkflow(snapshot); renderInterpretation(snapshot); renderResolver(snapshot); renderCourt(snapshot); renderInspector(snapshot); renderHistory(snapshot); renderValidation(snapshot); renderLearned(snapshot); renderLibrary(snapshot); renderTraceability(snapshot); renderBuilder(snapshot); renderPromotion(snapshot); renderMobile(snapshot);
  }

  function updateManualKinds() {
    const type = elements.manualPrimitiveType.value;
    const kinds = type === "entity" ? window.TRACA_MANUAL_GEOMETRY.ENTITY_KINDS : type === "path" ? window.TRACA_MANUAL_GEOMETRY.PATH_KINDS : ["spatial_zone"];
    elements.manualKind.innerHTML = kinds.map((kind) => `<option value="${kind}">${kind.replaceAll("_", " ")}</option>`).join("");
  }

  const builderKinds = {
    participant: ["attacker", "defender", "passer", "pivot", "goalkeeper", "generic_participant", "temporary_role"],
    material: ["cone", "bench", "cylinder", "ball", "generic_material"],
    space: ["interval", "zone", "regulation_reference", "functional_space"],
    action: ["pass", "movement", "reception", "finish", "feint", "one_v_one", "block", "slide", "exchange", "cross", "continuity", "generic_action"],
    decision: ["mandatory", "preferred", "available", "open"],
    phase: ["previous", "subsequent", "simultaneous", "conditional"]
  };
  function updateBuilderKinds() { elements.builderKind.innerHTML = builderKinds[elements.builderCollection.value].map((kind) => `<option value="${kind}">${kind.replaceAll("_", " ")}</option>`).join(""); }

  window.TRACA_PROMOTION.TYPES.forEach((type) => elements.promotionType.insertAdjacentHTML("beforeend", `<option value="${type}">${type.replaceAll("_", " ")}</option>`));
  window.TRACA_PROMOTION.SCOPES.forEach((scope) => elements.promotionScope.insertAdjacentHTML("beforeend", `<option value="${scope}">${scope.replaceAll("_", " ")}</option>`));
  updateManualKinds(); updateBuilderKinds();

  document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));

  $("#new-case").addEventListener("click", () => elements.newCaseDialog.showModal());
  $("#load-example").addEventListener("click", () => { const example = canonicalExamples[0]; store.loadCanonicalCase(example.caseData, example.geometry, canonicalInterpretation({ ...example.caseData, case_type: "canonical_specimen" })); syncCaseForm(store.snapshot()); toast("UVOF015 carregat com a cas d’exemple."); });
  $("#new-case-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const description = $("#new-description").value;
    if (!description.trim()) { toast("La descripció és necessària per crear el cas."); return; }
    store.createCase({ name: $("#new-name").value, description, notes: $("#new-notes").value });
    syncCaseForm(store.snapshot()); elements.newCaseDialog.close(); interpretCurrentCase(); $("#new-case-form").reset();
  });
  $("#interpret-case").addEventListener("click", interpretCurrentCase);
  $("#save-draft").addEventListener("click", () => { store.updateCase(readCaseForm()); store.saveCase({ status: "in_construction" }); toast("Cas guardat en construcció, encara que no tingui resolutor."); });
  $("#open-semantic-builder").addEventListener("click", () => elements.semanticBuilderDialog.showModal());
  $("#builder-collection").addEventListener("change", updateBuilderKinds);
  $("#builder-add").addEventListener("click", () => {
    if (!elements.builderLabel.value.trim()) { toast("Afegeix una etiqueta."); return; }
    store.addSemanticItem({ collection: elements.builderCollection.value, kind: elements.builderKind.value, label: elements.builderLabel.value.trim(), details: elements.builderDetails.value, knowledge_state: elements.builderState.value, reason: "Element completat amb el constructor assistit" });
    elements.builderLabel.value = ""; elements.builderDetails.value = ""; toast("Element afegit al model del cas.");
  });
  $("#add-unknown").addEventListener("click", () => elements.conceptDialog.showModal());
  $("#concept-form").addEventListener("submit", (event) => { event.preventDefault(); store.addUnknownConcept({ label: $("#concept-label").value, definition: $("#concept-definition").value, reason: $("#concept-reason").value }); elements.conceptDialog.close(); $("#concept-form").reset(); toast("Concepte desconegut preservat dins el cas."); });

  function startReference() { store.startCoachReference(courtProfile); store.setUi({ mode: "graph", view: "control" }); toast("Referència manual iniciada. No és geometria generada."); }
  $("#start-manual-layout").addEventListener("click", startReference); $("#no-geometry-cta").addEventListener("click", startReference);
  elements.manualPrimitiveType.addEventListener("change", updateManualKinds);
  $("#add-manual-primitive").addEventListener("click", () => { store.addManualPrimitive({ primitive_type: elements.manualPrimitiveType.value, kind: elements.manualKind.value, label: elements.manualLabel.value }); elements.manualLabel.value = ""; toast("Primitiva afegida com a referència de l’entrenador."); });
  function recordManualObservation(status) {
    const statement = elements.manualObservationText.value.trim();
    if (!statement) { toast("Explica què significa la col·locació abans de registrar-la."); return; }
    store.recordCoachObservation({ statement, status });
    elements.manualObservationText.value = "";
    toast(status === "promotion_intent" ? "Observació guardada per revisar-la al Promotion Builder després de validar." : status === "visual_only" ? "Disposició registrada com a visual, sense significat tàctic." : "Observació registrada només per a aquest cas.");
  }
  $("#observation-case-only").addEventListener("click", () => recordManualObservation("case_only"));
  $("#observation-promote-later").addEventListener("click", () => recordManualObservation("promotion_intent"));
  $("#observation-visual-only").addEventListener("click", () => recordManualObservation("visual_only"));

  document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => store.setUi({ mode: button.dataset.mode })));
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { if (!button.disabled) store.setUi({ view: button.dataset.view }); }));
  document.querySelectorAll("[data-mobile-panel]").forEach((button) => button.addEventListener("click", () => store.setUi({ mobilePanel: button.dataset.mobilePanel })));
  document.querySelectorAll("[data-dock]").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll("[data-dock]").forEach((item) => item.classList.toggle("is-active", item === button)); document.querySelectorAll("[data-dock-content]").forEach((section) => { section.hidden = section.dataset.dockContent !== button.dataset.dock; }); store.setUi({ bottomPanel: button.dataset.dock }); }));
  elements.undo.addEventListener("click", () => store.undo()); elements.redo.addEventListener("click", () => store.redo()); elements.reset.addEventListener("click", () => store.reset());

  elements.inspectorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const snapshot = store.snapshot();
    const resolved = window.TRACA_EDITOR.resolveSelection(snapshot, snapshot.selectedElement);
    if (!resolved) return;
    const reason = elements.correctionReason.value.trim() || "Ajust del tècnic";
    const isEntity = resolved.parsed.collection === "entity";
    const isState = resolved.parsed.collection === "participant_state";
    const isPath = resolved.parsed.collection === "common_path" || resolved.parsed.collection === "alternative" || resolved.parsed.collection === "return_pass";
    let changes = 0;
    if (isEntity || isState) {
      const linkedState = isEntity && resolved.object.state_ref ? (snapshot.workingGeometry.participant_states || []).find((state) => state.id === resolved.object.state_ref) : null;
      const positionObject = linkedState || resolved.object;
      const targetRef = linkedState ? `geometry:participant_state:${linkedState.id}` : resolved.ref;
      const after = [Number(elements.positionX.value), Number(elements.positionY.value)];
      if (!window.TRACA_UTILS.sameValue(positionObject.position, after)) { store.applyCorrection({ target: { layer: "geometry", ref: targetRef, property: "position" }, operation: "move", before: positionObject.position, after, reason, coach_explanation: reason, target_role: resolved.object.kind || resolved.object.participant_ref, source_refs: positionObject.source_refs || resolved.source_refs }); changes += 1; }
    }
    if (isPath && elements.pathKind.value !== resolved.object.kind) { store.applyCorrection({ target: { layer: "semantic", ref: `semantic:action:${resolved.object.id}`, property: "kind" }, operation: "replace", before: resolved.object.kind, after: elements.pathKind.value, reason, coach_explanation: reason, correction_type: "semantic.functional_action", source_refs: resolved.source_refs }); changes += 1; }
    const visual = primitiveForSelection(resolved, snapshot);
    if (visual) {
      const property = visual.style.stroke ? "stroke" : "fill";
      if (elements.visualColor.value !== visual.style[property]) { store.applyCorrection({ target: { layer: "visual", ref: visual.ref, property }, operation: "replace", before: visual.style[property], after: elements.visualColor.value, reason, coach_explanation: reason, scope: "case", source_refs: resolved.source_refs }); changes += 1; }
    }
    toast(changes ? `${changes} correcció${changes === 1 ? "" : "ns"} registrada${changes === 1 ? "" : "des"}.` : "No hi havia cap canvi.");
  });

  $("#add-conceptual").addEventListener("click", () => {
    const layer = $("#conceptual-layer").value, before = $("#conceptual-before").value.trim(), after = $("#conceptual-after").value.trim(), reason = $("#conceptual-reason").value.trim();
    if (!before || !after || !reason || before === after) { toast("Cal explicar abans, després i motiu."); return; }
    const snapshot = store.snapshot(); let ref = `${layer}:annotation:${snapshot.currentCase.id}`, property = `statements.${snapshot.corrections.length}`;
    if (layer === "geometry" && snapshot.selectedElement) { ref = snapshot.selectedElement.ref; property = "coach_note"; }
    if (layer === "visual") { const visual = primitiveForSelection(window.TRACA_EDITOR.resolveSelection(snapshot, snapshot.selectedElement), snapshot); if (!visual) { toast("Selecciona un element visual."); return; } ref = visual.ref; property = "coach_note"; }
    store.applyCorrection({ target: { layer, ref, property }, operation: "annotate", before, after, reason, coach_explanation: reason, source_refs: snapshot.currentCase.source_refs || [] }); toast("Discrepància registrada a la capa correcta.");
  });

  $("#run-preflight").addEventListener("click", () => { const report = store.runPreflight(); toast(report.can_validate ? "Preflight complet: es pot validar." : "El preflight ha detectat errors bloquejants."); });
  $("#validate-case").addEventListener("click", () => { try { store.validate("coach"); store.setUi({ mode: "library", bottomPanel: "learned" }); toast("Cas validat. Cap canvi s’ha promocionat automàticament."); } catch (error) { toast("No es pot validar: revisa els errors explicats al preflight."); } });
  $("#save-case").addEventListener("click", () => { store.saveCase(); toast("Cas guardat a la biblioteca local."); });
  $("#open-promotion").addEventListener("click", () => elements.promotionDialog.showModal());
  $("#promotion-form").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const correctionRefs = [...elements.promotionCorrections.querySelectorAll("input:checked")].map((input) => input.value);
      store.createPromotion({ type: elements.promotionType.value, scope: elements.promotionScope.value, scope_ref: $("#promotion-scope-ref").value, title: $("#promotion-title").value, definition: $("#promotion-definition").value, reason: $("#promotion-reason").value, examples: $("#promotion-examples").value, correction_refs: correctionRefs });
      elements.promotionDialog.close(); $("#promotion-form").reset(); toast("Candidat creat només amb les correccions seleccionades.");
    } catch (error) { toast("Completa tipus, abast, títol i definició."); }
  });

  $("#export-case").addEventListener("click", () => window.TRACA_IMPORT_EXPORT.downloadPackage(store.snapshot()));
  $("#import-trigger").addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", async () => { const file = elements.importFile.files[0]; if (!file) return; try { store.restorePackage(window.TRACA_IMPORT_EXPORT.parsePackage(await file.text())); syncCaseForm(store.snapshot()); toast("Cas importat amb coneixement i explicacions preservats."); } catch (error) { toast(`Importació rebutjada: ${error.message}`); } finally { elements.importFile.value = ""; } });

  store.subscribe((snapshot) => { window.TRACA_PERSISTENCE.save(window.TRACA_IMPORT_EXPORT.exportPackage(snapshot)); render(snapshot); });
  if (!persisted && store.snapshot().interpretation.status === "unknown") store.setInterpretation(canonicalInterpretation({ ...initialExample.caseData, case_type: "canonical_specimen" }));
  syncCaseForm(store.snapshot()); render(store.snapshot());
})();
