# Espai de treball MVP de TRAÇA

Primera vertical supervisada del cicle:

```text
descriure → interpretar → generar → revisar → corregir
          → validar → guardar → reutilitzar
```

UVOF015 és el cas executable real. La interfície carrega la seva semàntica
resumida, les relacions espacials referenciades i la geometria derivada. El
text es pot inspeccionar, però el motor actual no interpreta text arbitrari i
no genera un exercici inventat quan la descripció canvia.

## Arquitectura

- `data/`: paquets estàtics del cas, la pista i la geometria;
- `js/store.js`: estat central i transicions del cas;
- `js/corrections.js`: model i aplicació dels esdeveniments;
- `js/visual-grammar.js`: diccionari visual estructurat;
- `js/renderer.js`: SVG determinista i sense política semàntica;
- `js/editor.js`: selecció i arrossegament;
- `js/import-export.js`: paquet portable del cas;
- `js/persistence.js`: persistència local;
- `js/knowledge-library.js`: vistes de casos, candidats i diccionaris;
- `js/app.js`: coordinació de la interfície.

S'utilitzen scripts clàssics perquè l'aplicació també es pugui obrir amb
`file://`; no hi ha backend ni dependències frontend.

## Execució

```bash
make interface
```

Obre `http://localhost:8000` o `interface/index.html` directament. L'estat es
guarda al navegador amb la clau `traca.workspace.v0.2`.

Les correccions sempre afecten la versió de treball. «Reiniciar» reconstrueix
el cas des de la geometria generada; «validar» crea una instantània local i no
promou res al corpus.
