# TRAÇA — Implementar una pissarra útil, fiable i capaç de reutilitzar correccions

Petició vigent · revisió 2 · 4 d’octubre de 2026
Repositori: https://github.com/truenoxy7-hub/CODEX
Referència revisada: `codex/traca-geometry-a1-a3-refinement` a `8074dc56efd73e62f8764bc14a6264215daad005`.

## 1. Resultat que has de lliurar

Implementa aquesta petició al TRAÇA existent. L’entrenador ha de poder preparar un exercici amb la mateixa facilitat que tenia al seu editor inicial, corregir una proposta automàtica, guardar-la i reutilitzar un criteri validat en un exercici diferent. Lliura codi funcional, integració, migracions, comprovacions i una manera concreta d’obrir l’aplicació. Un document, una galeria estàtica o mòduls desconnectats de la interfície no completen la tasca.

La referència d’interacció és `editor_reference/HandballGenerator.original.jsx`, codi aportat per l’usuari el 04/10/2026. Conserva els seus gestos útils: afegir, seleccionar, arrossegar, ajustar una corba amb tres controls, girar bancs, fer simetries i exportar. Optimitza’n la fiabilitat i integra aquests gestos amb els contractes actuals de TRAÇA.

**Prova principal d’acceptació:** obrir un cas en blanc; dibuixar i corregir un exercici; desfer/refer; guardar; tancar i reobrir; recuperar-ne exactament el contingut editable; exportar-lo net; regenerar una part sense perdre correccions compatibles; aprovar un criteri reutilitzable i observar-ne l’efecte en un cas nou compatible.

L’ordre és: (1) pissarra usable i desament segur, (2) teoria i gràfic connectats, (3) correcció i reutilització comprovable. Completa aquest circuit en aquesta entrega. La generació automàtica inicial es concentra en passada, recepció en carrera, finta i continuació 2x1. Les altres famílies continuen representables manualment i conserven la seva semàntica; informa de la cobertura real de cadascuna. No esperis a disposar d’un generador universal per lliurar l’eina quotidiana.

Aquesta revisió substitueix l’ordre de prioritats del prompt del 03/10, conservat a `history/` com a antecedent. Manté les aprovacions tàctiques prèvies, la llegenda i les restriccions del model. La gestió de calendaris, assistència i seguiment de l’equip continua fora d’aquesta entrega.

## 2. Comença pel codi vigent i les fonts incloses

Comprova HEAD, branca, canvis locals i commits posteriors; integra sobre el treball actual sense restaurar snapshots antics ni sobreescriure canvis aliens. La referència 8074dc5 és el punt revisat, no un mandat de retrocedir. Llegeix `AGENTS.md` i els contractes vigents de domini, composició, geometria, correccions, coneixement i importació/exportació.

El paquet és autocontingut:

| Fitxer | Funció |
| --- | --- |
| `editor_reference/HandballGenerator.original.jsx` | Referència original de la pissarra. Conserva-la intacta com a antecedent. És un component, no un projecte React instal·lable complet. |
| `editor_reference/README.md` | Funcions observades i punts de fiabilitat que cal comprovar. |
| `TRACA_Base_coneixement_grafics_v0_1.json` | Font de coneixement real; `meta.version` és 0.2.0 malgrat el nom històric. |
| `TRACA_Base_coneixement_grafics_v0_1.html` | Vista derivada del mateix JSON amb referències visuals. |
| `AEB796E5-F49A-4466-A62E-79AA36F44AD4.png` | Llegenda original de l’entrenador, `LEG-COACH-001`. |
| `review/reproduce_findings.cjs` | Reproduccions de tres defectes de 8074dc5 amb el repositori i el JSON reals. |
| `review/baseline-findings.json` | Resultats observats de les reproduccions; no són resultats de la implementació nova. |
| `review/acceptance.json` | Criteris d’acceptació d’aquesta iteració i estat preimplementació. |
| `review/` | SVG i imatges de la revisió per comparar, amb procedència al manifest. |
| `history/TRACA_Prompt_Codex_2026-10-03.md` | Antecedent de l’ampliació global; aquesta revisió preval en prioritats i UX. |
| `manifest.json` | Inventari, versions i SHA-256 dels materials inclosos. |

Importa les fonts necessàries al repositori amb rutes estables i traçables. Inspecciona la llegenda abans de modificar símbols. No declaris absent un fitxer que el paquet conté. Si un adjunt és realment inaccessible, indica’n el nom i avança amb les parts independents; no inventis aprovacions.

La petició autoritza generar geometria, SVG, PNG, captures, fixtures i demostracions necessàries. Els ajustos de mida, espaiat i color es poden resoldre com a política visual provisional. No cal tornar a demanar aprovació de les definicions ja validades.

## 3. Una sola pissarra i una interfície senzilla

Aprofita `interface/index.html`, `app.js`, `editor.js`, `store.js`, el renderer i les dependències existents. El component aportat és React; el TRAÇA revisat és JavaScript modular amb SVG. Porta els seus patrons d’interacció a l’arquitectura vigent, amb una única font d’estat i un renderer compartit. No introdueixis una segona aplicació, un canvas desconnectat o una reescriptura completa de framework com a prerequisit. Si utilitzes React, justifica una integració acotada que mantingui els mateixos contractes i proves.

L’espai principal és la pista. La teoria ha de poder consultar-se i editar-se en un panell plegable, amb les accions seleccionables; els detalls tècnics queden en inspecció avançada. En mòbil, alterna «Pissarra» i «Text» conservant selecció, treball i desament. En escriptori poden conviure.

Accions quotidianes visibles: nou/obrir, eines de dibuix, generar o actualitzar proposta, desfer/refer, guardar i exportar. Les eines bàsiques de dibuix no s’amaguen darrere del mode avançat. Els controls específics apareixen quan se selecciona l’element corresponent. Organitza materials i accions menys freqüents en grups compactes. Usa català i noms d’handbol comprensibles. No mostris camps com `TacticalIR`, `scope_ref`, JSON, coordenades o IDs interns durant el flux habitual.

Retira del producte els botons de test, la llista de checks verds del prototip, els logs i els resums tècnics permanents. Les incidències que afecten la tasca apareixen de forma localitzada amb una acció útil. No obris preguntes o formularis després de cada arrossegament. Una etiqueta curta ha de distingir «Guardant», «Guardat» i «Canvis pendents / error de desament».

## 4. Contracte d’interacció de l’editor

### 4.1 Funcions a conservar i completar

| Funció | Comportament exigit |
| --- | --- |
| Pista | Mitja pista amb porteria a dalt o a baix; pista completa. Canviar vista no canvia tàctica ni esborra objectes fora de l’enquadrament. |
| Figures | Afegir atacant, defensor, pilota, con, banc i xirimbolo/cilindre; editar etiqueta i rol de manera contextual. |
| Materials | Banc orientable amb control directe i increments; conservar dimensions. Xirimbolo recognoscible com a material. La funció tàctica es declara per instància. |
| Trajectòria i passada | Afegir i editar directament. Corba quadràtica amb inici, control i final; controls visibles només en seleccionar-la. Passada discontínua. |
| Desplaçament del recorregut | Permet moure una trajectòria lliure sencera, a més dels controls. En accions vinculades, preserva o explicita el canvi d’ancoratges. |
| Edició | Seleccionar, arrossegar, eliminar, duplicar i editar una selecció. Supr/Retrocés només quan el focus correspon a la pissarra. |
| Rotació | El banc seleccionat gira amb nansa i botons; conserva el centre i es pot desfer. Mantén els increments de 5° per teclat i 10° per botons del prototip. |
| Simetria | Recupera dreta→esquerra i permet treballar sobre una selecció explícita. Previsualització i un sol desfer; remapeja tots els vincles interns de la còpia. |
| Ajust | Opcional a 6/9 m, apagat inicialment; deriva del perfil real de pista. Mantén l’acció de cons alineats amb els postes. |
| Historial | Desfer/refer de crear, moure, corbar, girar, eliminar, duplicar, simetria, buidar i acceptar una regeneració. Un gest és una operació atòmica. |
| Exportació | SVG, PNG i còpia d’imatge quan el navegador ho permet; sortida neta a mida d’editor i de fitxa. |

Les trajectòries complexes del motor poden tenir diversos segments o punts funcionals. Mostra controls adequats al segment seleccionat i conserva els punts de compromís, ruptura i sortida d’una finta. El requisit de tres controls correspon a la corba quadràtica simple de l’editor original; no obliga a reduir una finta composta a una única corba.

La selecció, les nanses i les línies fines han de ser fàcils d’encertar amb ratolí i dit: separa la zona interactiva del traç visible. Suporta zoom/enquadrament amb conversió de coordenades correcta. El teclat no ha d’esborrar jugadors quan s’edita text, un selector o un diàleg. Buidar és reversible i no elimina exercicis guardats.

### 4.2 Fiabilitat del gest

Comprova el codi de referència: `useDraggable` rep callbacks nous, reinstal·la listeners amb cada render i cancel·la frames pendents; cal evitar que un render interrompi un arrossegament. Si es porta a React, usa callbacks estables/referències i listeners estables. Si es porta a JavaScript existent, conserva el mateix principi de sessió d’arrossegament estable.

Conserva el desplaçament entre el punt on s’agafa la figura i el seu centre; ha de moure’s sense saltar al cursor. Controla punter actiu, captura, `pointercancel`, pèrdua de captura, sortida del canvas i desmuntatge. Aplica l’última posició en deixar anar i cancel·la amb restauració coherent. Usa requestAnimationFrame per a la previsualització si cal, i registra una ordre al final, no cent ordres per moviment.

El canvi d’orientació és una transformació de vista explícita amb transformació inversa del punter. Una simetria del muntatge és una operació diferent. Valida mitja pista/pista completa i la reducció de vista sense retallar dades. El snap ha d’usar el tram recte i els arcs del costat correcte de la pista, amb extrems vàlids; no projectis sobre tota una circumferència i després deformis la projecció amb un clamp.

## 5. Model compartit, identitats i dependències

Reutilitza els IDs persistents de participant, estat, acció, pilota i material. Un rol o una etiqueta no és una identitat. Un estat futur pertany a la mateixa persona; duplicar un jugador per crear-ne un altre necessita una nova identitat. Una còpia simètrica de muntatge remapeja els seus participants, estats, accions i pilotes sense fusionar-los amb l’original; invertir la vista no crea cap identitat.

L’editor treballa en metres amb el perfil de pista vigent. El factor `M=40` del prototip és una escala de dibuix històrica, no un contracte físic ni una base de dades tàctica. L’origen i les transformacions es defineixen una sola vegada. Si importes dades del prototip, conserva transformació, orientació i procedència; no tractis la separació decorativa de la porteria com a veritat tàctica.

El dibuix manual pot contenir elements encara sense vincle semàntic. Es conserven com a anotacions o referències de l’entrenador i són editables i guardables. El sistema pot proposar relacionar-los amb una acció del text quan el vincle sigui clar. Afegir una línia o un material no inventa automàticament una passada, un defensor o una possessió.

Una passada vinculada té emissor, receptor, pilota i estats. Una recepció en carrera comparteix el mateix estat per a passada, cursa i inici de l’acció següent. Moure aquest estat actualitza els extrems relacionats en una sola transacció. Moure la posició inicial no desplaça indiscriminadament tots els estats futurs. Si s’arrossega un extrem compartit, mou l’estat comú o ofereix explícitament desvincular-lo; evita divergències silencioses.

La pilota continua vinculada al posseïdor quan aquest es mou. Els materials amb funció declarada conserven la relació en girar-los o duplicar-los. Eliminar un element relacionat ha de conservar la integritat: mostra l’impacte quan hi ha dependències, conserva un esborrany recuperable i no inventis substituts.

## 6. Guardar, revisions i regeneració sense perdre feina

Separa **desar un esborrany** d’**aprovar la interpretació d’una acció o del cas**. Guardar no aprova tots els fets, i un error de geometria no ha d’impedir conservar el treball. La persistència rebutja dades il·legibles de forma controlada, però pot guardar un cas amb diagnòstics i parts desconegudes. L’aprovació exigeix les comprovacions aplicables a l’abast aprovat.

Implementa desament automàtic durable amb revisions recuperables i un botó explícit de guardar. Reutilitza un backend si ja existeix. A 8074dc5 només hi ha localStorage: per disposar d’un registre únic fora del navegador, afegeix un servei mínim de persistència al mateix projecte amb una base transaccional local, com SQLite, si no hi ha altra infraestructura. Prioritza la pila existent; no hi afegeixis un sistema complet de comptes o serveis de pagament.

El servei pot executar-se en local amb l’aplicació, sense credencials externes. Identifica el servei que és la font principal. Qualsevol accés remot reutilitza els controls d’accés del desplegament i secrets al servidor; no exposis un servei d’escriptura o claus al frontend. No cal publicar-lo en aquesta tasca. Les proves han d’incloure reiniciar el servei i recuperar la mateixa revisió des d’una sessió de navegador nova. La còpia local del navegador pot conservar canvis pendents i permetre treball sense connexió; no la presentis com a sincronització si el servei no ha confirmat l’escriptura.

Usa revisions/versions esperades per impedir sobreescriptures des de dues pestanyes. En conflicte, conserva les dues variants i permet comparar. Verifica l’error real del desament; no mostris «Guardat» quan localStorage, IndexedDB o el servei han fallat. La migració de l’estat antic ha de ser idempotent, deixar una còpia recuperable i preservar els paquets TRAÇA 0.2–0.5 admesos. El prototip original no té exportació JSON editable: no assumeixis un format històric que no existeix.

El registre d’exercici conserva text original i revisions, interpretació, aprovacions per afirmació, geometria generada, geometria de treball, correccions, materials, pilotes, estats, fases, alternatives, referències, estil, polítiques i fonts. Un únic exercici té un ID i revisions; les fitxes apunten a la revisió que els correspon. No mantinguis còpies manuals equivalents en diversos documents.

Regenerar és calcular una proposta sobre una base identificada. Mantén el dibuix anterior visible i recuperable mentre es calcula. Reaplica les correccions compatibles per identitat i dependències; compara abans/després quan hi hagi un conflicte. L’usuari pot conservar la seva correcció, acceptar la nova proposta o ajornar el conflicte. Una resposta de model antiga no ha de substituir una revisió més nova del text. Cancel·lar, fallar o descartar una proposta conserva el treball actual. Un canvi de color no invalida la tàctica; un canvi de text invalida els derivats afectats i manté accessible la versió anterior marcada com a pendent d’actualització.

## 7. Teoria, correccions i aprenentatge dins el mateix flux

Permet crear un cas manual, generar-lo des del text, obrir-ne un d’existent i adjuntar una imatge de referència amb origen. Una imatge és una font visual consultable: la lectura tàctica automàtica només es pot anunciar si realment està implementada i comprovada.

Connecta selecció d’acció al text amb actors, estats, trajectòries i fonts del dibuix. El ressaltat és bidireccional. Mostra només el dubte que impedeix interpretar una acció, amb una pregunta curta. La resta del cas continua editable. Valida aprovacions per acció/afirmació i revisió, sense obligar a aprovar tot el cas per aprofitar-ne una part correcta.

A cada correcció conserva abans/després, element i relació afectats, revisió del text, procedència, autor i un motiu opcional en llenguatge natural. El desplaçament de píxels o metres per si mateix no determina el motiu tàctic. L’usuari pot dir «canviar d’interval abans de superar D2»; el sistema proposa la restricció estructurada i la visualitza abans que sigui operativa.

Després de guardar, una acció discreta «Reutilitzar aquesta correcció» permet triar només les correccions pertinents. En un únic panell curt mostra el criteri proposat, quan s’aplica, l’exemple anterior/corregit i «Aprovar criteri» o «Només aquest exercici». Nom, condicions i evidències es poden preomplir. Cap formulari tècnic ni petició de confirmació després de cada gest.

Mantén separats quatre estats visibles i reals: **registrat**, **validat per l’entrenador**, **aplicable pel motor** i **aplicat a aquest resultat**. Un criteri aprovat però sense operador executable queda «pendent d’implementació». Si dues regles aplicables entren en conflicte, mostra el conflicte i conserva l’autoritat i l’abast de les fonts; no decideixis per ordre de llista.

Implementa una representació tipada de criteris amb condicions, variables vinculades a participants/estats/accions, efecte suportat, abast, versió, fonts i comprovació del resultat. Reutilitza els operadors i paràmetres del motor. Un text guardat, una coincidència d’àlies o una etiqueta «après» no equivalen a aplicar una correcció al gràfic. Conserva aquests camps durant desament, càrrega, exportació i consulta; a 8074dc5 `addCoachValidatedKnowledge` no desa els camps operatius que `compositionKnowledge` esperaria.

Per tancar el primer circuit, suporta almenys un criteri de disposició relativa o d’ancoratge entre estats/espais que produeixi un canvi geomètric observable en un cas nou compatible, i un criteri de validació seqüencial relacionat amb una acció ja suportada. Escull exemples dins la cadena passada–recepció–finta–2x1. Un criteri visual provisional s’identifica com a tal i no es converteix en llei tàctica.

L’exemple conceptual de finta manté l’ordre ja canònic: amenaça de l’interval inicial, compromís, canvi cap al contigu i superació. Reutilitza la seva aprovació existent; no la facis passar per coneixement nou que acabem d’inventar. Per demostrar una aprovació nova en proves, usa fixtures de test identificades; no afegeixis aprovacions reals fictícies a la base de producció.

Demostra l’aplicació en un cas diferent, amb IDs i coordenades inicials diferents; també en una variant lateral declarada i en un contraexemple on no s’ha d’aplicar. Mostra quin criteri ha intervingut. Revocar-lo afecta generacions noves i conserva les revisions passades. El coneixement pot créixer amb exercicis i correccions; això no és entrenar pesos d’un model.

## 8. Integrar la base real de coneixement

Usa el JSON inclòs, no un exemple inventat amb una estructura més fàcil. La base conté 15 casos interns, 103 evidències, 5 aprovacions prèvies, 14 símbols, 10 casos externs, 20 regles candidates i 20 especificacions de prova. Aquests nombres no són resultats actuals del motor.

Respecta l’estructura real:

- `canonical_visual_reference.symbols`: símbols de la llegenda.
- `internal_corpus.cases`, `.evidence`, `.coach_validations`, `.consolidated_patterns`: casos interns, evidències i aprovacions.
- `cases`: recerca externa D01–D10.
- `candidate_rules`: R01–R20; `test_catalog`: T01–T20.
- `case_index`: índex amb `json_pointer`, no una segona col·lecció de nous casos.
- `reuse_guides`: guies de consulta; no substitueixen l’afirmació aprovada que referencien.

Valida versions, esquemes, IDs dins de cada espai de noms i referències. Un mateix ID de cas a l’índex és una referència lícita. Les evidències porten `consolidated_status`, amb majúscules i espais; no pressuposis `record.status` amb valors anglesos. Una cerca de `VAL-ENT-004` ha de retornar la validació real, amb font i abast.

Conserva 10 «CONFIRMADA PER AMBDÓS», 16 «CONFIRMADA PER ENTRENADOR», 30 «OBSERVACIÓ REPETIDA», 13 «CANDIDAT», 26 «AMBIGUA» i 8 «SUPERADA». L’autoritat aprova la part delimitada pel motiu de consolidació, no tota la narració històrica ni el dibuix. Les validacions `VAL-ENT-001`…`005` no requereixen reconfirmació fora de canvis d’abast.

Mantén `runtime_import_allowed: false` i un registre separat d’activacions selectives. Els candidats, fonts externes i afirmacions superades no omplen camps tàctics obligatoris per coincidència. L’HTML i les galeries són vistes generades del JSON. Les correccions noves tenen identitat i historial propis connectats a aquesta font; no dupliquis manualment totes les dades entre documents.

Connecta carregador, consulta, activació i motor amb `app.js` i `store.js`. L’usuari ha de poder cercar un exercici o concepte, veure’n teoria/font/gràfic disponible i utilitzar-lo com a referència en el mateix espai de treball.

## 9. Simbologia i geometria compartides

La forma dels 14 símbols segueix `LEG-COACH-001`: cercle atacant; cercle amb punt adjacent per a pilota; triangle defensor; moviment continu; passada discontínua; finta de passada discontínua amb marca obliqua; tir de doble traç; finta de tir amb doble traç i marca; finta amb canvi de direcció; bloqueig ofensiu i blocatge defensiu diferenciats amb marca perpendicular; posició futura a destinació i anterior a origen, amb contorn discontinu; bot ondulat.

Usa les mateixes primitives a editor, miniatura, galeria, fitxa i exportació. El material no es converteix en defensor pel seu aspecte. El banc i el xirimbolo mantenen una representació fàcil de reconèixer, amb la seva funció indicada per instància. Les extensions no cobertes per la llegenda queden identificades.

Conserva com a tema opcional la pista blava/àrea verda del prototip, i ofereix un tema de fitxa amb fons blanc, pista discreta i contrast suficient. Comparteixen símbols, geometria i política d’escala; no són dos renderers. Les etiquetes han de veure’s també en figures buides o discontínues. El color no és l’única distinció de significat.

Utilitza el perfil de pista del projecte per a 6/9 m, porteria, límits, transformacions i comprovacions. Valida estats terrestres immòbils, trajectòries senceres, branques pertinents i límits laterals; no només els extrems. Separa límit físic de marge visual. Porters, materials i accions aèries explícites tenen els seus contractes; no inventis un salt per justificar una entrada a l’àrea.

Una finta ha de canviar cap a l’interval contigu abans de superar la línia del defensor corresponent, amb continuïtat, separació i sortida llegible. No n’hi ha prou amb una distància mínima i un punt final correcte. Comprova l’ordre al recorregut i la banda funcional respecte del defensor segons la direcció d’atac. No ajustis semàntica, identitat del defensor ni aprovacions per fer passar un dibuix.

El 2x1 continua sent una relació entre portador, suport, defensor i espais. Conserva’n el final obert quan no s’ha declarat passada o tir. L’ordre d’una llista o el nom d’un ID opac no decideixen la disposició. Una futura ampliació a permuta, encreuament, bloqueig o lliscament reutilitza aquestes identitats i relacions.

Mantén fases, condicions, diverses pilotes i alternatives del corpus. `VAL-ENT-004` conserva alternatives semàntiques sense exigir dibuixar-les totes. No concatenis finals incompatibles; la selecció de vista no elimina branques. Preserva els fluxos d’UVOF009/012/015 i la resta de semàntica ja validada. Si el motor només resol una part, mostra-la i permet completar manualment el dibuix sense marcar-la com a generada automàticament.

## 10. Defectes de la revisió del 04/10 que has de reproduir i corregir

Al commit 8074dc5 les 255 proves passaven i A1–A3 es regeneraven sense diferències. Això no certificava el següent:

| Incidència | Evidència i exigència |
| --- | --- |
| Finta pel costat inicial | A2 té D2=[10,7.5]. La trajectòria travessa y=7.5 a x=8.99 i canvia cap a la dreta després; A3 ho reflecteix a x=11.01. S’aprovava com a geometria vàlida. Revisa l’ordre funcional i el recorregut, sense pegats per ID. |
| Jugador immòbil dins l’àrea | A1 amb CE=[10,5.5], L inicial=[15,12] i recepció=[13,10] donava `geometry_status: ready` i `geometry: valid`. Cal detectar l’estat terrestre il·legal malgrat que la cursa del receptor sigui vàlida. |
| Importador incompatible | `GraphicKnowledge.validate` sobre el JSON real produeix 10 falsos `DUPLICATE_ID` per D01–D10 i `TEST_CATALOG_UNAVAILABLE` tot i existir `test_catalog`. Reconeix l’esquema real. |
| Posició anterior invertida | `renderSymbolSheet` situa tant futur com passat al final de la fletxa. El passat és a l’origen segons la llegenda. |
| Etiquetes il·legibles | Els estats temporals de jugadors poden tenir text blanc sobre interior buit clar. Valida contrast en tots els temes i exportacions. |
| Aprenentatge desconnectat | Hi ha formularis i coincidències de coneixement, però cal provar efecte estructurat sobre generacions noves. No donis per complet el bucle només per desar text. |
| Proveïdor de model desconnectat | El mòdul configurable existeix, però falta connexió efectiva al flux de l’app. Integra'l quan es configura, amb evidències, cancel·lació, revisió d’origen i credencials al servidor. |
| Cobertura mal interpretada | La galeria conté 15 targetes, 14 sense dibuix, i anuncia 0/15 de geometria genèrica. Les relacions qualitatives suficients han de poder alimentar el resolutor; l’absència de coordenades d’entrada no és per si sola un impediment. |

`review/reproduce_findings.cjs` escriu diagnòstics a stdout i no modifica el repositori. Reexecuta’l abans i després; és una reproducció dels defectes, no un substitut de les proves completes ni de la revisió visual.

Si no hi ha credencials de model, la connexió configurable es prova amb un doble de servei i l’entrada estructurada continua funcionant. Informa que la crida real no s’ha verificat; no frenïs l’editor per aquesta absència. La semàntica extreta d’un model continua provisional fins a la confirmació pertinent.

## 11. Exportació i recuperació fidels

Exporta a partir de la geometria de treball i la vista seleccionada amb el renderer compartit. Exclou controls, anelles de selecció, guies de rotació, hitboxes i debug; no eliminis figures tàctiques discontínues confonent-les amb controls. No cal que l’usuari desseleccioni abans d’exportar. Conserva fletxes, guions, etiquetes, material, proporcions, tema i enquadrament.

PNG amb resolució suficient per a la fitxa i SVG vectorial autònom. Defineix namespaces, dimensions, fonts disponibles i IDs de markers no conflictius. No facis un segon dibuix manual per exportar. L’exportació registra cas/revisió als metadades o nom coherent sense carregar la imatge amb dades internes.

«Copiar imatge» ha de copiar una imatge. Si el navegador no ho permet, ofereix/descarrega el PNG i informa de l’alternativa real; no mostris èxit d’imatge si s’ha copiat una DataURL o codi SVG com a text. Mantén «Copiar SVG» com a acció diferenciada si és útil. Verifica fallades d’exportació, permisos i absència de context de canvas; allibera URLs temporals.

El paquet editable importat ha de recuperar les dades i els vincles, no només una imatge. Les miniatures i la galeria es deriven d’aquest mateix registre.

## 12. Proves d’acceptació obligatòries

Implementa les proves de comportament que resolen riscos reals i executa les portes del repositori. La matriu detallada és `review/acceptance.json`; informa’n els resultats un a un. No substitueixis l’observació per comprovar que una bandera val `ready`.

### Sessió A — ús manual

Amb un cas nou, afegeix atacant, defensor, con, pilota, banc i xirimbolo; crea trajectòria i passada; canvia els tres controls i mou la corba sencera; gira banc; selecciona i crea simetria; desfés i refés; elimina i recupera; buida i desfés. Repeteix una mostra amb tacte, zoom i orientació invertida. Verifica que escriure a la teoria no elimina figures.

Guarda, recarrega, reinicia el servei i obre una sessió nova; compara dades, vincles i imatge amb toleràncies només de rasterització. Prova un error de desament i un conflicte de revisions. Exporta amb un recorregut i un banc seleccionats: la sortida ha de quedar neta.

### Sessió B — generació i correcció

Usa els textos exactes:

- A1: «El central passa al lateral. El lateral rep en carrera.»
- A2: «El central passa al lateral. El lateral rep en carrera a l’interval 1–2, fa una finta contra D2 i surt cap a l’interval 2–3. Després juga un 2x1 amb el pivot contra D3.»
- A3: «El central passa al lateral. El lateral rep en carrera a l’interval 2–3, fa una finta contra D2 i surt cap a l’interval 1–2. Després juga un 2x1 amb el pivot contra D1.»

Genera sense coordenades d’entrada. B1 visible amb CE; estat de recepció compartit; finta funcional; suport PV contra el defensor declarat; final obert. A3 manté pivot contra D1. Mou la recepció i verifica tots els extrems vinculats. Canvia text, compara proposta, conserva una correcció i accepta una altra. Prova cancel·lació, error i resposta retardada sobre una revisió antiga. Desfer la regeneració restaura el resultat anterior.

### Sessió C — aprenentatge real

Sobre un cas, selecciona una correcció pertinent, proposa el criteri, visualitza’n abast i efecte, aprova i guarda. Obre un cas nou compatible i comprova l’efecte geomètric i la font utilitzada. Renombra IDs i modifica posicions inicials; comprova que s’aplica per relació. Prova el mirall declarat i un contraexemple incompatible. Un candidat sense aprovar no s’aplica. Revoca el criteri i comprova generacions noves i revisions antigues.

### Sessió D — regressions i coneixement

Executa els tres diagnòstics del paquet. Valida les 14 convencions visuals amb la llegenda i els estats temporals. Consulta aprovacions reals, rebutja promoció massiva i preserva evidències superades. Mapea T01–T20 de `test_catalog` a proves del contracte amb estat individual; el seu estat de recerca no es transforma en aprovació tàctica.

Inspecciona el corpus de 15 casos, amb resultat complet/parcial i causa concreta. Una targeta buida no és un gràfic generat. Conserva les regressions de semàntica, múltiples pilotes, decisions, material i identitats. No debilitis validadors ni semàntica per fer passar proves.

Executa els punts d’entrada vigents, inclosos `python scripts/validate_semantic.py` i `python -m pytest -q` si es mantenen. Afegeix proves de navegador per a les sessions anteriors i inspecciona les captures reals de l’app i les exportacions a mida de fitxa. La inspecció tècnica no és aprovació tàctica de l’entrenador. Si un navegador/servei no està disponible, registra el buit i lliura instruccions reproduïbles; no declaris aquella prova superada.

## 13. Seqüència d’implementació i lliurament

1. Inspecciona estat i fonts, executa regressions i fixa la matriu d’acceptació sobre el codi actual.
2. Porta els gestos del prototip a la pissarra compartida; completa historial, dependències i exportació neta.
3. Implementa persistència, migració, conflictes i recuperació; separa guardar d’aprovar.
4. Integra la base real, resol els defectes confirmats i connecta text, accions, correccions i proposta regenerada.
5. Tanca reutilització tipada amb efecte en casos nous i aprovació per afirmació. Genera captures i completa les sessions d’acceptació.

Mantén commits revisables. Reutilitza funcions correctes; evita afegir diversos motors, validadors o fitxers de coneixement equivalents. Actualitza la documentació existent i la matriu de capacitats, en lloc de crear resums manuals contradictoris.

Lliura la branca i commit finals, passos exactes per executar i obrir l’eina, migracions, proves realment executades, captures de pissarra i exportació, exemple del criteri aplicat a un segon cas i limitacions concretes. Deixa qualsevol capacitat pendent identificada amb el seu motiu; les sessions A–C són la condició de completar aquesta entrega.

No tanquis la feina només amb «tests verds»: l’entrenador ha de poder treballar amb la pissarra i veure que una correcció validada ajuda en un altre exercici.
