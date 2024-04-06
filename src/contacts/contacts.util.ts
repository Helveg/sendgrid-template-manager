import { Client } from "@sendgrid/client";
import {
  CountContactsResponse,
  UploadContactsJob,
  UploadContactsOptions,
  UploadContactsResponse,
} from "./contact.interfaces.js";
import * as fs from "fs";
import { STMError } from "../errors.js";
import superagent from "superagent";

export async function countContacts(client: Client) {
  const [response] = (await client.request({
    url: `/v3/marketing/contacts/count`,
    method: "GET",
  })) as [CountContactsResponse, any];
  return response.body;
}

export async function uploadContacts(
  client: Client,
  options: UploadContactsOptions = {},
) {
  const [response] = (await client.request({
    url: `/v3/marketing/contacts/imports`,
    method: "PUT",
    body: {
      list_ids: options.lists,
      file_type: "csv",
    },
  })) as [UploadContactsResponse, any];
  return response.body;
}

export async function uploadContactCSV(
  client: Client,
  { path, upload_uri, upload_headers }: UploadContactsJob,
) {
  try {
    return await superagent
      .put(upload_uri)
      .send(fs.readFileSync(path, { encoding: "utf-8" }))
      .set(
        upload_headers.reduce(
          (acc, { header, value }) => {
            acc[header] = value;
            return acc;
          },
          {} as Record<string, string>,
        ),
      );
  } catch (e: any) {
    if (e.response) {
      return e.response as superagent.Response;
    } else {
      throw new STMError(`Could not contact the upload server.`);
    }
  }
}
