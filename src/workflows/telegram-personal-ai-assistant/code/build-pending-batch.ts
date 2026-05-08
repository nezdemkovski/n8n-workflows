// n8n Code node: Build Pending Batch
// This file is a TypeScript function body. Top-level return is expected.

const row = $json;

type PendingMessage = {
  text: string;
  senderName?: string;
  username?: string;
  messageId?: number | null;
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

function formatEvents(label: string, events: PendingMessage[]) {
  if (!events.length) return "";

  return [label].concat(events.map((event, index) => `${index + 1}. ${event.text}`)).join("\n");
}

const incoming = parsePendingMessages(row.pendingIncomingMessages);
const owner = parsePendingMessages(row.pendingOwnerMessages);
const latestIncoming = incoming.at(-1);
const latestOwner = owner.at(-1);
const hasIncoming = incoming.length > 0;
const userText = [
  formatEvents("Incoming messages:", incoming),
  formatEvents("Yuri messages during debounce:", owner),
]
  .filter(Boolean)
  .join("\n\n");
return {
  json: {
    updateId: null,
    updateType: "debounced_pending_batch",
    businessConnectionId: row.pendingBusinessConnectionId || "",
    chatId: Number(row.chatId || 0),
    fromId: null,
    ownerUserId: null,
    isFromOwner: !hasIncoming && owner.length > 0,
    messageId: Number(
      row.pendingReplyToMessageId || latestIncoming?.messageId || latestOwner?.messageId || 0,
    ),
    senderName:
      latestIncoming?.senderName || row.senderName || latestOwner?.senderName || "Unknown",
    username: latestIncoming?.username || row.username || latestOwner?.username || "",
    userText,
    sessionKey: row.sessionKey,
    shouldReply: Boolean(
      hasIncoming && row.pendingBusinessConnectionId && row.chatId && userText.trim(),
    ),
    shouldUpdateMemory: Boolean(userText.trim()),
    ownerMessageAt: new Date().toISOString(),
    pendingIncomingCount: incoming.length,
    pendingOwnerCount: owner.length,
  },
};
