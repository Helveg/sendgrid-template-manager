import client from "@sendgrid/client";
import { STMError } from "./errors.js";

export function makeClient(options: { key?: string }) {
  const key = options.key ?? process.env.SENDGRID_API_KEY;

  if (!key) {
    throw new STMError(
      "Missing SENDGRIP_API_KEY, set env var or pass the '--key' option",
    );
  }
  client.setApiKey(key);
  return client;
}
