import type { Handler } from "@netlify/functions";
import jwt from "jsonwebtoken";
import { getBlobsStore } from "./_blobs";
import { getCookie, json } from "./_utils";

type MapKey =
  | "mirage"
  | "inferno"
  | "dust2"
  | "nuke"
  | "overpass"
  | "ancient"
  | "anubis";

type StratCard = {
  id: string;
  title: string;
  side?: "CT" | "T" | "Both";
  tags?: string[];
  bodyHtml: string;
  collapsed?: boolean;
};

type MapContent = {
  version: 1;
  updatedAt: string;
  strats: StratCard[];
};

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "playsure_token";
const JWT_SECRET = process.env.AUTH_JWT_SECRET || "dev-secret";

function normalizeMap(v: string | null): MapKey | null {
  const m = (v || "").toLowerCase().trim();
  const ok: MapKey[] = ["mirage", "inferno", "dust2", "nuke", "overpass", "ancient", "anubis"];
  return (ok as string[]).includes(m) ? (m as MapKey) : null;
}

function isAdmin(event: any): { ok: true; username: string } | { ok: false } {
  const token = getCookie(event.headers.cookie, COOKIE_NAME);
  if (!token) return { ok: false };
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded?.role !== "admin") return { ok: false };
    return { ok: true, username: decoded?.sub || "admin" };
  } catch {
    return { ok: false };
  }
}

function sanitizeContent(input: any): MapContent {
  const now = new Date().toISOString();
  const strats = Array.isArray(input?.strats) ? input.strats : [];
  const safeStrats: StratCard[] = strats
    .map((s: any) => ({
      id: String(s?.id || "").slice(0, 80),
      title: String(s?.title || "").slice(0, 140),
      side: s?.side === "CT" || s?.side === "T" || s?.side === "Both" ? s.side : "Both",
      tags: Array.isArray(s?.tags) ? s.tags.map((t: any) => String(t).slice(0, 32)).slice(0, 12) : [],
      bodyHtml: String(s?.bodyHtml || "").slice(0, 50_000),
      collapsed: !!s?.collapsed,
    }))
    .filter((s: StratCard) => !!s.id && !!s.title);

  return {
    version: 1,
    updatedAt: now,
    strats: safeStrats,
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const admin = isAdmin(event);
  if (!admin.ok) return json(401, { error: "Unauthorized" });

  const map = normalizeMap(event.queryStringParameters?.map ?? null);
  if (!map) return json(400, { error: "Invalid map" });

  let payload: any = null;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  try {
    const store = getBlobsStore(event, "book-content");
    const key = `maps/${map}/content.json`;

    const next = sanitizeContent(payload);
    await store.setJSON(key, next);

    return json(200, { ok: true, map, updatedAt: next.updatedAt, savedBy: admin.username });
  } catch (e: any) {
    return json(500, { error: e?.message || "content-set failed" });
  }
};
