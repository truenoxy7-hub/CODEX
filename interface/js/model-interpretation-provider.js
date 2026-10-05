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
    const nodes = new Set();
    ["participants", "participant_states", "materials", "spaces", "balls", "actions", "relations", "decisions", "phases"].forEach(key => {
      if (value && value[key] !== undefined && !Array.isArray(value[key])) { errors.push(`COLLECTION_ARRAY_REQUIRED:${key}`); return; }
      (value && value[key] || []).forEach(item => {
        if (!item || typeof item !== "object" || !item.id) errors.push(`RECORD_ID_REQUIRED:${key}`);
        else if (nodes.has(item.id)) errors.push(`DUPLICATE_PROPOSAL_ID:${item.id}`);
        else nodes.add(item.id);
      });
    });
    (Array.isArray(value && value.actions) ? value.actions : []).filter(action => action && typeof action === "object").forEach((action, index) => {
      if (!action.id || !action.type) errors.push(`ACTION_ID_TYPE_REQUIRED:${index}`);
      if (!Array.isArray(action.evidence_spans) || !action.evidence_spans.length) errors.push(`ACTION_EVIDENCE_REQUIRED:${action.id || index}`);
      ["actor_ref", "receiver_ref", "ball_ref", "opponent_ref", "target_space_ref"].forEach(key => { if (action[key] && !nodes.has(action[key])) errors.push(`PROPOSAL_REFERENCE_NOT_FOUND:${action.id}:${key}`); });
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
        const description = String(input && input.description || "");
        (proposal && proposal.actions || []).forEach((action) => {
          (action.evidence_spans || []).forEach((span) => {
            const text = typeof span === "string" ? span : span && span.text;
            if (!text || !description.includes(text)) validation.errors.push(`EVIDENCE_NOT_IN_SOURCE:${action.id}`);
          });
        });
        validation.valid = !validation.errors.length;
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
