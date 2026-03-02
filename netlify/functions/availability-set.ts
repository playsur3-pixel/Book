import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import jwt from "jsonwebtoken";
import { getCookie, json } from "./_utils";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "adminbook";
const JWT_SECRET = process.env.AUTH_JWT_SECRET || "dev-secret";

const STORE_NAME = process.env.AVAILABILITY_STORE || "playsure-schedule";

const MIN_HOUR = 17;
const MAX_HOUR = 22;

type UserFile = {
  version: 1;
  user: string;
  updatedAt: string;
  available: string[];
};

type Slot = { a: string[] };

type UsersDb = Record<string, { username: string; role?: string }>; 

function norm(s: string) {
  return s.trim().toLowerCase();
}

function normUserKey(name: string) {
  return norm(name).replace(/[^a-z0-9_-]+/g, "_");
}

function userBlobKey(displayName: string) {
  return `availability/users/${normUserKey(displayName)}.json`;
}

function isValidSlotKey(slotKey: string): boolean {
  const m = /^(\d{4}-\d{2}-\d{2})\|(\d{1,2})$/.exec(slotKey);
  if (!m) return false;

  const datePart = m[1];
  const hour = Number(m[2]);
  if (!Number.isInteger(hour) || hour < MIN_HOUR || hour > MAX_HOUR) return false;

  const d = new Date(`${datePart}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === datePart;
}

function toStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((x) => String(x).trim()).filter((s) => s.length > 0);
}

async function computeSlot(store: any, slotKey: string, allowedUsers: string[]): Promise<Slot> {
  const a: string[] = [];

  for (const u of allowedUsers) {
    const key = userBlobKey(u);
    const uf = (await store.get(key, { type: "json" }).catch(() => null)) as any;
    if (!uf) continue;

    const avail = toStringArray(uf.available).filter(isValidSlotKey);
    if (avail.includes(slotKey)) a.push(String(uf.user || u));
  }

  a.sort((x, y) => x.localeCompare(y, "fr"));
  return { a };
}

export const handler: Handler = async (event) => {
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    const token = getCookie(event.headers.cookie, COOKIE_NAME);
    if (!token) return json(401, { error: "Not authenticated" });

    let username = "";
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      username = String(decoded?.sub || "").trim();
    } catch {
      return json(401, { error: "Invalid token" });
    }
    if (!username) return json(401, { error: "Invalid token payload" });

    const body = event.body ? JSON.parse(event.body) : null;
    const slotKey: string = String(body?.slotKey ?? "").trim();

    let available: boolean | undefined = body?.available;
    if (typeof available !== "boolean") {
      const state = body?.state;
      if (state === "available") available = true;
      if (state === "clear") available = false;
    }

    if (!slotKey) return json(400, { error: "Missing slotKey" });
    if (typeof available !== "boolean") return json(400, { error: "Missing available boolean" });
    if (!isValidSlotKey(slotKey)) return json(400, { error: "Invalid slotKey" });

    // Source de vérité: users.json (créé via admin_init_player)
    const authStore = getStore("playsure-auth");
    const rawUsers = await authStore.get("users.json", { type: "json" }).catch(() => null);
    const users: UsersDb = (rawUsers && typeof rawUsers === "object") ? (rawUsers as UsersDb) : {};

    const allDisplayNames = Object.values(users).map((u) => String(u.username || "").trim()).filter(Boolean);

    // Canonical display name (garde la casse d'origine users.json)
    const displayName = allDisplayNames.find((u) => norm(u) === norm(username)) || "";
    if (!displayName) {
      return json(403, { error: "Unknown user" });
    }

    const store = getStore(STORE_NAME);

    const key = userBlobKey(displayName);
    const current = (await store.get(key, { type: "json" }).catch(() => null)) as any;

    const file: UserFile = {
      version: 1,
      user: displayName,
      updatedAt: new Date().toISOString(),
      available: [],
    };

    if (current) {
      file.user = String(current.user || displayName);
      file.available = toStringArray(current.available).filter(isValidSlotKey);
    }

    const set = new Set<string>(file.available);
    if (available) set.add(slotKey);
    else set.delete(slotKey);

    file.available = Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
    file.updatedAt = new Date().toISOString();

    await store.setJSON(key, file);

    const slot = await computeSlot(store, slotKey, allDisplayNames);

    return json(200, { ok: true, slotKey, slot, updatedAt: file.updatedAt, store: STORE_NAME });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};