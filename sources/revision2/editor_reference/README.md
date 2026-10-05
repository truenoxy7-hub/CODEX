# Editor original aportat per l’entrenador

`HandballGenerator.original.jsx` conserva el component React enganxat al xat el 4 d’octubre de 2026. És una referència de codi i d’interacció. No inclou package.json, muntatge de React ni la configuració de Tailwind. No és la implementació nova de TRAÇA.

## Funcions observables al codi

- Mitja pista orientada a dalt/baix i pista completa de 20 × 40 m.
- Atacants, defensors, cons, pilotes, bancs i xirimbolos arrossegables.
- Corbes quadràtiques de trajectòria i passada, amb tres controls quan estan seleccionades.
- Banc orientable amb nansa, passos de 10° i teclat de 5°.
- Ajust a 6/9 m i col·locació de cons als postes.
- Simetria de la meitat dreta a l’esquerra; eliminació amb botó i teclat.
- Exportació PNG i alternatives de còpia al porta-retalls.

La funció «trajectòria» és una corba lliure. La semàntica de finta, recepció o possessió no es deriva automàticament d’aquesta figura. La corba es modifica amb els controls; el codi no implementa l’arrossegament de tota la línia com una sola selecció.

## Què conservar

La manipulació directa, els controls contextuals, les eines bàsiques accessibles i la pista com a superfície principal. La llegenda de l’entrenador és l’autoritat visual; el tema blau/verd es pot conservar com a preferència d’aspecte.

## Què optimitzar i provar

1. Historial transaccional i desament editable durable: actualment `shapes` viu en `useState` i no hi ha desfer/refer.
2. Drag: callbacks estables, sessions de punter, offset de captura, cancel·lació i última posició. El hook reinstal·la listeners amb `onDrag` nou; és un risc a provar en runtime, no una prova que tots els gestos fallin.
3. Exportació: `cloneNode(true)` arrossega controls de selecció/rotació i debug. Render net compartit, errors visibles i recursos temporals alliberats.
4. Còpia: distingir imatge real de DataURL/SVG com a text.
5. Orientació: el prototip canvia pista però conserva les coordenades de `shapes`. Definir transformacions de vista coherents, sense perdre dades en passar de pista completa a mitja.
6. Snap: restringir projecció als arcs vàlids de la pista i respectar geometria compartida. El clamp final del prototip no és una validació física general.
7. Relacions: participants, estats i accions amb identitats persistents; la pilota i les trajectòries actuals són objectes independents.
8. UX: proves i guies tècniques en mode de desenvolupament; controls prou grans per tacte i hitboxes de línia; atalls delimitats al focus de pissarra.

## Verificació d’aquest adjunt

El JSX s’ha transformat amb Babel per comprovar-ne la sintaxi. No s’ha executat aquí una sessió interactiva del prototip. La revisió estàtica i aquesta comprovació no certifiquen el comportament del drag o del porta-retalls; Codex ha de reproduir-los al navegador i verificar la versió integrada.
