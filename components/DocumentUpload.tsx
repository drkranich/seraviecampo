"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function DocumentUpload({
  userId,
  label,
  docType,
  currentPath,
}: {
  userId: string;
  label: string;
  docType: "rg" | "cnh";
  currentPath?: string | null;
}) {
  const [path, setPath] = useState(currentPath ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setErr("Arquivo muito grande (máx. 8MB)."); return; }
    setBusy(true); setErr("");

    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const p = `${userId}/${docType}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("documents").upload(p, file, {
      upsert: true,
      contentType: file.type || "image/jpeg",
    });
    if (error) { setErr(error.message); setBusy(false); return; }
    setPath(p);
    setBusy(false);
  }

  return (
    <div className="rounded-xl border border-campo-border bg-campo-surface2 p-4">
      <label className="mb-1 block text-sm text-stone-300">{label} *</label>
      <p className="mb-3 text-xs text-stone-500">
        Documento confidencial — visível apenas para você e para a verificação da plataforma.
      </p>
      <input type="hidden" name="document_url" value={path} />
      <input type="hidden" name="document_type" value={docType} />

      <div className="flex items-center gap-3">
        <span className="text-2xl">🪪</span>
        {path ? (
          <span className="text-sm text-forest-200">✓ Documento enviado</span>
        ) : (
          <span className="text-sm text-stone-500">Nenhum documento enviado</span>
        )}
        <label className="ml-auto cursor-pointer rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">
          {busy ? "Enviando…" : path ? "Trocar" : "Enviar documento"}
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onChange} disabled={busy} />
        </label>
      </div>
      {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
    </div>
  );
}
