# Estat actual

## Completat

- Corpus semàntic `TR-UVOF-001`–`TR-UVOF-015` i coneixement tàctic viu.
- Esquemes semàntics, corpus v1.1 i validació local amb proves positives i
  negatives.
- Contracte qualitatiu `spatial-relations` v0.3 per als quinze UVOF.
- Esquema v0.2 conservat exclusivament com a versió històrica read-only; no hi
  ha downgrade implícit de v0.3.
- Fonts semàntiques versionades amb fingerprint SHA-256 determinista i
  referències estables `artefacte#/json/pointer`.
- Namespace global tipat, bindings d'actors genèrics, cardinalitats de grups,
  semàntica per instància dels materials i capabilities explícites.
- Separació explícita d'equip, rol canònic, costat, rol temporal i funció dels
  participants. Els camps absents queden `unknown`; no es dedueixen de l'ID.
- Papers tipats dels 2x1, condicions tipades, marcs d'operador, graf de
  dependències i mapping individual de decisions i opcions.
- Cobertura rastrejable de participants, materials, pilotes, accions, fluxos,
  decisions i opcions de totes les fonts declarades.
- Preflight pur i read-only que només retorna `ready`, `partial` o `blocked`,
  amb diagnòstics estructurats i sense geometria.
- Integració del preflight al validador sense seleccionar silenciosament el
  `semantic.json` germà d'UVOF001.
- Suite verda amb 127 proves: les 88 del baseline auditat i 39 proves noves de
  contracte, preservació, integritat i mutacions destructives.
- Perfil reglamentari de pista IHF versionat i contracte de geometria derivada
  v0.1, aplicat a la primera vertical executable d'UVOF015.
- Resolutor determinista d'UVOF015 amb tres zones, sis espais i les dotze
  alternatives, més renderer SVG interactiu i exportació.

## Matriu reproduïble del preflight

| Estat | Exercicis | Motiu principal |
|---|---|---|
| `ready` | 001, 002, 003, 004, 006, 008, 009, 010, 011, 012, 013, 015 | Contracte i entrades suficients per al gate qualitatiu actual |
| `partial` | 005, 007, 014 | Flux/informació de pilota no especificat o opcions encara simbòliques |

`valid: true` al validador significa que l'artefacte compleix el contracte. No
converteix un resultat `partial` o `blocked` en resoluble.

## Estats conservats deliberadament

- UVOF001 declara el model detallat com a font canònica i conserva el corpus
  com a projecció resumida amb mappings explícits. B1, B2 i els seus dos
  fluxos no es perden.
- UVOF005 i UVOF007 no reben pilotes, posseïdors ni passades inventades.
- UVOF011 identifica quatre defensors reals i actius: `D1_LOCAL`, `D2_LOCAL`,
  `D3_LOCAL` i `D3_OPOSAT`; ja no existeix el participant abstracte `DEF_4`.
- UVOF014 conserva les sis opcions individualment; `encreuament` continua
  identificable encara que resti simbòlic.
- UVOF015 conserva dos espais contigus per defensor, la llibertat d'elecció
  inicial, la continuïtat si hi ha avantatge, la finta si el defensor tanca i
  la superació en travessar la línia defensiva.

## No completat

- Dades tàctiques pendents enumerades a `docs/OPEN_QUESTIONS.md`.
- Resolutor geomètric general per als altres catorze exercicis.
- Interpretació automàtica de descripcions noves.
- Renderer PNG i polítiques visuals generals més enllà d'UVOF015.

## Risc principal

Confondre un JSON estructuralment vàlid amb una entrada `ready`, o introduir
geometria per ocultar un diagnòstic `partial`/`blocked`. La geometria derivada
de l'MVP no pot convertir-se en font de veritat tàctica.

## En curs

- Primera versió viva del coneixement canònic d'handbol.
- Consolidació del corpus UVOF com a font de proves per al futur motor espacial.
- Primera interfície navegable del MVP amb el flux descripció → interpretació →
  confirmació → geometria → SVG per a UVOF015.

## Pròxima fita recomanada

Validar visualment amb l'entrenador la política de disposició d'UVOF015 i,
després, generalitzar el contracte geomètric a UVOF001, UVOF003 i UVOF010. Els
tres parcials tàctics poden continuar oberts sense bloquejar aquesta vertical.
