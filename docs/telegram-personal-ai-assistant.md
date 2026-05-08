# Telegram Personal AI Assistant

Source n8n workflow:

- ID: `wuShcnLXJgOIjRGG`
- Name: `Telegram Personal AI Assistant MVP`
- Active version: `d5e78ff7-f825-4f03-8cb8-6053eb5a2d0f`
- Production webhook: `https://n8n.nezdemkovski.cloud/webhook/telegram-personal-ai-assistant`

## Behavior

- Receives Telegram Chat Automation updates through a webhook.
- Debounces consecutive messages per chat using `autoReplyDebounceSeconds`, default currently `15`.
- Keeps per-chat memory in `telegram_person_memory`.
- Uses hybrid control:
  - `autoReplyEnabled`
  - `quietAfterOwnerActivityMinutes`
  - `lastOwnerMessageAt`
- Learns Yuri's style from owner messages into `telegram_yuri_voice_profile`.
- Keeps trusted Yuri facts in `telegram_yuri_personal_context`.

## Data Tables

- `telegram_person_memory`: `TVfAzirdgq5fTvUU`
- `telegram_assistant_settings`: `ypokG5tVBhOmGheM`
- `telegram_yuri_voice_profile`: `HvpnlPzgJUGdV9ej`
- `telegram_yuri_personal_context`: `bXtoAE0DT4oRNrBp`

## Secret Handling

Telegram replies are sent through the private custom node in
`packages/n8n-nodes-telegram-business`.

The workflow uses the existing n8n `telegramApi` credential:

- ID: `FKvl2DEiMNZgXa2C`
- Name: `Telegram account (nezdemoid_bot)`

The token stays in n8n Credentials. The workflow export only stores the credential reference.

## Custom Node Install

Build and pack the node:

```bash
bun run build:nodes
cd packages/n8n-nodes-telegram-business
npm pack
```

Install the tarball into the n8n container's persistent nodes directory:

```bash
docker cp n8n-nodes-telegram-business-0.1.0.tgz n8n:/tmp/
docker compose exec -T --user node n8n sh -lc \
  'mkdir -p /home/node/.n8n/nodes && cd /home/node/.n8n/nodes && npm install /tmp/n8n-nodes-telegram-business-0.1.0.tgz'
docker compose restart n8n
```
