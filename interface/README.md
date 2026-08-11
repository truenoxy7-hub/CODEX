# Workspace universal de TRAÇA

Aplicació estàtica del cicle supervisat:

```text
descriure → interpretar parcialment → completar → representar si és possible
          → corregir → preflight → validar → guardar → promocionar opcionalment
```

## Arquitectura

- `data/handball-knowledge.js`: vocabulari local auditable;
- `js/interpretation-provider.js`: providers canònic i local;
- `js/store.js`: estat universal, models, geometries i biblioteca;
- `js/manual-geometry.js`: referència manual no generada;
- `js/corrections.js` i `js/change-explainer.js`: events i explicacions;
- `js/workspace-preflight.js`: diagnòstics explicables;
- `js/promotion.js`: candidats explícits;
- `js/visual-grammar.js`, `renderer.js`, `editor.js`: representació i edició;
- `js/import-export.js` i `persistence.js`: paquet v0.3 i estat local;
- `js/app.js`: coordinació de la interfície.

UVOF015 és l’exemple canònic amb resolver. Un text nou no hereta la seva
geometria. Sense resolver, el cas es pot guardar i pot contenir una
`coach_reference_geometry` de l’entrenador.

## Execució

```bash
make interface
```

Obre `http://localhost:8000` o `interface/index.html`. No hi ha backend ni
dependències frontend. L’estat usa la clau `traca.workspace.v0.3` i validar no
promociona automàticament cap coneixement.
