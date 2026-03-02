import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { json } from "./_utils";

type LambdaEventLike = any;

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "adminbook";
const JWT_SECRET = process.env.AUTH_JWT_SECRET || "dev-secret";

// même normalisation que tes scripts admin
function normalizeUsername(u: string) {
  return u.trim().toUpperCase().replace(/\s+/g, "_");
}

// attendu: pbkdf2$$sha256$$120000$$<salt>$$<derivedHex>
function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.startsWith("pbkdf2$$")) return false;
  const parts = stored.split("$$");
  if (parts.length !== 6) return false;

  const digest = parts[2];
  const iter = Number(parts[3]);
  const salt = parts[4];
  const derivedHex = parts[5];

  if (!digest || !Number.isFinite(iter) || iter <= 0 || !salt || !derivedHex) return false;

  const keylen = Buffer.from(derivedHex, "hex").length;
  const computedHex = crypto
    .pbkdf2Sync(password, salt, iter, keylen, digest as any)
    .toString("hex");

  const a = Buffer.from(computedHex, "hex");
  const b = Buffer.from(derivedHex, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function buildSetCookie(name: string, value: string) {
  const isProd = process.env.NODE_ENV === "production";
  // SameSite=Lax suffit ici, Secure seulement en prod
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    isProd ? "Secure" : "",
    // 14 jours
    `Max-Age=${14 * 24 * 60 * 60}`,
  ].filter(Boolean);

  return parts.join("; ");
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

  // ✅ obligatoire pour Blobs avec @netlify/functions Handler
  connectLambda(event as unknown as LambdaEventLike);

  let payload: any;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const username = normalizeUsername(String(payload.username || ""));
  const password = String(payload.password || "");

  if (!username || !password) return json(400, { error: "Missing username/password" });

  const store = getStore("auth");
  const key = `users/${username}.json`;

  const user = await store.get(key, { type: "json" }).catch(() => null);
  if (!user) return json(401, { error: "Invalid credentials" });

  const role = String((user as any).role || "player");
  const hash = String((user as any).passwordHash || "");

  if (!verifyPassword(password, hash)) return json(401, { error: "Invalid credentials" });

  // JWT compatible avec ton auth-me.ts (sub + role)
  const token = jwt.sign({ role }, JWT_SECRET, { subject: username, expiresIn: "14d" });

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "set-cookie": buildSetCookie(COOKIE_NAME, token),
    },
    body: JSON.stringify({ ok: true, username, role }),
  };
};