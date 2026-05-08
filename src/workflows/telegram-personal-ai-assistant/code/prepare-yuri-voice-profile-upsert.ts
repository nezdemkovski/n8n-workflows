// n8n Code node: Prepare Yuri Voice Profile Upsert
// This file is a TypeScript function body. Top-level return is expected.

const text = $json.text || $json.output || "";
const gate = $("Apply Hybrid Reply Gate").item.json;
const examplesMarker = "RECENT_STYLE_EXAMPLES:";
const observationMarker = "OBSERVATION:";

function afterMarker(source: string, marker: string) {
  return source.includes(marker) ? source.split(marker).slice(1).join(marker).trim() : "";
}

const profileRaw = text.includes(examplesMarker)
  ? text.split(examplesMarker)[0].trim()
  : text.trim();
const examplesPart = afterMarker(text, examplesMarker);
const examplesRaw = examplesPart.includes(observationMarker)
  ? examplesPart.split(observationMarker)[0].trim()
  : examplesPart.trim() || gate.voiceRecentExamples || "";
const observationRaw = afterMarker(text, observationMarker);

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

function normalizeBullets(value: string) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"));
}

const existingObservations = normalizeBullets(gate.voiceObservationBuffer);
const newObservations = normalizeBullets(observationRaw);
const observationBuffer = [...existingObservations, ...newObservations].slice(-30).join("\n");
const observationsSinceConsolidation =
  Number(gate.observationsSinceConsolidation || 0) + newObservations.length;

return {
  json: {
    profileKey: "yuri_voice",
    profileText: capBullets(profileRaw, 12, 2400),
    recentExamples: capBullets(examplesRaw, 6, 1200),
    observationBuffer,
    messageCount: Number(gate.voiceMessageCount || 0) + 1,
    observationsSinceConsolidation,
    shouldConsolidate: observationsSinceConsolidation >= 20,
    lastUpdatedAt: new Date().toISOString(),
  },
};
