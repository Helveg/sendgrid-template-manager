import { Response } from "@sendgrid/helpers/classes";

export interface Design {
  id: string;
  name: string;
  html_content: string;
  plain_content: string;
  updated_at: string;
}

export type DesignResponse = Response<{
  result: Design[];
}>;

export interface ListDesignOptions {
  summary?: boolean;
}
