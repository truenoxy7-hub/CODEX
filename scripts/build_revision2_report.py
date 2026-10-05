#!/usr/bin/env python3
"""Build an evidence-indexed report; never promote technical tests to coach approval."""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reports/revision2"
SOURCE = ROOT / "sources/revision2"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# Specific executable contracts, not a blanket claim that the entire UI criterion passed.
EVIDENCE = {
    "ED01": (["ed_atomic_undo_redo", "ed_pointer_capture", "ed_transform_is_frozen"], ["A_MANUAL"], "Tacte físic i mòbil pendents."),
    "ED02": (["ed_quadratic_shared", "ed_pointer_capture"], ["A_MANUAL", "B_A1"], "Corba sencera lliure no repetida a la UI després de l'últim ajust."),
    "ED03": (["ed_atomic_undo_redo", "ed_copy_remaps"], ["A_MANUAL"], "Nansa de gir pendent de repetició UI; botons i atall observats."),
    "ED04": (["ed_atomic_undo_redo", "gn_three_way", "gn_failed_acceptance"], ["A_MANUAL"], "Desfer/refer regeneració comprovat automàticament, no tot el circuit UI mixt."),
    "ED05": (["ed_transform_is_frozen", "ge_full_court_bottom"], ["A_VIEW"], ""),
    "ED06": (["ed_quadratic_shared"], [], "Snap cobert pel contracte geomètric; ús tàctil i UI no repetits."),
    "ED07": (["ed_pointer_capture", "ed_transform_is_frozen"], ["A_MANUAL"], "Cancel·lació/pèrdua de captura cobertes automàticament."),
    "SV01": (["sv_sqlite_restart", "http_durable_recovery"], ["DURABLE_RESTART"], ""),
    "SV02": (["sv_client_offline", "http_durable_recovery"], ["TWO_SESSIONS"], "Desconnexió/quota cobertes amb doble client, conflicte amb servei real."),
    "SV03": (["sv_all_package_versions", "sv_sqlite_restart"], [], "Migració real idempotent i backup exercitats; importació via UI pendent."),
    "SV04": (["sv_stale_incomplete", "ge_full_court_bottom"], ["A_MANUAL"], ""),
    "EX01": (["ex_clean_export", "ed_temporal_state_has_hitbox"], ["CLEAN_PNG"], "PNG real inspeccionat; baixada SVG UI no confirmada."),
    "EX02": (["ex_png_failures"], ["CLEAN_PNG"], "Imatge real copiada; alternativa PNG preparada, baixada no confirmada."),
    "EX03": (["sv_real_edited_package", "ex_clean_export", "ed_atomic_undo_redo"], ["CLEAN_PNG"], "Roundtrip automatitzat; importació i monocrom a UI pendents."),
    "TH01": (["th_confirmed_model", "ge_full_court_bottom"], ["B_MODEL", "B_A1"], "Selecció d'acció observada; totes les ambigüitats bidireccionals no repetides."),
    "TH02": (["sv_real_edited_package", "sv_stale_incomplete"], ["A_MANUAL"], "Pissarra independent observada; càrrega d'imatge de referència pendent de circuit UI."),
    "GN01": (["ge_full_curves", "a1", "a2", "a3"], ["B_A1", "B_A2", "B_A3"], "Només famílies inicials compatibles, no generació universal."),
    "GN02": (["ed_quadratic_shared", "ed_copy_remaps"], ["B_A1"], ""),
    "GN03": (["gn_three_way", "gn_failed_acceptance", "gn_derived_validation"], ["B_MODEL"], "Correccions mixtes, respostes tardanes i undo provats automàticament; circuit UI complet pendent."),
    "LR01": (["lr_typed_criterion", "sv_real_edited_package"], ["C_LEARNING"], "Aprovació de prova explícita, no autoritat tàctica del corpus."),
    "LR02": (["lr_typed_criterion"], ["C_LEARNING"], "Cas nou UI observat; IDs/posicions nous i mirall verificats amb demo executable."),
    "LR03": (["lr_typed_criterion", "lr_result_constraints"], ["C_LEARNING"], "Revocació observada; incompatibilitat i conflicte de regles exercitats automàticament."),
    "LR04": (["lr_typed_criterion", "lr_result_constraints"], [], "Contracte automàtic: aprovat sense executor no es declara aplicat."),
    "KB01": (["kb_real_index"], [], ""),
    "KB02": (["kb_real_index", "kb_activation_changes"], [], "Catàleg mapejat individualment; no es declaren T01–T20 tots executats."),
    "GE01": (["ge_full_curves", "ge_full_court_bottom"], [], ""),
    "GE02": (["ge_full_curves"], ["B_A2", "B_A3"], ""),
    "VS01": (["ex_clean_export", "temporal", "symbol"], ["CLEAN_PNG"], "14 símbols i estats provats; comparació humana completa color/monocrom pendent."),
    "RG01": (["rg_corpus_qualitative", "kb_activation_changes"], [], "15 fonts preservades; 46 escenes parcials en 12 casos, 0 exercicis complets pel compositor genèric."),
    "UI01": (["ed_atomic_undo_redo", "http_durable_recovery", "lr_typed_criterion"], ["A_MANUAL", "B_A1", "B_A2", "B_A3", "C_LEARNING", "DURABLE_RESTART", "TWO_SESSIONS", "CLEAN_PNG"], "Circuits principals A–C observats; variants enumerades a browser-observations.json encara pendents.")
}

CATALOG = {
    "T01": ([], "pendent", "No s'ha implementat el lector visual de llegendes externes S06/S09."),
    "T02": (["ed_quadratic_shared"], "parcial", "Recepció única/possessió A1 i dependències; no seqüència externa D02 e2–e6 completa."),
    "T03": (["ed_copy_remaps", "rg_corpus_qualitative"], "parcial", "Identitats persistents/còpia de graf; D08 A1/A1_F no traduït completament."),
    "T04": (["rg_corpus_qualitative", "kb_activation_changes"], "parcial", "Variants/fonts no aplanades; selector V_BASE del cas extern D03 pendent."),
    "T05": (["sv_stale_incomplete", "rg_corpus_qualitative"], "parcial", "Buits conservats i cap geometria forçada; adaptació completa D08 pendent."),
    "T06": ([], "pendent", "Motor de desencadenaments externs A_prepares_pass no implementat."),
    "T07": ([], "pendent", "Planificació de repeticions solapades amb recursos no implementada."),
    "T08": (["ed_copy_remaps", "rg_corpus_qualitative"], "parcial", "Pilotes i holder separats; inventari/activació de repeticions D01 pendents."),
    "T09": (["a2", "a3"], "parcial", "2x1 local inicial; suport/porter del cas extern D06 no traduït completament."),
    "T10": (["kb_activation_changes", "rg_corpus_qualitative"], "parcial", "Decisions preservades; execució de tots els camins externs D04 pendent."),
    "T11": ([], "pendent", "Intervals derivats dels dos delimitadors N3 externs no implementats."),
    "T12": (["a2", "a3", "rg_corpus_qualitative"], "parcial", "2x1 obert no força PV; comparativa externa D04/D06 pendent."),
    "T13": (["lr_typed_criterion", "ed_quadratic_shared"], "parcial", "Reflexió relacional/IDs i criteri mirall; no traducció externa D02/D05 completa."),
    "T14": (["rg_corpus_qualitative"], "parcial", "Accions tipades originals preservades; adaptador screen de D07 pendent."),
    "T15": ([], "pendent", "Intercanvi d'assignacions defensives de D07 no resolt."),
    "T16": (["rg_corpus_qualitative"], "parcial", "No exigeix coordenades d'entrada ni les promou a semàntica; layout extern D10 pendent."),
    "T17": (["rg_corpus_qualitative"], "parcial", "Subescenes separades del corpus; F60/F33 externs encara sense adaptador complet."),
    "T18": (["rg_corpus_qualitative"], "parcial", "Funció material original preservada; C_BOUNDARY D04 extern pendent."),
    "T19": (["kb_real_index", "kb_activation_changes"], "verificat", "JSON real: candidates inoperants, runtime_import_allowed false i validacions prèvies selectives amb abast."),
    "T20": (["rg_corpus_qualitative"], "parcial", "No s'infereix tàctica de píxels/interseccions; trajectòries externes D08 no resoltes completament.")
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--node", default="node")
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    xml = ET.parse(OUT / "pytest.xml")
    tests = [{"name": t.get("name"), "class": t.get("classname"), "passed": not any(t.find(x) is not None for x in ("failure", "error", "skipped"))} for t in xml.iter("testcase")]
    if not tests or not all(t["passed"] for t in tests):
        raise SystemExit("Fresh passing pytest.xml required; refusing a green acceptance report")
    def matches(patterns):
        found = [t for t in tests if any(p in t["name"] for p in patterns)]
        for p in patterns:
            if not any(p in t["name"] for t in tests):
                raise ValueError(f"Evidence references missing executable test: {p}")
        return found
    manifest = read(SOURCE / "manifest.json")
    hashes = [{"path": f["path"], "sha256_matches": hashlib.sha256((SOURCE / f["path"]).read_bytes()).hexdigest() == f["sha256"]} for f in manifest["files"]]
    if not all(f["sha256_matches"] for f in hashes):
        raise SystemExit("An original handoff source changed")
    write("source-integrity.json", {"files": hashes, "inaccessible_sources": [], "matches": len(hashes)})
    probe = subprocess.run([args.node, str(SOURCE / "review/reproduce_findings.cjs"), str(ROOT), str(SOURCE / "TRACA_Base_coneixement_grafics_v0_1.json")], cwd=ROOT, capture_output=True, text=True, check=True)
    findings = json.loads(probe.stdout)
    if any(not r["executed"] or r.get("defect_reproduced") is not False for r in findings["results"]):
        raise SystemExit("A supplied baseline defect remains or needs a new checker")
    write("reproduced-findings.json", findings)
    semantic = subprocess.run([sys.executable, "scripts/validate_semantic.py"], cwd=ROOT, capture_output=True, text=True)
    (OUT / "semantic-validation.txt").write_text(semantic.stdout + semantic.stderr, encoding="utf-8")
    if semantic.returncode:
        raise SystemExit("Semantic validation failed")
    browser = read(OUT / "browser-observations.json")
    observed = {v["id"]: v for v in browser["observations"]}
    criteria = []
    for c in read(SOURCE / "review/acceptance.json")["criteria"]:
        patterns, observations, gap = EVIDENCE[c["id"]]
        evidence = matches(patterns)
        criteria.append({"id": c["id"], "scenario": c["scenario"], "status": "parcial" if gap else "verificat", "test_evidence": evidence, "browser_evidence": [observed[i] for i in observations], "scope_or_gap": gap})
    catalog = []
    for item in read(SOURCE / "TRACA_Base_coneixement_grafics_v0_1.json")["test_catalog"]:
        patterns, status, gap = CATALOG[item["id"]]
        catalog.append({"id": item["id"], "title": item["title"], "case_refs": item["case_refs"], "status": status, "external_fixture_executed": item["id"] == "T19", "test_evidence": matches(patterns), "scope_or_gap": gap})
    coverage = read(ROOT / "examples/graphics-gallery/coverage.json")
    write("acceptance.json", {"format":"TRACA_revision2_results", "date":browser["date"], "technical_tests_not_coach_approval":True, "pytest_total":len(tests), "pytest_failed":0, "semantic_validation_exit":semantic.returncode, "source_hashes_match":len(hashes), "criteria":criteria, "test_catalog":catalog, "corpus_totals":coverage["totals"], "corpus_cases":coverage["exercises"]})
    lines = ["# TRAÇA — resultats de la revisió 2", "", "Implementació funcional de la pissarra prioritària, persistència SQLite local, exportació neta, regeneració amb revisió i aprenentatge tipat. Es conserven el corpus i les aprovacions tàctiques prèvies; les aprovacions de les proves no són coneixement tàctic nou.", "", f"Resultat executable: **{len(tests)} proves passades**, 0 fallades; validació semàntica amb sortida 0. **{len(hashes)}/{len(hashes)} fonts originals** coincideixen amb els SHA-256 del paquet; cap font inaccessible. Els quatre defectes del script de revisió ja no es reprodueixen.", "", "## Obrir l'aplicació", "", "Des del directori CODEX:", "", "```sh", "python3 scripts/workspace_server.py --port 8000", "```", "", "Obre http://127.0.0.1:8000/interface/. No obris index.html amb file://: la persistència durable necessita el servei. Alternativa: `make interface`. Python 3.11+; el servei és de biblioteca estàndard. La base és `.traca-data/workspace.sqlite3` (ignorada per Git). Guarda aquest fitxer amb el servei aturat si vols una còpia de seguretat; els paquets editables són una altra via portable.", "", "El servei de lliurament no carrega criteris de prova ni un model fictici. Sense model configurat pots crear i editar la pissarra, guardar, importar i exportar. Si uses el proxy, la clau viu només al servidor; consulta `docs/GRAPHICS_ENGINE.md`. Connexió amb model remot real no verificada perquè no hi ha credencials.", "", "## Comprovar els circuits", "", "- A: Pissarra manual → afegir les sis figures → corba/passada → moure els tres controls → banc 10° i atall 5° → duplicar/simetria → desfer/refer → guardar → recarregar → exportar PNG/SVG.", "- B: Text A1/A2/A3 → generar → seleccionar la recepció futura i moure-la → revisar dependències → regenerar → comparar i escollir cada conflicte o cancel·lar.", "- C: Correcció → registrar criteri → revisar condicions/efecte/abast → aprovar → cas nou compatible → comprovar font i canvi real → revocar. No aprovis una fixture tècnica com a consigna esportiva.", "", "Les observacions reals i els passos no observats són a [browser-observations.json](browser-observations.json). Les captures precedeixen alguns ajustos finals; no s'ha fingit una repetició UI quan es va perdre el navegador controlable.", "", "## Acceptació individual", "", "`verificat` = contracte executat i evidència indicada; `parcial` = part executada, limitació concreta. No equival a homologació en tots els dispositius.", "", "| ID | Estat | Evidència / límit |", "| --- | --- | --- |"]
    for c in criteria:
        names = ", ".join(t["name"] for t in c["test_evidence"])
        lines.append(f"| {c['id']} | {c['status']} | {c['scope_or_gap'] or c['scenario']} Proves: {names}. UI: {', '.join(v['id'] for v in c['browser_evidence']) or 'no repetida'} |")
    lines += ["", "## Catàleg T01–T20", "", "La font conté especificacions, no vint proves ja executades. Es conserva intacta. Aquesta taula separa la fixture externa exacta dels contractes equivalents parcials del motor.", "", "| ID | Especificació | Estat | Abast executat / pendent |", "| --- | --- | --- | --- |"]
    for c in catalog:
        lines.append(f"| {c['id']} | {c['title']} | {c['status']} | {c['scope_or_gap']} |")
    total = coverage["totals"]
    lines += ["", "## Corpus: denominadors i resultats", "", f"{total['generated_scenes']} escenes de flux de pilota realment resoltes, en {total['generic_geometry_partial']}/15 exercicis. **0/15 exercicis complets** amb el compositor genèric. La geometria canònica UVOF015 és un espècimen separat: no s'utilitza per inflar aquesta cobertura.", "", "| Exercici | Escenes | Estat complet | Operadors o informació pendent |", "| --- | ---: | --- | --- |"]
    for c in coverage["exercises"]:
        pending = "; ".join(c["missing_information"] + ["Operador no implementat: " + x for x in c["unsupported"]])
        lines.append(f"| {c['exercise_id']} | {c.get('geometry_scenes',0)} | {c['geometry_status']} | {pending} |")
    lines += ["", "Els layouts parcials són inferències visuals provisionals; no satisfan totes les zones, fases o condicionals del cas original. El paquet de cada subescena conserva la semàntica i el contracte originals complets. L'absència de coordenades d'entrada no s'utilitza com a diagnòstic de bloqueig.", "", "## Exemple executable del segon cas", "", "[criterion-result.json](demo/criterion-result.json): criteri relatiu de recepció, nou TacticalIR amb IDs CE/L/B1/A001/A002 renombrats i posicions inicials diferents; efecte observable i mirall relacional. Candidat sense aprovació i criteri revocat no operen. Autor: TEST_FIXTURE_NOT_COACH.", "", "- [Abans](demo/second-before.svg), [després](demo/second-after.svg), [mirall](demo/mirror-after.svg).", "- [Paquet origen editable](demo/source-training-case.json) i [segon cas editable](demo/second-training-case.json).", "- [Captura del segon cas a l'app](screenshots/criterion-second-case.jpg).", "", "## Captures i exportació reals", "", "![Pissarra manual a l'app](screenshots/manual-board.jpg)", "", "![Criteri aplicat al segon cas](screenshots/criterion-second-case.jpg)", "", "![Exportació PNG neta de 600 px](exports/manual-fitxa.png)", "", "Altres captures: [A2](screenshots/a2-generated.jpg), [A3](screenshots/a3-generated.jpg), [model tècnic confirmat](screenshots/model-confirmed.jpg), [conflicte de desament](screenshots/save-conflict.jpg). No són les imatges de baseline incloses al ZIP.", "", "## Decisions i límits", "", "- Geometria, semàntica i render separats; cap canvi tàctic introduït per fer passar proves. Política visual provisional explícita. Material no es converteix en defensor sense funció declarada.", "- Historial atòmic de 50 passos; drafts incomplets/geomètricament invàlids guardables, no aprovables implícitament. Eliminar referències trencades les conserva com a diagnòstics; encara no hi ha una previsualització d'impacte abans d'eliminar.", "- SQLite local amb revisions, backups idempotents i conflicte 409 sense sobreescriptura silenciosa. No és servei remot multiusuari. Revisions històriques recuperables per API/UI.", "- Revocacions conegudes no tornen a executar-se en reobrir un paquet antic. No hi ha un registre global de revocacions entre sessions independents que no s'hagin sincronitzat.", "- Executor inicial: posició relativa vinculada i comprovació de finta. Criteris sense executor romanen aprovats però pendents, mai aplicats fictíciament. No s'executa codi arbitrari dels criteris.", "- Cobertura automàtica inicial de passada/recepció/finta/2x1 obert. Convé l'entrenador per les ambigüitats tàctiques i adaptar més marcs relacionals; l'editor manual no depèn d'això.", "- Tacte físic/mòbil, tots els passos UI enumerats i connexió a model real pendents. Porta-retalls verificat amb PNG real; baixada d'arxius UI no confirmada.", "", "## Reproduir les proves", "", "```sh", "python3 -m pip install -r requirements-dev.txt", "python3 scripts/validate_semantic.py", "python3 -m pytest -q --junitxml=reports/revision2/pytest.xml", "node scripts/build_revision2_demo.js", "python3 scripts/build_revision2_report.py --node node", "```", "", "Cal Node disponible per les proves JS. En aquest entorn s'ha utilitzat el Python de `/private/tmp/traca-integral-venv` i el Node bundled de Codex. Les proves HTTP han obert serveis loopback reals. [JUnit](pytest.xml), [validació semàntica](semantic-validation.txt), [defectes reproduïts](reproduced-findings.json), [integritat de fonts](source-integrity.json), [resultats estructurats](acceptance.json).", ""]
    # requirements-dev filename is resolved from the repository, not invented.
    requirements = "requirements-dev.txt" if (ROOT / "requirements-dev.txt").exists() else "requirements.txt"
    text = "\n".join(lines).replace("-r requirements-dev.txt", f"-r {requirements}")
    # The service serves interface as its root, not as a nested /interface path.
    text = text.replace("http://127.0.0.1:8000/interface/", "http://127.0.0.1:8000/")
    (OUT / "RESULTATS.md").write_text(text, encoding="utf-8")
    print(json.dumps({"pytest":len(tests), "source_integrity":len(hashes), "criteria":dict(Counter(c["status"] for c in criteria)), "catalog":dict(Counter(c["status"] for c in catalog)), "report":str(OUT / "RESULTATS.md")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
