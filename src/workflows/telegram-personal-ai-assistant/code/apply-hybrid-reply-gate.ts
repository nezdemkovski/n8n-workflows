// n8n Code node: Apply Hybrid Reply Gate
// This file is a TypeScript function body. Top-level return is expected.

function firstJson(name: string) {
  try {
    return $items(name)[0]?.json ?? {};
  } catch (_) {
    return {};
  }
}

function settingsFromRows(rows): Record<string, string> {
  return Object.fromEntries(
    rows
      .map((item) => item.json ?? {})
      .filter((row) => row.settingKey)
      .map((row) => [String(row.settingKey), String(row.settingValue ?? "")]),
  );
}

const normalize = firstJson("Build Pending Batch");
const memory = firstJson("Load Long Term Memory");
const voice = firstJson("Load Yuri Voice Profile");
const personalContext = firstJson("Load Yuri Personal Context");
const settings = settingsFromRows($items("Load Assistant Settings"));
const autoReplyEnabled = String(settings.autoReplyEnabled ?? "true").toLowerCase() === "true";
const quietMinutesRaw = Number(settings.quietAfterOwnerActivityMinutes ?? 10);
const quietMinutes =
  Number.isFinite(quietMinutesRaw) && quietMinutesRaw >= 0 ? quietMinutesRaw : 10;
const lastOwnerMessageAt = settings.lastOwnerMessageAt ?? "";
const lastOwnerTs = lastOwnerMessageAt ? Date.parse(lastOwnerMessageAt) : 0;
const nowTs = Date.now();
const quietUntilTs = lastOwnerTs ? lastOwnerTs + quietMinutes * 60 * 1000 : 0;
const quietActive = Boolean(!normalize.isFromOwner && lastOwnerTs && nowTs < quietUntilTs);
const shouldAutoReply = Boolean(normalize.shouldReply && autoReplyEnabled && !quietActive);
const shouldMemoryOnly = Boolean(normalize.shouldUpdateMemory && !shouldAutoReply);
return [
  {
    json: {
      ...normalize,
      memorySummary: memory.summary || "",
      personProfile: memory.personProfile || "",
      personObservationBuffer: memory.personObservationBuffer || "",
      personObservationsSinceConsolidation: Number(
        memory.personObservationsSinceConsolidation || 0,
      ),
      settings,
      autoReplyEnabled,
      quietMinutes,
      lastOwnerMessageAt,
      quietActive,
      quietUntil: quietUntilTs ? new Date(quietUntilTs).toISOString() : "",
      shouldAutoReply,
      shouldMemoryOnly,
      ownerMessageAt: normalize.ownerMessageAt || new Date().toISOString(),
      voiceProfileText: voice.profileText || "No stable voice profile yet.",
      voiceRecentExamples: voice.recentExamples || "",
      voiceMessageCount: Number(voice.messageCount || 0),
      voiceObservationBuffer: voice.observationBuffer || "",
      observationsSinceConsolidation: Number(voice.observationsSinceConsolidation || 0),
      personalContextText: personalContext.contextText || "",
    },
  },
];
