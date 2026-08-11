# Estat actual

## IMPLEMENTAT

### Coneixement i geometria canònics

- Corpus semàntic `TR-UVOF-001`–`TR-UVOF-015` i contracte
  `spatial-relations` v0.3.
- Preflight qualitatiu pur amb estats `ready`, `partial` o `blocked`.
- Perfil IHF, contracte geomètric v0.2 i resolver determinista d’UVOF015.
- UVOF015 conserva tres zones, sis espais, setze entitats, tres branques i
  dotze alternatives.
- Els sis espais són relacions ocultes; només els límits físics de les tres
  zones poden aparèixer discretament a Control.
- Participants amb estats persistents, trajectòries segmentades i passades
  enllaçades a emissor/receptor; la finta conserva el trencament funcional.
- Les posicions futures connectades a l’acció visible reutilitzen el símbol del
  participant sense farciment i amb contorn discontinu; passades i moviments queden ancorats al
  perímetre dels símbols d’origen i destí.
- Cada recepció en carrera és un únic estat compartit: la cursa i la passada hi
  acaben, i la trajectòria posterior comença exactament des del mateix punt.

### MVP funcional v0.4

- La pantalla inicial és un cas en blanc amb el flux `ESCRIURE → GENERAR → CORREGIR → GUARDAR`.
- Cada cas té `case_uid` durable i un codi curt; esborranys i casos validats viuen en col·leccions diferents.
- L’origen es registra com a entrada de l’entrenador i les etiquetes es deriven
  automàticament dels conceptes explícits reconeguts; no són camps obligatoris.
- `KnowledgeResolver` ordena les fonts per autoritat. El coneixement local que
  l'entrenador valida explícitament en un cas validat pot ajudar casos futurs;
  candidats i inferències només suggereixen.
- La pantalla normal mostra «He entès» i «Em falta»; els quatre estats interns
  continuen disponibles al mode avançat.
- Constructor assistit de participants, materials, espais, accions, decisions
  i fases.
- Casos sense resolver poden continuar, guardar-se i tenir una
  `coach_reference_geometry` explícitament no generada.
- Correccions amb canvi principal, efectes derivats, diff, explicació
  automàtica i motiu de l’entrenador.
- Compositor genèric de primitives per a passada identificada i recepció en
  carrera; si falten emissor o receptor, pregunta i no inventa.
- Vistes neta, d'edició, comparada i original.
- Preflight amb errors bloquejants, warnings i informació accionable.
- Promotion Builder per tipus, abast i subconjunt seleccionat de correccions.
- Biblioteca inspectable i resum «Què ha après TRAÇA?».
- Diccionari visual-funcional estructurat i projectat a la gramàtica del renderer.
- Persistència local i paquet portable `0.4.0`, compatible amb importacions `0.2.0` i `0.3.0`.
- Fingerprint del text i estat `stale`: cap geometria anterior es pot guardar després de canviar la font.
- `validation` i `completeness` són independents: el snapshot pot estar validat i conservar semàntica o espai parcials.

### Matriu reproduïble del preflight espacial

| Estat | Exercicis |
|---|---|
| `ready` | 001, 002, 003, 004, 006, 008, 009, 010, 011, 012, 013, 015 |
| `partial` | 005, 007, 014 |

El preflight del workspace és un gate posterior i diferent: comprova el cas de
treball, la seva geometria disponible, identitats, fonts i correccions pendents.

## FUTUR / NO IMPLEMENTAT

- interpretació tàctica general, LLM o embeddings;
- resolutor tàctic o geomètric general per a text nou;
- backend, base de dades remota, comptes o col·laboració;
- promoció canònica i modificació del corpus des del navegador;
- exportació PNG.

## Invariants de risc

```text
coincidència lèxica ≠ coneixement validat
referència del tècnic ≠ geometria generada
correcció de cas ≠ criteri reutilitzable
candidat ≠ coneixement canònic
override visual del cas ≠ regla visual global
```

## Pròxima fita

Validar amb l’entrenador el compositor de passada simple sobre casos nous i
incorporar l'inventari de 103 evidències i la llegenda gràfica quan es rebin els
fitxers font. Després, ampliar primitives una a una amb evidència, sense
hardcodejar exercicis.
