import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type WorkflowDocument = Array<{
  nodes: Array<{
    name: string;
    type: string;
    parameters?: {
      jsCode?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}>;

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const generatedDir = join(repoRoot, ".generated");
const tempFormatDir = join(tmpdir(), "n8n-workflows-oxfmt");
const checkOnly = process.argv.includes("--check");
const transpiler = new Bun.Transpiler({ loader: "ts" });

const workflows = [
  {
    name: "telegram-personal-ai-assistant",
    srcDir: "src/workflows/telegram-personal-ai-assistant",
    output: ".generated/workflows/telegram-personal-ai-assistant.workflow.json",
  },
  {
    name: "telegram-personal-ai-assistant-errors",
    srcDir: "src/workflows/telegram-personal-ai-assistant-errors",
    output: ".generated/workflows/telegram-personal-ai-assistant-errors.workflow.json",
  },
];

function sanitizeWorkflowJson(json: string) {
  return json.replaceAll(/bot[0-9]+:[A-Za-z0-9_-]+/g, "bot{{ $env.TELEGRAM_BOT_TOKEN }}");
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function formatWithOxfmt(json: string, fileName: string) {
  await mkdir(tempFormatDir, { recursive: true });
  const tempPath = join(tempFormatDir, fileName);
  await writeFile(tempPath, json);

  const result = spawnSync(
    join(repoRoot, "node_modules/.bin/oxfmt"),
    ["-c", join(repoRoot, ".oxfmtrc.json"), tempPath],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `oxfmt failed for ${fileName}`);
  }

  return readFile(tempPath, "utf8");
}

async function buildWorkflow(config: (typeof workflows)[number]) {
  const srcDir = join(repoRoot, config.srcDir);
  const templatePath = join(srcDir, "workflow.template.json");
  const codeMapPath = join(srcDir, "code-nodes.json");
  const outputPath = join(repoRoot, config.output);

  const workflow = await readJson<WorkflowDocument>(templatePath);
  const codeMap = await readJson<Record<string, string>>(codeMapPath).catch(() => ({}));
  const expectedCodeNodes = new Set(Object.keys(codeMap));

  for (const document of workflow) {
    for (const node of document.nodes) {
      if (node.type !== "n8n-nodes-base.code") continue;

      const codePath = codeMap[node.name];
      if (!codePath) {
        throw new Error(`${config.name}: missing code file mapping for Code node "${node.name}"`);
      }

      const source = await readFile(join(srcDir, codePath), "utf8");
      const code = transpiler.transformSync(source).trim();
      node.parameters ??= {};
      node.parameters.jsCode = code;
      expectedCodeNodes.delete(node.name);
    }
  }

  if (expectedCodeNodes.size > 0) {
    throw new Error(
      `${config.name}: mapped Code nodes not found in template: ${[...expectedCodeNodes].join(", ")}`,
    );
  }

  const output = await formatWithOxfmt(
    sanitizeWorkflowJson(`${JSON.stringify(workflow, null, 2)}\n`),
    config.output.replaceAll("/", "__"),
  );

  if (checkOnly) {
    const current = await readFile(outputPath, "utf8").catch(() => "");
    if (current !== output) {
      throw new Error(`${config.output} is out of date. Run: bun run build`);
    }
    return;
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output);
}

for (const workflow of workflows) {
  await buildWorkflow(workflow);
}

console.log(checkOnly ? "Workflow exports are up to date." : "Workflow exports rebuilt.");
