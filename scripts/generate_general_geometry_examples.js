#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const Provider = require("../interface/js/interpretation-provider.js");
const Composer = require("../interface/js/representation-composer.js");
const Renderer = require("../interface/js/renderer.js");
const Visual = require("../interface/js/visual-grammar.js");
const profile = require("../config/handball-court.ihf-2025.json");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "examples", "general-geometry");
const CASES = [
  {
    id: "A1_PASS_RECEPTION",
    slug: "a1-pass-reception",
    description: "El central passa al lateral. El lateral rep en carrera."
  },
  {
    id: "A2_RECEPTION_FEINT_2X1",
    slug: "a2-reception-feint-2x1",
    description: "El central passa al lateral. El lateral rep en carrera a l’interval 1–2, fa una finta contra D2 i surt cap a l’interval 2–3. Després juga un 2x1 amb el pivot contra D3."
  },
  {
    id: "A3_OPPOSITE_SIDE",
    slug: "a3-opposite-side",
    description: "El central passa al lateral. El lateral rep en carrera a l’interval 2–3, fa una finta contra D2 i surt cap a l’interval 1–2. Després juga un 2x1 amb el pivot contra D1."
  }
];

function escaped(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

class MiniElement {
  constructor(name, documentObject) {
    this.name = name;
    this.ownerDocument = documentObject;
    this.attributes = {};
    this.children = [];
    this.dataset = {};
    this.textContent = "";
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  serialize() {
    const attributes = Object.entries(this.attributes).map(([name, value]) => ` ${name}="${escaped(value)}"`).join("");
    const dataset = Object.entries(this.dataset).map(([name, value]) => ` data-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}="${escaped(value)}"`).join("");
    const content = `${this.textContent ? escaped(this.textContent) : ""}${this.children.map((child) => child.serialize()).join("")}`;
    return `<${this.name}${attributes}${dataset}>${content}</${this.name}>`;
  }
}

class MiniDocument {
  createElementNS(_namespace, name) { return new MiniElement(name, this); }
}

function renderSvg(geometry) {
  const documentObject = new MiniDocument();
  const container = new MiniElement("div", documentObject);
  const svg = Renderer.render(container, {
    geometry,
    visualGrammar: Visual.createVisualGrammar(),
    selectedAlternatives: {},
    selection: null,
    view: "clean"
  });
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return `<?xml version="1.0" encoding="UTF-8"?>\n${svg.serialize()}\n`;
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

fs.mkdirSync(OUTPUT, { recursive: true });
CASES.forEach((candidate) => {
  const tacticalIR = Provider.buildTacticalIR(candidate.description, [], { case_id: candidate.id, knowledge_version: "K1" });
  const result = Composer.compose({ tacticalIR, courtProfile: profile });
  if (result.composition_status !== "ready" || result.geometry_status !== "ready" || !result.geometry) {
    throw new Error(`EXAMPLE_NOT_RESOLVED:${candidate.id}:${result.composition_status}:${result.geometry_status}`);
  }
  writeJson(path.join(OUTPUT, `${candidate.slug}.tactical-ir.json`), tacticalIR);
  writeJson(path.join(OUTPUT, `${candidate.slug}.geometry.json`), result.geometry);
  fs.writeFileSync(path.join(OUTPUT, `${candidate.slug}.svg`), renderSvg(result.geometry), "utf8");
});

process.stdout.write(`Generated ${CASES.length} general geometry examples in ${OUTPUT}\n`);
