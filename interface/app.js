const SVG_NS = "http://www.w3.org/2000/svg";
const courtProfile = window.TRACA_COURT_PROFILE;
const oneVOne = window.TRACA_ONE_V_ONE;
const exampleText = "Un lateral esquerre amb pilota juga un 1x1 contra un segon defensiu. Té llibertat per sortir cap a l’interior o cap a l’exterior i finalitzar. Sense bot.";

let interpretation = null;
let geometry = null;

const elements = {
  description: document.querySelector("#description"),
  loadExample: document.querySelector("#load-example"),
  interpret: document.querySelector("#interpret"),
  interpretation: document.querySelector("#interpretation"),
  interpretationTitle: document.querySelector("#interpretation-title"),
  confidenceLabel: document.querySelector("#confidence-label"),
  factOrganization: document.querySelector("#fact-organization"),
  factParticipants: document.querySelector("#fact-participants"),
  factConditions: document.querySelector("#fact-conditions"),
  phaseList: document.querySelector("#phase-list"),
  validationNote: document.querySelector("#validation-note"),
  validationIcon: document.querySelector("#validation-icon"),
  validationTitle: document.querySelector("#validation-title"),
  validationMessage: document.querySelector("#validation-message"),
  edit: document.querySelector("#edit"),
  confirm: document.querySelector("#confirm"),
  generate: document.querySelector("#generate"),
  exportSvg: document.querySelector("#export-svg"),
  previewState: document.querySelector("#preview-state"),
  previewMessage: document.querySelector("#preview-message"),
  svgStage: document.querySelector("#svg-stage"),
  branchControls: document.querySelector("#branch-controls"),
  branchSelectors: document.querySelector("#branch-selectors"),
  semanticDot: document.querySelector("#semantic-dot"),
  semanticStatus: document.querySelector("#semantic-status"),
  relationDot: document.querySelector("#relation-dot"),
  relationStatus: document.querySelector("#relation-status"),
  geometryDot: document.querySelector("#geometry-dot"),
  geometryStatus: document.querySelector("#geometry-status"),
  announcer: document.querySelector("#announcer"),
};

function setStep(activeStep) {
  document.querySelectorAll(".stepper li").forEach((step) => {
    step.classList.toggle("is-active", step.dataset.step === activeStep);
  });
}

function announce(message) {
  elements.announcer.textContent = "";
  window.setTimeout(() => {
    elements.announcer.textContent = message;
  }, 30);
}

function svgNode(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
  return node;
}

function append(parent, name, attributes = {}) {
  const node = svgNode(name, attributes);
  parent.appendChild(node);
  return node;
}

function pointString(points) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function smoothPath(points) {
  if (!points || points.length < 2) return "";
  if (points.length === 2) return `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]}`;
  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const middle = [(current[0] + next[0]) / 2, (current[1] + next[1]) / 2];
    path += ` Q ${current[0]} ${current[1]} ${middle[0]} ${middle[1]}`;
  }
  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];
  return `${path} Q ${penultimate[0]} ${penultimate[1]} ${last[0]} ${last[1]}`;
}

function addMarker(defs, id, color) {
  const marker = append(defs, "marker", {
    id,
    viewBox: "0 0 10 10",
    refX: 9,
    refY: 5,
    markerWidth: 5,
    markerHeight: 5,
    orient: "auto-start-reverse",
  });
  append(marker, "path", { d: "M 0 0 L 10 5 L 0 10 z", fill: color });
}

function addCourt(svg) {
  const { court } = geometry;
  const goalLeft = (court.width_m - court.goal.width_m) / 2;
  const goalRight = goalLeft + court.goal.width_m;
  const radius = court.markings.goal_area_radius_m;
  const freeRadius = court.markings.free_throw_distance_m;
  const leftAreaStart = goalLeft - radius;
  const rightAreaStart = goalRight + radius;
  const leftFreeStart = goalLeft - freeRadius;
  const rightFreeStart = goalRight + freeRadius;

  const defs = append(svg, "defs");
  const wood = append(defs, "linearGradient", { id: "wood", x1: 0, y1: 0, x2: 0, y2: 1 });
  append(wood, "stop", { offset: "0%", "stop-color": "#d7a06b" });
  append(wood, "stop", { offset: "100%", "stop-color": "#c98950" });
  const clip = append(defs, "clipPath", { id: "court-clip" });
  append(clip, "rect", { x: 0, y: 0, width: 20, height: 20 });
  addMarker(defs, "arrow-player", "#126c55");
  addMarker(defs, "arrow-ball", "#db5a2a");

  append(svg, "rect", { x: 0, y: 0, width: 20, height: 20, fill: "url(#wood)" });
  for (let x = 1; x < 20; x += 1.5) {
    append(svg, "line", { x1: x, y1: 0, x2: x, y2: 20, stroke: "#ffffff", "stroke-opacity": 0.055, "stroke-width": 0.025 });
  }
  append(svg, "rect", { x: 0, y: 0, width: 20, height: 20, fill: "none", stroke: "#fff", "stroke-width": 0.08 });

  const goalAreaPath = `M ${leftAreaStart} 0 A ${radius} ${radius} 0 0 0 ${goalLeft} ${radius} L ${goalRight} ${radius} A ${radius} ${radius} 0 0 0 ${rightAreaStart} 0`;
  append(svg, "path", { d: goalAreaPath, fill: "#75b8ac", "fill-opacity": 0.34, stroke: "#fff", "stroke-width": 0.08 });

  const freeThrowPath = `M ${leftFreeStart} 0 A ${freeRadius} ${freeRadius} 0 0 0 ${goalLeft} ${freeRadius} L ${goalRight} ${freeRadius} A ${freeRadius} ${freeRadius} 0 0 0 ${rightFreeStart} 0`;
  append(svg, "path", {
    d: freeThrowPath,
    fill: "none",
    stroke: "#fff",
    "stroke-width": 0.08,
    "stroke-dasharray": `${court.markings.free_throw_segment_m} ${court.markings.free_throw_gap_m}`,
    "clip-path": "url(#court-clip)",
  });

  const penaltyHalf = court.markings.penalty_line_length_m / 2;
  const goalkeeperHalf = court.markings.goalkeeper_line_length_m / 2;
  append(svg, "line", { x1: 10 - penaltyHalf, y1: court.markings.penalty_line_distance_m, x2: 10 + penaltyHalf, y2: court.markings.penalty_line_distance_m, stroke: "#fff", "stroke-width": 0.08 });
  append(svg, "line", { x1: 10 - goalkeeperHalf, y1: court.markings.goalkeeper_line_distance_m, x2: 10 + goalkeeperHalf, y2: court.markings.goalkeeper_line_distance_m, stroke: "#fff", "stroke-width": 0.08 });
  append(svg, "line", { x1: 0, y1: 20, x2: 20, y2: 20, stroke: "#fff", "stroke-width": 0.08 });
  append(svg, "path", { d: "M 8 20 A 2 2 0 0 1 12 20", fill: "none", stroke: "#fff", "stroke-width": 0.08 });

  append(svg, "rect", { x: goalLeft, y: -0.72, width: 3, height: 0.72, fill: "#f7f4eb", stroke: "#c83d37", "stroke-width": 0.12 });
  for (let x = goalLeft + 0.25; x < goalRight; x += 0.5) {
    append(svg, "line", { x1: x, y1: -0.72, x2: x, y2: 0, stroke: "#c83d37", "stroke-width": 0.12 });
  }
}

function selectedAlternatives() {
  return geometry.branches.map((branch) => {
    const select = document.querySelector(`[data-branch="${branch.id}"]`);
    const selectedId = select ? select.value : branch.alternatives[0].id;
    return branch.alternatives.find((alternative) => alternative.id === selectedId) || branch.alternatives[0];
  });
}

function addSpaces(svg, alternatives) {
  const selected = new Map();
  alternatives.forEach((alternative) => {
    selected.set(alternative.initial_space_ref, "initial");
    selected.set(alternative.target_space_ref, alternative.initial_space_ref === alternative.target_space_ref ? "same" : "target");
  });
  geometry.spaces.forEach((space) => {
    const state = selected.get(space.id);
    append(svg, "polygon", {
      points: pointString(space.polygon),
      fill: state === "target" ? "#f6b26b" : "#dff2e9",
      "fill-opacity": state ? 0.28 : 0.08,
      stroke: state ? "#ffffff" : "none",
      "stroke-width": 0.035,
    });
    const label = append(svg, "text", {
      x: space.center[0], y: 6.0, "text-anchor": "middle", fill: "#173f33", "fill-opacity": 0.72,
      "font-size": 0.28, "font-family": "Inter, sans-serif", "font-weight": 700,
    });
    label.textContent = space.label || space.id;
  });
}

function addZones(svg) {
  geometry.zones.forEach((zone) => {
    append(svg, "polygon", { points: pointString(zone.polygon), fill: "none", stroke: "#183f34", "stroke-opacity": 0.32, "stroke-width": 0.04, "stroke-dasharray": "0.16 0.14" });
    append(svg, "line", { x1: zone.defensive_line[0][0], y1: zone.defensive_line[0][1], x2: zone.defensive_line[1][0], y2: zone.defensive_line[1][1], stroke: "#b73d3d", "stroke-opacity": 0.55, "stroke-width": 0.05, "stroke-dasharray": "0.12 0.12" });
    const label = append(svg, "text", {
      x: (zone.polygon[0][0] + zone.polygon[1][0]) / 2,
      y: 14.45,
      "text-anchor": "middle",
      fill: "#173f33",
      "fill-opacity": 0.75,
      "font-size": 0.36,
      "font-family": "Inter, sans-serif",
      "font-weight": 750,
    });
    label.textContent = zone.label || zone.id;
  });
}

function addCommonPaths(svg) {
  geometry.common_paths.forEach((path) => {
    const isPass = path.kind === "initial_pass";
    append(svg, "path", {
      d: smoothPath(path.points),
      fill: "none",
      stroke: isPass ? "#db5a2a" : "#465d56",
      "stroke-width": isPass ? 0.075 : 0.065,
      "stroke-dasharray": isPass ? "0.18 0.12" : "0.12 0.11",
      "stroke-linecap": "round",
      "marker-end": isPass ? "url(#arrow-ball)" : "none",
      opacity: 0.82,
    });
  });
}

function addAlternativePaths(svg, alternatives) {
  alternatives.forEach((alternative) => {
    if (alternative.return_ball_points && alternative.return_ball_points.length >= 2) {
      append(svg, "path", { d: smoothPath(alternative.return_ball_points), fill: "none", stroke: "#db5a2a", "stroke-width": 0.075, "stroke-dasharray": "0.18 0.12", "stroke-linecap": "round", "marker-end": "url(#arrow-ball)", opacity: 0.86 });
    }
    append(svg, "path", { d: smoothPath(alternative.points), fill: "none", stroke: "#126c55", "stroke-width": 0.14, "stroke-linecap": "round", "stroke-linejoin": "round", "marker-end": "url(#arrow-player)" });
  });
}

function addEntities(svg) {
  geometry.entities.forEach((entity) => {
    const [x, y] = entity.position;
    if (entity.kind === "cone") {
      append(svg, "polygon", { points: `${x},${y - 0.28} ${x - 0.24},${y + 0.22} ${x + 0.24},${y + 0.22}`, fill: "#f07a2f", stroke: "#fff4e8", "stroke-width": 0.045 });
      return;
    }
    if (entity.kind === "ball") {
      append(svg, "circle", { cx: x, cy: y, r: 0.16, fill: "#f0a12f", stroke: "#7f4e13", "stroke-width": 0.035 });
      return;
    }
    const palette = { attacker: ["#1f6fb2", "#eaf4ff"], passer: ["#258b7a", "#e9fff9"], defender: ["#b63e45", "#fff1f2"] };
    const [fill, textColor] = palette[entity.kind];
    append(svg, "circle", { cx: x, cy: y, r: 0.37, fill, stroke: "#fff", "stroke-width": 0.07 });
    const label = append(svg, "text", { x, y: y + 0.13, "text-anchor": "middle", fill: textColor, "font-size": 0.36, "font-family": "Inter, sans-serif", "font-weight": 850 });
    label.textContent = entity.label;
  });
}

function renderGeometry() {
  const alternatives = selectedAlternatives();
  const svg = svgNode("svg", {
    xmlns: SVG_NS,
    viewBox: geometry.court.view_box.join(" "),
    role: "img",
    "aria-label": "Situació 1x1 interpretada sobre una mitja pista reglamentària d’handbol",
  });
  addCourt(svg);
  addSpaces(svg, alternatives);
  addZones(svg);
  addCommonPaths(svg);
  addAlternativePaths(svg, alternatives);
  addEntities(svg);
  elements.svgStage.replaceChildren(svg);
  elements.svgStage.hidden = false;
  elements.previewMessage.hidden = true;
}

function alternativeLabel(alternative) {
  return alternative.label || `${alternative.kind === "feint" ? "Finta" : "Continua"} · ${alternative.target_space_ref}`;
}

function buildBranchControls() {
  elements.branchSelectors.replaceChildren();
  geometry.branches.forEach((branch) => {
    const zone = geometry.zones.find((item) => item.id === branch.zone_ref);
    const branchLabel = zone?.label || "Duel 1x1";
    const label = document.createElement("label");
    label.textContent = branchLabel;
    const select = document.createElement("select");
    select.dataset.branch = branch.id;
    select.setAttribute("aria-label", `Alternativa de ${branchLabel}`);
    branch.alternatives.forEach((alternative, index) => {
      const option = document.createElement("option");
      option.value = alternative.id;
      option.textContent = alternativeLabel(alternative);
      option.selected = index === 0;
      select.appendChild(option);
    });
    select.addEventListener("change", () => {
      renderGeometry();
      announce(`Previsualització actualitzada: ${select.options[select.selectedIndex].textContent}.`);
    });
    label.appendChild(select);
    elements.branchSelectors.appendChild(label);
  });
}

function phaseCard(phase, index) {
  const article = document.createElement("article");
  article.className = "phase-card";
  const number = document.createElement("span");
  number.className = "phase-number";
  number.textContent = String(index + 1).padStart(2, "0");
  const content = document.createElement("div");
  const title = document.createElement("h4");
  title.textContent = phase.title;
  const description = document.createElement("p");
  description.textContent = phase.description;
  const tags = document.createElement("div");
  tags.className = "tags";
  tags.setAttribute("aria-label", `Conceptes de la fase ${index + 1}`);
  phase.tags.forEach((value) => {
    const tag = document.createElement("span");
    tag.textContent = value;
    tags.appendChild(tag);
  });
  content.append(title, description, tags);
  article.append(number, content);
  return article;
}

function setValidation(kind, title, message) {
  elements.validationNote.classList.toggle("is-warning", kind === "warning");
  elements.validationNote.classList.toggle("is-error", kind === "error");
  elements.validationIcon.textContent = kind === "error" ? "!" : kind === "warning" ? "?" : "✓";
  elements.validationTitle.textContent = title;
  elements.validationMessage.textContent = message;
}

function resetGeneratedOutput() {
  geometry = null;
  elements.generate.disabled = true;
  elements.exportSvg.disabled = true;
  elements.branchControls.hidden = true;
  elements.branchSelectors.replaceChildren();
  elements.svgStage.hidden = true;
  elements.svgStage.replaceChildren();
  elements.previewMessage.hidden = false;
  elements.previewState.textContent = "Esperant confirmació";
  elements.previewState.classList.remove("is-ready");
  elements.relationDot.classList.remove("is-ready");
  elements.geometryDot.classList.remove("is-ready");
  elements.relationStatus.textContent = "Pendent de confirmació";
  elements.geometryStatus.textContent = "Preparat després de confirmar";
}

function renderInterpretation(result) {
  elements.interpretation.hidden = false;
  elements.phaseList.replaceChildren();
  resetGeneratedOutput();

  if (result.status === "unsupported") {
    elements.confidenceLabel.textContent = "Fora de l’abast 1x1 inicial";
    elements.factOrganization.textContent = "No identificada";
    elements.factParticipants.textContent = "No derivats";
    elements.factConditions.textContent = "Sense inferències";
    elements.confirm.disabled = true;
    elements.semanticDot.classList.remove("is-ready");
    elements.semanticStatus.textContent = "Cal concretar un 1x1";
    elements.previewState.textContent = "Descripció no representada";
    setValidation("error", "TRAÇA no ho representarà encara", result.message);
    setStep("review");
    return;
  }

  const facts = result.facts;
  const support = facts.support ? " · 1 passador" : "";
  const ball = facts.ball_start === "attacker" ? "Pilota: atacant" : facts.ball_start === "support" ? "Pilota: passador" : "Pilota: no especificada";
  const dribble = facts.dribble === "forbidden" ? "Sense bot" : facts.dribble === "allowed" ? "Bot permès" : "Bot no especificat";
  elements.confidenceLabel.textContent = result.status === "needs_confirmation" ? "Interpretació amb dades pendents" : "1x1 reconegut";
  elements.factOrganization.textContent = facts.organization;
  elements.factParticipants.textContent = `${facts.attacker.label} · ${facts.defender.label}${support}`;
  elements.factConditions.textContent = `${ball} · ${dribble}`;
  result.phases.forEach((phase, index) => elements.phaseList.appendChild(phaseCard(phase, index)));
  elements.confirm.disabled = false;
  elements.semanticDot.classList.add("is-ready");
  elements.semanticStatus.textContent = "1x1 interpretat del text";

  const notes = [...result.pending, ...result.warnings];
  if (notes.length) {
    setValidation("warning", `${notes.length} criteri${notes.length === 1 ? "" : "s"} per revisar`, notes.join(" "));
  } else {
    setValidation("ready", "Sense dades pendents", "Tots els elements necessaris per representar aquest 1x1 apareixen al text.");
  }
  setStep("review");
}

function showInterpretation() {
  interpretation = oneVOne.interpret(elements.description.value);
  renderInterpretation(interpretation);
  elements.interpretationTitle.focus();
  announce(interpretation.status === "unsupported" ? interpretation.message : "Interpretació provisional preparada. Revisa-la abans de confirmar.");
}

function editDescription() {
  elements.description.focus();
  resetGeneratedOutput();
  setStep("write");
  announce("Pots modificar la descripció i tornar-la a interpretar.");
}

function confirmInterpretation() {
  if (!interpretation || interpretation.status === "unsupported") return;
  geometry = oneVOne.buildGeometry(interpretation, courtProfile);
  elements.relationDot.classList.add("is-ready");
  elements.relationStatus.textContent = "Esborrany 1x1 confirmat";
  elements.previewState.textContent = "Preparat per generar";
  elements.previewState.classList.add("is-ready");
  elements.generate.disabled = false;
  setStep("generate");
  announce("Interpretació confirmada. Ja pots generar el gràfic.");
}

function generateGraph() {
  if (!geometry) {
    announce("Confirma primer la interpretació del text.");
    return;
  }
  buildBranchControls();
  renderGeometry();
  elements.branchControls.hidden = false;
  elements.exportSvg.disabled = false;
  elements.geometryDot.classList.add("is-ready");
  elements.geometryStatus.textContent = "SVG derivat del text";
  elements.previewState.textContent = "Gràfic generat";
  announce("Gràfic del 1x1 generat des de la descripció confirmada.");
}

function exportSvg() {
  const svg = elements.svgStage.querySelector("svg");
  if (!svg) return;
  const source = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`;
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "TRACA-1x1.svg";
  link.click();
  URL.revokeObjectURL(url);
  announce("SVG del 1x1 descarregat.");
}

function loadExample() {
  elements.description.value = exampleText;
  interpretation = null;
  elements.interpretation.hidden = true;
  resetGeneratedOutput();
  setStep("write");
  elements.description.focus();
  announce("Exemple 1x1 carregat. Pots modificar qualsevol part del text.");
}

function invalidateInterpretation() {
  if (!interpretation) return;
  interpretation = null;
  elements.interpretation.hidden = true;
  resetGeneratedOutput();
  elements.semanticDot.classList.remove("is-ready");
  elements.semanticStatus.textContent = "Pendent de tornar a interpretar";
  setStep("write");
}

elements.loadExample.addEventListener("click", loadExample);
elements.description.addEventListener("input", invalidateInterpretation);
elements.interpret.addEventListener("click", showInterpretation);
elements.edit.addEventListener("click", editDescription);
elements.confirm.addEventListener("click", confirmInterpretation);
elements.generate.addEventListener("click", generateGraph);
elements.exportSvg.addEventListener("click", exportSvg);
