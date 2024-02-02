import { makeClient } from "../client";
import { TemplateResponse } from "../templates/template.interfaces";
import { filterContentTemplates } from "../templates/template.util";
import { Client } from "@sendgrid/client";
import { DesignResponse } from "../designs/design.interfaces";

export async function listDesignsCommand(
  type: "designs" | "templates" | undefined,
  options: { key?: string },
) {
  const client = makeClient(options);
  let out = "";
  const promises = [];
  if ((type ?? "templates") === "templates") {
    promises.push(listContentTemplates(client));
  }
  if ((type ?? "designs") === "designs") {
    promises.push(listDesigns(client));
  }
  console.log((await Promise.all(promises)).join("\n\n"));
}

async function listContentTemplates(client: Client) {
  let out = `Content templates\n-----------------\n\n`;
  try {
    const [response, body] = (await client.request({
      url: `/v3/templates`,
      method: "GET",
      qs: {
        generations: "dynamic",
      },
    })) as [TemplateResponse, any];
    out += filterContentTemplates(response.body.templates)
      .map((template) => `* ${template.name} [${template.id}]`)
      .join("\n");
  } catch (e) {
    out += "  ERROR";
  }
  return out;
}

async function listDesigns(client: Client) {
  let out = `Designs\n-----------------\n\n`;
  try {
    const [response, body] = (await client.request({
      url: `/v3/designs`,
      method: "GET",
    })) as [DesignResponse, any];
    out += response.body.result.map((design) => `* ${design.name}`).join("\n");
  } catch (e) {
    out += "  ERROR";
  }
  return out;
}
