import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  valueHtml: string;
  onChangeHtml: (html: string) => void;
  placeholder?: string;
  className?: string;
};

// WYSIWYG léger, sans dépendances (execCommand). Suffisant pour :
// titres, gras/italique, listes, liens, images, code inline.
export default function Wysiwyg({ valueHtml, onChangeHtml, placeholder, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync externe -> editor (sans casser le curseur quand on tape)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isFocused) return;
    if (el.innerHTML !== (valueHtml || "")) el.innerHTML = valueHtml || "";
  }, [valueHtml, isFocused]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    const el = ref.current;
    if (!el) return;
    onChangeHtml(el.innerHTML);
  };

  const buttons = useMemo(
    () => [
      { label: "B", title: "Gras", onClick: () => exec("bold") },
      { label: "I", title: "Italique", onClick: () => exec("italic") },
      { label: "U", title: "Souligné", onClick: () => exec("underline") },
      { label: "H2", title: "Titre", onClick: () => exec("formatBlock", "h2") },
      { label: "H3", title: "Sous-titre", onClick: () => exec("formatBlock", "h3") },
      { label: "•", title: "Liste", onClick: () => exec("insertUnorderedList") },
      { label: "1.", title: "Liste numérotée", onClick: () => exec("insertOrderedList") },
      {
        label: "🔗",
        title: "Lien",
        onClick: () => {
          const url = window.prompt("URL du lien :");
          if (!url) return;
          exec("createLink", url);
        },
      },
      {
        label: "🖼️",
        title: "Image",
        onClick: () => {
          const url = window.prompt("URL de l'image :");
          if (!url) return;
          exec("insertImage", url);
        },
      },
      { label: "</>", title: "Code inline", onClick: () => exec("insertHTML", "<code>code</code>") },
      { label: "↩", title: "Annuler", onClick: () => exec("undo") },
      { label: "↪", title: "Rétablir", onClick: () => exec("redo") },
    ],
    []
  );

  return (
    <div className={"rounded-xl2 border border-border bg-card/60 shadow-soft backdrop-blur " + (className || "")}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-3 py-2">
        {buttons.map((b) => (
          <button
            key={b.title}
            type="button"
            title={b.title}
            onMouseDown={(e) => {
              // évite de perdre le focus/caret
              e.preventDefault();
              b.onClick();
            }}
            className="rounded-lg border border-border/70 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
          >
            {b.label}
          </button>
        ))}
        <div className="ml-auto text-[11px] text-white/40">HTML sauvegardé</div>
      </div>

      <div
        ref={ref}
        className="min-h-[220px] px-3 py-3 text-sm leading-relaxed outline-none"
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          const el = ref.current;
          if (!el) return;
          onChangeHtml(el.innerHTML);
        }}
        onInput={() => {
          const el = ref.current;
          if (!el) return;
          onChangeHtml(el.innerHTML);
        }}
        data-placeholder={placeholder || ""}
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: rgba(255,255,255,0.35);
        }
        [contenteditable] h2 { font-size: 1.15rem; font-weight: 600; margin: 0.35rem 0; }
        [contenteditable] h3 { font-size: 1.02rem; font-weight: 600; margin: 0.35rem 0; }
        [contenteditable] ul { list-style: disc; padding-left: 1.25rem; }
        [contenteditable] ol { list-style: decimal; padding-left: 1.25rem; }
        [contenteditable] a { text-decoration: underline; color: rgba(255,255,255,0.9); }
        [contenteditable] code { padding: 0.1rem 0.25rem; border-radius: 0.35rem; background: rgba(255,255,255,0.08); }
        [contenteditable] img { max-width: 100%; border-radius: 0.75rem; margin: 0.25rem 0; }
      `}</style>
    </div>
  );
}
