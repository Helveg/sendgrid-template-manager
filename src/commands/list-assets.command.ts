import { makeClient } from "../client.js";
import {
  filterContentTemplates,
  listTemplates,
} from "../templates/template.util.js";
import { Client } from "@sendgrid/client";
import { listDesigns } from "../designs/design.util.js";
import { color, ListrTaskWrapper } from "listr2";
import { nameSort } from "../util.js";
import { createOutputListTasks } from "../manager.js";

interface ListAssetsContext {
  client: Client;
}

export async function listAssetsCommand(
  type: "designs" | "templates" | undefined,
  options: { key?: string },
) {
  const tasks = createOutputListTasks(
    [
      {
        title: "Retrieve designs",
        task: summarizeDesigns,
        rendererOptions: { outputBar: Infinity, persistentOutput: true },
      },
      {
        title: "Retrieve templates",
        task: summarizeTemplates,
        rendererOptions: { outputBar: Infinity, persistentOutput: true },
      },
    ],
    { concurrent: true },
  );
  const ctx = await tasks.run({ client: makeClient(options) });
}

async function summarizeTemplates(
  ctx: ListAssetsContext,
  task: ListrTaskWrapper<ListAssetsContext, any, any>,
) {
  const allTemplates = await listTemplates(ctx.client);
  const contentTemplates = filterContentTemplates(allTemplates);
  const untaggedTemplates = allTemplates.filter(
    (template) => !contentTemplates.includes(template),
  );
  const nUntagged = allTemplates.length - contentTemplates.length;
  task.title =
    `Found ${contentTemplates.length} templates` +
    (nUntagged ? ` (${nUntagged} untagged)` : "");
  task.output = [
    ...contentTemplates
      .sort(nameSort)
      .map((template) => color.dim(`➥ [${template.id}] `) + template.name),
    ...untaggedTemplates
      .sort(nameSort)
      .map((template) => color.dim(`? [${template.id}] ${template.name}`)),
  ].join("\n");
}

async function summarizeDesigns(
  ctx: ListAssetsContext,
  task: ListrTaskWrapper<ListAssetsContext, any, any>,
) {
  const designs = await listDesigns(ctx.client);
  task.title = `Found ${designs.length} designs`;
  task.output = designs
    .sort(nameSort)
    .map((design) => color.dim(`➥ [${design.id}] `) + design.name)
    .join("\n");
}
