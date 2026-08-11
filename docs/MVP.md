# MVP de TRAÇA

## Resultat de producte

L’MVP és un workspace universal d’aprenentatge supervisat on l’entrenador pot
introduir qualsevol situació d’handbol i completar aquest cicle:

```text
DESCRIURE → INTERPRETAR FINS ON SABEM → REPRESENTAR SI ÉS POSSIBLE
          → CORREGIR → PREFLIGHT → VALIDAR → GUARDAR → PROMOCIONAR OPCIONALMENT
```

`TR-UVOF-015` continua sent el primer cas executable canònic i la regressió del
resolver. No és una plantilla que es substitueixi sota textos nous.

## Capacitat funcional

- crea casos locals amb text exacte, origen, etiquetes i notes;
- mostra coneixement validat, coincidències provisionals, conceptes desconeguts
  i punts no resolts;
- ofereix un constructor assistit per participants, materials, espais, accions,
  decisions i fases;
- admet casos sense resolutor, guardat en construcció i referència geomètrica
  manual amb autoritat de l’entrenador;
- separa vistes generada, corregida, comparada i de control;
- registra correccions amb diff, explicació de màquina i explicació humana;
- executa un preflight amb errors bloquejants, warnings i informació;
- valida casos sense promocionar coneixement;
- crea candidats només des del Promotion Builder i només amb les correccions
  escollides;
- persisteix localment i exporta/importa paquets `0.3.0`.

## Arquitectura honesta

L’MVP implementa providers locals i un matcher lèxic auditable. No inclou un
LLM, embeddings ni un resolutor general. Una coincidència coneguda és
provisional fins que l’entrenador la valida; un concepte desconegut es preserva.
Si no hi ha geometria resolta, la interfície ho declara i no n’inventa cap.

## Espai de treball

- esquerra: descripció, interpretació, representació, correcció, validació i
  aprenentatge;
- centre: pista IHF i les quatre vistes gràfiques;
- dreta: inspector i classificació de discrepàncies;
- franja inferior: historial, preflight, biblioteca, coneixement après i
  traçabilitat;
- mòbil: navegació entre els mateixos panells.

## Fora d’abast

- backend, comptes o base de dades remota;
- LLM API, embeddings o vector database;
- resolutor geomètric general o catorze resolutors hardcoded;
- modificació automàtica del corpus;
- promoció canònica automàtica;
- exportació PNG.

Els contractes detallats són
[`UNIVERSAL_CASE_WORKFLOW.md`](UNIVERSAL_CASE_WORKFLOW.md),
[`INTERPRETATION_PROVIDER.md`](INTERPRETATION_PROVIDER.md) i
[`KNOWLEDGE_PROMOTION.md`](KNOWLEDGE_PROMOTION.md).
