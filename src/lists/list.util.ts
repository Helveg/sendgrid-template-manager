import { Client } from "@sendgrid/client";
import {
  CreateListResponse,
  ListResponse,
  ListsResponse,
} from "./list.interfaces.js";

export async function getList(client: Client, id: string) {
  const [response] = (await client.request({
    url: `/v3/marketing/lists/${id}`,
    method: "GET",
  })) as [ListResponse, any];
  return response.body;
}

export async function listLists(
  client: Client,
  options: { page_size?: number } = { page_size: 1000 },
) {
  const [response] = (await client.request({
    url: `/v3/marketing/lists`,
    method: "GET",
    qs: options,
  })) as [ListsResponse, any];
  return response.body.result;
}

export async function createList(client: Client, name: string) {
  const [response] = (await client.request({
    url: `/v3/marketing/lists`,
    method: "POST",
    body: { name },
  })) as [CreateListResponse, any];
  return response.body;
}

export async function deleteList(
  client: Client,
  id: string,
  options: { delete_contacts?: boolean } = { delete_contacts: false },
) {
  const [response] = (await client.request({
    url: `/v3/marketing/lists/${id}`,
    method: "DELETE",
    qs: options,
  })) as [CreateListResponse, any];
  return response.body;
}
