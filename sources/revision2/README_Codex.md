# Paquet de treball per a Codex — TRAÇA

Adjunta aquest ZIP complet a Codex i indica:

> Descomprimeix el paquet i implementa `TRACA_Prompt_Codex_implementacio_integral.md` sobre l’estat actual de `truenoxy7-hub/CODEX`. La prioritat és una pissarra fàcil d’usar, basada en l’editor original adjunt, amb desament fiable i un circuit real de correcció i reutilització. Llegeix les fonts incloses, reprodueix les incidències i completa les sessions d’acceptació. Fes la implementació i les comprovacions.

## Punt d’entrada

El prompt de l’arrel, revisió 2 del 04/10/2026, és l’única petició vigent del paquet. `history/` conserva el prompt anterior per entendre antecedents; no és una segona llista de prioritats.

L’editor original és a `editor_reference/HandballGenerator.original.jsx`. La base JSON, l’HTML i la llegenda són presents a l’arrel. No cal recuperar-les d’una altra conversa. No existeix un fitxer d’exercici guardat amb aquell prototip: l’usuari ha aportat el component font.

## Reproduccions de la revisió

Amb Node instal·lat:

```bash
node review/reproduce_findings.cjs /ruta/al/repositori/CODEX ./TRACA_Base_coneixement_grafics_v0_1.json
```

El script no modifica el repositori. Sobre 8074dc5 reprodueix la incompatibilitat del carregador, l’acceptació d’un atacant immòbil dins l’àrea i la finta que supera pel costat inicial a A2/A3. Un `defect_reproduced: true` indica un defecte observat en aquella versió; no és un test superat. Si el format de trajectòries canvia a corbes, el comprovador lineal demana una adaptació i no dona un fals resultat positiu.

`review/baseline-findings.json` són les sortides d’aquesta revisió. `review/acceptance.json` descriu proves que Codex ha d’implementar/executar. Les seves entrades es lliuren com a pendents, sense aprovar cap tàctica nova.

Les imatges de `review/` són evidència anterior a la implementació, generada a partir dels SVG del commit revisat amb Sharp/librsvg. No són captures del navegador ni resultats de la nova pissarra.

`manifest.json` identifica tots els fitxers i les empremtes, excepte el mateix manifest per evitar autoreferència. Conserva la procedència quan portis les fonts al repositori.
