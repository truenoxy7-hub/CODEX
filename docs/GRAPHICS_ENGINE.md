# Motor gràfic integral

## Contracte executable

```text
font semàntica / text
→ TacticalIR proposat i traçable
→ CompositionPlan i preguntes
→ geometria derivada i validada per capes
→ gramàtica visual v0.5 + estil v0.1
→ un únic SVG
→ pantalla / SVG / PNG
```

La política visual és a `config/visual-style.v0.1.json`; les convencions i la
seva autoritat són a `knowledge/visual-functional-dictionary.v0.2.json`. El
renderer no decideix actors, espais o tàctica.

## Regeneració

```bash
python scripts/build_visual_dictionary_bundle.py
node scripts/generate_general_geometry_examples.js
TRACA_PYTHON=python node scripts/generate_graphics_gallery.js
```

La galeria resultant és `examples/graphics-gallery/index.html`. El manifest
identifica fonts, versions i limitacions. `coverage.json` es deriva del corpus
i no conté èxits geomètrics sintètics.

## Base de coneixement gràfic

`interface/js/graphic-knowledge-base.js` ofereix validació, consulta i adaptació
selectiva. `runtime_import_allowed: true`, IDs duplicats o autoritat operativa
en registres no confirmats són errors. Un registre confirmat tampoc entra si no
figura a `activated_records`.

Els fitxers externs esmentats a l'encàrrec no eren disponibles. Per això no
s'han reconstruït VAL-ENT-001–005, D01–D10, R01–R20 ni T01–T20. Quan s'aporti
el paquet, s'ha d'afegir com a font i executar els catàlegs reals abans de
promoure cap asserció.

## Model configurable

`interface/js/model-interpretation-provider.js` rep una funció `invoke`
injectada. Rebutja accions sense `evidence_spans` i mai etiqueta la resposta
com a coneixement validat. La interfície local continua operativa sense servei
ni credencials.

## Exportació

Els botons SVG i PNG s'activen només quan hi ha geometria vigent. El nom conté
el cas i la revisió. Les metadades de l'SVG identifiquen la versió geomètrica,
la política visual i l'estat tàctic conegut. El PNG conserva el mateix aspecte
perquè rasteritza l'SVG actual.
