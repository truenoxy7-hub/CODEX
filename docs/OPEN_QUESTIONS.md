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

## Bloquejos i parcials exposats pel preflight v0.3

1. **UVOF001 — autoritat de font:** decidir si el model detallat, el corpus o
   un mapping explícit entre tots dos és la font canònica. Fins aleshores cap
   candidat es marca canònic i el resultat és `blocked`.
2. **UVOF005/007/008 — pilota:** validar, si escau, pilota, posseïdor inicial i
   passades que avui no estan especificats. No s'afegirà cap flux per
   inferència.
3. **UVOF008 — ancoratge:** validar una referència independent per a
   `ZONA_CONCENTRACIO` o reformular la relació amb `PV`. La dependència actual
   és circular.
4. **UVOF010 — ancoratge:** validar una definició no circular entre `ESPAI_PV`
   i `D3`.
5. **UVOF011 — cardinalitat:** identificar quatre defensors concrets o validar
   una plantilla i el seu mecanisme d'instanciació. `DEF_4` no equival per si
   sol a quatre persones.
6. **UVOF014 — mapping:** validar l'alternativa espacial específica
   d'`encreuament` i qualsevol separació addicional entre les sis opcions que
   avui només es preserven simbòlicament.
7. **UVOF015 — finta:** definir per a cada duel l'espai inicial, l'espai
   contigu i el criteri de superació. No es deduiran dels límits de zona.
8. **Simetria:** aprovar mappings d'identitat només als exercicis que realment
   els necessitin. `reflectible` o `dues_bandes_paraleles` no autoritzen a
   duplicar participants o pilotes.

Els diagnòstics anteriors descriuen informació absent o conflictiva; no són
noves conclusions tàctiques.

## Regla de treball

Fins que una pregunta no estigui resolta:

- no marcar la dada com a validada;
- no introduir coordenades per ocultar l'ambigüitat;
- no alterar el contingut per satisfer el renderer;
- registrar qualsevol proposta com a `provisional`.
