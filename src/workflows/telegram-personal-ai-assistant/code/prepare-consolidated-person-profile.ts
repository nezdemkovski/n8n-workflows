// n8n Code node: Prepare Consolidated Person Profile
// This file is a TypeScript function body. Top-level return is expected.

const text = $json.text || $json.output || "";
const original = $("Prepare Memory Upsert").item.json;

function extractSection(source: string, marker: string) {
  if (!source.includes(marker)) return source.trim();
  return source.split(marker).slice(1).join(marker).trim();
}

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

return {
  json: {
    ...original,
    personProfile: capBullets(extractSection(text, "PERSON_PROFILE:"), 8, 1600),
    personObservationsSinceConsolidation: 0,
    personProfileUpdatedAt: new Date().toISOString(),
  },
};
