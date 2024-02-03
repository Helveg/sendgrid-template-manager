import { makeClient } from "../client.js";
import {
  filterContentTemplates,
  listTemplates,
} from "../templates/template.util.js";
import { Client } from "@sendgrid/client";
import { listDesigns } from "../designs/design.util.js";

export async function listAssetsCommand(
  type: "designs" | "templates" | undefined,
  options: { key?: string },
) {
  const client = makeClient(options);
  let out = "";
  const promises = [];
  if ((type ?? "templates") === "templates") {
    promises.push(summarizeTemplates(client));
  }
  if ((type ?? "designs") === "designs") {
    promises.push(summarizeDesigns(client));
  }
  console.log((await Promise.all(promises)).join("\n\n"));
}

async function summarizeTemplates(client: Client) {
  let out = `Content templates\n-----------------\n\n`;
  try {
    const allTemplates = await listTemplates(client);
    const contentTemplates = filterContentTemplates(allTemplates);
    out += contentTemplates
      .map((template) => `* ${template.name} [${template.id}]`)
      .join("\n");
    if (contentTemplates.length < allTemplates.length) {
      out +=
        (contentTemplates.length ? "\n\n" : "") +
        `(${allTemplates.length - contentTemplates.length} untagged)`;
    }
  } catch (e) {
    out += "  ERROR";
  }
  return out;
}

async function summarizeDesigns(client: Client) {
  let out = `Designs\n-----------------\n\n`;
  try {
    const designs = await listDesigns(client);
    out += designs.map((design) => `* ${design.name}`).join("\n");
  } catch (e) {
    out += "  ERROR";
  }
  return out;
}
