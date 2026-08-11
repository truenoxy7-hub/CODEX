# Promoció de coneixement

## Regla principal

Validar un cas no generalitza res. La promoció és una acció posterior,
explícita i reversible que crea un element amb estat `candidate` i
`canonical_promotion: false`.

## Promotion Builder

L’entrenador selecciona:

- les correccions exactes que aporten evidència;
- el tipus de candidat;
- l’abast;
- títol, definició, motiu i exemples.

Tipus disponibles: regla semàntica, espacial, geomètrica o visual; patró tàctic;
i concepte de vocabulari. Abasts disponibles: aquest cas, família d’exercicis,
concepte, context tàctic o gramàtica visual global.

Només les correccions seleccionades s’inclouen a `source_corrections`. Una
referència de correcció inexistent rebutja el candidat. El candidat conserva
`source_case_id`, `correction_refs`, tipus i abast.

## Biblioteca

La biblioteca separa casos, candidats tàctics, candidats per capa, vocabulari,
diccionari visual validat i coneixement no resolt. Els ajustos visuals del cas
viuen a `caseVisualOverrides`; no modifiquen `baseVisualGrammar` ni el diccionari
visual validat.

La incorporació al corpus, a una regla canònica o a la gramàtica global queda
fora d’aquest MVP i requereix revisió humana posterior.
