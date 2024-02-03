import { Client } from "@sendgrid/client";
import {
  Design,
  DesignResponse,
  ListDesignOptions,
} from "./design.interfaces.js";
import { getModuleContainer, getTargetModule, makeDom } from "../dom.util.js";

export async function listDesigns(
  client: Client,
  options: ListDesignOptions = {},
) {
  const [response] = (await client.request({
    url: `/v3/designs`,
    method: "GET",
    qs: options,
  })) as [DesignResponse, any];
  return response.body.result;
}

export async function insertModules(design: Design, modules: Element[]) {
  if (!design.html_content) {
    throw Error(
      "insertModules called on Design which was fetched with summary=true.",
    );
  }
  const dom = makeDom(design);
  const container = getModuleContainer(dom);
  const target = getTargetModule(container);
  modules.forEach((module) =>
    target.insertAdjacentElement("beforebegin", module),
  );
  target.remove();
  return dom.serialize();
}

export function checkTarget(design: Design) {
  const dom = makeDom(design);
  const container = getModuleContainer(dom);
  getTargetModule(container);
}
