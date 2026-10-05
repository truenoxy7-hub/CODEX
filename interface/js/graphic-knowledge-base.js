(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const api = factory();
  if (isNode) module.exports = api;
  root.TRACA_GRAPHIC_KNOWLEDGE_BASE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const OPERATIONAL_STATUSES = new Set(["confirmada_per_entrenador", "confirmada_per_ambdós", "validated"]);
  const NON_OPERATIONAL_STATUSES = new Set(["observació_repetida", "candidat", "candidate", "ambigua", "ambiguous", "superada", "superseded"]);
  const COLLECTIONS = ["entities", "cases", "internal_cases", "external_cases", "rules", "tests", "evidence", "evidence_records", "reuse_guides", "candidate_rules", "test_catalog", "sources", "canonical_visual_reference.symbols", "internal_corpus.cases", "internal_corpus.evidence", "internal_corpus.coach_validations", "internal_corpus.consolidated_patterns"];
  function at(source, path) { return path.split(".").reduce((v, key) => v && v[key], source); }
  function status(record) { return record.consolidated_status || record.status || record.status_from_consolidation || "unspecified"; }
  function operational(record) { return OPERATIONAL_STATUSES.has(status(record)) || ["CONFIRMADA PER AMBDÓS", "CONFIRMADA PER ENTRENADOR", "prior_explicit_coach_validation_documented", "confirmed_source_shape"].includes(status(record)); }

  function records(source) {
    return COLLECTIONS.flatMap((collection) => Array.isArray(at(source, collection))
      ? at(source, collection).map((record) => ({ collection, record })) : []);
  }

  function recordId(record) {
    return record && (record.id || record.uid || record.case_id || record.rule_id || record.test_id) || null;
  }

  function validate(source) {
    const errors = [], warnings = [];
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      return { valid: false, errors: [{ code: "SOURCE_OBJECT_REQUIRED", path: "$", message: "La base ha de ser un objecte JSON." }], warnings, summary: { records: 0 } };
    }
    if (!source.meta || typeof source.meta !== "object") errors.push({ code: "META_REQUIRED", path: "$.meta", message: "Falta la metainformació de la base." });
    const importAllowed = source.runtime_import_allowed === true || source.meta && source.meta.runtime_import_allowed === true;
    if (importAllowed) errors.push({ code: "MASS_IMPORT_FORBIDDEN", path: "$.runtime_import_allowed", message: "La base no pot autoritzar una importació massiva al runtime." });
    const seen = new Map();
    records(source).forEach(({ collection, record }, index) => {
      const id = recordId(record);
      if (!id) errors.push({ code: "RECORD_ID_REQUIRED", path: `$.${collection}[${index}]`, message: "El registre no té identificador estable." });
      else if (seen.has(`${collection}:${id}`)) errors.push({ code: "DUPLICATE_ID", path: `$.${collection}[${index}]`, message: `${id} repetit al mateix espai de noms.` });
      else seen.set(`${collection}:${id}`, `$.${collection}[${index}]`);
      if (record && NON_OPERATIONAL_STATUSES.has(record.status) && record.runtime_authority === "operational") {
        errors.push({ code: "NON_OPERATIONAL_AUTHORITY", path: `$.${collection}[${index}].runtime_authority`, message: `${record.status} no pot ser autoritat operativa.` });
      }
    });
    if (!Array.isArray(source.case_index)) warnings.push({ code: "CASE_INDEX_UNAVAILABLE", path: "$.case_index", message: "No es pot executar el catàleg D01–D10 sense case_index." });
    if (!Array.isArray(source.test_catalog) && !Array.isArray(source.tests)) warnings.push({ code: "TEST_CATALOG_UNAVAILABLE", path: "$.test_catalog", message: "Falta el catàleg de proves." });
    if (source.meta && source.meta.format === "TRACA_graphic_research_corpus" && source.meta.version !== "0.2.0") errors.push({ code: "VERSION_UNSUPPORTED", path: "$.meta.version" });
    const all = new Set(records(source).map(({ record }) => recordId(record)));
    if (source.internal_corpus && source.internal_corpus.source) all.add(source.internal_corpus.source.id);
    (source.case_index || []).forEach((entry, index) => {
      if (!entry.json_pointer) return;
      const referenced = entry.json_pointer.split("/").slice(1).reduce((v, key) => v && v[key.replace(/~1/g, "/").replace(/~0/g, "~")], source);
      if (!referenced || referenced.id !== entry.id) errors.push({ code: "CASE_INDEX_REFERENCE_INVALID", path: `$.case_index[${index}]` });
    });
    records(source).forEach(({ collection, record }) => {
      ["case_refs", "internal_case_refs", "external_case_refs", "evidence_refs", "test_refs", "acceptance_test_refs", "related_research_rule_refs"].forEach((key) => {
        (record[key] || []).forEach((ref) => { if (!all.has(ref) && source.internal_corpus) errors.push({ code: "REFERENCE_NOT_FOUND", path: `${collection}:${recordId(record)}.${key}`, ref }); });
      });
    });
    const counts = (source.internal_corpus && source.internal_corpus.evidence || []).reduce((result, record) => { result[status(record)] = (result[status(record)] || 0) + 1; return result; }, {});
    if (source.internal_corpus) Object.entries(source.internal_corpus.evidence_status_counts || {}).forEach(([key, count]) => { if (counts[key] !== count) errors.push({ code: "EVIDENCE_COUNT_MISMATCH", path: key }); });
    return { valid: errors.length === 0, errors, warnings, summary: { records: records(source).length, unique_ids: seen.size, evidence_status_counts: counts, runtime_import_allowed: importAllowed } };
  }

  function query(source, term) {
    const needle = String(term || "").trim().toLocaleLowerCase("ca");
    if (!needle) return [];
    return records(source).flatMap(({ collection, record }) => {
      const haystack = JSON.stringify(record).toLocaleLowerCase("ca");
      if (!haystack.includes(needle)) return [];
      return [{ collection, id: recordId(record), status: status(record), authority: record.authority || null, scope: record.status_scope || record.scope || record.tactical_scope_or_limit || record.validated_statement || null, source_refs: record.source_refs || record.evidence_refs || (record.source_ref ? [record.source_ref] : []), record }];
    });
  }

  function adaptOperational(source, activationRegistry) {
    const report = validate(source);
    if (!report.valid) return { status: "rejected", facts: [], rejected: [], report };
    const activated = new Set((activationRegistry && activationRegistry.activated_records || []).map((item) => typeof item === "string" ? item : item.id));
    const facts = [], rejected = [];
    records(source).forEach(({ collection, record }) => {
      const id = recordId(record);
      if (!activated.has(id)) return;
      if (!operational(record)) {
        rejected.push({ id, collection, status: record.status || "unspecified", reason: "ASSERTION_NOT_OPERATIONAL" });
        return;
      }
      facts.push({ ...record, id, assertion: record.validated_statement || record.consolidation_reason || record.meaning || record.definition || null, scope: record.status_scope || record.scope || "claim_only", source_collection: collection, runtime_authority: "explicitly_activated", source_refs: record.source_refs || record.evidence_refs || (record.source_ref ? [record.source_ref] : [id]) });
    });
    return { status: "selective_adapter", facts, rejected, report, mass_import: false };
  }

  return { OPERATIONAL_STATUSES, NON_OPERATIONAL_STATUSES, validate, query, adaptOperational, records, operational };
});
