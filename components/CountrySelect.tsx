"use client";

import { useEffect, useRef, useState } from "react";
import { COUNTRIES } from "@/lib/countries";

export function CountrySelect({ defaultValue, className }: { defaultValue?: string | null; className?: string }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(defaultValue || "BR");
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
  const list = COUNTRIES.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));

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
        .country-pop{scrollbar-width:thin;scrollbar-color:rgba(201,190,147,.5) transparent;}
        .country-pop::-webkit-scrollbar{width:10px;}
        .country-pop::-webkit-scrollbar-track{background:rgba(255,255,255,.04);border-radius:8px;}
        .country-pop::-webkit-scrollbar-thumb{background:rgba(201,190,147,.45);border-radius:8px;border:2px solid transparent;background-clip:padding-box;}
        .country-pop::-webkit-scrollbar-thumb:hover{background:rgba(201,190,147,.75);}
      `}</style>

      <label className="mb-1 block text-sm text-stone-300">País</label>
      <input type="hidden" name="country" value={code} />

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-left text-stone-100 outline-none transition focus:border-gold"
        >
          <span>{selected.name} <span className="text-stone-500">({selected.currency})</span></span>
          <span className={`text-stone-500 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </button>

        {open && (
          <div className="country-pop absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-campo-border bg-campo-bg/95 backdrop-blur-xl shadow-2xl">
            <div className="sticky top-0 border-b border-campo-border bg-campo-surface2/80 p-2 backdrop-blur">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar país…"
                className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-1.5 text-sm text-stone-100 outline-none focus:border-gold"
              />
            </div>
            {list.length === 0 ? (
              <p className="px-3 py-3 text-sm text-stone-500">Nenhum país encontrado.</p>
            ) : (
              list.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { setCode(c.code); setOpen(false); setQ(""); }}
                  className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-gold/10 ${c.code === code ? "bg-gold/10 text-gold" : "text-stone-200"}`}
                >
                  {c.name} <span className="text-stone-500">({c.currency})</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
