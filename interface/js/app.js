(function () {
  "use strict";
  const specimen = window.TRACA_UVOF015_CASE;
  const generatedGeometry = window.TRACA_UVOF015_GEOMETRY;
  const generatedVisualGrammar = window.TRACA_VISUAL_GRAMMAR.createVisualGrammar();
  const persisted = window.TRACA_PERSISTENCE.load();
  const store = window.TRACA_STORE.createWorkspaceStore({
    specimen,
    generatedGeometry,
    visualGrammar: generatedVisualGrammar,
    persistedState: persisted
  });

  const elements = {
    description: document.querySelector("#description"),
    engineNotice: document.querySelector("#engine-notice"),
    restoreSpecimen: document.querySelector("#restore-specimen"),
    interpretCase: document.querySelector("#interpret-case"),
    courtStage: document.querySelector("#court-stage"),
    branchSelectors: document.querySelector("#branch-selectors"),
    inspectorEmpty: document.querySelector("#inspector-empty"),
    inspectorForm: document.querySelector("#inspector-form"),
    selectionType: document.querySelector("#selection-type"),
    selectedId: document.querySelector("#selected-id"),
    selectedRef: document.querySelector("#selected-ref"),
    positionFields: document.querySelector("#position-fields"),
    positionX: document.querySelector("#position-x"),
    positionY: document.querySelector("#position-y"),
    pathKindField: document.querySelector("#path-kind-field"),
    pathKind: document.querySelector("#path-kind"),
    visualColorField: document.querySelector("#visual-color-field"),
    visualColor: document.querySelector("#visual-color"),
    correctionReason: document.querySelector("#correction-reason"),
    sourceRefList: document.querySelector("#source-ref-list"),
    undo: document.querySelector("#undo"),
    redo: document.querySelector("#redo"),
    reset: document.querySelector("#reset"),
    correctionCount: document.querySelector("#correction-count"),
    workspaceStatus: document.querySelector("#workspace-status"),
    validationMiniStatus: document.querySelector("#validation-mini-status"),
    validateCase: document.querySelector("#validate-case"),
    saveCase: document.querySelector("#save-case"),
    savePattern: document.querySelector("#save-pattern"),
    saveRule: document.querySelector("#save-rule"),
    historyCount: document.querySelector("#history-count"),
    historyList: document.querySelector("#history-list"),
    validationSummary: document.querySelector("#validation-summary"),
    librarySummary: document.querySelector("#library-summary"),
    traceabilitySummary: document.querySelector("#traceability-summary"),
    importTrigger: document.querySelector("#import-trigger"),
    importFile: document.querySelector("#import-file"),
    exportCase: document.querySelector("#export-case"),
    toast: document.querySelector("#toast"),
    announcer: document.querySelector("#announcer")
  };

  const editor = window.TRACA_EDITOR.createEditor({ container: elements.courtStage, store });
  let toastTimer = null;

  function escape(value) { return window.TRACA_UTILS.escapeHtml(value); }

  function toast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    elements.announcer.textContent = message;
    toastTimer = window.setTimeout(() => { elements.toast.hidden = true; }, 3200);
  }

  function setEngineNotice(isError) {
    const isCanonical = elements.description.value.trim() === specimen.description.trim();
    elements.engineNotice.classList.toggle("is-error", Boolean(isError || !isCanonical));
    elements.engineNotice.textContent = isCanonical
      ? specimen.engine_notice
      : "Aquest text s’ha conservat, però el motor actual no pot interpretar-lo amb garanties. Restaura UVOF015 o espera la futura capa d’interpretació de text lliure; TRAÇA no inventarà cap geometria.";
    elements.interpretCase.disabled = !isCanonical;
  }

  function modeLabel(mode) {
    return { description: "Descripció", interpretation: "Interpretació", graph: "Gràfic", correction: "Correcció", validation: "Validació", library: "Biblioteca" }[mode] || mode;
  }

  function setMode(mode) {
    store.setUi({ mode });
  }

  function primitiveForSelection(resolved, snapshot) {
    if (!resolved) return null;
    if (resolved.parsed.collection === "entity") {
      const entityStyle = snapshot.workingVisualGrammar.entities[resolved.object.kind];
      return entityStyle ? { ref: `visual:entity:${resolved.object.kind}`, style: entityStyle } : null;
    }
    if (resolved.parsed.collection === "common_path" || resolved.parsed.collection === "alternative") {
      const primitive = window.TRACA_VISUAL_GRAMMAR.primitiveForPath(resolved.object.kind, snapshot.workingVisualGrammar);
      const pathStyle = snapshot.workingVisualGrammar.paths[primitive];
      return pathStyle ? { ref: `visual:primitive:${primitive}`, style: pathStyle } : null;
    }
    return null;
  }

  function renderWorkflow(snapshot) {
    document.querySelectorAll("[data-mode]").forEach((button) => button.classList.toggle("is-active", button.dataset.mode === snapshot.ui.mode));
    document.querySelectorAll("[data-mode-content]").forEach((section) => { section.hidden = section.dataset.modeContent !== snapshot.ui.mode; });
  }

  function ensureBranches(snapshot) {
    if (!elements.branchSelectors.children.length) {
      snapshot.workingGeometry.branches.forEach((branch, index) => {
        const label = document.createElement("label");
        label.textContent = `Duel ${index + 1} · ${branch.zone_ref}`;
        const select = document.createElement("select");
        select.dataset.branch = branch.id;
        branch.alternatives.forEach((alternative) => {
          const option = document.createElement("option");
          option.value = alternative.id;
          option.textContent = `${alternative.kind === "feint" ? "Finta" : "Continuïtat"} · ${alternative.initial_space_ref} → ${alternative.target_space_ref}`;
          select.appendChild(option);
        });
        select.addEventListener("change", () => store.setAlternative(branch.id, select.value));
        label.appendChild(select);
        elements.branchSelectors.appendChild(label);
      });
    }
    elements.branchSelectors.querySelectorAll("select").forEach((select) => { select.value = snapshot.selectedAlternatives[select.dataset.branch]; });
  }

  function renderCourt(snapshot) {
    window.TRACA_RENDERER.render(elements.courtStage, {
      geometry: snapshot.workingGeometry,
      visualGrammar: snapshot.workingVisualGrammar,
      selectedAlternatives: snapshot.selectedAlternatives,
      selection: snapshot.selectedElement,
      view: snapshot.ui.view
    });
    editor.bind();
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
    const isPath = resolved.parsed.collection === "common_path" || resolved.parsed.collection === "alternative";
    elements.positionFields.hidden = !isEntity;
    if (isEntity) {
      elements.positionX.value = resolved.object.position[0];
      elements.positionY.value = resolved.object.position[1];
    }
    elements.pathKindField.hidden = !isPath;
    if (isPath) {
      const kinds = ["initial_pass", "return_pass", "run_without_ball", "continuation", "feint", "shot", "future_position"];
      elements.pathKind.replaceChildren();
      kinds.forEach((kind) => {
        const option = document.createElement("option");
        option.value = kind;
        option.textContent = kind.replaceAll("_", " ");
        elements.pathKind.appendChild(option);
      });
      elements.pathKind.value = resolved.object.kind;
    }
    const visual = primitiveForSelection(resolved, snapshot);
    elements.visualColorField.hidden = !visual;
    if (visual) elements.visualColor.value = visual.style.stroke || visual.style.fill || "#173f33";
    elements.sourceRefList.innerHTML = resolved.source_refs.length
      ? resolved.source_refs.map((ref) => `<li>${escape(ref)}</li>`).join("")
      : "<li>Sense referència explícita</li>";
  }

  function correctionTitle(event) {
    return {
      move: "Element reposicionat",
      move_vertex: "Trajectòria ajustada",
      replace: "Propietat corregida",
      annotate: "Criteri anotat"
    }[event.operation] || "Correcció registrada";
  }

  function renderHistory(snapshot) {
    elements.correctionCount.textContent = `${snapshot.corrections.length} ${snapshot.corrections.length === 1 ? "canvi" : "canvis"}`;
    elements.historyCount.textContent = snapshot.corrections.length;
    elements.undo.disabled = !snapshot.corrections.length;
    elements.redo.disabled = !snapshot.redoStack.length;
    elements.reset.disabled = !snapshot.corrections.length;
    if (!snapshot.corrections.length) {
      elements.historyList.innerHTML = '<p class="history-empty">Encara no hi ha correccions. La geometria de treball coincideix amb la generada.</p>';
      return;
    }
    elements.historyList.innerHTML = snapshot.corrections.slice().reverse().map((event) => `
      <article class="history-item">
        <header><strong>${escape(correctionTitle(event))}</strong><span>${escape(event.status)}</span></header>
        <p>${escape(event.target.layer)} · ${escape(event.target.ref)} · ${escape(event.target.property)}</p>
        <p>${escape(event.reason)}</p>
      </article>`).join("");
  }

  function renderValidation(snapshot) {
    const validated = snapshot.validation.status === "validated_case";
    const changed = snapshot.validation.status === "changes_pending";
    elements.workspaceStatus.className = `status-badge ${validated ? "is-validated" : changed ? "is-changed" : "is-pending"}`;
    elements.workspaceStatus.textContent = validated ? "Cas validat" : changed ? "Correccions pendents" : "Pendent de validació";
    elements.validationMiniStatus.textContent = validated ? "Validat" : changed ? "Canvis pendents" : "Pendent";
    elements.validateCase.disabled = validated;
    [elements.saveCase, elements.savePattern, elements.saveRule].forEach((button) => { button.disabled = !validated; });
    const counts = snapshot.validation.counts_by_layer || {};
    elements.validationSummary.innerHTML = `<div class="validation-grid">
      <div class="summary-cell"><small>Estat</small><strong>${escape(validated ? "Versió validada" : "Encara no validat")}</strong></div>
      <div class="summary-cell"><small>Correccions</small><strong>${snapshot.corrections.length}</strong></div>
      <div class="summary-cell"><small>Capes afectades</small><strong>${Object.keys(counts).length || "—"}</strong></div>
      <div class="summary-cell"><small>Promoció canònica</small><strong>No</strong></div>
    </div>`;
  }

  function renderLibrary(snapshot) {
    const counts = window.TRACA_KNOWLEDGE_LIBRARY.countSections(snapshot.knowledgeLibrary, snapshot.workingVisualGrammar);
    const labels = {
      validated_cases: "Casos validats", pattern_candidates: "Candidats de patró",
      general_rule_candidates: "Regles candidates", semantic_rules: "Regles semàntiques",
      spatial_rules: "Regles espacials", geometry_rules: "Regles geomètriques", visual_dictionary: "Diccionari visual"
    };
    elements.librarySummary.innerHTML = Object.entries(labels).map(([key, label]) => `<div class="library-card"><small>${escape(label)}</small><strong>${counts[key] || 0}</strong></div>`).join("");
  }

  function renderTraceability(snapshot) {
    elements.traceabilitySummary.innerHTML = `<div class="trace-grid">
      <div class="summary-cell"><small>Text</small><strong>Font preservada</strong></div>
      <div class="summary-cell"><small>Semàntica</small><strong>Corpus validat</strong></div>
      <div class="summary-cell"><small>Espai</small><strong>Contracte v0.3 ready</strong></div>
      <div class="summary-cell"><small>Geometria</small><strong>${snapshot.corrections.length ? "Generada + treball" : "Generada intacta"}</strong></div>
    </div>`;
  }

  function renderMobile(snapshot) {
    document.querySelectorAll("[data-mobile-panel]").forEach((button) => button.classList.toggle("is-active", button.dataset.mobilePanel === snapshot.ui.mobilePanel));
    document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("is-mobile-active", panel.dataset.panel === snapshot.ui.mobilePanel));
  }

  function render(snapshot) {
    renderWorkflow(snapshot);
    ensureBranches(snapshot);
    renderCourt(snapshot);
    renderInspector(snapshot);
    renderHistory(snapshot);
    renderValidation(snapshot);
    renderLibrary(snapshot);
    renderTraceability(snapshot);
    renderMobile(snapshot);
  }

  function persist(snapshot) {
    window.TRACA_PERSISTENCE.save(window.TRACA_IMPORT_EXPORT.exportPackage(snapshot));
  }

  specimen.phases.forEach((phase) => {
    document.querySelector("#phase-list").insertAdjacentHTML("beforeend", `<article class="phase-item"><strong>${escape(phase.id)} · ${escape(phase.title)}</strong><p>${escape(phase.detail)}</p></article>`);
  });
  specimen.invariants.forEach((item) => document.querySelector("#invariant-list").insertAdjacentHTML("beforeend", `<li>${escape(item)}</li>`));
  elements.description.value = store.snapshot().currentCase.description;
  setEngineNotice(false);

  document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("is-active", item === button));
    store.setUi({ view: button.dataset.view });
  }));
  document.querySelectorAll("[data-dock]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-dock]").forEach((item) => item.classList.toggle("is-active", item === button));
    document.querySelectorAll("[data-dock-content]").forEach((section) => { section.hidden = section.dataset.dockContent !== button.dataset.dock; });
    store.setUi({ bottomPanel: button.dataset.dock });
  }));
  document.querySelectorAll("[data-mobile-panel]").forEach((button) => button.addEventListener("click", () => store.setUi({ mobilePanel: button.dataset.mobilePanel })));

  elements.description.addEventListener("input", () => setEngineNotice(false));
  elements.restoreSpecimen.addEventListener("click", () => {
    elements.description.value = specimen.description;
    setEngineNotice(false);
    toast("S’ha restaurat la descripció validada d’UVOF015.");
  });
  elements.interpretCase.addEventListener("click", () => {
    if (elements.description.value.trim() !== specimen.description.trim()) { setEngineNotice(true); return; }
    setMode("interpretation");
    toast("Interpretació validada carregada des del corpus.");
  });
  elements.undo.addEventListener("click", () => store.undo());
  elements.redo.addEventListener("click", () => store.redo());
  elements.reset.addEventListener("click", () => { store.reset(); toast("Correccions descartades; s’ha restaurat la geometria generada."); });

  elements.inspectorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const snapshot = store.snapshot();
    const resolved = window.TRACA_EDITOR.resolveSelection(snapshot, snapshot.selectedElement);
    if (!resolved) return;
    const reason = elements.correctionReason.value.trim() || "Ajust del tècnic";
    const originalVisual = primitiveForSelection(resolved, snapshot);
    const visualProperty = originalVisual && (originalVisual.style.stroke ? "stroke" : "fill");
    const desiredVisualColor = elements.visualColor.value;
    const visualChanged = originalVisual && desiredVisualColor !== originalVisual.style[visualProperty];
    let changes = 0;
    if (resolved.parsed.collection === "entity") {
      const after = [Number(elements.positionX.value), Number(elements.positionY.value)];
      if (!window.TRACA_UTILS.sameValue(resolved.object.position, after)) {
        store.applyCorrection({ target: { layer: "geometry", ref: resolved.ref, property: "position" }, operation: "move", before: resolved.object.position, after, reason, source_refs: resolved.source_refs });
        changes += 1;
      }
    }
    if (resolved.parsed.collection === "common_path" || resolved.parsed.collection === "alternative") {
      if (elements.pathKind.value !== resolved.object.kind) {
        store.applyCorrection({ target: { layer: "geometry", ref: resolved.ref, property: "kind" }, operation: "replace", before: resolved.object.kind, after: elements.pathKind.value, reason, source_refs: resolved.source_refs });
        changes += 1;
      }
    }
    if (visualChanged) {
      store.applyCorrection({ target: { layer: "visual", ref: originalVisual.ref, property: visualProperty }, operation: "replace", before: originalVisual.style[visualProperty], after: desiredVisualColor, reason, source_refs: resolved.source_refs });
      changes += 1;
    }
    toast(changes ? `${changes} correcció${changes === 1 ? "" : "ns"} registrada${changes === 1 ? "" : "des"}.` : "No hi havia cap canvi per registrar.");
  });

  document.querySelector("#add-conceptual").addEventListener("click", () => {
    const layer = document.querySelector("#conceptual-layer").value;
    const before = document.querySelector("#conceptual-before").value.trim();
    const after = document.querySelector("#conceptual-after").value.trim();
    const reason = document.querySelector("#conceptual-reason").value.trim();
    if (!before || !after || !reason || before === after) { toast("Cal indicar una lectura anterior, una correcció diferent i el criteri."); return; }
    const snapshot = store.snapshot();
    let ref = `${layer}:annotation:${snapshot.currentCase.id}`;
    let property = `statements.${snapshot.corrections.length}`;
    if (layer === "geometry") {
      if (!snapshot.selectedElement || !snapshot.selectedElement.ref.startsWith("geometry:")) { toast("Selecciona un element geomètric abans d’anotar aquesta capa."); return; }
      ref = snapshot.selectedElement.ref;
      property = "coach_note";
    }
    if (layer === "visual") {
      const resolved = window.TRACA_EDITOR.resolveSelection(snapshot, snapshot.selectedElement);
      const visual = primitiveForSelection(resolved, snapshot);
      if (!visual) { toast("Selecciona una entitat o trajectòria abans d’anotar la capa visual."); return; }
      ref = visual.ref;
      property = "coach_note";
    }
    store.applyCorrection({ target: { layer, ref, property }, operation: "annotate", before, after, reason, author: "coach", scope: "case", source_refs: specimen.source_refs });
    toast("Correcció conceptual registrada com a canvi del cas.");
  });

  elements.validateCase.addEventListener("click", () => { store.validate("coach"); setMode("library"); toast("Versió validada. Ara pots decidir si la guardes o la proposes com a candidat."); });
  elements.saveCase.addEventListener("click", () => { store.saveValidatedCase(); toast("Cas validat guardat a la biblioteca local."); });
  elements.savePattern.addEventListener("click", () => { store.promotePattern({ title: "Patró candidat derivat d’UVOF015" }); toast("Candidat de patró creat. Encara no és coneixement canònic."); });
  elements.saveRule.addEventListener("click", () => { store.proposeGeneralRule({ title: "Regla general candidata derivada d’UVOF015" }); toast("Regla candidata registrada. Requereix una validació posterior."); });
  elements.exportCase.addEventListener("click", () => { window.TRACA_IMPORT_EXPORT.downloadPackage(store.snapshot()); toast("Paquet estructurat del cas exportat."); });
  elements.importTrigger.addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", async () => {
    const file = elements.importFile.files[0];
    if (!file) return;
    try {
      const payload = window.TRACA_IMPORT_EXPORT.parsePackage(await file.text());
      store.restorePackage(payload);
      elements.description.value = store.snapshot().currentCase.description;
      setEngineNotice(false);
      toast("Cas importat amb geometria, correccions i validació preservades.");
    } catch (error) {
      toast(`No s’ha pogut importar: ${error.message}`);
    } finally {
      elements.importFile.value = "";
    }
  });

  store.subscribe((snapshot) => { persist(snapshot); render(snapshot); });
  render(store.snapshot());
})();
