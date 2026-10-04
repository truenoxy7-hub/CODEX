(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const api = factory();
  if (isNode) module.exports = api;
  root.TRACA_MODEL_INTERPRETATION_PROVIDER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function validateProposal(value) {
    const errors = [];
    if (!value || typeof value !== "object" || Array.isArray(value)) errors.push("PROPOSAL_OBJECT_REQUIRED");
    if (!Array.isArray(value && value.participants)) errors.push("PARTICIPANTS_REQUIRED");
    if (!Array.isArray(value && value.actions)) errors.push("ACTIONS_REQUIRED");
    (value && value.actions || []).forEach((action, index) => {
      if (!action.id || !action.type) errors.push(`ACTION_ID_TYPE_REQUIRED:${index}`);
      if (!Array.isArray(action.evidence_spans) || !action.evidence_spans.length) errors.push(`ACTION_EVIDENCE_REQUIRED:${action.id || index}`);
    });
    return { valid: errors.length === 0, errors };
  }

  function create(options) {
    const configuration = options || {};
    if (typeof configuration.invoke !== "function") throw new Error("MODEL_INVOKE_REQUIRED");
    return {
      async interpret(input) {
        const proposal = await configuration.invoke({
          task: "traca_tactical_ir_proposal",
          provider: configuration.provider || "configured_provider",
          model: configuration.model || null,
          description: String(input && input.description || ""),
          schema: { participants: "array", actions: "array with evidence_spans", unresolved: "array" }
        });
        const validation = validateProposal(proposal);
        if (!validation.valid) return { status: "rejected", provider: configuration.provider || "configured_provider", validation, proposal: null };
        return {
          status: "model_proposal",
          authority: "provisional_model_output",
          requires_coach_validation: true,
          provider: configuration.provider || "configured_provider",
          model: configuration.model || null,
          validation,
          proposal
        };
      }
    };
  }

  return { validateProposal, create };
});
