"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Abre um arquivo de bucket privado via link assinado temporário.
// Roda no navegador do admin (RLS permite leitura de documents/selfies).
export function ViewDocumentButton({
  path,
  bucket = "documents",
  label,
}: {
  path: string;
  bucket?: "documents" | "selfies" | "proofs";
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const text = label ?? "🪪 Ver documento";

  async function open() {
    if (/^https?:\/\//.test(path)) { window.open(path, "_blank", "noopener,noreferrer"); return; }
    setBusy(true); setErr("");
    const supabase = createClient();
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 120);
    setBusy(false);
    if (error || !data) { setErr("Falha ao abrir"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={open} disabled={busy}
        className="rounded-lg border border-gold/40 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10 disabled:opacity-50">
        {busy ? "Abrindo…" : text}
      </button>
      {err && <span className="text-xs text-red-300">{err}</span>}
    </span>
  );
}
