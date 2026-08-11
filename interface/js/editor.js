(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const corrections = isNode ? require("./corrections.js") : root.TRACA_CORRECTIONS;
  const api = factory(corrections);
  if (isNode) module.exports = api;
  root.TRACA_EDITOR = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (correctionsApi) {
  "use strict";

  function svgCoordinates(svg, event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const converted = point.matrixTransform(svg.getScreenCTM().inverse());
    return [Number(converted.x.toFixed(3)), Number(converted.y.toFixed(3))];
  }

  function sourceRefsFor(object) {
    if (!object) return [];
    if (Array.isArray(object.source_refs)) return object.source_refs.slice();
    return object.source_ref ? [object.source_ref] : [];
  }

  function readPath(object, path) {
    return String(path || "").split(".").filter(Boolean).reduce((value, key) => value == null ? undefined : value[key], object);
  }

  function resolveSelection(snapshot, selection) {
    if (!selection || !selection.ref) return null;
    const parsed = correctionsApi.parseRef(selection.ref);
    const geometry = snapshot.workingGeometry;
    let object = null;
    if (parsed.collection === "entity") object = (geometry.entities || []).find((item) => item.id === parsed.id);
    if (parsed.collection === "zone") object = (geometry.zones || []).find((item) => item.id === parsed.id);
    if (parsed.collection === "space") object = (geometry.spaces || []).find((item) => item.id === parsed.id);
    if (parsed.collection === "participant_state") object = (geometry.participant_states || []).find((item) => item.id === parsed.id);
    if (parsed.collection === "common_path") object = (geometry.common_paths || []).find((item) => item.id === parsed.id);
    if (parsed.collection === "alternative") {
      for (const branch of geometry.branches || []) {
        object = (branch.alternatives || []).find((item) => item.id === parsed.id);
        if (object) break;
      }
    }
    if (parsed.collection === "return_pass") {
      for (const branch of geometry.branches || []) {
        object = (branch.alternatives || []).map((item) => item.return_pass).find((item) => item && item.id === parsed.id);
        if (object) break;
      }
    }
    return object ? { ...selection, parsed, object, source_refs: sourceRefsFor(object) } : null;
  }

  function createEditor(options) {
    const container = options.container;
    const store = options.store;

    function bind() {
      const svg = container.querySelector("svg");
      if (!svg) return;

      container.querySelectorAll(".selectable").forEach((node) => {
        node.addEventListener("click", (event) => {
          event.stopPropagation();
          store.setSelection({ ref: node.dataset.ref, kind: node.dataset.kind, property: node.dataset.pathSuffix || null });
        });
        node.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            store.setSelection({ ref: node.dataset.ref, kind: node.dataset.kind, property: node.dataset.pathSuffix || null });
          }
        });
      });
      svg.addEventListener("click", (event) => {
        if (event.target === svg || event.target.tagName === "rect") store.setSelection(null);
      });

      container.querySelectorAll(".entity-node, .participant-state-node").forEach((node) => {
        node.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.stopPropagation();
          const snapshot = store.snapshot();
          const resolved = resolveSelection(snapshot, { ref: node.dataset.ref, kind: node.dataset.kind });
          if (!resolved) return;
          const start = svgCoordinates(svg, event);
          const linkedState = node.dataset.stateRef && (snapshot.workingGeometry.participant_states || []).find((state) => state.id === node.dataset.stateRef);
          const correctionObject = linkedState || resolved.object;
          const correctionRef = linkedState ? `geometry:participant_state:${linkedState.id}` : node.dataset.ref;
          const before = correctionObject.position.slice();
          let after = before.slice();
          node.setPointerCapture(event.pointerId);
          function move(moveEvent) {
            const current = svgCoordinates(svg, moveEvent);
            after = [Number((before[0] + current[0] - start[0]).toFixed(3)), Number((before[1] + current[1] - start[1]).toFixed(3))];
            node.setAttribute("transform", `translate(${after[0] - before[0]} ${after[1] - before[1]})`);
          }
          function end() {
            node.removeEventListener("pointermove", move);
            node.removeEventListener("pointerup", end);
            node.removeEventListener("pointercancel", cancel);
            if (before[0] !== after[0] || before[1] !== after[1]) {
              const selection = { ref: node.dataset.ref, kind: node.dataset.kind };
              store.applyCorrection({
                target: { layer: "geometry", ref: correctionRef, property: "position" },
                operation: "move", before, after, author: "coach", scope: "case",
                reason: "Reposicionament manual d’un estat a la pista", source_refs: sourceRefsFor(correctionObject)
              });
              store.setSelection(selection);
            }
          }
          function cancel() {
            node.removeAttribute("transform");
            node.removeEventListener("pointermove", move);
            node.removeEventListener("pointerup", end);
            node.removeEventListener("pointercancel", cancel);
          }
          node.addEventListener("pointermove", move);
          node.addEventListener("pointerup", end);
          node.addEventListener("pointercancel", cancel);
        });
      });

      container.querySelectorAll(".path-handle").forEach((handle) => {
        handle.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.stopPropagation();
          const snapshot = store.snapshot();
          const resolved = resolveSelection(snapshot, { ref: handle.dataset.ref, kind: "path" });
          if (!resolved) return;
          const propertyRoot = handle.dataset.property || "points";
          const index = handle.dataset.index === undefined ? null : Number(handle.dataset.index);
          const property = index === null ? propertyRoot : `${propertyRoot}.${index}`;
          const point = readPath(resolved.object, property);
          if (!Array.isArray(point)) return;
          const before = point.slice();
          let after = before.slice();
          handle.setPointerCapture(event.pointerId);
          function move(moveEvent) {
            after = svgCoordinates(svg, moveEvent);
            handle.setAttribute("cx", after[0]);
            handle.setAttribute("cy", after[1]);
          }
          function end() {
            handle.removeEventListener("pointermove", move);
            handle.removeEventListener("pointerup", end);
            handle.removeEventListener("pointercancel", cancel);
            if (before[0] !== after[0] || before[1] !== after[1]) {
              store.applyCorrection({
                target: { layer: "geometry", ref: handle.dataset.ref, property },
                operation: "move_vertex", before, after, author: "coach", scope: "case",
                reason: "Ajust manual d’un punt de trajectòria", source_refs: resolved.source_refs
              });
            }
          }
          function cancel() {
            handle.setAttribute("cx", before[0]);
            handle.setAttribute("cy", before[1]);
            handle.removeEventListener("pointermove", move);
            handle.removeEventListener("pointerup", end);
            handle.removeEventListener("pointercancel", cancel);
          }
          handle.addEventListener("pointermove", move);
          handle.addEventListener("pointerup", end);
          handle.addEventListener("pointercancel", cancel);
        });
      });
    }

    return { bind, resolveSelection: (selection) => resolveSelection(store.snapshot(), selection) };
  }

  return { createEditor, resolveSelection };
});
