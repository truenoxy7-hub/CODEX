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
- Suite verda amb 111 proves: les 88 del baseline auditat i 23 proves noves de
  contracte, preservació, integritat i mutacions destructives.

## Matriu reproduïble del preflight

| Estat | Exercicis | Motiu principal |
|---|---|---|
| `ready` | 001, 002, 003, 004, 006, 008, 009, 012, 013 | Contracte i entrades suficients per al gate qualitatiu actual |
| `partial` | 005, 007, 014 | Flux/informació de pilota no especificat o opcions encara simbòliques |
| `blocked` | 010, 011, 015 | Cicle no ancorat, cardinalitat o espai contigu absent |

`valid: true` al validador significa que l'artefacte compleix el contracte. No
converteix un resultat `partial` o `blocked` en resoluble.

## Estats conservats deliberadament

- UVOF001 declara el model detallat com a font canònica i conserva el corpus
  com a projecció resumida amb mappings explícits. B1, B2 i els seus dos
  fluxos no es perden.
- UVOF005 i UVOF007 no reben pilotes, posseïdors ni passades inventades.
- UVOF010 conserva i diagnostica el cicle no ancorat.
- UVOF011 conserva `DEF_4` com un grup esperat de quatre amb una sola instància
  actual; no es presenta com quatre defensors.
- UVOF014 conserva les sis opcions individualment; `encreuament` continua
  identificable encara que resti simbòlic.
- UVOF015 no inventa l'espai inicial, l'espai contigu ni el criteri de
  superació dels tres duels.

## No completat

- Dades tàctiques pendents enumerades a `docs/OPEN_QUESTIONS.md`.
- Perfil reglamentari de pista versionat.
- Resolutor espacial o geomètric.
- `geometry.json`, coordenades, punts, vectors o regions calculades.
- Renderer, SVG i polítiques visuals.

## Risc principal

Confondre un JSON estructuralment vàlid amb una entrada `ready`, o introduir
geometria per ocultar un diagnòstic `partial`/`blocked`.

## Pròxima fita recomanada

Resoldre amb l'entrenador els bloquejos que requereixen autoritat tàctica i,
només després, especificar el perfil de pista i l'API del futur resolutor. El
preflight v0.3 és el gate d'entrada; encara no resol ni dibuixa cap exercici.
