# MVP de TRAÇA

## Resultat de producte

L'MVP és el primer espai de treball supervisat on l'entrenador pot seguir el
cicle complet d'un cas sense confondre una correcció local amb coneixement
canònic:

```text
DESCRIURE → INTERPRETAR → GENERAR → REVISAR → CORREGIR
          → VALIDAR → GUARDAR → REUTILITZAR
```

La primera vertical real és `TR-UVOF-015`. El text, el contracte espacial i la
geometria provenen dels artefactes validats del repositori. La interfície no
simula encara una interpretació de text arbitrari: si el text canvia, el motor
n'informa honestament i no inventa cap gràfic.

## Espai de treball

- columna esquerra: cas, descripció, interpretació, branques, correcció,
  validació i promoció;
- centre: pista reglamentària IHF, vista neta o de control i editor SVG;
- columna dreta: inspector de propietats, fonts i anotacions conceptuals;
- franja inferior: historial, validació, biblioteca i traçabilitat;
- mòbil: els mateixos quatre espais com a panells navegables.

## Capacitat funcional assolida

- UVOF015 conserva tres zones, sis espais, setze entitats, tres branques i
  dotze alternatives;
- la selecció d'una alternativa és només estat de visualització;
- participants, pilotes i cons es poden reposicionar;
- els vèrtexs d'una trajectòria es poden arrossegar en vista de control;
- el tipus de trajectòria i la seva convenció visual es poden corregir
  explícitament;
- desfer, refer i reiniciar reconstrueixen el treball des de la geometria
  generada, que mai se sobreescriu;
- cada canvi crea un esdeveniment amb capa, referència, propietat, abans,
  després, autor, abast, estat, motiu i fonts;
- les anotacions semàntiques i espacials no muten els artefactes canònics;
- la validació congela una versió del cas, no una regla general;
- després de validar hi ha tres decisions separades: guardar el cas, crear un
  candidat de patró o proposar una regla general candidata;
- l'estat es conserva a `localStorage` i es pot exportar/importar com a paquet
  JSON estructurat.

## Gramàtica visual mínima

La gramàtica visual és dades versionades, no condicionals escampats pel
renderer. Distingeix atacant, defensor, passador, pivot, pilota, con, banc i
cilindre; moviment, cursa sense pilota, passada, llançament, finta i posició
futura; zona espacial, zona de finalització i referència defensiva.

La passada és discontínua. El moviment del jugador, inclosa la cursa sense
pilota, és continu. La finta és una polilínia que preserva el canvi funcional
de direcció. El renderer no suavitza ni inventa punts.

## Límits actuals

- no hi ha interpretació general de text nou en producció;
- no hi ha resolutor geomètric general per als altres catorze exercicis;
- UVOF001 informa l'arquitectura futura, però encara no té editor executable;
- no hi ha backend, comptes, col·laboració remota ni publicació de casos;
- la biblioteca i les promocions són locals i candidates;
- no hi ha exportació PNG ni selecció tàctica automàtica.

## Criteri de validació

L'entrenador ha de poder identificar sense ajuda:

1. quina informació és font i quina és derivada;
2. quina geometria és generada i quina és la versió de treball;
3. què ha canviat, on, per què i qui ho ha canviat;
4. com desfer o reiniciar sense perdre l'original;
5. què valida només el cas i què requereix una promoció posterior;
6. que una proposta general continua sent candidata.
