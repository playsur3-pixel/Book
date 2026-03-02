import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import crypto from "node:crypto";

type LambdaEventLike = any;

function json(statusCode: number, body: any) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

function normalizeUsername(u: string) {
  return u.trim().toUpperCase().replace(/\s+/g, "_");
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iter = 120000;
  const keylen = 32;
  const digest = "sha256";
  const derived = crypto.pbkdf2Sync(password, salt, iter, keylen, digest).toString("hex");
  return `pbkdf2$${digest}$${iter}$${salt}$${derived}`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

  connectLambda(event as unknown as LambdaEventLike);

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return json(500, { error: "Missing ADMIN_SECRET env var" });

  const sent = event.headers["x-admin-secret"] || event.headers["X-Admin-Secret"];
  if (sent !== adminSecret) return json(401, { error: "Unauthorized" });

  let payload: any;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const username = normalizeUsername(String(payload.username || ""));
  const newPassword = String(payload.newPassword || "");

  if (!username) return json(400, { error: "Missing username" });
  if (!newPassword || newPassword.length < 6) return json(400, { error: "newPassword too short (min 6)" });

  const store = getStore("auth");
  const key = `users/${username}.json`;

  const user = await store.get(key, { type: "json" }).catch(() => null);
  if (!user) return json(404, { error: "User not found", username });

  await store.setJSON(key, {
    ...user,
    passwordHash: hashPassword(newPassword),
    passwordUpdatedAt: new Date().toISOString(),
  });

  return json(200, { ok: true, username });
};