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
  active: boolean;
  name: string;
  generate_plain_content: boolean;
  subject: string;
  updated_at: string;
  editor: "design" | "code";
  thumbnail_url: string;
}

export type TemplateResponse = Response<{
  templates: Template[];
}>;
