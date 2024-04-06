import { createOutputListTasks } from "../manager.js";
import { makeClient } from "../client.js";
import { Client } from "@sendgrid/client";
import { color } from "listr2";
import { nameSort } from "../util.js";
import { listLists } from "../lists/list.util.js";
import { minimatch } from "minimatch";

export interface ListListsCommandOptions {
  key?: string;
}

export interface ListListsContext {
  client: Client;
}

export async function listListsCommand(
  globs: string[],
  options: ListListsCommandOptions,
) {
  const tasks = createOutputListTasks([
    {
      title: "Fetching lists",
      task: async (ctx: ListListsContext, task) => {
        const lists = (await listLists(ctx.client)).filter(
          (list) =>
            !globs.length ||
            globs.some(
              (glob) => list.id === glob || minimatch(list.name, glob),
            ),
        );
        task.title = `Fetched ${lists.length} lists`;
        task.output = lists
          .sort(nameSort)
          .map((list) => color.dim(`➥ [${list.id}] `) + list.name)
          .join("\n");
      },
      rendererOptions: { outputBar: Infinity, persistentOutput: true },
    },
  ]);
  const ctx = await tasks.run({
    client: makeClient(options),
  } as ListListsContext);
}
