# Estat actual

## Coneixement i geometria canònics

- Corpus semàntic `TR-UVOF-001`–`TR-UVOF-015` i contracte
  `spatial-relations` v0.3.
- Preflight qualitatiu pur amb estats `ready`, `partial` o `blocked`.
- Perfil IHF, contracte geomètric v0.1 i resolver determinista d’UVOF015.
- UVOF015 conserva tres zones, sis espais, setze entitats, tres branques i
  dotze alternatives.

## Workspace universal MVP

- `Nou cas` preserva qualsevol text i crea una identitat local.
- Arquitectura d’`InterpretationProvider` amb provider canònic, matcher local i
  constructor manual; cap coincidència local es marca com a validada.
- Interpretació visible en quatre grups: conegut, provisional, desconegut i no
  resolt.
- Constructor assistit de participants, materials, espais, accions, decisions
  i fases.
- Casos sense resolver poden continuar, guardar-se i tenir una
  `coach_reference_geometry` explícitament no generada.
- Correccions amb diff, explicació automàtica, motiu de l’entrenador i metadades
  preparades per comparar casos.
- Vistes generada, corregida, comparada i de control.
- Preflight amb errors bloquejants, warnings i informació accionable.
- Promotion Builder per tipus, abast i subconjunt seleccionat de correccions.
- Biblioteca inspectable i resum «Què ha après TRAÇA?».
- Persistència local i paquet portable `0.3.0`.

## Matriu reproduïble del preflight espacial

| Estat | Exercicis |
|---|---|
| `ready` | 001, 002, 003, 004, 006, 008, 009, 010, 011, 012, 013, 015 |
| `partial` | 005, 007, 014 |

El preflight del workspace és un gate posterior i diferent: comprova el cas de
treball, la seva geometria disponible, identitats, fonts i correccions pendents.

## No completat

- interpretació tàctica general, LLM o embeddings;
- resolver geomètric general per a text nou;
- backend, base de dades remota, comptes o col·laboració;
- promoció canònica i modificació del corpus des del navegador;
- exportació PNG.

## Invariants de risc

```text
coincidència lèxica ≠ coneixement validat
referència del tècnic ≠ geometria generada
cas validat ≠ patró reutilitzable
candidat ≠ coneixement canònic
override visual del cas ≠ regla visual global
```

## Pròxima fita

Validar amb l’entrenador el flux universal complet sobre dos casos: un text nou
sense resolver i UVOF015 com a regressió. Després, escollir un segon resolver
real a partir d’un contracte espacial `ready`, no hardcodejar catorze casos.
