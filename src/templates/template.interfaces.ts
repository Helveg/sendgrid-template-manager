import { Response } from "@sendgrid/helpers/classes";

export interface Template {
  id: string;
  name: string;
  generation: "legacy" | "dynamic" | "legacy,dynamic";
  updated_at: string;
  versions: TemplateVersion[];
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  active: 0 | 1;
  name: string;
  html_content: string;
  plain_content: string;
  generate_plain_content: boolean;
  subject: string;
  updated_at: string;
  editor: "design" | "code";
  thumbnail_url: string;
}

export type TemplateResponse = Response<{
  templates: Template[];
}>;
export type TemplateVersionResponse = Response<TemplateVersion>;
