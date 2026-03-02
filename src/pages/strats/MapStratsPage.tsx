import { useEffect, useMemo, useState } from "react";
import StratsAccordion from "@/components/StratsAccordion";
import { apiContentGet, type MapContent, type MapKey } from "@/app/contentApi";

export default function MapStratsPage({ map, title }: { map: MapKey; title: string }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<MapContent | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    apiContentGet(map)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(String(e?.message || e));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [map]);

  const items = useMemo(() => (data?.strats || []).slice(), [data]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl2 border border-border bg-card/60 p-4 shadow-soft backdrop-blur">
        <h2 className="text-xl font-semibold">{title} • Strats</h2>
        <p className="mt-1 text-xs text-muted/80">
          Contenu éditable via <span className="text-white/70">/admin</span> (rôle admin).
        </p>
        {loading && <p className="mt-2 text-sm text-muted">Chargement…</p>}
        {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
      </div>

      {!loading && !err && <StratsAccordion items={items} />}
    </div>
  );
}
