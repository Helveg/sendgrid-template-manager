import { makeClient } from "../client.js";
import { Client } from "@sendgrid/client";
import { color, ListrTaskWrapper } from "listr2";
import { createOutputListTasks } from "../manager.js";
import * as fsExtra from "fs-extra";
import * as fs from "fs";
import { STMError } from "../errors.js";
import neatCsv from "neat-csv";
import { listFields } from "../fields/field.util.js";
import { Field } from "../fields/field.interfaces.js";
import { createObjectCsvWriter } from "csv-writer";
import os from "os";
import path from "path";
import UUID from "pure-uuid";
import { uploadContactCSV, uploadContacts } from "../contacts/contacts.util.js";
import { UploadContactsJob } from "../contacts/contact.interfaces.js";

export interface UploadContactCommandOptions {
  key?: string;
  crop?: number;
  split?: number;
  skip?: number;
  roundRobin?: boolean;
  lists?: string[];
}

interface UploadContactsContext {
  client: Client;
  headers: string[];
  data: object[];
  fields: Field[];
  fieldMap: (string | null)[];
  csvJobs: UploadContactsJob[];
}

export async function uploadContactsCommand(
  csv: string,
  options: UploadContactCommandOptions,
) {
  if (!fs.existsSync(csv)) {
    throw new STMError(`Specified CSV file '${csv}' does not exist.`);
  }
  const tasks = createOutputListTasks([
    {
      title: "Parsing CSV",
      task: async (ctx, task) => {
        ctx.data = await neatCsv(fs.createReadStream(csv));
        ctx.headers = Object.keys(ctx.data[0]);
        task.title += ` (${ctx.data.length} records)`;
      },
    },
    {
      title: "Check CSV field mapping",
      task: fieldMapCSV,
      rendererOptions: { outputBar: Infinity, persistentOutput: true },
    },
    {
      title: "Prepare CSV uploads",
      task: (...args) => prepareCSV(options, ...args),
      skip: !options.crop && !options.split,
      rendererOptions: { collapseSubtasks: false },
    },
    {
      title: "Upload CSV",
      task: (...args) => uploadCSV(options, ...args),
      rendererOptions: { outputBar: Infinity, persistentOutput: true },
    },
  ]);
  const ctx = await tasks.run({
    client: makeClient(options),
    csvJobs: [{ path: csv }],
  } as UploadContactsContext);
}

async function fieldMapCSV(
  ctx: UploadContactsContext,
  task: ListrTaskWrapper<UploadContactsContext, any, any>,
) {
  return task.newListr([
    {
      title: "Fetch fields",
      task: async (ctx, task) => {
        ctx.fields = await listFields(ctx.client);
        task.title = `Fetched ${ctx.fields.length} fields`;
      },
    },
    {
      title: `Map ${ctx.headers.length} headers to fields`,
      task: async (ctx, task) => {
        const fieldMap = ctx.headers.map((header) => {
          const field = ctx.fields.find((field) => field.name === header);
          return field ? field.name : null;
        });
        task.output = [...zip(ctx.headers, fieldMap)]
          .map(([header, field]) =>
            field
              ? field !== header
                ? color.green(`➥ `) + ` ${header} ↦ ${field}`
                : null
              : color.dim(`➥ ${header} [skipped]`),
          )
          .filter((line) => line !== null)
          .join("\n");
        ctx.fieldMap = fieldMap;
      },
      rendererOptions: { outputBar: Infinity, persistentOutput: true },
    },
  ]);
}

async function prepareCSV(
  {
    split = 1,
    crop,
    skip = 0,
  }: { split?: number; crop?: number; skip?: number },
  ctx: UploadContactsContext,
  task: ListrTaskWrapper<UploadContactsContext, any, any>,
) {
  crop = Math.min(crop ?? ctx.data.length - skip, ctx.data.length - skip);
  const rowsPerFile = Math.ceil(crop / split);
  task.title = `Prepare ${split} CSV uploads (${rowsPerFile} rows each)`;

  const directory = path.join(os.tmpdir(), new UUID(4).format());
  await fsExtra.mkdirs(directory);
  ctx.csvJobs = [];
  for (let i = 0; i < split; i++) {
    const jobPath = path.join(directory, `file${i}.csv`);
    const csvWriter = createObjectCsvWriter({
      path: jobPath,
      header: ctx.headers.map((header) => ({ id: header, title: header })),
    });
    await csvWriter.writeRecords(
      ctx.data.slice(skip + rowsPerFile * i, skip + rowsPerFile * (i + 1)),
    );
    ctx.csvJobs.push({ path: jobPath } as UploadContactsJob);
  }
}

async function uploadCSV(
  { lists, roundRobin }: { lists?: string[]; roundRobin?: boolean },
  ctx: UploadContactsContext,
  task: ListrTaskWrapper<UploadContactsContext, any, any>,
) {
  return task.newListr(
    ctx.csvJobs.map((csvJob, jobIndex) => ({
      title: `Requesting CSV upload ${jobIndex}`,
      task: async (taskCtx, subTask) => {
        const jobLists = lists
          ? roundRobin
            ? [lists[jobIndex % lists.length]]
            : lists
          : [];
        const response = await uploadContacts(ctx.client, { lists: jobLists });
        subTask.title = `Uploading ${jobIndex}:${response.job_id}`;
        Object.assign(csvJob, response);
        const csvResponse = await uploadContactCSV(ctx.client, csvJob);
        subTask.title = `Upload ${jobIndex}:${response.job_id}: ${csvResponse.statusCode}`;
        if (csvResponse.statusCode !== 200) {
          subTask.output = csvResponse.body;
        }
      },
      rendererOptions: { persistentOutput: true, outputBar: Infinity },
    })),
    { concurrent: true },
  );
}

function* zip<T extends any[]>(
  ...iterables: { [I in keyof T]: Iterable<T[I]> }
): Generator<T> {
  let iterators = iterables.map((i) => i[Symbol.iterator]());
  while (true) {
    let results = iterators.map((iter) => iter.next());
    if (results.some((res) => res.done)) return;
    else yield results.map((res) => res.value) as any;
  }
}
