import { Client } from "@sendgrid/client";
import { countContacts } from "../contacts/contacts.util.js";
import { makeClient } from "../client.js";

interface CountContactsContext {
  client: Client;
}

export async function countContactsCommand(options: { key?: string }) {
  const client = makeClient(options);
  const countResponse = await countContacts(client);
  console.log(`→ Total contacts:    ${countResponse.contact_count}`);
  console.log(`→ Billable contacts: ${countResponse.billable_count}`);
}
