import { Client } from "@sendgrid/client";
import { Design, DesignResponse, ListDesignOptions } from "./design.interfaces";
import { getModuleContainer, getTargetModule, makeDom } from "../dom.util";

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
  const target = getTargetModule(container, "text");
  modules.forEach((module) =>
    target.insertAdjacentElement("beforebegin", module),
  );
  target.remove();
  return dom.serialize();
}
