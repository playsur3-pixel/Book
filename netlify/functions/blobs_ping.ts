import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";

type LambdaEventLike = any;

export const handler: Handler = async (event) => {
  connectLambda(event as unknown as LambdaEventLike);

  const store = getStore("auth");
  await store.set("ping.txt", "ok " + new Date().toISOString());
  const value = await store.get("ping.txt", { type: "text" });

  return {
    statusCode: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ ok: true, value }),
  };
};