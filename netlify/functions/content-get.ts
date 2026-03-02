import type { Handler } from "@netlify/functions";
import { getBlobsStore } from "./_blobs";
import { json } from "./_utils";

type MapKey =
  | "mirage"
  | "inferno"
  | "dust2"
  | "nuke"
  | "overpass"
  | "ancient"
  | "anubis";

export type StratCard = {
  id: string;
  title: string;
  side?: "CT" | "T" | "Both";
  tags?: string[];
  bodyHtml: string;
  collapsed?: boolean;
};

export type MapContent = {
  version: 1;
  updatedAt: string;
  strats: StratCard[];
  // (optionnel) futur: stuffs, notes, etc.
};

function normalizeMap(v: string | null): MapKey | null {
  const m = (v || "").toLowerCase().trim();
  const ok: MapKey[] = ["mirage", "inferno", "dust2", "nuke", "overpass", "ancient", "anubis"];
  return (ok as string[]).includes(m) ? (m as MapKey) : null;
}

export const handler: Handler = async (event) => {
  const map = normalizeMap(event.queryStringParameters?.map ?? null);
  if (!map) return json(400, { error: "Invalid map" });

  try {
    const store = getBlobsStore(event, "book-content");
    const key = `maps/${map}/content.json`;
    const raw = await store.get(key, { type: "json" }).catch(() => null);
    const data = (raw as any) as MapContent | null;

    const fallback: MapContent = {
      version: 1,
      updatedAt: new Date().toISOString(),
      strats: [],
    };

    return json(200, { ok: true, map, data: data || fallback });
  } catch (e: any) {
    return json(500, { error: e?.message || "content-get failed" });
  }
};
