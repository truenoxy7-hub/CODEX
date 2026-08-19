# MVP de TRAÇA

## Resultat de producte

L’MVP comença en blanc i prioritza el camí que fa l’entrenador:

```text
ESCRIURE → GENERAR → RESPONDRE SI FALTA UNA DADA → CORREGIR → GUARDAR
```

La pantalla normal no demana origen, etiquetes, coordenades, capes ni tipus d'autoritat. Mostra «He entès», «Em falta», la pista, desfer/refer i «Guardar exercici». L'usuari pot obrir «Més opcions» per al nom i les notes.

## Capacitat funcional

- conserva qualsevol text i crea `case_uid` durable;
- calcula origen i etiquetes sense demanar-los a l'entrenador;
- resol conceptes per ordre d'autoritat i conserva evidència;
- transforma una interpretació estructurada en un graf i un pla de composició;
- compon moviment, bot, passada, recepció, llançament, finta/1x1, bloqueig,
  relacions numèriques, permuta, encreuament i lliscament de pivot;
- pregunta els actors, oponents o espais obligatoris quan no estan determinats;
- mostra una sola clarificació cada vegada, recalcula opcions després de cada
  resposta i deriva automàticament només conseqüències canòniques úniques;
- representa posicions futures vinculades i manté un únic destí per a moviment i passada;
- permet corregir directament arrossegant;
- demana si la correcció és només del cas o criteri reutilitzable;
- executa preflight, validació i guardat amb una sola acció;
- separa `drafts` de `validated_cases`;
- reutilitza coneixement local només després de validació explícita;
- persisteix i exporta/importa paquets `0.5.0`, acceptant `0.2.0`, `0.3.0` i `0.4.0`;
- conserva UVOF015 com a exemple explícit i prova de regressió.

## Mode avançat

Inspector, coordenades, canvi manual de rol o tipus d’acció, eliminació de primitives manuals, constructor assistit, preflight detallat, historial, biblioteca, traçabilitat, import/export i Promotion Builder queden ocults fins que s'activa «Mode avançat».

Una referència manual és `coach_reference_geometry`, mai `generatedGeometry`. Els candidats creats amb Promotion Builder poden suggerir, però no decideixen.

## Arquitectura honesta

El `KnowledgeResolver` no és un LLM i el `RepresentationComposer` no és un
intèrpret de text. El primer aplica fonts locals auditables i la interpretació
produeix `TacticalIR`; el segon combina operadors i constraints. Pot completar
la composició sense completar la geometria. Qualsevol acció no suportada es
conserva com a parcial o es completa manualment.

Canviar la descripció invalida interpretació, models i geometria que derivaven de la revisió anterior. La interfície oculta el gràfic obsolet i el preflight bloqueja el guardat fins a regenerar.

En clarificacions, `OPCIÓ ≠ FET`: mostrar D1, D2 o D3 no els activa. Una
resposta és un fet explícit de l'entrenador; una conseqüència única d'una regla
validada és un fet derivat i conserva fonts i autoritat pròpies.

## Fora d’abast

- backend, comptes o base de dades remota;
- LLM API, embeddings o cerca vectorial;
- resolutor universal de qualsevol situació d'handbol;
- inferir actors, encreuaments, bloqueigs, duels o sistemes complets sense relacions explícites;
- modificar automàticament el corpus canònic;
- activar candidats sense validació;
- exportació PNG.

Els contractes detallats són [`KNOWLEDGE_RESOLVER.md`](KNOWLEDGE_RESOLVER.md), [`REPRESENTATION_COMPOSER.md`](REPRESENTATION_COMPOSER.md), [`LEARNING_WORKFLOW.md`](LEARNING_WORKFLOW.md) i [`VISUAL_GRAMMAR.md`](VISUAL_GRAMMAR.md).
