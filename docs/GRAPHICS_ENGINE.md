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

El paquet complet és a `sources/revision2/` intacte. El loader reconeix els
catàlegs reals, conserva els estats d’evidència i resol els índexs per pointer.
VAL-ENT-004 conserva l’aprovació original i l’abast: activar-la pot ometre
branques opcionals de la vista, sense esborrar alternatives de la semàntica.
No es promocionen en bloc candidats ni evidències superades. Els resultats
individuals T01–T20 consten a `reports/revision2/acceptance.json`.

## Model configurable

`interface/js/model-interpretation-provider.js` rep una funció `invoke`
injectada. Rebutja accions sense `evidence_spans` i mai etiqueta la resposta
com a coneixement validat. La interfície local continua operativa sense servei
ni credencials. El servei ofereix `/api/interpret`, validació d’origen i token
de sessió. `TRACA_MODEL_URL`, `TRACA_MODEL_KEY` i `TRACA_MODEL_NAME` viuen només
al servidor. L’URL ha de ser HTTPS o loopback, i rebre un POST JSON
`{description, model}` amb resposta estructurada del contracte del provider.
La proposta exigeix evidències de text, IDs/vincles vàlids i confirmació
explícita abans de la composició. Sense configurar, retorna una indisponibilitat
controlada; el generador local i l’editor continuen funcionant. El doble de prova
`--model-fixture tests/fixtures/revision2-model-a1.json` es distingeix a la UI;
no s’ha verificat una crida a un model real perquè no hi ha credencials.

## Exportació

Els botons SVG i PNG s'activen només quan hi ha geometria vigent. El nom conté
el cas i la revisió. Les metadades de l'SVG identifiquen la versió geomètrica,
la política visual i l'estat tàctic conegut. El PNG conserva el mateix aspecte
perquè rasteritza un SVG net del mateix renderer, no el DOM d’edició.
Nanses, hitboxes, selecció i guies s’exclouen; es mantenen els estats tàctics
discontinus. PNG de 600/1200 px, color/monocrom i còpia d’imatge real, amb
descàrrega alternativa explícita quan manca permís. L’enllaç de l’última
exportació roman accessible fins a preparar-ne una altra.
