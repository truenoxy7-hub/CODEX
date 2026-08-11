# Flux d’aprenentatge supervisat

## Camí normal de producte

1. **Escriure.** Es conserva el text exacte. Origen i etiquetes es calculen internament.
2. **Generar.** `KnowledgeResolver` separa coneixement validat, coincidències provisionals, candidats i buits. `RepresentationComposer` només combina primitives que pot justificar.
3. **Respondre.** Si falta emissor, receptor o una altra identitat necessària, TRAÇA fa una pregunta directa. No completa relacions per intuïció.
4. **Corregir.** Arrossegar, canviar un rol o modificar una acció crea un esdeveniment reversible. Les dependències actualitzen posició futura, moviment i passada vinculats.
5. **Decidir l’abast.** L’entrenador indica si el canvi és només del cas o si expressa un criteri reutilitzable.
6. **Guardar.** Una única acció executa preflight, valida la versió i la desa. Els errors estructurals bloquegen; els warnings continuen visibles.

Les eines de coordenades, constructor assistit, referència manual, Promotion Builder, importació i traçabilitat són al mode avançat.

## Tancament real del bucle

Una correcció directa continua sent `case_only` fins que l’entrenador demana explícitament reutilitzar-la. Un criteri reutilitzable exigeix:

- cas font validat;
- nom, definició i almenys una expressió activadora;
- evidència que referencia el cas i les correccions;
- autoritat `coach_validated`;
- estat `validated` dins `coach_validated_local_knowledge`.

Només després entra a la resolució de casos futurs. No modifica el corpus canònic. Els candidats del Promotion Builder són diferents: poden aparèixer com a suggeriment, però no decideixen cap interpretació.

```text
correcció
├─ només aquest cas → observació local
└─ criteri reutilitzable
   └─ guardar + validar cas
      └─ evidència local validada
         └─ KnowledgeResolver la pot consumir en un cas futur
```

## Inval·lidació per canvi de font

La descripció té un fingerprint. Interpretació, model semàntic, model espacial i geometria declaren de quina revisió deriven. Quan canvia el text:

- les derivacions `current` passen a `stale`;
- la geometria anterior desapareix de la vista normal;
- el preflight emet `SOURCE_DERIVATION_STALE`;
- guardar queda bloquejat fins a tornar a generar.

## Garanties

- un cas nou no hereta UVOF015;
- `generatedGeometry` no es muta;
- `coach_reference_geometry` mai no es presenta com a generada;
- una passada identifica emissor, receptor i estats;
- una recepció en carrera comparteix un sol estat final per a moviment i passada;
- un candidat no s'activa com a regla;
- validar un cas no modifica coneixement canònic;
- el coneixement local reutilitzable sempre conserva evidència.

## Paquet portable 0.4

L’exportació conserva cas i identitat durable, text, interpretació, models, estat del resolutor, derivacions i fingerprints, preguntes i respostes, resultat del compositor, geometries, gramàtica, correccions, observacions, validació, alternatives i biblioteca.

Les versions `0.2.0` i `0.3.0` s’importen i migren. Els registres antics no validats que vivien a `validated_cases` passen a `drafts`; s’afegeixen identitat durable i estat de derivació. L’exportació següent sempre és `0.4.0`.

## UVOF015

UVOF015 continua preservant tres zones, sis espais, tres branques i dotze alternatives. Només es carrega mitjançant l’acció explícita d’exemple i continua sent una regressió del resolver canònic.
