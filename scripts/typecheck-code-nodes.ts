import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(repoRoot, ".generated/code-node-typecheck");
const workflowSrcDir = join(repoRoot, "src/workflows/telegram-personal-ai-assistant");
const codeMapPath = join(workflowSrcDir, "code-nodes.json");

function functionName(nodeName: string) {
  return nodeName
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char: string) => char.toUpperCase())
    .replace(/^[^a-zA-Z_]+/, "")
    .replace(/^./, (char) => char.toLowerCase());
}

const globals = `
type N8nJson = Record<string, any>;
type N8nItem = { json: N8nJson };

declare const $json: N8nJson;
declare function $items(nodeName: string): N8nItem[];
declare function $(nodeName: string): { item: N8nItem };
`;

const codeMap = JSON.parse(await readFile(codeMapPath, "utf8")) as Record<string, string>;
const wrappers: string[] = [globals];

for (const [nodeName, relativePath] of Object.entries(codeMap)) {
  const source = await readFile(join(workflowSrcDir, relativePath), "utf8");
  wrappers.push(`
function ${functionName(nodeName)}() {
${source}
}
`);
}

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "code-node-wrappers.ts"), wrappers.join("\n"));
await writeFile(
  join(outDir, "tsconfig.json"),
  `${JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        strict: true,
        noImplicitAny: false,
        noEmit: true,
        skipLibCheck: true,
      },
      include: ["code-node-wrappers.ts"],
    },
    null,
    2,
  )}\n`,
);
