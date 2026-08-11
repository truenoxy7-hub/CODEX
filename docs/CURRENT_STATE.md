# Estat actual

## Capa de coneixement

- Corpus semàntic `TR-UVOF-001`–`TR-UVOF-015` i coneixement tàctic viu.
- Esquemes semàntics, corpus v1.1 i contracte qualitatiu
  `spatial-relations` v0.3 per als quinze UVOF.
- Fonts versionades amb fingerprint SHA-256, referències estables i cobertura
  rastrejable de participants, materials, pilotes, accions, fluxos, decisions
  i opcions.
- Preflight pur i read-only amb estats `ready`, `partial` o `blocked`.
- UVOF015 conserva dos espais contigus per defensor, llibertat inicial,
  continuïtat si hi ha avantatge, finta al contigu si el defensor tanca i
  superació en travessar la línia defensiva.

## Capa geomètrica

- Perfil reglamentari de pista IHF versionat.
- Contracte de geometria derivada v0.1 i resolutor determinista d'UVOF015.
- Tres zones, sis espais, setze entitats, tres branques i dotze alternatives
  reproduïbles des de l'entrada `ready`.
- Les coordenades són una política visual revisable i no tornen cap a la
  semàntica ni al contracte espacial.

## Espai de treball MVP

- Interfície professional en tres panells més franja inferior, amb navegació
  específica per a mòbil.
- UVOF015 és l'espècimen executable real; l'aplicació declara explícitament que
  encara no interpreta text nou arbitrari.
- Estat central separat en `generatedGeometry`, `workingGeometry`, gramàtica
  visual generada/de treball, selecció, historial, validació i biblioteca.
- Editor SVG de participants, materials i vèrtexs de trajectòria.
- Renderer determinista basat en segments explícits, sense suavitzat automàtic.
- Historial d'esdeveniments de correcció amb desfer, refer i reiniciar.
- Validació de cas i promoció explícita a candidat de patró o de regla general;
  cap correcció local esdevé coneixement canònic automàticament.
- Persistència local i exportació/importació d'un paquet de cas estructurat.
- Esquemes nous per a esdeveniments de correcció i paquets de cas.

## Matriu reproduïble del preflight

| Estat | Exercicis | Motiu principal |
|---|---|---|
| `ready` | 001, 002, 003, 004, 006, 008, 009, 010, 011, 012, 013, 015 | Contracte i entrades suficients per al gate qualitatiu actual |
| `partial` | 005, 007, 014 | Flux/informació de pilota no especificat o opcions encara simbòliques |

`valid: true` només confirma el contracte. No converteix un resultat
`partial` o `blocked` en resoluble.

## No completat

- Dades tàctiques enumerades a `docs/OPEN_QUESTIONS.md`.
- Interpretació general de descripcions noves.
- Resolutor geomètric dels altres catorze UVOF.
- Backend, identitat d'usuari, sincronització, publicació i PNG.
- Revisió humana de candidats abans d'incorporar-los al corpus o a les regles.

## Risc principal

Confondre una de les transicions següents:

```text
vàlid estructuralment ≠ ready
geometria de treball ≠ geometria generada
cas validat ≠ patró reutilitzable
regla candidata ≠ coneixement canònic
```

## Pròxima fita recomanada

Validar amb l'entrenador el flux complet d'edició d'UVOF015 i els camps de
l'esdeveniment de correcció. Després, utilitzar UVOF001 per provar múltiples
estats, posicions futures, banc, pivot, extrem, 2x1, recuperació, simetria i
dues subaccions abans d'implementar un resolutor general.
