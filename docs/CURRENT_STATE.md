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

### MVP funcional v0.5

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
- Pipeline general `TacticalIR → CompositionGraph → operator registry →
  CompositionPlan → constraints → preflight → geometry`.
- Operadors de moviment, bot, passada, recepció, llançament, finta/1x1,
  bloqueig, relació numèrica, permuta, encreuament i lliscament de pivot.
- Estat de recepció compartit, màquina d’estats de pilota, preguntes de slots,
  cobertura per acció i traçabilitat fins a la font.
- `composition_status` separat de `geometry_status`; el compositor pot quedar
  complet encara que la geometria necessiti dades.
- Els intervals canònics creen referències defensives estructurals estables
  per als delimitadors implícits. Aquestes identitats només delimiten l'espai,
  no actuen com a oponents, i una menció explícita posterior reutilitza la
  mateixa identitat.
- El preflight no bloqueja una composició per un delimitador derivable d'una
  relació validada, però continua bloquejant referències desconegudes. La
  composició pot quedar `ready` mentre la geometria resta `needs_input`.
- Vistes neta, d'edició, comparada i original.
- Preflight amb errors bloquejants, warnings i informació accionable.
- El diagnòstic avançat combina `TacticalIR` i `CompositionPlan` per mostrar
  l'espai funcional de cada acció i explica en llenguatge humà els bloquejos o
  les dades espacials que encara falten.
- Les clarificacions són progressives: la pantalla normal mostra una única
  pregunta activa, mentre el diagnòstic conserva totes les pendents, respostes,
  opcions i derivacions. Els catàlegs canònics ofereixen referències sense
  convertir-les en fets; una selecció materialitza la identitat estable.
- La finta pot derivar l'interval de sortida només quan oponent, espai inicial i
  contigüitat deixen una única opció validada. Aquesta derivació no determina
  el defensor d'una relació numèrica posterior.
- L’encreuament distingeix el primer jugador del jugador que encreua. Pot
  recuperar l’atac espacial previ del jugador referenciat, amb traçabilitat per
  slot i sense confondre’l amb l’últim atac global; context invalidat o
  contradictori queda pendent o bloquejat. El diagnòstic avançat mostra els
  dos rols, l’atac inicial i l’espai objectiu.
- Promotion Builder per tipus, abast i subconjunt seleccionat de correccions.
- Biblioteca inspectable i resum «Què ha après TRAÇA?».
- Diccionari visual-funcional amb les 103 evidències de l’inventari i 13
  evidències normatives de la llegenda, projectat a la gramàtica del renderer.
- Persistència local i paquet portable `0.5.0`, compatible amb importacions
  `0.2.0`, `0.3.0` i `0.4.0`.
- Fingerprint del text i estat `stale`: cap geometria anterior es pot guardar després de canviar la font.
- `validation` i `completeness` són independents: el snapshot pot estar validat i conservar semàntica o espai parcials.

### Matriu reproduïble del preflight espacial

| Estat | Exercicis |
|---|---|
| `ready` | 001, 002, 003, 004, 006, 008, 009, 010, 011, 012, 013, 015 |
| `partial` | 005, 007, 014 |

El preflight del workspace és un gate posterior i diferent: comprova el cas de
treball, la seva geometria disponible, identitats, fonts i correccions pendents.

## PARTIAL

- La cobertura estructural del corpus és 164/203 unitats (80,79%); el detall
  per exercici és a [`COMPOSER_COVERAGE.md`](COMPOSER_COVERAGE.md).
- Finta, bloqueig, permuta i lliscament poden obtenir geometria quan les
  posicions necessàries són explícites. No tenen encara resolució universal.
- L’encreuament es compon a nivell funcional però deixa la geometria sense
  resoldre.
- L’intèrpret local produeix TacticalIR per formulacions explícites comunes;
  no és un intèrpret lingüístic general.

## UNRESOLVED

- Tipar `resolucio` del corpus com a passada, llançament o moviment abans de
  compondre-la.
- Traduir totes les relacions qualitatives v0.3 a posicions sense defaults.
- Resoldre geometria general d’encreuament i coexistència de trajectòries en
  lliscaments de pivot.
- Decidir a la interpretació els actors/espais que falten en diversos casos;
  el compositor pregunta i s’atura.

## FUTURE

- interpretació tàctica general, LLM o embeddings;
- resolutor lingüístic general per a text nou;
- ampliar la geometria genèrica a més relacions validades;
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

Validar manualment el pipeline amb cinc casos nous: cadena
passada–recepció–finta–2x1, dades absents, conflicte de pilota, permuta i
encreuament sense geometria. Després, prioritzar els buits publicats a
`COMPOSER_COVERAGE.md` sense hardcodejar exercicis.
