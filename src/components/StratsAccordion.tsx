import { useState } from "react";
import type { StratCard } from "@/app/contentApi";

export default function StratsAccordion({ items }: { items: StratCard[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (!items.length) {
    return (
      <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
        <h2 className="text-xl font-semibold">Strats</h2>
        <p className="mt-2 text-sm text-muted">Aucune strat pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl2 border border-border bg-card/60 p-4 shadow-soft backdrop-blur">
      <h2 className="px-2 pb-3 text-xl font-semibold">Strats</h2>
      <div className="space-y-2">
        {items.map((s) => {
          const isOpen = open[s.id] ?? !s.collapsed;
          return (
            <div key={s.id} className="rounded-xl border border-border/70 bg-black/10">
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [s.id]: !isOpen }))}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate font-semibold">{s.title}</div>
                    {s.side && (
                      <span className="rounded-full border border-border/70 bg-white/5 px-2 py-[2px] text-[11px] text-white/70">
                        {s.side}
                      </span>
                    )}
                    {Array.isArray(s.tags) && s.tags.length > 0 && (
                      <span className="text-[11px] text-white/35">• {s.tags.join(" • ")}</span>
                    )}
                  </div>
                </div>
                <span className="text-white/55">{isOpen ? "–" : "+"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-border/70 px-4 py-3">
                  <div className="strat-body max-w-none text-sm leading-relaxed"
                    // contenu admin -> HTML
                    dangerouslySetInnerHTML={{ __html: s.bodyHtml || "" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .strat-body h2 { font-size: 1.15rem; font-weight: 600; margin: 0.35rem 0; }
        .strat-body h3 { font-size: 1.02rem; font-weight: 600; margin: 0.35rem 0; }
        .strat-body ul { list-style: disc; padding-left: 1.25rem; }
        .strat-body ol { list-style: decimal; padding-left: 1.25rem; }
        .strat-body a { text-decoration: underline; color: rgba(255,255,255,0.9); }
        .strat-body code { padding: 0.1rem 0.25rem; border-radius: 0.35rem; background: rgba(255,255,255,0.08); }
        .strat-body img { max-width: 100%; border-radius: 0.75rem; margin: 0.25rem 0; }
        .strat-body p { margin: 0.25rem 0; }
      `}</style>
    </div>
  );
}
