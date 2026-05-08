// n8n Code node: Normalize Telegram Update
// This file is a TypeScript function body. Top-level return is expected.

const update = $json.body ?? $json;
const message = update.business_message ?? update.message ?? null;
const businessConnectionId =
  message?.business_connection_id ?? update.business_connection?.id ?? null;
const chatId = message?.chat?.id ?? null;
const fromId = message?.from?.id ?? null;
const ownerSettings = Object.fromEntries(
  $items("Load Owner Identity Settings")
    .map((item) => item.json ?? {})
    .filter((row) => row.settingKey)
    .map((row) => [String(row.settingKey), String(row.settingValue ?? "")]),
);
const ownerUserId = Number(ownerSettings.ownerTelegramUserId || 0);
const userText = message?.text ?? message?.caption ?? "";
const trimmedText = userText.trim();
const senderName =
  [message?.from?.first_name, message?.from?.last_name].filter(Boolean).join(" ") ||
  message?.from?.username ||
  "Unknown";
const isFromOwner = Boolean(ownerUserId && fromId === ownerUserId);
const sessionKey =
  businessConnectionId && chatId
    ? `${businessConnectionId}:${chatId}`
    : chatId
      ? `chat:${chatId}`
      : `update:${update.update_id}`;

return {
  json: {
    updateId: update.update_id,
    updateType: update.business_message ? "business_message" : update.message ? "message" : "other",
    businessConnectionId,
    chatId,
    fromId,
    ownerUserId,
    isFromOwner,
    messageId: message?.message_id ?? null,
    senderName,
    username: message?.from?.username ?? null,
    userText,
    sessionKey,
    shouldReply: Boolean(businessConnectionId && chatId && trimmedText && !isFromOwner),
    shouldUpdateMemory: Boolean(businessConnectionId && chatId && trimmedText),
    ownerMessageAt: new Date().toISOString(),
    rawUpdate: update,
  },
};
