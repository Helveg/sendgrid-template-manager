import { Template } from "./template.interfaces";

export function filterContentTemplates(templates: Template[]) {
  return templates.filter(
    (template) =>
      template.versions.filter((version: any) => version.name === "__content__")
        .length,
  );
}
