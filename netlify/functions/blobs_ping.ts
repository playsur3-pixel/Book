import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export const handler: Handler = async () => {
  const store = getStore("auth");
  const key = "ping.txt";

  await store.set(key, "ok " + new Date().toISOString());
  const value = await store.get(key, { type: "text" });

  return {
    statusCode: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ ok: true, value }),
  };
};