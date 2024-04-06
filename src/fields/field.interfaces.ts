import { Response } from "@sendgrid/helpers/classes";

export interface Field {
  id: string;
  name: string;
  field_type: "Text" | "Number" | "Date";
  read_only?: boolean;
}

export interface ListFieldsOptions {}

export type ListFieldsResponse = Response<{
  custom_fields: Field[];
  reserved_fields: Field[];
}>;
