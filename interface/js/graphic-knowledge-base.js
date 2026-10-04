(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const api = factory();
  if (isNode) module.exports = api;
  root.TRACA_GRAPHIC_KNOWLEDGE_BASE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const OPERATIONAL_STATUSES = new Set(["confirmada_per_entrenador", "confirmada_per_ambdós", "validated"]);
  const NON_OPERATIONAL_STATUSES = new Set(["observació_repetida", "candidat", "candidate", "ambigua", "ambiguous", "superada", "superseded"]);
  const COLLECTIONS = ["entities", "cases", "internal_cases", "external_cases", "rules", "tests", "evidence", "evidence_records", "case_index", "reuse_guides"];

  function records(source) {
    return COLLECTIONS.flatMap((collection) => Array.isArray(source && source[collection])
      ? source[collection].map((record) => ({ collection, record })) : []);
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
      else if (seen.has(id)) errors.push({ code: "DUPLICATE_ID", path: `$.${collection}[${index}]`, message: `${id} ja existeix a ${seen.get(id)}.` });
      else seen.set(id, `$.${collection}[${index}]`);
      if (record && NON_OPERATIONAL_STATUSES.has(record.status) && record.runtime_authority === "operational") {
        errors.push({ code: "NON_OPERATIONAL_AUTHORITY", path: `$.${collection}[${index}].runtime_authority`, message: `${record.status} no pot ser autoritat operativa.` });
      }
    });
    if (!Array.isArray(source.case_index)) warnings.push({ code: "CASE_INDEX_UNAVAILABLE", path: "$.case_index", message: "No es pot executar el catàleg D01–D10 sense case_index." });
    if (!Array.isArray(source.tests)) warnings.push({ code: "TEST_CATALOG_UNAVAILABLE", path: "$.tests", message: "No es pot executar el catàleg T01–T20 sense tests." });
    return { valid: errors.length === 0, errors, warnings, summary: { records: records(source).length, unique_ids: seen.size, runtime_import_allowed: importAllowed } };
  }

  function query(source, term) {
    const needle = String(term || "").trim().toLocaleLowerCase("ca");
    if (!needle) return [];
    return records(source).flatMap(({ collection, record }) => {
      const haystack = JSON.stringify(record).toLocaleLowerCase("ca");
      if (!haystack.includes(needle)) return [];
      return [{ collection, id: recordId(record), status: record.status || "unspecified", authority: record.authority || null, source_refs: record.source_refs || record.evidence_refs || [], record }];
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
      if (!OPERATIONAL_STATUSES.has(record.status)) {
        rejected.push({ id, collection, status: record.status || "unspecified", reason: "ASSERTION_NOT_OPERATIONAL" });
        return;
      }
      facts.push({ ...record, id, source_collection: collection, runtime_authority: "explicitly_activated", source_refs: record.source_refs || record.evidence_refs || [id] });
    });
    return { status: "selective_adapter", facts, rejected, report, mass_import: false };
  }

  return { OPERATIONAL_STATUSES, NON_OPERATIONAL_STATUSES, validate, query, adaptOperational };
});
