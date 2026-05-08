// n8n Code node: Prepare Error Alert
// This file is a TypeScript function body. Top-level return is expected.

const execution = $json.execution ?? {};
const workflow = $json.workflow ?? {};
const error = execution.error ?? $json.error ?? {};
const failedNode = execution.lastNodeExecuted || error.node?.name || "unknown";
const message =
  error.description || error.message || error.cause?.message || error.cause || "unknown error";

const lines = [
  "n8n workflow error",
  `workflow: ${workflow.name || workflow.id || "unknown"}`,
  `node: ${failedNode}`,
  `message: ${message}`,
  execution.id ? `executionId: ${execution.id}` : "",
  execution.url ? `url: ${execution.url}` : "",
];

return {
  json: {
    alertText: lines.filter(Boolean).join("\n").slice(0, 3500),
  },
};
