import { useEffect, useMemo, useState } from "react";
import { apiMe } from "@/app/auth";
import { apiContentGet, apiContentSet, type MapContent, type MapKey, type StratCard } from "@/app/contentApi";
import Wysiwyg from "@/components/Wysiwyg";

const MAPS: { key: MapKey; label: string }[] = [
  { key: "mirage", label: "Mirage" },
  { key: "inferno", label: "Inferno" },
  { key: "dust2", label: "Dust2" },
  { key: "nuke", label: "Nuke" },
  { key: "overpass", label: "Overpass" },
  { key: "ancient", label: "Ancient" },
  { key: "anubis", label: "Anubis" },
];

function uid() {
  return "s_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function Admin() {
  const [me, setMe] = useState<{ loading: boolean; ok: boolean; role?: string; user?: string }>({
    loading: true,
    ok: false,
  });

  const [map, setMap] = useState<MapKey>("mirage");
  const [data, setData] = useState<MapContent | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiMe()
      .then((m) => setMe({ loading: false, ok: !!m.authenticated, role: m.role, user: m.username }))
      .catch(() => setMe({ loading: false, ok: false }));
  }, []);

  useEffect(() => {
    if (!me.ok) return;
    setErr(null);
    setStatus("Chargement…");
    apiContentGet(map)
      .then((d) => {
        setData(d);
        setSelectedId(d.strats?.[0]?.id || null);
        setStatus(null);
      })
      .catch((e) => {
        setErr(String(e?.message || e));
        setStatus(null);
      });
  }, [map, me.ok]);

  const cards = useMemo(() => data?.strats || [], [data]);
  const selected = useMemo(() => cards.find((c) => c.id === selectedId) || null, [cards, selectedId]);

  const updateSelected = (patch: Partial<StratCard>) => {
    if (!data || !selected) return;
    setData({
      ...data,
      strats: data.strats.map((s) => (s.id === selected.id ? { ...s, ...patch } : s)),
    });
  };

  const addStrat = () => {
    const next: StratCard = {
      id: uid(),
      title: "Nouvelle strat",
      side: "Both",
      tags: [],
      bodyHtml: "<p>Décris la strat ici…</p>",
      collapsed: false,
    };
    setData((d) =>
      d
        ? { ...d, strats: [next, ...(d.strats || [])], updatedAt: new Date().toISOString() }
        : { version: 1, updatedAt: new Date().toISOString(), strats: [next] }
    );
    setSelectedId(next.id);
  };

  const delSelected = () => {
    if (!data || !selected) return;
    const rest = data.strats.filter((s) => s.id !== selected.id);
    setData({ ...data, strats: rest, updatedAt: new Date().toISOString() });
    setSelectedId(rest[0]?.id || null);
  };

  const moveSelected = (dir: -1 | 1) => {
    if (!data || !selected) return;
    const arr = [...data.strats];
    const i = arr.findIndex((s) => s.id === selected.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
    setData({ ...data, strats: arr, updatedAt: new Date().toISOString() });
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setErr(null);
    setStatus("Sauvegarde…");
    try {
      const payload: MapContent = {
        ...data,
        version: 1,
        updatedAt: new Date().toISOString(),
      };
      const r = await apiContentSet(map, payload);
      setStatus(`✅ Sauvé (${new Date(r.updatedAt).toLocaleString()})`);
      // refresh local timestamp
      setData(payload);
    } catch (e: any) {
      setErr(String(e?.message || e));
      setStatus(null);
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 2500);
    }
  };

  if (me.loading) {
    return (
      <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
        <h2 className="text-xl font-semibold">Admin</h2>
        <p className="mt-2 text-sm text-muted">Chargement…</p>
      </div>
    );
  }

  if (!me.ok) {
    return (
      <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
        <h2 className="text-xl font-semibold">Admin</h2>
        <p className="mt-2 text-sm text-muted">Tu dois être connecté pour accéder à cette page.</p>
        <p className="mt-1 text-xs text-muted/80">Va sur /login</p>
      </div>
    );
  }

  if (me.role !== "admin") {
    return (
      <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
        <h2 className="text-xl font-semibold">Admin</h2>
        <p className="mt-2 text-sm text-muted">Accès refusé (rôle: {me.role || "?"}).</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl2 border border-border bg-card/60 p-4 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">Admin • Strats</h2>
          <span className="text-xs text-white/40">({me.user})</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={addStrat}
              className="rounded-lg border border-border/70 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              + Ajouter
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg border border-border/70 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
            >
              Sauvegarder
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {MAPS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMap(m.key)}
              className={
                "rounded-full border px-3 py-1 text-xs " +
                (map === m.key
                  ? "border-white/25 bg-white/10 text-white"
                  : "border-border/70 bg-white/5 text-white/70 hover:bg-white/10")
              }
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mt-3 text-xs">
          {status && <span className="text-white/70">{status}</span>}
          {err && <span className="text-red-400">{err}</span>}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
        <div className="rounded-xl2 border border-border bg-card/60 p-3 shadow-soft backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Cartes ({cards.length})</div>
            <div className="flex gap-1">
              <button
                disabled={!selected}
                onClick={() => moveSelected(-1)}
                className="rounded-lg border border-border/70 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40"
              >
                ↑
              </button>
              <button
                disabled={!selected}
                onClick={() => moveSelected(1)}
                className="rounded-lg border border-border/70 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40"
              >
                ↓
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {cards.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={
                  "w-full rounded-xl border px-3 py-2 text-left " +
                  (selectedId === c.id
                    ? "border-white/25 bg-white/10"
                    : "border-border/70 bg-black/10 hover:bg-white/5")
                }
              >
                <div className="truncate text-sm font-semibold">{c.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                  <span>{c.side || "Both"}</span>
                  {c.tags?.length ? <span>• {c.tags.join(" • ")}</span> : null}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {!selected ? (
            <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
              <h3 className="text-lg font-semibold">Aucune strat sélectionnée</h3>
              <p className="mt-2 text-sm text-muted">Clique sur une carte à gauche, ou ajoute-en une.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl2 border border-border bg-card/60 p-4 shadow-soft backdrop-blur">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={selected.title}
                    onChange={(e) => updateSelected({ title: e.target.value })}
                    className="w-full rounded-lg border border-border/70 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    placeholder="Titre"
                  />
                  <div className="flex w-full flex-wrap gap-2">
                    <select
                      value={selected.side || "Both"}
                      onChange={(e) => updateSelected({ side: e.target.value as any })}
                      className="rounded-lg border border-border/70 bg-black/20 px-3 py-2 text-xs text-white/80 outline-none focus:border-white/25"
                    >
                      <option value="Both">Both</option>
                      <option value="CT">CT</option>
                      <option value="T">T</option>
                    </select>

                    <label className="flex items-center gap-2 rounded-lg border border-border/70 bg-black/20 px-3 py-2 text-xs text-white/70">
                      <input
                        type="checkbox"
                        checked={!!selected.collapsed}
                        onChange={(e) => updateSelected({ collapsed: e.target.checked })}
                      />
                      repliée par défaut
                    </label>

                    <button
                      onClick={delSelected}
                      className="ml-auto rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:bg-red-500/15"
                    >
                      Supprimer
                    </button>
                  </div>

                  <input
                    value={(selected.tags || []).join(", ")}
                    onChange={(e) =>
                      updateSelected({
                        tags: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full rounded-lg border border-border/70 bg-black/20 px-3 py-2 text-xs text-white/80 outline-none focus:border-white/25"
                    placeholder="Tags (séparés par des virgules)"
                  />
                </div>
              </div>

              <Wysiwyg
                valueHtml={selected.bodyHtml}
                onChangeHtml={(html) => updateSelected({ bodyHtml: html })}
                placeholder="Décris la strat, timings, utilités, placements…"
              />
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl2 border border-border bg-card/60 p-4 text-xs text-muted/80 shadow-soft backdrop-blur">
        <div className="font-semibold text-white/70">À venir</div>
        <div className="mt-1">
          La même page peut gérer <span className="text-white/70">Stuffs</span> (lineups) : type de grenade, coordonnées,
          preview, et description WYSIWYG. Dis-moi si tu veux migrer les lineups existants vers Blobs.
        </div>
      </div>
    </div>
  );
}
