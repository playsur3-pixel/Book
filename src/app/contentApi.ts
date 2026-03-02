export type MapKey = "mirage" | "inferno" | "dust2" | "nuke" | "overpass" | "ancient" | "anubis";

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
};

export async function apiContentGet(map: MapKey): Promise<MapContent> {
  const r = await fetch(`/.netlify/functions/content-get?map=${encodeURIComponent(map)}`, {
    credentials: "include",
    cache: "no-store",
    headers: { "cache-control": "no-store" },
  });
  const j = await r.json().catch(() => ({} as any));
  if (!r.ok) throw new Error(j?.error || "content-get failed");
  return (j?.data || null) as MapContent;
}

export async function apiContentSet(map: MapKey, data: MapContent) {
  const r = await fetch(`/.netlify/functions/content-set?map=${encodeURIComponent(map)}`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "content-type": "application/json", "cache-control": "no-store" },
    body: JSON.stringify(data),
  });
  const j = await r.json().catch(() => ({} as any));
  if (!r.ok) throw new Error(j?.error || "content-set failed");
  return j as { ok: boolean; map: string; updatedAt: string; savedBy: string };
}
