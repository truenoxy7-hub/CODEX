# Preguntes obertes que requereixen l'entrenador

Aquest document evita que Codex resolgui per inferència decisions tàctiques encara no aprovades.

## Qüestions resoltes de TR-UVOF-001

- `SA1` rep a `1–2`, supera el segon defensor simulat pel banc mitjançant una
  finta cap a `2–3` i genera el 2x1 amb el pivot contra el tercer.
- `SA2` no conté una finta. Entrena recuperació, recepció orientada sense bot,
  atac directe del carril `1–2` i explotació d'un 2x1 preparat amb l'extrem.
- El con de `SA2` representa passivament el segon defensor absent.
- El defensor actiu de `SA2` és el primer defensor.
- `C1` i `C2` només delimiten l'espai de resolució de `SA1`.
- El pivot ocupa l'interval complementari al que ataca el lateral.
- L'extrem manté l'amplitud i anticipa la possible passada amb criteri tàctic.

## Coneixement encara obert

1. Completar amb exemples les defenses `4:2`, `3:3`, mixtes i les seves
   transformacions.
2. Definir altres continguts tàctics encara absents, especialment passada i va
   i canvis de posició que no siguin permutes.
3. Precisar el model temporal general de passos i bot sense convertir
   preferències tècniques en invariants.
4. Precisar els posseïdors inicials i passadors dels fluxos que el corpus UVOF
   conserva explícitament com a no especificats.
5. Validar el vocabulari contra altres famílies abans de congelar una nova
   versió del llenguatge.

## Regla de treball

Fins que una pregunta no estigui resolta:

- no marcar la dada com a validada;
- no introduir coordenades per ocultar l'ambigüitat;
- no alterar el contingut per satisfer el renderer;
- registrar qualsevol proposta com a `provisional`.
