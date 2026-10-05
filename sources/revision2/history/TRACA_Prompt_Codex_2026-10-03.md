# TRAÇA — Prompt per a Codex: implementació integral del motor gràfic

Data: 3 d’octubre de 2026. Repositori: [truenoxy7-hub/CODEX](https://github.com/truenoxy7-hub/CODEX).

Implementa les millores següents al codi vigent de TRAÇA. L’objectiu és obtenir gràfics d’handbol fidels, visualment uniformes, editables i reutilitzables, aprofitant els exercicis i les validacions que ja tenim. Fes la implementació, les migracions necessàries, les proves, la regeneració i la inspecció dels gràfics. No et limitis a redactar un pla ni a afegir documentació.

Aquesta petició consolida el pla d’ampliació del 18/09/2026, les correccions geomètriques d’A1–A3 del 25/09 i el treball posterior de simbologia i coneixement. És la petició d’implementació vigent per a aquesta iteració. Les correccions explícites de l’entrenador i les validacions posteriors documentades mantenen la seva autoritat.

## 1. Punt de partida i abast

Treballa sobre l’estat actual del repositori. Identifica branca, commit, canvis locals i implementacions posteriors abans d’editar. Conserva el treball existent i reaprofita les millores que ja funcionin; no restauris cap snapshot antic. Deixa els canvis en una branca revisable.

Les revisions que originen aquesta petició es van fer sobre `1626da78d9c106d49e750149cbea2b7995d8ba3a` i, després, `06b4c88c799cd08480d5136b20c05912cbf9a251`. Són referències històriques, no una afirmació sobre el HEAD actual. Reprodueix els defectes descrits abans de considerar-los encara oberts. Si ja estan corregits, conserva la correcció i la seva regressió.

Llegeix `AGENTS.md`, el context, el model de domini, les decisions i l’estat actual. Consulta també els contractes vigents d’interpretació, composició, relacions espacials, geometria, gramàtica visual, correccions, aprenentatge i promoció del coneixement. Resol els noms reals dels fitxers al repositori.

La tasca **autoritza expressament generar geometria, SVG, PNG i captures per revisar els resultats**. Les decisions tècniques i d’estil que preserven el significat es poden implementar amb una política visual provisional documentada. Reutilitza les validacions prèvies dins del seu abast: no tornis a demanar a l’entrenador que aprovi allò que ja ha aprovat.

Inclou el motor, la integració de coneixement, el circuit d’interpretació, la representació, l’editor i l’exportació. La unificació de calendaris, assistència i seguiment és una línia posterior; aquí cal deixar un únic registre d’exercici amb revisions i referències des de les fitxes. No obris una reforma paral·lela de tota la gestió de l’equip.

## 2. Materials d’entrada

El paquet que acompanya aquest prompt conté:

| Fitxer | Ús |
| --- | --- |
| `TRACA_Base_coneixement_grafics_v0_1.json` | Font estructurada de coneixement. La versió real és `meta.version = 0.2.0`; el nom conserva el sufix històric. |
| `TRACA_Base_coneixement_grafics_v0_1.html` | Consulta visual del mateix coneixement, amb la llegenda i els fragments gràfics atribuïts. És una vista derivada. |
| `AEB796E5-F49A-4466-A62E-79AA36F44AD4.png` | Captura original de la llegenda aportada per l’entrenador: `LEG-COACH-001`. |
| `manifest.json` | Versions i empremtes dels fitxers del paquet. |

La base conté 15 exercicis interns, 103 registres d’evidència, 5 validacions explícites prèvies, 14 símbols de la llegenda, 10 casos externs i 20 especificacions d’acceptació. **103 evidències no són 103 regles aprovades, i les 20 especificacions encara no són tests executats al motor.**

L’auditoria interna incorporada és de l’11/08/2026. La seva importació no va incloure una nova inspecció visual dels 15 dibuixos ni una verificació del repositori actual. Els estats històrics `ready` o `partial` no certifiquen la geometria d’avui.

Si reps només aquest Markdown, cerca primer els fitxers al repositori o als adjunts. Si falta una font imprescindible, identifica-la i continua les parts sustentades per les fonts disponibles; no reconstrueixis validacions ni evidències inexistents.

## 3. Autoritat, coneixement i font única

Mantén separades aquestes preguntes:

- **Què passa a l’exercici?** Ho determinen les correccions de l’entrenador, la semàntica aprovada del cas i les definicions canòniques aplicables.
- **Com es dibuixa un símbol?** Ho determinen `LEG-COACH-001` i les validacions visuals explícites.
- **Com era un dibuix antic?** Ho documenta l’auditoria; pot contenir omissions i errors.
- **La geometria actual és correcta?** Ho han de demostrar el resolutor, les comprovacions i la inspecció del resultat actual.

Integra la base al repositori com a font versionada de consulta, evidència i regressió. Adapta-la al mecanisme de coneixement existent; no la carreguis com si fos directament `TacticalIR` ni substitueixis amb aquesta auditoria la semàntica canònica dels exercicis.

Requisits de la integració:

1. Un carregador valida l’estructura, les versions, els identificadors i les referències. La consulta per conceptes utilitza `case_index`, `reuse_guides`, les evidències i els casos, i retorna procedència i estat de validació.
2. Un adaptador explícit selecciona què pot utilitzar el motor. Cada regla o dada operativa conserva la referència exacta al fet validat i el seu abast. La coincidència amb un exercici només aporta context; no decideix automàticament la tàctica d’un cas nou.
3. Preserva els estats consolidats dels 103 registres: 10 `CONFIRMADA PER AMBDÓS`, 16 `CONFIRMADA PER ENTRENADOR`, 30 `OBSERVACIÓ REPETIDA`, 13 `CANDIDAT`, 26 `AMBIGUA` i 8 `SUPERADA`. La confirmació correspon a l’afirmació delimitada, no a tot el dibuix o a tota la narració històrica del registre.
4. Les 5 validacions `VAL-ENT-001`…`005` es reutilitzen. Les observacions repetides i els candidats poden orientar una proposta o una prova, però no omplir per si sols un camp tàctic obligatori. Les afirmacions superades no tornen a activar-se.
5. Els casos externs `D01`…`D10` i les regles `R01`…`R20` conserven el seu estat de recerca. Si una regla corrobora una invariant ja canònica, implementa la invariant citant la seva autoritat canònica, sense convertir tota la font externa en coneixement aprovat.
6. Els camps `runtime_import_allowed: false` de la base descriuen el límit de la recerca original. Conserva’l. La integració nova ha de tenir un registre separat de les dades validades que activa; no canviïs aquell camp global a `true` per fer una importació massiva. La petició autoritza l’adaptador i la reutilització de validacions existents, no aprova tàctica nova en bloc.
7. La incorporació de correccions noves ha de ser explícita, rastrejable i reversible. Confirmar un cas no generalitza automàticament una regla a tots els exercicis.

El JSON és la font de dades de la base; l’HTML, les galeries i els índexs derivats es regeneren. El codi de símbols i la configuració d’estil també han de tenir una sola implementació compartida. No mantinguis llistes manuals equivalents en diversos documents o renderers. Aquesta integració és consulta i reutilització de coneixement; no és entrenament dels pesos d’un model.

## 4. Estàndard visual compartit

Inspecciona la captura original i implementa les 14 entrades de `canonical_visual_reference`. Utilitza les mateixes primitives a l’editor, a les previsualitzacions, a les miniatures, a les fitxes i a l’exportació SVG/PNG.

| Significat | Representació canònica |
| --- | --- |
| Atacant | Cercle de contorn continu. |
| Atacant amb pilota | Cercle amb un punt petit adjacent que representa la pilota. |
| Defensor | Triangle de contorn continu. |
| Desplaçament sense pilota | Fletxa de línia contínua. |
| Passada | Fletxa de línia discontínua, sempre. |
| Finta de passada | Fletxa de passada discontínua amb una marca obliqua curta. |
| Llançament | Fletxa de doble traç continu. No és una passada discontínua. |
| Finta de llançament | Fletxa de doble traç amb una marca obliqua curta. |
| Finta | Trajectòria amb canvi de direcció recognoscible i fletxa, fidel a la forma de la llegenda. |
| Bloqueig ofensiu / pantalla | Atacant relacionat amb una marca perpendicular curta; aproximació quan l’acció la declara. |
| Blocatge defensiu del tir | Defensor relacionat amb un recorregut que acaba en una marca perpendicular curta. |
| Posició futura | Contorn discontinu del jugador al final del desplaçament. |
| Posició anterior | Contorn discontinu del jugador a l’origen del desplaçament. |
| Desplaçament en bot | Trajectòria ondulada regular amb fletxa. |

La discontinuïtat d’un contorn temporal no converteix el jugador en una passada. Separa les primitives d’entitat, moviment, pilota i temps. Les fintes de passada o de llançament no transfereixen la possessió ni generen un tir real. Una posició passada o futura és un estat del mateix participant, no un jugador nou.

La forma de la finta no substitueix la seva lògica tàctica. L’encreuament, la permuta i la superioritat es representen composant participants, estats i recorreguts; no necessiten un glif arbitrari nou. Distingir bloqueig ofensiu de blocatge defensiu requereix el tipus d’acció i els actors, no només la paraula «bloqueig».

Centralitza en una configuració versionada mides, gruixos, guions, separació entre els dos traços del tir, puntes de fletxa, etiquetes, marges i capes. La llegenda no fixa valors numèrics, paleta ni tipografia: tria valors coherents amb la fitxa i marca’ls com a política visual provisional. Fons blanc, pista discreta i significat llegible en blanc i negre. El color pot ajudar, però no ser l’única distinció.

Les trajectòries no poden quedar tapades per etiquetes o símbols; la separació gràfica dels acabats ha de conservar l’estat lògic compartit. El canvi de zoom o d’exportació ha de mantenir una escala coherent de símbols i textos sense canviar la geometria física. Respecta els límits entre vista neta i vista de control: els intervals tàctics no es converteixen en rectangles decoratius.

Els símbols de porter, material, suports o altres extensions no coberts per la captura es resolen amb convencions vigents o extensions identificades i documentades. No els atribueixis a la llegenda original. Les llegendes externes serveixen per interpretar les seves fonts; el resultat TRAÇA sempre utilitza la llegenda de l’entrenador.

## 5. Interpretació i model estructurat

Mantén el circuit: text i fonts → interpretació estructurada → semàntica confirmada → relacions espacials qualitatives → composició → geometria resolta → render. El compositor i el resolutor no rellegeixen text lliure ni seleccionen plantilles per ID d’exercici o frase exacta.

Completa el proveïdor d’interpretació i la connexió amb la base de coneixement:

- Identitats úniques independents del rol, la posició i la fase. Dos laterals o dos defensors «tercers» poden ser persones diferents. Un jugador que permuta manté la mateixa identitat.
- Participants, estats, material amb funció per instància, pilotes, accions, fases, condicions, alternatives i fluxos de pilota amb referències tipades.
- Evidència del fragment original per cada extracció; procedència i aprovació són camps diferents. Una interpretació d’un model sobre text de l’entrenador continua sent una proposta.
- Coreferències com «el mateix lateral» preservades; antecedents ambigus generen una pregunta concreta. Conceptes desconeguts es conserven.
- Distinció entre seqüència, concurrència, activació, repetició, retorn, variant de tasca i escena independent. No dedueixis cronologia només de la numeració o la posició dels panells.
- Validació de referències, possessió, obligatorietat de camps i contradiccions després de la interpretació.

Reutilitza `InterpretationProvider` i el proveïdor local. Si falta l’adaptador de model previst al pla, implementa’l amb el servei i les convencions actuals del projecte, sortida estructurada validada i configuració del proveïdor/model. Mantén les credencials al servidor. No incorporis claus ni inventis una configuració de producció. Si no hi ha credencials disponibles, lliura la integració configurable i verifica el contracte amb dobles de prova; informa que la crida real queda sense verificar. La generació des d’entrada estructurada vàlida ha de continuar funcionant.

La interfície ha de mostrar un resum entenedor del que s’ha interpretat i només els dubtes que afecten el significat. La confirmació és per cas i revisió; reutilitza la confirmació mentre les fonts rellevants no canviïn. No disfressis dades candidates de dades validades per aconseguir geometria.

## 6. Geometria general i regressions prioritàries

Reutilitza o completa el contracte geomètric general vigent, amb adaptadors i versions explícites quan calgui. La seva sortida ha d’incloure pista, estats, objectes, accions, dependències, política visual, traçabilitat i diagnòstics. Conserva la compatibilitat d’UVOF015 sense mantenir l’esquema general lligat a aquest ID.

El resolutor ha de poder generar la disposició a partir de relacions suficients sense coordenades aportades manualment. Respecta ancoratges explícits vàlids; si entren en conflicte, informa’n sense moure’ls silenciosament ni modificar la tàctica.

### 6.1 Defectes històrics a comprovar

Al commit `06b4c88…`, les 8 proves de geometria general passaven, però la revisió va trobar:

| Defecte | Evidència històrica i resultat exigit |
| --- | --- |
| Sortida dins l’àrea | L acabava a `[12, 5.5]` en A2 i `[8, 5.5]` en A3: aproximadament 0,477 m dins l’àrea, sense salt declarat. Corregir posicions i recorreguts terrestres amb el perfil real de pista. |
| Finta superposada a D2 | El recorregut passava a uns 0,154 m del centre de D2 i `commitment` coincidia amb `direction_break`. Cal una ruptura funcional i llegible. |
| Dependència de l’ordre de participants | Reordenar `[L, PV]` a `[PV, L]` desplaçava el pivot 2,5 m. Resoldre per relacions, no per índex ni ordre alfabètic. |
| Pilota omesa | B1 existia a `TacticalIR` però no era visible al SVG. Conservar identitat, possessió i representació. |
| Fals resultat complet | Tenir coordenades es considerava suficient per resoldre una relació. Validar-ne les obligacions, no només l’existència de punts. |

Aquestes coordenades descriuen errors: no les converteixis en plantilles o pegats específics.

### 6.2 Restriccions i trajectòries

- **Pista:** centralitza els càlculs del tram recte i els arcs de l’àrea a partir del perfil versionat del repositori. No utilitzis una circumferència des del centre de la porteria ni `y = 6` com a frontera universal. Reutilitza el càlcul en resolució i validació d’estats i de tot el recorregut, també dels segments corbs.
- **Marges:** separa límits físics i marges visuals. No inventis un salt per justificar una entrada terrestre dins de l’àrea. Les accions aèries explícites segueixen el seu contracte específic.
- **Intervals:** deriva regions o corredors dels delimitadors i del context. Recepció, amenaça i sortida poden ocupar llocs diferents del mateix interval. No ho redueixis a un punt mitjà amb un quadrat fix.
- **Recepció en cursa:** passada, cursa i inici de l’acció posterior comparteixen un únic estat. Canviar-ne la geometria actualitza totes les dependències.
- **Finta canònica:** preserva amenaça de l’interval inicial, compromís defensiu, ruptura de direcció i ritme, atac de l’interval contigu i superació del defensor. No eliminis `SURPASSES_DEFENSIVE_LINE` per evitar l’àrea. Resol conjuntament profunditat i sortida. Una corba decorativa o una mínima separació artificial entre punts no ho satisfà. No afegeixis moviment tàctic del defensor per evitar una col·lisió gràfica.
- **2x1 i altres relacions numèriques:** resol segons portador, company, defensor, espais i direcció d’atac. No exigeixis universalment que els atacants quedin a banda i banda de la X del defensor. Conserva el final obert si no hi ha passada o tir declarats.
- **Encreuament:** representa qui inicia, qui encreua, quan s’activa i quin espai ataca. Dues línies que es tallen no demostren un encreuament tàctic.
- **Permuta:** intercanvi funcional d’espais amb identitats persistents. El flux habilitador de pilota és independent i segueix la definició canònica o la variant específica validada; no dedueixis una passada només de la permuta.
- **Bloqueig:** relaciona bloquejador, defensor afectat i beneficiari/context, amb el moment i el caràcter estàtic o mòbil que constin. La marca visual no determina per si sola contacte, orientació exacta o legalitat.
- **Pivot:** respecta l’espai propi, la proximitat relacional a l’àrea i les condicions d’activació. Si la tasca diu que llisca quan D3 puja, no el facis lliscar sempre.
- **Material:** el mateix tipus d’objecte pot ser límit, referència passiva, oposició simulada o handicap. La funció es declara per instància. Un con o cilindre no suma automàticament un defensor.

El renderer pinta segments ja resolts; no reinterpreta l’acció ni suavitza una trajectòria fins a esborrar-ne la funció. L’enquadrament conserva proporcions i referències de pista i no retalla símbols ni etiquetes.

## 7. Temps, pilotes, decisions i composició

Implementa les dependències com a ordre parcial i condicions quan correspongui. La preparació d’una passada pot activar una cursa abans de la recepció; això no autoritza a inventar durades. Repeticions que se solapen requereixen recursos compatibles, no una activació indiscriminada de tota la fila.

Cada pilota activa té identitat i estat de possessió o vol. Separa pilotes actives de l’estoc en espera. No fusionis els 3 fluxos d’UVOF009, els 2 d’UVOF012 o les 3 pilotes operatives d’UVOF015 perquè un dibuix antic mostri menys icones. Una mateixa pilota no pot tenir dos posseïdors simultanis incompatibles. Les còpies temporals no han de semblar pilotes simultànies.

Compta cada superioritat dins del seu àmbit. Suports externs, cues, porters i delimitadors estructurals tenen funcions pròpies i no entren automàticament en el recompte local. Els canvis de marcatge o possessió modifiquen relacions d’estat, no la identitat de les persones.

**Aplica `VAL-ENT-004`: preservar totes les alternatives semàntiques no obliga a dibuixar totes les branques.** Permet consultar muntatge, fase i alternativa quan sigui útil. La selecció de previsualització no selecciona canònicament una decisió ni esborra les altres. Evita superposar finals incompatibles com si fossin una seqüència, però no imposis un glif, un ramal o una vinyeta per cada alternativa.

Mantén separades escenes independents i configuracions alternatives. Els sistemes 6:0 i 3:3 de D10 no demostren una transició amb identitats corresponents. D08 no determina a qui es passa. No inventis receptors, tirs, rebots, transicions completes, mà dominant ni logística absent per acabar un dibuix. La consigna de contacte exclosa de D01 continua exclosa.

## 8. Exercicis existents com a banca principal

Parteix dels exercicis que ja entenem. Contrasta la base amb la semàntica vigent del repositori i utilitza els registres consolidats; les observacions històriques superades no prevalen. Aquesta taula defineix què revisar, no declara aprovats els dibuixos complets.

| Cas | Comportament que ha de demostrar |
| --- | --- |
| UVOF001 | Recepció, finta, 2x1 amb pivot; després el mateix lateral recupera i rep de l’extrem sense bot. La segona acció no es transforma en una altra finta. Material amb les seves funcions particulars. |
| UVOF002 | Recepció al canvi de direcció, alternatives després de l’1x1 i distinció entre defensor real i handicap sostingut. Les absències del gràfic antic no eliminen accions validades. |
| UVOF003 | 6x6 contra 6:0, bloqueig estàtic del pivot i continuïtats condicionals. Les obligacions pedagògiques del cas conserven el seu abast. |
| UVOF004 | Passada que habilita recepció en cursa, D2 amb handicap de recorregut i cons que no són defensors. |
| UVOF005 | 6x6 contra 5:1 i condicions de tasca. Si continua faltant el flux complet, mostrar la composició sustentada i el pendent corresponent. |
| UVOF006 | Dos cilindres com a handicaps de defensors reals; no crear defensors addicionals ni confondre canvi de banda preferent amb obligatori. |
| UVOF007 | Dos extrems diferents activats en ordre i retorn del mateix lateral. Si la semàntica vigent continua sense flux de pilota, conservar aquest buit. |
| UVOF008 | Central amb possessió inicial, mobilització de l’avançat i passada al lateral oposat; no perdre B1 perquè l’antic dibuix no la mostri. |
| UVOF009 | Permuta, identitats persistents, bancs amb funcions diferents i 3 fluxos de pilota independents. Corregir la representació antiga de tir discontinu. |
| UVOF010 | Segona acció condicionada a la participació anterior; D3 pla → tir exterior, D3 puja → lliscament i passada al pivot. No ocupar el mateix espai amb L i PV. |
| UVOF011 | 4 atacants reals, 4 defensors reals, còpies temporals i flux L→EXT→L; representar les passades validades que el gràfic antic ometia. |
| UVOF012 | Dues accions i 2 fluxos independents després de la permuta, amb activació condicional del pivot. |
| UVOF013 | 4x4 amb passador extern exclòs del recompte; atac obligat a 2–3 i resposta del pivot condicionada a D3. |
| UVOF014 | 6x6 contra 6:0, permuta i passada inicials obligatòries, continuació oberta. No comptar estats temporals com a atacants nous. |
| UVOF015 | 3 zones amb 3 duels, suports, defensors i pilotes; conservar les 3 branques i les 12 alternatives de l’adaptador vigent, sense seleccionar-ne cap canònicament. |

La replicació operativa d’UVOF015 està validada per aquest cas. No generalitzis que qualsevol dibuix parcial s’ha de replicar a totes les zones. No dedueixis correspondències especulars que no constin.

Els buits reals d’UVOF005, 007 o 014 —si encara existeixen— han de produir diagnòstics concrets i representacions parcials útils. Una millora correcta no necessita declarar tots els casos completament resolts. Tampoc pot donar per acabat el treball deixant com a «no suportada» una capacitat d’aquest abast que disposa d’entrada validada suficient.

## 9. Edició, revisions i exportació

Integra els canvis en el circuit real de la interfície. Una demostració en un script separat no és suficient.

- Moure un estat de recepció genera una correcció principal i recalcula passada, arribada i acció posterior. No crea tres correccions desconnectades.
- Mantén diferenciades geometria generada, geometria de treball, correccions i geometria aprovada. Els conflictes amb restriccions es mostren i no canvien silenciosament la semàntica.
- Desa i reobre identitats, pilotes, branques, correccions, fonts, versions de política i estats de validació sense pèrdues.
- Un canvi semàntic invalida els derivats afectats; un canvi només d’estil no esborra la validació tàctica. Una exportació identifica el cas i la revisió utilitzada.
- Un exercici té un únic identificador i revisions. Les fitxes referencien la revisió corresponent, preservant les sessions ja fetes. Reutilitza la persistència existent i migra formats antics quan calgui.
- Exporta SVG i PNG amb la mateixa simbologia i una composició llegible al requadre real de la fitxa, mantenint el format de fitxa vigent. Si la plantilla no està disponible, fes configurable la mida i deixa indicada aquesta verificació pendent.

## 10. Proves i criteris d’acceptació

### 10.1 Cadena A1–A3

Conserva aquests textos exactes com a regressió:

**A1:** «El central passa al lateral. El lateral rep en carrera.»

**A2:** «El central passa al lateral. El lateral rep en carrera a l’interval 1–2, fa una finta contra D2 i surt cap a l’interval 2–3. Després juga un 2x1 amb el pivot contra D3.»

**A3:** «El central passa al lateral. El lateral rep en carrera a l’interval 2–3, fa una finta contra D2 i surt cap a l’interval 1–2. Després juga un 2x1 amb el pivot contra D1.»

A3 conserva el pivot contra D1; no el substitueixis per un extrem. Mostra la cadena real d’interpretació, confirmació/fixture estructurada esperada, composició, geometria i render. Les fixtures serveixen per comprovar el contracte: no converteixen una interpretació nova en una validació de l’entrenador.

Han de funcionar sense coordenades introduïdes a mà, amb B1 visible inicialment amb CE, una recepció compartida, finta funcional als casos que la demanen, trajectòries terrestres vàlides i final obert.

### 10.2 Matriu mínima de comprovacions

| Àmbit | Acceptació |
| --- | --- |
| Símbols i estil | Làmina generada amb els 14 símbols, fidel a la llegenda; mateixa primitiva i estil en editor, SVG i PNG. Tir i passada distingibles en blanc i negre i a mida de fitxa. |
| Integració del coneixement | Consulta un cas i una regla per concepte, retorna fonts i estat; reutilitza una validació prèvia i rebutja un candidat com a autoritat suficient per omplir un camp obligatori. |
| Identitat | Còpies temporals, permutes i canvis de marcatge no creen ni intercanvien persones. Un suport extern no altera un 4x4. |
| Recepció i edició | Una sola referència d’estat; moure-la, desar, reobrir i exportar manté connectades totes les accions dependents. |
| Pilota | Possessió i visibilitat coherents; UVOF009, 012 i 015 mantenen els seus fluxos. Rebutja dues possessions simultànies incompatibles. Les fintes no transfereixen la pilota. |
| Àrea i finta | Detecta geometria invàlida tant al tram recte com als arcs; valida el recorregut, la ruptura funcional i la superació, amb toleràncies justificades. |
| Generalitat | Reordenar conjunts de participants no altera la disposició associada. Renombrar IDs opacs manté una geometria equivalent. No apliquis aquesta invariància a seqüències que sí tenen ordre. |
| Mirall declarat | Transforma totes les relacions laterals pertinents i obté l’equivalent; no infereix mà dominant ni tracta qualsevol canvi d’interval com a mirall complet. |
| Decisions | UVOF010/013 respecten les condicions; les alternatives es preserven sense exigir dibuixar-les totes ni concatenar finals incompatibles. |
| Material i àmbit | Distingeix oposició simulada, handicap, límit i referència; cap recompte inventat de participants. |
| Buits i contradiccions | Receptor ambigu, flux absent, acció desconeguda i ancoratge incompatible produeixen diagnòstics localitzats, conservant la part resolta. |
| Versions | Canviar el text marca derivats afectats com a obsolets; reobrir i migrar preserva correccions, fonts i revisions. |
| Circuit real | La interfície i els scripts de regeneració consumeixen el mateix motor i renderer; cap retoc manual dels SVG de demostració. |

Implementa les especificacions `T01`…`T20` de la base com a proves del contracte o de la normalització, adaptades als noms reals del repositori. Els casos externs poden exercitar mecanismes amb fixtures explícites de prova sense convertir-se en tàctica aprovada del corpus operatiu. Si la lectura automàtica d’imatges no existeix, comprova la traducció de llegendes sobre dades estructurades i no declaris implementat un lector visual.

T19 ha de continuar demostrant que importar la base no promociona tot el coneixement. Distingeix l’estat del document de recerca del registre de dades validades activades per l’adaptador nou. Conserva la traçabilitat entre cada `Txx`, la prova executable i el resultat real; no marquis tot el catàleg com a executat en bloc.

Afegeix mutacions negatives que exposin els errors: tir codificat com a passada, participant duplicat, receptor inventat, branques concatenades, ordre de llista que canvia el pivot, corba que entra a l’àrea i resultat `ready` amb obligacions pendents. Evita tests que només reprodueixen les constants del resolutor o confien en el seu propi indicador d’èxit.

Per al text lliure, cobreix almenys tres formulacions equivalents dels casos principals i casos amb dos jugadors del mateix rol. La geometria ha de ser reproduïble amb la mateixa entrada estructurada i versions; no pressuposis determinisme entre noves crides al model.

Executa les proves rellevants i les exigides pel repositori, incloent `python scripts/validate_semantic.py` i `python -m pytest -q` si continuen sent els punts d’entrada vigents. No modifiquis semàntica aprovada, desactivis validadors o afegeixis excepcions per ID per aconseguir una suite verda.

### 10.3 Revisió visual obligatòria

Genera una sola galeria reproduïble amb:

1. La làmina dels 14 símbols i les extensions identificades.
2. A1–A3 abans/després quan existeixi un resultat anterior comparable.
3. Els 15 exercicis interns: resultat actual, complet o parcial, amb fonts i diagnòstics; sense inventar les parts absents.
4. Fases o alternatives seleccionables quan aportin claredat i una mostra de cada família nova implementada.

Obre i inspecciona realment els SVG o les seves captures, tant a mida d’editor com de fitxa i en blanc i negre. Revisa significat de símbols, pilota, direcció de les fletxes, identitats, col·lisions, etiquetes, continuïtat i condicions. Aquesta inspecció tècnica no equival a una nova aprovació tàctica de l’entrenador.

Separa en els informes: interpretació confirmada, composició, geometria verificada, render possible i revisió visual. Una comprovació no implementada o no executada és pendent, mai superada. Publica denominadors clars per exercicis, variants i proves; reconèixer una família d’acció no significa haver dibuixat correctament l’exercici.

## 11. Ordre de treball i definició de complet

Implementa en canvis petits i revisables, però completa els blocs d’aquesta petició que disposen de dades suficients:

1. **Inventari del codi vigent i base de regressió.** Identifica què ja funciona, què falta i les fonts autoritzades. Aquesta anàlisi és l’inici de la implementació.
2. **Simbologia i estil únics.** Primitives compartides, configuració i làmina de verificació; integra-les als punts reals de render.
3. **Coneixement i interpretació.** Carregador, consulta, adaptador amb autoritat per afirmació, proveïdor d’interpretació i diagnòstics.
4. **Geometria i composició.** Correccions A1–A3, accions ampliades, decisions, temps, diverses pilotes i regressions amb exercicis existents.
5. **Ús complet.** Edició amb dependències, revisions, migracions, exportació, galeria i comprovacions finals.

Revisa especialment els equivalents vigents de `interpretation-provider.js`, `state-registry.js`, `ball-flow.js`, `composition-operators.js`, `representation-composer.js`, `spatial-constraints.js`, `generic-geometry-resolver.js`, `visual-grammar.js`, `renderer.js`, `import-export.js`, els esquemes i els scripts de generació. Adapta els noms i l’organització al repositori actual; evita un segon motor paral·lel.

Si apareix una ambigüitat tàctica nova, deixa pendent el camp o la branca afectada amb una pregunta concreta i continua les parts independents. Les mides, els espaiats i altres decisions d’estil es poden resoldre com a política provisional sense tornar a demanar validacions tàctiques ja existents.

Lliura:

- Codi funcional i canvis d’esquema/migració quan calguin, amb compatibilitat comprovada.
- Base de coneixement connectada al circuit real, fonts i aprovacions preservades, i dades activades identificables.
- Símbols unificats i galeria regenerable amb SVG/PNG accessibles per revisar.
- Proves executades amb resultats reals i traçabilitat dels criteris anteriors.
- Documentació existent actualitzada: decisions, contractes, estat actual i instruccions de regeneració. Evita documents manuals duplicats.
- Resum final de què s’ha resolt, quins casos continuen parcials i per quin motiu, què és política visual provisional i quines verificacions no s’han pogut executar.

La feina no es considera completa només perquè els tests passin o el dibuix sigui net: el circuit ha de conservar la tàctica, utilitzar la llegenda de l’entrenador, gestionar les dependències i haver estat inspeccionat visualment. No declaris verificacions que no has fet.
