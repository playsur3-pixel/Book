import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

type Role = "admin" | "coach" | "player";

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

// pbkdf2 simple (sans lib externe)
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

  const usernameRaw = String(payload.username || "");
  const password = String(payload.password || "");
  const role = String(payload.role || "player") as Role;

  if (!usernameRaw || usernameRaw.length < 2) return json(400, { error: "username too short" });
  if (!password || password.length < 6) return json(400, { error: "password too short (min 6)" });
  if (!["admin", "coach", "player"].includes(role)) return json(400, { error: "invalid role" });

  const username = normalizeUsername(usernameRaw);

  const store = getStore("auth");
  const key = `users/${username}.json`;

  const existing = await store.get(key, { type: "json" }).catch(() => null);
  if (existing) return json(409, { error: "User already exists", username });

  await store.setJSON(key, {
    username,
    role,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  });

  return json(200, { ok: true, username, role });
};