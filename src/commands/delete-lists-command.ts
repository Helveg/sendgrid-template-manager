import { createOutputListTasks } from "../manager.js";
import { makeClient } from "../client.js";
import { Client } from "@sendgrid/client";
import { deleteList, listLists } from "../lists/list.util.js";
import { minimatch } from "minimatch";
import { List } from "../lists/list.interfaces.js";
import { color, ListrTaskWrapper } from "listr2";
import { nameSort } from "../util.js";

export interface DeleteListsCommandOptions {
  key?: string;
  deleteContacts?: boolean;
}

export interface DeleteListsContext {
  client: Client;
  lists: List[];
  deleteContacts?: boolean;
}

export async function deleteListsCommand(
  lists: string[],
  options: DeleteListsCommandOptions,
) {
  const tasks = createOutputListTasks([
    {
      title: "Fetching lists",
      task: async (ctx: DeleteListsContext, task) => {
        ctx.lists = (await listLists(ctx.client)).filter((list) =>
          lists.some((glob) => list.id === glob || minimatch(list.name, glob)),
        );
      },
    },
    {
      title: "Delete lists",
      task: deleteLists,
      rendererOptions: { collapseSubtasks: false },
    },
  ]);
  const ctx = await tasks.run({
    client: makeClient(options),
    deleteContacts: options.deleteContacts,
  } as DeleteListsContext);
}

async function deleteLists(
  ctx: DeleteListsContext,
  task: ListrTaskWrapper<DeleteListsContext, any, any>,
) {
  return task.newListr(
    ctx.lists.sort(nameSort).map((list) => ({
      title: color.dim(`[${list.id}] `) + list.name,
      task: async (taskCtx, task) => {
        await deleteList(ctx.client, list.id, {
          delete_contacts: ctx.deleteContacts,
        });
        task.title = color.green(`[deleted] `) + list.name;
      },
    })),
    { concurrent: true, exitOnError: false, collectErrors: "minimal" },
  );
}
