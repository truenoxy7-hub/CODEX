(function (root, factory) {
  const node = typeof module === "object" && module.exports;
  const api = factory(node ? require("./corrections.js") : root.TRACA_CORRECTIONS, node ? require("./whiteboard.js") : root.TRACA_WHITEBOARD, node ? require("./utils.js") : root.TRACA_UTILS);
  if (node) module.exports = api;
  root.TRACA_EDITOR = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (corrections, board, utils) {
  "use strict";
  function resolveSelection(snapshot, selection) {
    if (!snapshot.workingGeometry || !selection || !selection.ref) return null;
    const object = board.target(snapshot.workingGeometry, selection.ref);
    return object ? { ...selection, object, parsed: corrections.parseRef(selection.ref), source_refs: object.source_refs || (object.source_ref ? [object.source_ref] : []) } : null;
  }
  function svgCoordinates(svg, event, inverse) {
    const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    const world = svg.querySelector("[data-world]") || svg;
    const converted = point.matrixTransform(inverse || world.getScreenCTM().inverse());
    return [converted.x, converted.y];
  }
  function keyboardAllowed(event, container) {
    const t = event.target;
    return container.contains(t) && !t.closest("input, textarea, select, [contenteditable=true], dialog") && !container.ownerDocument.querySelector("dialog[open]");
  }
  function createEditor(options) {
    const { container, store } = options;
    let bound = false, gesture = null, raf = null;
    const notify = (error) => options.onError && options.onError(error.message || error);
    function preview(geometry, selection) { if (options.onPreview) options.onPreview(geometry, selection); }
    function calculate(event) {
      const g = gesture, current = svgCoordinates(container.querySelector("svg"), event, g.inverse);
      const delta = current.map((v, i) => v - g.start[i]);
      if (Math.hypot(...delta) <= 0.015) { g.moved = false; g.latest = g.geometry; return g.geometry; }
      let geometry;
      if (g.rotation) {
        geometry = utils.deepClone(g.geometry);
        const item = board.target(geometry, g.ref);
        const initialAngle = Math.atan2(g.start[1] - item.position[1], g.start[0] - item.position[0]);
        item.angle = (g.object.angle || 0) + (Math.atan2(current[1] - item.position[1], current[0] - item.position[0]) - initialAngle) * 180 / Math.PI;
      } else if (g.property) {
        const original = utils.readPath(g.object, g.property);
        geometry = board.handle(g.geometry, g.ref, g.property, original.map((v, i) => v + delta[i]));
      } else geometry = board.move(g.geometry, g.ref, delta, g.ui);
      g.latest = geometry; g.moved = Math.hypot(...delta) > 0.015;
      return geometry;
    }
    function cancel(event) {
      if (!gesture || event && event.pointerId !== undefined && event.pointerId !== gesture.pointerId) return;
      const g = gesture; gesture = null;
      if (raf) cancelAnimationFrame(raf); raf = null;
      if (container.hasPointerCapture(g.pointerId)) container.releasePointerCapture(g.pointerId);
      preview(store.snapshot().workingGeometry, store.snapshot().selectedElement);
    }
    function down(event) {
      if (gesture || event.button !== 0 || event.isPrimary === false) return;
      if (!["control", "corrected"].includes(store.snapshot().ui.view)) return;
      const node = event.target.closest("[data-ref]");
      if (!node || !container.contains(node)) { store.setSelection(null); container.focus({ preventScroll: true }); return; }
      const snapshot = store.snapshot(), ref = node.dataset.ref;
      const resolved = resolveSelection(snapshot, { ref }); if (!resolved) return;
      event.preventDefault(); container.focus({ preventScroll: true });
      const property = node.classList.contains("path-handle") ? `${node.dataset.property}${node.dataset.index === undefined ? "" : `.${node.dataset.index}`}` : null;
      const svg = container.querySelector("svg"), world = svg.querySelector("[data-world]") || svg;
      const inverse = world.getScreenCTM().inverse();
      gesture = { pointerId: event.pointerId, start: svgCoordinates(svg, event, inverse), inverse, ref, object: resolved.object, geometry: snapshot.workingGeometry, ui: snapshot.ui, property, rotation: node.classList.contains("rotation-handle"), moved: false, revision: snapshot.revision };
      container.setPointerCapture(event.pointerId);
      store.setSelection({ ref, kind: node.dataset.kind || (property ? "path" : "entity") });
      preview(snapshot.workingGeometry, { ref });
    }
    function move(event) {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      event.preventDefault();
      try {
        calculate(event);
        if (!raf) raf = requestAnimationFrame(() => { raf = null; if (gesture) preview(gesture.latest, { ref: gesture.ref }); });
      } catch (error) { cancel(event); notify(error); }
    }
    function up(event) {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      try {
        const geometry = calculate(event), g = gesture;
        if (raf) cancelAnimationFrame(raf); raf = null; gesture = null;
        if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId);
        if (g.moved && store.snapshot().revision === g.revision) {
          let ref = g.ref, property = g.rotation ? "angle" : g.property || (g.object.position ? "position" : "segments");
          const linked = g.object.state_ref || (property === "segments.0.start" ? g.object.from_state_ref : property === `segments.${(g.object.segments || []).length - 1}.end` ? g.object.to_state_ref : null);
          if (linked) { ref = `geometry:participant_state:${linked}`; property = "position"; }
          const beforeObject = board.target(g.geometry, ref), afterObject = board.target(geometry, ref);
          if (property === "segments" && !g.object.segments) property = "points";
          store.commitGeometry(geometry, g.rotation ? "Rotació del banc" : "Correcció directa de la pissarra", {
            target: { layer: "geometry", ref, property }, before: utils.readPath(beforeObject, property), after: utils.readPath(afterObject, property),
            source_refs: g.object.source_refs || (g.object.source_ref ? [g.object.source_ref] : []), action_refs: [g.object.action_ref].filter(Boolean),
            derived_effects: linked ? [{ target_ref: ref, property: "position", reason: "state_drives_geometry", explanation: "Estat compartit, trajectòries i pilota sincronitzats" }] : []
          });
        } else preview(store.snapshot().workingGeometry, { ref: g.ref });
      } catch (error) { cancel(event); notify(error); }
    }
    function key(event) {
      if (!keyboardAllowed(event, container)) return;
      if (event.key === "Escape") { cancel(); store.setSelection(null); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? store.redo() : store.undo(); return; }
      const snapshot = store.snapshot(), selection = resolveSelection(snapshot, snapshot.selectedElement);
      if (!selection) return;
      if (["Delete", "Backspace"].includes(event.key)) { event.preventDefault(); store.commitGeometry(board.remove(snapshot.workingGeometry, selection.ref), "Eliminar element"); store.setSelection(null); }
      if (["ArrowLeft", "ArrowRight"].includes(event.key) && selection.object.kind === "bench") {
        event.preventDefault(); store.applyCorrection({ target: { layer: "geometry", ref: selection.ref, property: "angle" }, before: selection.object.angle || 0, after: (selection.object.angle || 0) + (event.key === "ArrowLeft" ? -5 : 5), reason: "Rotació del banc de 5°" });
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") { event.preventDefault(); store.commitGeometry(board.cloneSelection(snapshot.workingGeometry, [selection.ref], false).geometry, "Duplicar selecció"); }
    }
    function bind() {
      if (bound) return; bound = true;
      container.tabIndex = 0;
      container.addEventListener("pointerdown", down); container.addEventListener("pointermove", move); container.addEventListener("pointerup", up);
      container.addEventListener("pointercancel", cancel); container.addEventListener("lostpointercapture", cancel); container.addEventListener("keydown", key);
    }
    return { bind, cancel, get active() { return Boolean(gesture); }, resolveSelection: (selection) => resolveSelection(store.snapshot(), selection) };
  }
  return { createEditor, resolveSelection, svgCoordinates, keyboardAllowed };
});
