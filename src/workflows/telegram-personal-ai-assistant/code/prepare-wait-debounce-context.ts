// n8n Code node: Prepare Wait Debounce Context
// This file is a TypeScript function body. Top-level return is expected.

const pending = $("Prepare Pending Message Upsert").item.json;
const settings = Object.fromEntries(
  $items("Load Debounce Setting For Wait")
    .map((item) => item.json ?? {})
    .filter((row) => row.settingKey)
    .map((row) => [String(row.settingKey), String(row.settingValue ?? "")]),
);
const raw = Number(settings.autoReplyDebounceSeconds ?? 15);
const debounceSeconds = Number.isFinite(raw) && raw >= 0 ? raw : 15;
return [{ json: { ...pending, settings, debounceSeconds } }];
