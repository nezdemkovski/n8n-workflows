// n8n Code node: Handle Owner AI Command
// This file is a TypeScript function body. Top-level return is expected.

function firstJson(nodeName: string) {
  try {
    return $items(nodeName)[0]?.json ?? {};
  } catch (_) {
    return {};
  }
}

function settingsFromRows(rows: Array<{ json?: Record<string, unknown> }>) {
  return Object.fromEntries(
    rows
      .map((item) => item.json ?? {})
      .filter((row) => row.settingKey)
      .map((row) => [String(row.settingKey), String(row.settingValue ?? "")]),
  );
}

function integerInRange(value: string | undefined, min: number, max: number) {
  if (value == null || value.trim() === "") return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;

  return parsed;
}

const normalize = firstJson("Normalize Telegram Update");
const settings = settingsFromRows($items("Load Assistant Settings For Command"));
const text = String(normalize.userText || "").trim();
const [, actionRaw = "status", valueRaw] = text.split(/\s+/);
const action = actionRaw.toLowerCase();

let settingKey = "";
let settingValue = "";
let replyText = "";

if (action === "on") {
  settingKey = "autoReplyEnabled";
  settingValue = "true";
  replyText = "ok, auto-reply включен";
} else if (action === "off") {
  settingKey = "autoReplyEnabled";
  settingValue = "false";
  replyText = "ok, auto-reply выключен";
} else if (action === "quiet") {
  const minutes = integerInRange(valueRaw, 0, 1440);
  if (minutes == null) {
    replyText = "формат: /ai quiet 10\nчисло минут от 0 до 1440";
  } else {
    settingKey = "quietAfterOwnerActivityMinutes";
    settingValue = String(minutes);
    replyText = `ok, quiet window = ${minutes} min`;
  }
} else if (action === "debounce") {
  const seconds = integerInRange(valueRaw, 0, 300);
  if (seconds == null) {
    replyText = "формат: /ai debounce 15\nчисло секунд от 0 до 300";
  } else {
    settingKey = "autoReplyDebounceSeconds";
    settingValue = String(seconds);
    replyText = `ok, debounce = ${seconds} sec`;
  }
} else if (action === "status") {
  replyText = [
    "ai settings:",
    `autoReplyEnabled=${settings.autoReplyEnabled ?? "true"}`,
    `quietAfterOwnerActivityMinutes=${settings.quietAfterOwnerActivityMinutes ?? "10"}`,
    `autoReplyDebounceSeconds=${settings.autoReplyDebounceSeconds ?? "15"}`,
  ].join("\n");
} else {
  replyText = [
    "команды:",
    "/ai on",
    "/ai off",
    "/ai quiet 10",
    "/ai debounce 15",
    "/ai status",
  ].join("\n");
}

return [
  {
    json: {
      ...normalize,
      commandText: text,
      settings,
      settingKey,
      settingValue,
      needsSettingsUpsert: Boolean(settingKey),
      replyText,
    },
  },
];
