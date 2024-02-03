import {
  checkTarget,
  insertModules,
  listDesigns,
} from "../designs/design.util.js";
import { STMError } from "../errors.js";
import {
  filterContentTemplates,
  findVersion,
  listTemplates,
  retrieveModules,
  updateVersion,
} from "../templates/template.util.js";
import { Design } from "../designs/design.interfaces.js";
import {
  Template,
  TemplateVersionResponse,
} from "../templates/template.interfaces.js";
import { Client } from "@sendgrid/client";
import { color, ListrTaskWrapper } from "listr2";
import { makeClient } from "../client.js";
import { runTasks } from "../manager.js";

export interface ApplyOptions {
  verbose?: boolean;
  key?: string;
  tag?: string;
  activate?: boolean;
}

interface ApplyContext {
  templates: Template[];
  client: Client;
  designId: string;
  templateIds: string[];
  designs: Design[];
  design: Design;
  commandOptions: ApplyOptions;
}

export async function applyCommand(
  designId: string,
  templateIds: string[],
  options: ApplyOptions,
) {
  await runTasks(
    [
      {
        title: `Prepare '${designId}' design`,
        task: prepareDesignTask,
      },
      {
        title: `Fetch templates`,
        task: fetchTemplatesTask,
      },
      {
        title: `Update templates`,
        task: updateTemplatesTask,
      },
    ],
    {
      client: makeClient(options),
      designId,
      templateIds,
      commandOptions: options,
    } as ApplyContext,
    { exitOnError: true },
  );
}

async function prepareDesignTask(
  ctx: ApplyContext,
  task: ListrTaskWrapper<any, any, any>,
) {
  return task.newListr([
    {
      title: "Fetch designs",
      task: async (_, task) => {
        ctx.designs = await listDesigns(ctx.client, { summary: false });
      },
    },
    {
      title: `Filter designs`,
      task: () => {
        const design = ctx.designs.find(
          (design) =>
            design.id === ctx.designId || design.name === ctx.designId,
        );
        if (!design) {
          throw new STMError(`Unknown design '${ctx.designId}'`, {
            code: "design.not-found",
          });
        }
        ctx.design = design;
      },
    },
    {
      title: `Find module injection location`,
      task: () => {
        checkTarget(ctx.design);
      },
    },
  ]);
}

async function fetchTemplatesTask(
  ctx: ApplyContext,
  task: ListrTaskWrapper<any, any, any>,
) {
  const templates = await listTemplates(ctx.client);
  const contentTemplates = filterContentTemplates(templates);
  let applicableTemplates;
  if (ctx.templateIds.length) {
    const templateSearch = ctx.templateIds.map(
      (id) =>
        [id, templates.find((t) => t.id === id || t.name === id)] as const,
    );
    const notFound = templateSearch
      .filter(([id, t]) => !!t)
      .map(([id, t]) => `'${id}'`);
    if (notFound.length) {
      throw new STMError(`Unknown template(s): ${notFound.join(", ")}`, {
        code: "template.not-found",
      });
    }
    const untagged = templateSearch
      .filter(([, t]) => !contentTemplates.includes(t!))
      .map(([id, t]) => `'${id}'`);
    if (untagged.length) {
      throw new STMError(`Missing content versions: ${untagged.join(", ")}`, {
        code: "template.no-content-version",
      });
    }
    applicableTemplates = templateSearch.map(([, t]) => t!);
  } else {
    applicableTemplates = contentTemplates;
  }
  if (!applicableTemplates.length) {
    throw new STMError("No applicable templates.", {
      code: "no-templates",
    });
  }
  ctx.templates = applicableTemplates;
}

async function updateTemplatesTask(
  ctx: ApplyContext,
  task: ListrTaskWrapper<any, any, any>,
) {
  return task.newListr(
    ctx.templates.map((template) => ({
      title: color.dim(`[${template.id}] `) + template.name,
      task: () =>
        applyDesign(ctx.client, ctx.design, template, ctx.commandOptions),
    })),
    {
      concurrent: true,
      rendererOptions: {
        collapseSubtasks: false,
      },
    },
  );
}

async function applyDesign(
  client: Client,
  design: Design,
  template: Template,
  options: ApplyOptions,
) {
  const modules = await retrieveModules(client, template);
  const newVersion = await insertModules(design, modules);
  const existingVersion = findVersion(template, options.tag);
  if (existingVersion) {
    return await updateVersion(client, template, {
      id: existingVersion.id,
      html_content: newVersion,
      active: +((existingVersion.active || options.activate) ?? 0) as 0 | 1,
    });
  } else {
    const data = {
      template_id: template.id,
      active: +(options.activate ?? 0),
      name: options.tag,
      html_content: newVersion,
      generate_plain_content: true,
      subject: findVersion(template)?.subject ?? "",
      editor: "design",
    };

    const [response] = (await client.request({
      url: `/v3/templates/${template.id}/versions`,
      method: "POST",
      body: data,
    })) as [TemplateVersionResponse, any];
    return response.body;
  }
}
