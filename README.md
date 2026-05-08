# n8n Workflows

Versioned exports of personal n8n workflows.

## Workflow Sources

- `src/workflows/telegram-personal-ai-assistant/workflow.template.json` - n8n workflow template.
- `src/workflows/telegram-personal-ai-assistant/code/*.ts` - source of truth for n8n Code nodes.
- `workflows/telegram-personal-ai-assistant.workflow.json` - generated n8n import/export JSON.

## Commands

```bash
bun run build:nodes
bun run build
bun run fmt
bun run fmt:check
bun run typecheck:nodes
bun run typecheck:code
bun run verify
```

Change Code node logic only in `src/workflows/**/code/*.ts`, then run `bun run build`.
`typecheck:code` wraps n8n Code node bodies into temporary functions and runs TypeScript over them with minimal n8n globals.
`verify` checks formatting, Code node type safety, and generated workflow freshness.

## Notes

- Workflow exports are generated as pretty JSON for n8n import.
- Secrets must not be committed. Telegram replies use the custom `Telegram Business` node with an n8n `telegramApi` credential reference instead of a literal token.
- Data Table IDs are currently instance-specific and documented next to the workflow.
