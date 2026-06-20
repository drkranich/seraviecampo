"use client";

import { useEffect, useRef, useState } from "react";

export type FancyOption = { value: string; label: string };

export function FancySelect({
  name,
  options,
  defaultValue,
  placeholder = "Selecione",
  className,
  searchable = false,
}: {
  name: string;
  options: FancyOption[];
  defaultValue?: string | null;
  placeholder?: string;
  className?: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(defaultValue ?? "");
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.value === val);
  const list = searchable && q.trim() ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className={className} ref={ref}>
      <style>{`
        .fancy-pop{scrollbar-width:thin;scrollbar-color:rgba(201,190,147,.5) transparent;}
        .fancy-pop::-webkit-scrollbar{width:10px;}
        .fancy-pop::-webkit-scrollbar-track{background:rgba(255,255,255,.04);border-radius:8px;}
        .fancy-pop::-webkit-scrollbar-thumb{background:rgba(201,190,147,.45);border-radius:8px;border:2px solid transparent;background-clip:padding-box;}
        .fancy-pop::-webkit-scrollbar-thumb:hover{background:rgba(201,190,147,.75);}
      `}</style>
      <input type="hidden" name={name} value={val} />
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-left text-stone-100 outline-none transition focus:border-gold"
        >
          <span className={current ? "" : "text-stone-500"}>{current ? current.label : placeholder}</span>
          <span className={`text-stone-500 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </button>
        {open && (
          <div className="fancy-pop glass absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-campo-border shadow-2xl">
            {searchable && (
              <div className="sticky top-0 border-b border-campo-border bg-campo-surface2/80 p-2 backdrop-blur">
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…"
                  className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-1.5 text-sm text-stone-100 outline-none focus:border-gold" />
              </div>
            )}
            {list.length === 0 ? (
              <p className="px-3 py-3 text-sm text-stone-500">Nada encontrado.</p>
            ) : (
              list.map((o) => (
                <button key={o.value || "_"} type="button" onClick={() => { setVal(o.value); setOpen(false); setQ(""); }}
                  className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-gold/10 ${o.value === val ? "bg-gold/10 text-gold" : "text-stone-200"}`}>
                  {o.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
