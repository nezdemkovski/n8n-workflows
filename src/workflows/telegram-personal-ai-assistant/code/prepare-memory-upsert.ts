// n8n Code node: Prepare Memory Upsert
// This file is a TypeScript function body. Top-level return is expected.

const text = $json.text || $json.output || "";
const gate = $("Apply Hybrid Reply Gate").item.json;

function extractSection(source: string, marker: string, nextMarkers: string[] = []) {
  if (!source.includes(marker)) return "";

  let value = source.split(marker).slice(1).join(marker);
  for (const next of nextMarkers) {
    if (value.includes(next)) value = value.split(next)[0];
  }
  return value.trim();
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

function normalizeObservationBullets(value: string) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .filter(
      (line) =>
        !/^[-\s]*(none|no new|nothing|empty|нет|ничего|без изменений|нет новых)/i.test(line),
    );
}

function getAssistantReply() {
  try {
    return $("Generate Assistant Reply").item.json.output || "";
  } catch (_) {
    return "";
  }
}

const summaryRaw =
  extractSection(text, "MEMORY_SUMMARY:", ["PERSON_PROFILE:", "PERSON_OBSERVATION:"]) || text;
const personProfileRaw =
  extractSection(text, "PERSON_PROFILE:", ["PERSON_OBSERVATION:"]) || gate.personProfile || "";
const observationRaw = extractSection(text, "PERSON_OBSERVATION:");
const existingObservations = normalizeObservationBullets(gate.personObservationBuffer);
const newObservations = normalizeObservationBullets(observationRaw);
const personObservationBuffer = [...existingObservations, ...newObservations].slice(-30).join("\n");
const personObservationsSinceConsolidation =
  Number(gate.personObservationsSinceConsolidation || 0) + newObservations.length;

return {
  json: {
    sessionKey: gate.sessionKey,
    chatId: gate.chatId,
    username: gate.username || "",
    senderName: gate.senderName,
    summary: capBullets(summaryRaw, 10, 2200),
    personProfile: capBullets(personProfileRaw, 8, 1600),
    personObservationBuffer,
    personObservationsSinceConsolidation,
    shouldConsolidatePersonProfile: personObservationsSinceConsolidation >= 20,
    personProfileUpdatedAt: new Date().toISOString(),
    lastUserMessage: gate.userText,
    lastAssistantReply: getAssistantReply(),
    isFromOwner: Boolean(gate.isFromOwner),
  },
};
