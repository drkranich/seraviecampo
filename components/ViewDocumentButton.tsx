"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Gera um link assinado temporário e abre o documento (bucket privado).
// Roda no navegador do admin, que tem permissão de leitura via RLS.
export function ViewDocumentButton({ path }: { path: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function open() {
    setBusy(true); setErr("");
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 120);
    setBusy(false);
    if (error || !data) { setErr("Falha ao abrir"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={open}
        disabled={busy}
        className="rounded-lg border border-gold/40 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10 disabled:opacity-50"
      >
        {busy ? "Abrindo…" : "🪪 Ver documento"}
      </button>
      {err && <span className="text-xs text-red-300">{err}</span>}
    </span>
  );
}
