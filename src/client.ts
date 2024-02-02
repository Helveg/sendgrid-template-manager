import client from "@sendgrid/client";

export function makeClient(options: { key?: string }) {
  const key = options.key ?? process.env.SENDGRID_API_KEY;

  if (!key) {
    console.error(
      "Missing SENDGRIP_API_KEY, set env var or pass the '--key' option",
    );
    process.exit(1);
  }
  client.setApiKey(key);
  return client;
}
