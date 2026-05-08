// n8n Code node: Prepare Pending Message Upsert
// This file is a TypeScript function body. Top-level return is expected.

const normalize = $("Normalize Telegram Update").item.json;
const memory = $("Load Memory For Intake").item.json || {};

type PendingMessage = {
  at: string;
  text: string;
  senderName: string;
  username: string;
  messageId: number | null;
};

function parsePendingMessages(value): PendingMessage[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function capEvents(events: PendingMessage[], maxEvents = 20, maxChars = 4000) {
  const capped = events.slice(-maxEvents);
  while (JSON.stringify(capped).length > maxChars && capped.length > 1) {
    capped.shift();
  }
  return capped;
}

const incoming = parsePendingMessages(memory.pendingIncomingMessages);
const owner = parsePendingMessages(memory.pendingOwnerMessages);
const text = String(normalize.userText || "").trim();
const now = new Date().toISOString();
const pendingBatchVersion = `${now}:${normalize.messageId || Math.random().toString(36).slice(2)}`;

if (text) {
  const event: PendingMessage = {
    at: now,
    text,
    senderName: normalize.senderName || "",
    username: normalize.username || "",
    messageId: normalize.messageId || null,
  };

  if (normalize.isFromOwner) {
    owner.push(event);
  } else {
    incoming.push(event);
  }
}

const cappedIncoming = capEvents(incoming);
const cappedOwner = capEvents(owner);
const pendingIncomingMessages = JSON.stringify(cappedIncoming);
const pendingOwnerMessages = JSON.stringify(cappedOwner);

return {
  json: {
    sessionKey: normalize.sessionKey,
    chatId: normalize.chatId,
    username: normalize.username || memory.username || "",
    senderName: normalize.senderName || memory.senderName || "",
    summary: memory.summary || "",
    lastUserMessage: text || memory.lastUserMessage || "",
    lastAssistantReply: memory.lastAssistantReply || "",
    personProfile: memory.personProfile || "",
    personObservationBuffer: memory.personObservationBuffer || "",
    personObservationsSinceConsolidation: Number(memory.personObservationsSinceConsolidation || 0),
    personProfileUpdatedAt: memory.personProfileUpdatedAt || "",
    pendingIncomingMessages,
    pendingOwnerMessages,
    pendingUpdatedAt: now,
    pendingMessageCount: cappedIncoming.length + cappedOwner.length,
    pendingBatchVersion,
    pendingBusinessConnectionId:
      normalize.businessConnectionId || memory.pendingBusinessConnectionId || "",
    pendingReplyToMessageId: normalize.messageId || memory.pendingReplyToMessageId || 0,
    isFromOwner: Boolean(normalize.isFromOwner),
    ownerMessageAt: normalize.ownerMessageAt,
  },
};
