import {
  Template,
  TemplateResponse,
  TemplateVersion,
  TemplateVersionResponse,
} from "./template.interfaces";
import { Client } from "@sendgrid/client";
import { STMError } from "../errors";
import { getAllModules, getModuleContainer, makeDom } from "../dom.util";

export async function listTemplates(client: Client) {
  const [response] = (await client.request({
    url: `/v3/templates`,
    method: "GET",
    qs: {
      generations: "dynamic",
    },
  })) as [TemplateResponse, any];
  return response.body.templates;
}

export function findVersion(template: Template, name = "__content__") {
  return template.versions.find((v) => v.name === name);
}

export async function retrieveContentVersion(
  client: Client,
  template: Template,
) {
  const version = findVersion(template);
  if (!version) {
    throw new STMError(
      `Template '${template.name}' is missing a __content__ version.`,
      { code: "template.no-content-version" },
    );
  }
  const [response] = (await client.request({
    url: `/v3/templates/${template.id}/versions/${version.id}`,
    method: "GET",
  })) as [TemplateVersionResponse, any];
  return response.body;
}

export async function retrieveModules(client: Client, template: Template) {
  const dom = makeDom(await retrieveContentVersion(client, template));
  return getAllModules(getModuleContainer(dom));
}

export function filterContentTemplates(templates: Template[]) {
  return templates.filter((t) => findVersion(t));
}

export async function updateVersion(
  client: Client,
  template: Template,
  version: Partial<TemplateVersion> & Pick<TemplateVersion, "id">,
) {
  const id = version.id;
  const body: Partial<TemplateVersion> = { ...version };
  delete body.id;
  const [response] = (await client.request({
    url: `/v3/templates/${template.id}/versions/${id}`,
    body,
    method: "PATCH",
  })) as [TemplateVersionResponse, any];
  return response.body;
}
