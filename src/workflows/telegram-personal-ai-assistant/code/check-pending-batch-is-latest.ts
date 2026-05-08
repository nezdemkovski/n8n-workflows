// n8n Code node: Check Pending Batch Is Latest
// This file is a TypeScript function body. Top-level return is expected.

const original = $("Prepare Wait Debounce Context").item.json;
const row = $("Reload Pending Row After Wait").item.json || {};
const currentVersion = row.pendingBatchVersion || "";
const originalVersion = original.pendingBatchVersion || "";
const count = Number(row.pendingMessageCount || 0);
return {
  json: {
    ...row,
    originalPendingBatchVersion: originalVersion,
    isLatestPendingBatch: Boolean(
      originalVersion && currentVersion === originalVersion && count > 0,
    ),
  },
};
