import { Client } from "@sendgrid/client";
import { Field, ListFieldsResponse } from "./field.interfaces.js";

export async function listFields(client: Client) {
  const [response] = (await client.request({
    url: `/v3/marketing/field_definitions`,
    method: "GET",
  })) as [ListFieldsResponse, any];
  return [
    ...response.body.custom_fields,
    ...response.body.reserved_fields,
  ] as Field[];
}
