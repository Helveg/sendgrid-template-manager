import { Response } from "@sendgrid/helpers/classes";

export interface Design {
  id: string;
  name: string;
  updated_at: string;
}

export type DesignResponse = Response<{
  result: Design[];
}>;
