import { makeClient } from "../client.js";
import { insertModules, listDesigns } from "../designs/design.util.js";
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
  TemplateVersion,
  TemplateVersionResponse,
} from "../templates/template.interfaces.js";
import { Client } from "@sendgrid/client";

export interface ApplyOptions {
  verbose?: boolean;
  key?: string;
  tag?: string;
  activate?: boolean;
}

export async function applyCommand(
  designIdentifier: string,
  templateIdentifiers: string[],
  options: ApplyOptions,
) {
  const client = makeClient(options);
  const designs = await listDesigns(client, { summary: false });
  const design = designs.find(
    (design) =>
      design.id === designIdentifier || design.name === designIdentifier,
  );
  if (!design) {
    throw new STMError(`Unknown design '${designIdentifier}'`, {
      code: "design.not-found",
    });
  }
  const templates = await listTemplates(client);
  const contentTemplates = filterContentTemplates(templates);
  let applicableTemplates;
  if (templateIdentifiers.length) {
    const templateSearch = templateIdentifiers.map(
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
      throw new STMError(
        `The following template(s) are missing a version named '__content__': ${untagged.join(", ")}`,
        { code: "template.no-content-version" },
      );
    }
    applicableTemplates = templateSearch.map(([, t]) => t!);
  } else {
    applicableTemplates = contentTemplates;
  }
  if (!applicableTemplates.length) {
    throw new STMError("No applicable templates found.", {
      code: "no-templates",
    });
  }
  console.log(
    `Applying design '${design.name}' [${design.id}] to the following ${applicableTemplates.length} templates:`,
  );
  console.log(
    applicableTemplates.map((t) => `* ${t.name} [${t.id}]`).join("\n") + "\n",
  );
  console.log(" ...\n");
  await Promise.all(
    applicableTemplates.map(async (template) => {
      let version: TemplateVersion | undefined = undefined;
      let error: Error | undefined = undefined;
      try {
        version = await applyDesign(client, design, template, options);
      } catch (e: any) {
        error = e;
      }
      if (version) {
        console.log(
          `* [success] ${findVersion(template, version.name) ? "Updated" : "Created"} "${template.name}".${version.name}`,
        );
      } else if (error instanceof STMError) {
        let msg = `* [error:${error.info.code}] ${template.name}`;
        if (options.verbose) {
          msg += `\n --> ${error.message}`;
        }
        console.log(msg);
      } else {
        throw error;
      }
    }),
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
  const existingVersion = await findVersion(template, options.tag);
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
      subject: "",
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
