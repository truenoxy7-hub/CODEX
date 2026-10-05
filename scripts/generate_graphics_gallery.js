#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const Renderer = require("../interface/js/renderer.js");
const Visual = require("../interface/js/visual-grammar.js");
const dictionary = require("../interface/data/visual-functional-dictionary.js");
const style = require("../interface/data/visual-style.js");
const Adapter = require("../interface/js/corpus-adapter.js");
const Composer = require("../interface/js/representation-composer.js");
const profile = require("../config/handball-court.ihf-2025.json");
const { escaped, MiniElement, MiniDocument } = require("./lib/minidom.js");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "examples", "graphics-gallery");
const PYTHON = process.env.TRACA_PYTHON || "python3";

function container() {
  const documentObject = new MiniDocument();
  return new MiniElement("div", documentObject);
}

function writeSvg(filename, svg) {
  fs.writeFileSync(path.join(OUTPUT, filename), Renderer.serializeSvg(svg), "utf8");
}

function renderSymbols(mode) {
  const host = container();
  const grammar = Visual.createVisualGrammar(dictionary, { style, mode });
  const svg = Renderer.renderSymbolSheet(host, { visualGrammar: grammar, canonicalReferences: dictionary.canonical_visual_reference });
  writeSvg(`symbol-sheet-${mode}.svg`, svg);
}

function renderCurrentExample() {
  const geometry = JSON.parse(fs.readFileSync(path.join(ROOT, "exercises", "TR-UVOF-015", "geometry.json"), "utf8"));
  const host = container();
  const svg = Renderer.render(host, { geometry, visualGrammar: Visual.createVisualGrammar(dictionary, { style }), selectedAlternatives: {}, selection: null, view: "clean" });
  writeSvg("current-TR-UVOF-015.svg", svg);
}

function coverageReport() {
  const stdout = childProcess.execFileSync(PYTHON, [path.join(ROOT, "scripts", "composer_coverage.py")], { cwd: ROOT, encoding: "utf8" });
  const report = JSON.parse(stdout), corpus = require("../corpus/uvof.semantic.json");
  for (const exercise of corpus.exercicis) {
    const adapted = Adapter.adapt(exercise, JSON.parse(fs.readFileSync(path.join(ROOT, "exercises", exercise.id, "spatial-relations.json"), "utf8")));
    const scenes = adapted.scenes.map((scene, index) => {
      const result = Composer.compose({ tacticalIR: scene.tacticalIR, courtProfile: profile });
      const filename = `${exercise.id}-scene-${index + 1}.svg`;
      if (result.geometry) writeSvg(filename, Renderer.render(container(), { geometry: result.geometry, visualGrammar: Visual.createVisualGrammar(dictionary, { style }), view: "clean", selectedAlternatives: {} }));
      return { ...scene, artifact: result.geometry ? filename : null, result };
    });
    fs.writeFileSync(path.join(OUTPUT, `${exercise.id}-scenes.json`), JSON.stringify({ ...adapted, scenes }, null, 2) + "\n");
    const item = report.exercises.find(e => e.exercise_id === exercise.id);
    item.scenes = scenes.map(s => ({ id: s.id, artifact: s.artifact, scope: s.scope, status: s.result.geometry_status }));
    item.geometry_scenes = scenes.filter(s => s.result.geometry).length;
    item.geometry_status = item.geometry_scenes ? "partial" : "needs_operator_adapter";
    item.geometry_coverage = (adapted.preserved.spatial.fluxos_pilota || []).length ? item.geometry_scenes / adapted.preserved.spatial.fluxos_pilota.length : 0;
    item.geometry_coverage_denominator = "validated ball-flow scenes, NOT whole exercise";
    item.missing_information = [...new Set(adapted.unresolved.map(u => u.reason || `${u.code}: ${u.missing.join(', ')}`))];
  }
  report.totals.generic_geometry_partial = report.exercises.filter(e => e.geometry_scenes).length;
  report.totals.generated_scenes = report.exercises.reduce((sum, e) => sum + e.geometry_scenes, 0);
  return report;
}

function exerciseCard(item) {
  const missing = item.missing_information.length ? item.missing_information.map((value) => `<li>${escaped(value)}</li>`).join("") : "<li>cap segons el classificador de relacions</li>";
  const visual = item.scenes.filter(s => s.artifact).map(s => `<details><summary>${escaped(s.id)} · ${escaped(s.scope.ball_ref)} · escena parcial</summary><img src="${escaped(s.artifact)}" alt="Subgraf de passada resolt; no és tot l’exercici"></details>`).join("") || '<div class="not-generated">No hi ha subgraf de passada amb vincles validats. Adaptació dels altres operadors pendent.</div>';
  return `<article class="case-card"><header><h3>${escaped(item.exercise_id)}</h3><span>${Math.round(item.composition_coverage * 100)}% relacions classificades</span></header>${visual}<dl><div><dt>unitats</dt><dd>${item.semantic_units}</dd></div><div><dt>relacions suficients</dt><dd>${item.relations_sufficient}</dd></div><div><dt>geometria</dt><dd>${item.geometry_scenes} escenes parcials</dd></div></dl><strong>Informació pendent</strong><ul>${missing}</ul><a href="${item.exercise_id}-scenes.json">Fonts completes, alternatives, pilotes i resultats</a></article>`;
}

function galleryHtml(report) {
  const comparisons = [
    ["A1 · passada i recepció", "a1-pass-reception"],
    ["A2 · recepció, finta i 2×1", "a2-reception-feint-2x1"],
    ["A3 · costat oposat", "a3-opposite-side"]
  ].map(([label, slug]) => `<article><h3>${label}</h3><div class="compare"><figure><img src="../general-geometry/comparison/${slug}-v0.3.svg" alt="${label}, abans"><figcaption>abans · v0.3</figcaption></figure><figure><img src="../general-geometry/${slug}.svg" alt="${label}, després"><figcaption>després · v0.4</figcaption></figure></div></article>`).join("");
  return `<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TRAÇA · galeria del motor gràfic</title><style>
  :root{font-family:Inter,system-ui,sans-serif;color:#17241f;background:#f5f6f3}body{margin:0}main{max-width:1440px;margin:auto;padding:32px}h1{font-size:clamp(2rem,5vw,4rem);margin:.1em 0}.lead{max-width:78ch;color:#526056}.notice{padding:16px;border-left:5px solid #b06724;background:#fff7e8}.sheets,.compare,.cases{display:grid;gap:18px}.sheets{grid-template-columns:repeat(auto-fit,minmax(420px,1fr))}.sheets img,.compare img,.case-card img{width:100%;background:#fff;border:1px solid #d9ded8}.compare{grid-template-columns:1fr 1fr}figure{margin:0}figcaption{font-weight:700;margin-top:6px}.cases{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}.case-card{background:white;border:1px solid #d9ded8;border-radius:12px;padding:16px}.case-card header{display:flex;justify-content:space-between;gap:12px}.case-card h3{margin:0}.case-card span{color:#2b6954;font-weight:800}.case-card dl{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.case-card dl div{background:#f3f5f2;padding:8px}.case-card dt{font-size:.72rem;text-transform:uppercase;color:#667}.case-card dd{margin:4px 0 0;font-weight:700}.not-generated{min-height:120px;display:grid;place-items:center;text-align:center;padding:18px;background:repeating-linear-gradient(135deg,#fafafa,#fafafa 10px,#f2f2f2 10px,#f2f2f2 20px);color:#59635e}code{display:block;white-space:normal;font-size:.72rem;color:#667}section{margin:54px 0}a{color:#225d49}@media(max-width:700px){main{padding:18px}.sheets{grid-template-columns:1fr}.compare{grid-template-columns:1fr}.case-card dl{grid-template-columns:1fr}}
  </style></head><body><main><p>Motor gràfic · revisió 2 · artefacte reproduïble</p><h1>TRAÇA, referència i cobertura real</h1><p class="lead">Símbols i exemples provenen del mateix renderitzador. Les escenes parcials no representen tot l’exercici ni decideixen alternatives obertes.</p><aside class="notice"><strong>Fonts recuperades:</strong> JSON v0.2, HTML, manifest, llegenda i component original disponibles a sources/revision2. Les aprovacions documentades mantenen l’abast original; la recerca no és promoció tàctica.</aside>
  <section><h2>14 símbols canònics + extensions TRAÇA</h2><div class="sheets"><figure><img src="symbol-sheet-color.svg" alt="Làmina canònica en color"><figcaption>Color</figcaption></figure><figure><img src="symbol-sheet-monochrome.svg" alt="Làmina canònica monocroma"><figcaption>Monocrom · llegible sense color</figcaption></figure></div></section>
  <section><h2>A1–A3 · abans i després</h2>${comparisons}</section>
  <section><h2>15 casos interns · estat honest</h2><p>${report.totals.generated_scenes} escenes de passada/recepció generades sense coordenades d’entrada, distribuïdes en ${report.totals.generic_geometry_partial}/15 casos. Cap no es declara complet: resten marcs relacionals dels altres operadors. La semàntica íntegra, els fluxos i les alternatives es conserven als JSON.</p><div class="cases">${report.exercises.map(exerciseCard).join("")}</div></section>
  <footer><p>Regeneració: <code>node scripts/generate_graphics_gallery.js</code></p><p><a href="manifest.json">Manifest auditable</a> · <a href="coverage.json">Cobertura JSON</a></p></footer></main></body></html>`;
}

fs.mkdirSync(OUTPUT, { recursive: true });
renderSymbols("color");
renderSymbols("monochrome");
renderCurrentExample();
const coverage = coverageReport();
fs.writeFileSync(path.join(OUTPUT, "coverage.json"), `${JSON.stringify(coverage, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(OUTPUT, "manifest.json"), `${JSON.stringify({
  format: "TRACA_graphics_gallery", version: "0.1.0", generated_by: "scripts/generate_graphics_gallery.js",
  dictionary: "knowledge/visual-functional-dictionary.v0.2.json", visual_style: "config/visual-style.v0.1.json",
  source_availability: { graphic_knowledge_json: "sources/revision2/TRACA_Base_coneixement_grafics_v0_1.json", graphic_knowledge_html: "available_in_package", manifest: "verified_20_of_20_sha256", coach_legend_png: "inspected_from_package", original_editor: "available_in_package" },
  artifacts: ["symbol-sheet-color.svg", "symbol-sheet-monochrome.svg", "current-TR-UVOF-015.svg", "coverage.json", "index.html"]
}, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(OUTPUT, "index.html"), galleryHtml(coverage), "utf8");
process.stdout.write(`Generated graphics gallery in ${OUTPUT}\n`);
