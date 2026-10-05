(function (root) {
  "use strict";
  function create(options) {
    const { store, editor, persistence, toast, syncCaseForm } = options;
    const $ = (s) => document.querySelector(s), board = root.TRACA_WHITEBOARD, clone = root.TRACA_UTILS.deepClone, escape = root.TRACA_UTILS.escapeHtml;
    let mirror = null, knowledge = null, reuseDraft = null;
    function snapshot() { return store.snapshot(); }
    function selected() { const s = snapshot(); return root.TRACA_EDITOR.resolveSelection(s, s.selectedElement); }
    function ensureBoard() { if (!snapshot().workingGeometry) store.startCoachReference(root.TRACA_COURT_PROFILE); }
    function commit(geometry, label) { store.commitGeometry(geometry, label); }
    function listen(id, fn) { $(id).addEventListener("click", () => { try { fn(); } catch (e) { toast(e.message); } }); }
    document.querySelectorAll("[data-add-entity]").forEach((button) => button.onclick = () => {
      ensureBoard(); const kind = button.dataset.addEntity, s = snapshot();
      const count = (s.workingGeometry.entities || []).filter((e) => e.kind === kind).length;
      const index = (s.workingGeometry.entities || []).length;
      const entity = store.addManualPrimitive({ primitive_type: "entity", kind, position: [4 + (index % 5) * 3, (s.ui.orientation === "full" ? 20 : kind === "defender" ? 7.5 : 11) + Math.floor(index / 5) * 1.5], label: ["attacker", "defender"].includes(kind) ? String(count + 1) : "" });
      store.setSelection({ ref: `geometry:entity:${entity.id}`, kind: "entity" }); store.setUi({ view: "control" });
    });
    listen("#add-quick-path", () => { ensureBoard(); const path = store.addManualPrimitive({ primitive_type: "path", kind: $("#quick-path").value }); store.setSelection({ ref: `geometry:common_path:${path.id}`, kind: "path" }); store.setUi({ view: "control" }); });
    listen("#cones-posts", () => {
      ensureBoard(); let geometry = snapshot().workingGeometry; const posts = root.TRACA_COURT_GEOMETRY.goalPosts(geometry.court);
      [posts.left, posts.right].forEach((x) => { geometry = root.TRACA_MANUAL_GEOMETRY.addPrimitive(geometry, { primitive_type: "entity", kind: "cone", position: [x, geometry.court.markings.goal_area_radius_m] }); });
      commit(geometry, "Dos cons alineats amb els pals a 6 m");
    });
    [["#board-orientation", "orientation"], ["#board-snap", "snap"], ["#board-theme", "theme"], ["#board-zoom", "zoom"]].forEach(([id, key]) => $(id).onchange = () => { editor.cancel(); store.setUi({ [key]: key === "zoom" ? Number($(id).value) : $(id).value }); });
    $("#quick-label").onchange = () => { const item = selected(); if (item && $("#quick-label").value !== (item.object.label || "")) store.applyCorrection({ target: { layer: "geometry", ref: item.ref, property: "label" }, before: item.object.label || "", after: $("#quick-label").value, reason: "Étiquette del participant o del material" }); };
    [["#quick-role", "kind"], ["#material-function", "material_function"]].forEach(([id, property]) => $(id).onchange = () => { const item = selected(); if (item && $(id).value !== (item.object[property] || "")) store.applyCorrection({ target: { layer: "geometry", ref: item.ref, property }, before: item.object[property] || "", after: $(id).value, reason: property === "kind" ? "Canvi de figura indicat per l’entrenador" : "Funció declarada del material" }); });
    listen("#delete-selected", () => { const item = selected(); if (item) { commit(board.remove(snapshot().workingGeometry, item.ref), "Eliminar selecció"); store.setSelection(null); } });
    listen("#duplicate-selected", () => { const item = selected(); if (item) commit(board.cloneSelection(snapshot().workingGeometry, [item.ref], false).geometry, "Duplicar selecció amb identitats noves"); });
    listen("#detach-path", () => { const item = selected(); if (item && (item.object.from_state_ref || item.object.to_state_ref)) { commit(board.detach(snapshot().workingGeometry, item.ref), "Desvinculació explícita del traç"); toast("Traç lliure. La desvinculació ha quedat registrada."); } });
    [["#rotate-left", -10], ["#rotate-right", 10]].forEach(([id, angle]) => listen(id, () => { const item = selected(); if (item && item.object.kind === "bench") store.applyCorrection({ target: { layer: "geometry", ref: item.ref, property: "angle" }, before: item.object.angle || 0, after: (item.object.angle || 0) + angle, reason: "Rotació del banc de 10°" }); }));
    listen("#clear-board", () => { const s = snapshot(); const empty = root.TRACA_MANUAL_GEOMETRY.createCoachReferenceGeometry(s.currentCase.id, root.TRACA_COURT_PROFILE); commit(empty, "Buidar pista (recuperable amb Desfer)"); store.setSelection(null); });
    listen("#mirror-selection", () => {
      const s = snapshot(); if (!s.workingGeometry) return;
      mirror = { ...board.cloneSelection(s.workingGeometry, s.selectedElement ? [s.selectedElement.ref] : null, true), revision: s.revision };
      $("#mirror-summary").textContent = `${mirror.count} elements vinculats es duplicaran amb identitats noves. Els originals es conservaran. ${s.selectedElement ? "Selecció actual." : "Tot el muntatge."}`;
      root.TRACA_RENDERER.render($("#mirror-preview"), { geometry: mirror.geometry, visualGrammar: s.workingVisualGrammar, selectedAlternatives: s.selectedAlternatives, view: "clean", board: s.ui });
      $("#mirror-dialog").showModal();
    });
    listen("#confirm-mirror", () => { if (mirror && mirror.revision === snapshot().revision) { commit(mirror.geometry, "Duplicar en mirall"); $("#mirror-dialog").close(); mirror = null; } else toast("La pissarra ha canviat. Torna a preparar el mirall."); });
    listen("#toggle-theory", () => { document.body.classList.toggle("theory-collapsed"); $("#toggle-theory").setAttribute("aria-expanded", String(!document.body.classList.contains("theory-collapsed"))); });
    listen("#approve-case", () => { try { store.validate("coach"); store.saveCase({ status: "validated" }); persistence.flush(); toast("Aquesta revisió s’ha validat explícitament."); } catch (error) { toast(error.report && error.report.diagnostics.find((d) => d.level === "error")?.message || "Hi ha punts pendents. L’esborrany es pot guardar igualment."); } });
    listen("#package-export", () => root.TRACA_IMPORT_EXPORT.downloadPackage(snapshot()));
    listen("#package-import", () => $("#import-trigger").click());
    $("#copy-png").onclick = async () => {
      try {
        const svg = root.TRACA_RENDERER.cleanSvg(snapshot(), document, { monochrome: $("#export-mono").checked });
        const result = await root.TRACA_RENDERER.copyPng(svg, "traca.png", { width: Number($("#export-size").value), pixelRatio: 1 });
        toast(result.status === "copied_image" ? "Imatge PNG copiada al porta-retalls." : "El navegador no permet copiar la imatge. PNG preparat; tens l’enllaç de descàrrega.");
      } catch (error) { toast(`No s’ha pogut crear la imatge: ${error.message}`); }
    };
    $("#reference-image").onchange = async (event) => {
      const file = event.target.files[0]; if (!file) return;
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 1500000) { toast("Utilitza PNG, JPEG o WebP de menys d’1,5 MB."); return; }
      const reader = new FileReader(); reader.onload = () => store.attachReference({ name: file.name, media_type: file.type, data_url: reader.result, provenance: "Fitxer adjuntat per l’entrenador", source_refs: [file.name] }); reader.readAsDataURL(file); event.target.value = "";
    };
    function renderTheory(s) {
      const actions = s.composition.plan && s.composition.plan.actions || s.semanticModel.actions || [];
      const selection = selected(), paths = root.TRACA_GEOMETRY_DEPENDENCIES.allPaths(s.workingGeometry);
      const linkedActions = new Set(selection ? [selection.object.action_ref, ...paths.filter((p) => p.from_state_ref === selection.object.id || p.to_state_ref === selection.object.id || p.actor_ref === selection.object.id).map((p) => p.action_ref)] : []);
      const actionNames = { pass: "Passada", reception: "Recepció en carrera", feint: "Finta", numerical_relation: "Superioritat numèrica", movement: "Desplaçament", shot: "Llançament", dribble: "Bot", block: "Bloqueig", crossing: "Encreuament" };
      $("#theory-actions").innerHTML = actions.map((action) => `<article class="theory-action ${linkedActions.has(action.id) ? "is-linked" : ""}"><button data-theory="${escape(action.id)}">${escape(actionNames[action.type || action.kind || action.semantic_type || action.operator_id] || action.label || "Acció")}</button><span>${s.actionApprovals[action.id]?.revision === s.revision ? "Aprovada en aquesta revisió" : "Pendent de revisió"}</span><button data-approve-action="${escape(action.id)}">Aprovar acció</button></article>`).join("") || '<p class="empty-copy">Pissarra manual independent. Genera text o completa el model per vincular-hi accions.</p>';
      $("#theory-actions").querySelectorAll("[data-theory]").forEach((button) => button.onclick = () => {
        const path = paths.find((p) => p.action_ref === button.dataset.theory);
        if (path) { const collection = (s.workingGeometry.common_paths || []).some((p) => p.id === path.id) ? "common_path" : "alternative"; store.setSelection({ ref: `geometry:${collection}:${path.id}`, kind: "path" }); store.setUi({ view: "control" }); } else toast("Aquesta acció encara no té geometria resolta; pots dibuixar-la manualment.");
      });
      $("#theory-actions").querySelectorAll("[data-approve-action]").forEach((button) => button.onclick = () => { try { store.approveAction(button.dataset.approveAction); } catch (_error) { toast("Revisa els punts pendents d’aquesta acció abans d’aprovar-la. Pots guardar l’esborrany."); } });
      $("#reference-images").replaceChildren();
      s.referenceImages.forEach((ref) => { const figure = document.createElement("figure"), image = document.createElement("img"), caption = document.createElement("figcaption"); image.src = /^data:image\/(png|jpeg|webp);base64,/.test(ref.data_url) ? ref.data_url : ""; image.alt = ref.name; caption.textContent = `${ref.name} · ${ref.provenance} · no interpretada`; figure.append(image, caption); $("#reference-images").appendChild(figure); });
    }
    function renderRegeneration(s) {
      const panel = $("#regeneration-panel"), proposal = s.regeneration;
      panel.hidden = !proposal;
      if (!proposal) return;
      if (proposal.status === "pending") { panel.innerHTML = '<strong>Preparant proposta… El dibuix actual es conserva.</strong><button data-cancel-generation>Cancel·lar</button>'; }
      else {
        panel.innerHTML = `<strong>Proposta de regeneració</strong><p>${proposal.result.geometry ? "Les correccions compatibles es conserven. Revisa els conflictes abans d’aplicar-la." : "El generador no ha resolt una geometria nova. Es conserva tota la pissarra manual."}</p><div class="comparison-previews"><div id="old-preview"></div><div id="new-preview"></div></div>${proposal.conflicts.map((c, i) => `<label>Canvi ${i + 1}: ${escape(c.path.split("/").at(-1))}<select data-conflict-choice="${escape(c.path)}"><option value="defer">Ajornar</option><option value="keep">Conservar correcció</option><option value="new">Acceptar proposta</option></select></label>`).join("")}<button data-accept-generation>Aplicar proposta (es pot desfer)</button><button data-cancel-generation>Cancel·lar</button>`;
        if (s.workingGeometry) root.TRACA_RENDERER.render($("#old-preview"), { geometry: s.workingGeometry, visualGrammar: s.workingVisualGrammar, view: "clean", board: s.ui });
        if (proposal.geometry) root.TRACA_RENDERER.render($("#new-preview"), { geometry: proposal.geometry, visualGrammar: s.workingVisualGrammar, view: "clean", board: s.ui });
        panel.querySelector("[data-accept-generation]").onclick = () => { try { store.acceptRegeneration(Object.fromEntries([...panel.querySelectorAll("[data-conflict-choice]")].map((select) => [select.dataset.conflictChoice, select.value]))); toast("Proposta aplicada. Desfer recupera la versió anterior."); } catch (e) { toast(e.message === "REGENERATION_CONFLICTS_PENDING" ? "Tria conservar o acceptar per a cada conflicte, o cancel·la la proposta." : "La pissarra ha canviat: cal regenerar la proposta."); } };
      }
      panel.querySelector("[data-cancel-generation]").onclick = () => store.cancelRegeneration();
    }
    function showConflict(conflict) {
      const panel = $("#save-conflict"); panel.hidden = false;
      const local = conflict.incoming, remote = conflict.current && conflict.current.payload;
      panel.innerHTML = `<strong>Hi ha dues versions. Cap no s’ha eliminat.</strong><p>Local: ${escape(local.case.name)} · ${local.corrections.length} correccions. Servei: ${escape(remote?.case.name || "Sense versió")} · ${remote?.corrections.length || 0} correccions.</p><div class="comparison-previews"><div id="conflict-local"></div><div id="conflict-remote"></div></div><button data-save-choice="copy">Conservar totes dues com a exercicis</button><button data-save-choice="local">Fer servir la meva</button><button data-save-choice="server">Obrir la del servei</button>`;
      [[local, "#conflict-local"], [remote, "#conflict-remote"]].forEach(([p, id]) => { if (p?.working_geometry) root.TRACA_RENDERER.render($(id), { geometry: p.working_geometry, visualGrammar: p.base_visual_grammar, view: "clean", board: p.ui || {} }); });
      panel.querySelectorAll("[data-save-choice]").forEach((button) => button.onclick = async () => { const payload = await persistence.resolveConflict(button.dataset.saveChoice); if (payload) { store.restorePackage(payload); syncCaseForm(snapshot()); panel.hidden = true; } });
    }
    function renderKnowledge() {
      const output = $("#knowledge-results");
      if (!knowledge) { output.textContent = "La base documental es carregarà des del servei local."; return; }
      const query = $("#knowledge-search").value.trim() || "VAL-ENT-004";
      const results = root.TRACA_GRAPHIC_KNOWLEDGE_BASE.query(knowledge, query).slice(0, 12);
      const active = snapshot().knowledgeLibrary.activation_registry.activated_records;
      output.innerHTML = results.map((item) => `<article class="knowledge-result"><strong>${escape(item.record.title || item.record.concept || item.record.label || item.id)}</strong><p>${escape(item.record.validated_statement || item.record.takeaway || item.record.meaning_from_audit || item.record.consolidation_reason || item.record.meaning || "")}</p><small>${escape(item.status)} · ${escape(item.source_refs.join(", "))}</small><p>${escape(item.scope || "Abast limitat al registre original")}</p>${root.TRACA_GRAPHIC_KNOWLEDGE_BASE.operational(item.record) ? `<button data-activate-knowledge="${escape(item.id)}">${active.includes(item.id) ? "Desactivar consulta operativa" : "Activar només aquesta afirmació"}</button>` : '<small>No executable: candidat o observació documental.</small>'}</article>`).join("") || "Cap coincidència.";
      output.querySelectorAll("[data-activate-knowledge]").forEach((button) => button.onclick = () => { const id = button.dataset.activateKnowledge; store.activateKnowledge(id, !active.includes(id), results.find(r => r.id === id)); renderKnowledge(); });
    }
    $("#knowledge-search").oninput = renderKnowledge;
    function decorateGeneration(result) {
      if (!knowledge) return result;
      const adapter = root.TRACA_GRAPHIC_KNOWLEDGE_BASE.adaptOperational(knowledge, snapshot().knowledgeLibrary.activation_registry);
      result.knowledge_assertions = adapter.facts.map(f => ({ id: f.id, assertion: f.assertion, scope: f.scope, source_refs: f.source_refs, usage: f.id === "VAL-ENT-004" ? "optional_alternatives_render_policy" : "consultation_only_pending_typed_executor" }));
      return result;
    }
    fetch("/api/knowledge").then((r) => { if (!r.ok) throw Error("SOURCE_UNAVAILABLE"); return r.json(); }).then((source) => { const report = root.TRACA_GRAPHIC_KNOWLEDGE_BASE.validate(source); if (!report.valid) throw Error(JSON.stringify(report.errors)); knowledge = source; renderKnowledge(); }).catch(() => { $("#knowledge-results").textContent = "Base no disponible. Obre l’aplicació amb el servei local; la pissarra continua funcionant."; });
    function openReuse() {
      const events = snapshot().corrections; if (!events.length) return;
      const form = $("#reuse-form");
      let controls = $("#typed-criterion");
      if (!controls) { controls = document.createElement("div"); controls.id = "typed-criterion"; form.insertBefore(controls, form.querySelector(".dialog-actions")); }
      controls.innerHTML = `<label>Correcció concreta<select id="criterion-event">${events.map((e, i) => `<option value="${escape(e.id)}">${i + 1}. ${escape(e.coach_explanation || e.reason || 'Correcció del dibuix')}</option>`).join("")}</select></label><label>Efecte<select id="criterion-type"><option value="relative_position">Posició relativa vinculada a l’acció</option><option value="feint_sequence">Comprovar l’ordre funcional d’una finta</option></select></label><p id="criterion-preview"></p><div class="comparison-previews"><figure><figcaption>Abans</figcaption><div id="criterion-before"></div></figure><figure><figcaption>Correcció</figcaption><div id="criterion-after"></div></figure></div><label><input id="criterion-approve" type="checkbox" /> Aprovo explícitament aquest criteri i aquest abast</label>`;
      $("#criterion-event").value = events.at(-1).id;
      function previewCriterion() {
        const event = events.find((e) => e.id === $("#criterion-event").value);
        reuseDraft = root.TRACA_LEARNING_CRITERIA.derive(snapshot(), event, { type: $("#criterion-type").value });
        const s = snapshot(), before = clone(s.workingGeometry), item = board.target(before, event.target.ref);
        if (item && event.target.layer === "geometry" && event.target.property !== "geometry") { root.TRACA_UTILS.writePath(item, event.target.property, clone(event.before)); root.TRACA_GEOMETRY_DEPENDENCIES.reconcileGeometry(before); }
        [[before, "#criterion-before"], [s.workingGeometry, "#criterion-after"]].forEach(([geometry, id]) => root.TRACA_RENDERER.render($(id), { geometry, visualGrammar: s.workingVisualGrammar, view: "clean", board: s.ui }));
        $("#criterion-preview").textContent = reuseDraft.effect?.type === "relative_position" ? `En una acció compatible (${reuseDraft.condition.action_kind}), situar el destí a ${reuseDraft.effect.lateral_m.toFixed(2)} m laterals i ${reuseDraft.effect.depth_m.toFixed(2)} m de profunditat respecte de l’origen. S’adapta al costat; no memoritza IDs ni coordenades absolutes.` : reuseDraft.effect?.type === "validate_feint_sequence" ? "Comprovar compromís, canvi de costat davant del defensor i superació pel costat de sortida. No dibuixa una acció nova." : "La correcció es pot registrar i aprovar, però encara no té implementació operativa. No s’aplicarà en altres casos.";
      }
      $("#criterion-event").onchange = previewCriterion; $("#criterion-type").onchange = previewCriterion; previewCriterion();
      $("#reuse-dialog").showModal();
    }
    function saveReuse(input) {
      const c = store.registerCriterion($("#criterion-event").value, { ...input, type: $("#criterion-type").value });
      if ($("#criterion-approve").checked) store.approveCriterion(c.id, "coach");
      store.saveCase(); persistence.flush(); toast("Criteri registrat amb la correcció i el seu abast.");
    }
    function renderCriteria(s) {
      const applied = s.workingGeometry?.learning_applied || [];
      $("#criteria-list").innerHTML = (s.knowledgeLibrary.criteria || []).map((c) => `<article><strong>${escape(c.label)}</strong><p>${c.revoked ? "Revocat per a usos futurs" : c.state === "registered" ? "Registrat · pendent d’aprovació" : c.implementation !== "supported" ? "Aprovat · pendent d’implementació" : applied.some((a) => a.criterion_ref === c.id) ? "Aplicat en aquest exercici" : "Aprovat i executable"}</p>${!c.revoked && c.approval ? `<button data-revoke="${escape(c.id)}">Revocar usos futurs</button>` : !c.revoked ? `<button data-approve-criterion="${escape(c.id)}">Aprovar criteri</button>` : ""}</article>`).join("") || '<p class="empty-copy">Les correccions no es converteixen en regles automàticament.</p>';
      $("#criteria-list").querySelectorAll("[data-revoke]").forEach((b) => b.onclick = () => store.revokeCriterion(b.dataset.revoke));
      $("#criteria-list").querySelectorAll("[data-approve-criterion]").forEach((b) => b.onclick = () => store.approveCriterion(b.dataset.approveCriterion));
      const conflicts = s.composition.learning?.conflicts || [];
      if (conflicts.length) $("#criteria-list").insertAdjacentHTML("afterbegin", `<p class="is-error">${conflicts.length} criteris incompatibles no s’han aplicat. Revisa o revoca un dels criteris.</p>`);
      const blocked = (s.composition.learning?.rejected || []).filter(r => r.reason === "GEOMETRY_CONSTRAINT_VIOLATION");
      if (blocked.length) $("#criteria-list").insertAdjacentHTML("afterbegin", '<p class="is-error">Un criteri entrava en conflicte amb els límits físics; s’ha conservat la geometria anterior.</p>');
      applied.forEach(a => { const p = document.createElement("p"); p.className = "criterion-provenance"; const c = s.knowledgeLibrary.criteria.find(c => c.id === a.criterion_ref); const source = c?.source_case_code || [...(s.knowledgeLibrary.drafts || []), ...(s.knowledgeLibrary.cases || [])].find(record => record.case_uid === c?.source_case_uid)?.short_code; p.textContent = `Aplicat: ${c?.label || 'Criteri de la revisió original'} · versió ${a.version} · ${a.effect === 'validation' ? `comprovació de l’ordre funcional: ${a.result}` : 'posició relativa corregida'} · origen: ${source || 'correcció documentada'} · revisió ${c?.source_revision ?? 'original'}`; $("#criteria-list").appendChild(p); });
    }
    function render(s) {
      [["#board-orientation", "orientation"], ["#board-snap", "snap"], ["#board-theme", "theme"], ["#board-zoom", "zoom"]].forEach(([id, key]) => { $(id).value = String(s.ui[key] || (key === "zoom" ? 1 : "")); });
      const item = selected(); if (document.activeElement !== $("#quick-label")) $("#quick-label").value = item?.object.label || "";
      $("#quick-label").disabled = !item;
      $("#quick-role-field").hidden = item?.parsed.collection !== "entity";
      if (item?.parsed.collection === "entity") $("#quick-role").value = item.object.kind;
      $("#material-function-field").hidden = !["bench", "cylinder", "cone"].includes(item?.object.kind);
      if (document.activeElement !== $("#material-function")) $("#material-function").value = item?.object.material_function || "";
      ["#delete-selected", "#duplicate-selected"].forEach((id) => $(id).disabled = !item);
      ["#rotate-left", "#rotate-right"].forEach((id) => { $(id).disabled = item?.object.kind !== "bench"; $(id).hidden = $(id).disabled; });
      $("#detach-path").disabled = !(item?.object.from_state_ref || item?.object.to_state_ref);
      $("#detach-path").hidden = $("#detach-path").disabled;
      if (!editor.active) { renderTheory(s); renderRegeneration(s); renderCriteria(s); }
    }
    async function generateModel(input) {
      store.updateCase(input);
      const token = store.beginRegeneration(), panel = $("#model-proposal"); panel.hidden = true;
      let mode;
      const provider = root.TRACA_MODEL_INTERPRETATION_PROVIDER.create({ provider: "local_service_configured_provider", invoke: async ({ description }) => { const response = await persistence.interpret(description); mode = response.mode; return response.proposal; } });
      try {
        const response = await provider.interpret({ description: input.description });
        if (snapshot().revision !== token.revision || snapshot().regeneration?.token.id !== token.id) return;
        if (response.status === "rejected") throw Error(response.validation.errors.join(", "));
        panel.hidden = false;
        const person = ref => response.proposal.participants.find(p => p.id === ref)?.label || "participant pendent";
        const actionNames = { pass: "Passada", reception: "Recepció en carrera", feint: "Finta", shot: "Llançament", movement: "Desplaçament", numerical_relation: "Superioritat numèrica" };
        panel.innerHTML = `<strong>${mode === "test_double" ? "Doble de prova · NO és una resposta d’un model real" : "Proposta del model · pendent de confirmació"}</strong><ul>${response.proposal.actions.map((action) => `<li>${escape(actionNames[action.type] || "Acció")}: ${escape(person(action.actor_ref))}${action.receiver_ref ? ` → ${escape(person(action.receiver_ref))}` : ""}</li>`).join("")}</ul><p>Confirma només si aquestes accions i participants corresponen al teu text. La proposta no és coneixement aprovat.</p><button id="confirm-model-proposal">Confirmo aquesta interpretació</button><button id="cancel-model-proposal">Descartar</button>`;
        $("#cancel-model-proposal").onclick = () => { panel.hidden = true; store.cancelRegeneration(); };
        $("#confirm-model-proposal").onclick = () => {
          if (snapshot().revision !== token.revision || snapshot().regeneration?.token.id !== token.id) { toast("El text o la pissarra ha canviat. Cal demanar una proposta nova."); return; }
          const proposal = response.proposal;
          const ir = root.TRACA_INTERPRETATION_PROVIDER.buildTacticalIR("", [], { case_id: snapshot().currentCase.id });
          ir.meta.source_revision = root.TRACA_UTILS.fingerprint(input.description);
          ["participants", "participant_states", "spaces", "materials", "balls", "actions", "relations", "decisions", "phases"].forEach((key) => {
            ir[key] = (proposal[key] || []).map((item) => ({ ...item, authority: "coach_explicit_input", status: "explicit", source_refs: [`coach_confirmed_model_proposal:${token.id}`, ...(item.evidence_spans || []).map((span) => `text:${typeof span === "string" ? span : span.text}`)] }));
          });
          const result = root.TRACA_REPRESENTATION_COMPOSER.compose({ tacticalIR: ir, courtProfile: root.TRACA_COURT_PROFILE });
          result.model_provenance = { mode, authority: "coach_confirmed_interpretation", source_revision: token.source };
          store.proposeRegeneration(token, decorateGeneration(result)); panel.hidden = true;
        };
      } catch (error) { if (snapshot().regeneration?.token.id === token.id) store.cancelRegeneration(); toast(`Interpretació no disponible (${error.message}). La pissarra i el generador local continuen disponibles.`); }
    }
    window.addEventListener("online", () => persistence.flush());
    window.addEventListener("beforeunload", (event) => { if (persistence.pending) { event.preventDefault(); event.returnValue = ""; } });
    return { render, showConflict, openReuse, saveReuse, generateModel, decorateGeneration, get knowledge() { return knowledge; } };
  }
  root.TRACA_WORKSPACE_UI = { create };
})(typeof globalThis !== "undefined" ? globalThis : this);
