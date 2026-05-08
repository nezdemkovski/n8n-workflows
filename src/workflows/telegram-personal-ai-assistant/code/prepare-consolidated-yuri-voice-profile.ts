// n8n Code node: Prepare Consolidated Yuri Voice Profile
// This file is a TypeScript function body. Top-level return is expected.

const text = $json.text || $json.output || "";
const original = $("Prepare Yuri Voice Profile Upsert").item.json;
const marker = "RECENT_STYLE_EXAMPLES:";
const hasModelOutput = text.trim().length > 0;

function capBullets(value: string, maxBullets: number, maxChars: number) {
  const lines = String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const header = lines.find((line) => !line.startsWith("-")) || "";
  const bullets = lines.filter((line) => line.startsWith("-")).slice(0, maxBullets);
  const result = [header, ...bullets].filter(Boolean).join("\n");
  return result.length > maxChars ? result.slice(0, maxChars).trim() : result;
}

const profileRaw = text.includes(marker) ? text.split(marker)[0].trim() : text.trim();
const examplesRaw = text.includes(marker)
  ? text.split(marker).slice(1).join(marker).trim()
  : original.recentExamples;
return {
  json: {
    profileKey: "yuri_voice",
    profileText: capBullets(profileRaw || original.profileText, 10, 2000),
    recentExamples: capBullets(examplesRaw, 5, 1000),
    observationBuffer: original.observationBuffer,
    messageCount: original.messageCount,
    observationsSinceConsolidation: hasModelOutput ? 0 : original.observationsSinceConsolidation,
    lastUpdatedAt: new Date().toISOString(),
  },
};
