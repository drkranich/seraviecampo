"use client";

import { useRef, useState } from "react";

// Heurística simples anti "papel em branco": rejeita imagens muito uniformes
// (sem texto/foto). Não substitui verificação oficial de documento (KYC).
async function looksLikeDocument(file: File): Promise<boolean> {
  if (file.type === "application/pdf") return true; // PDFs passam pela checagem visual
  try {
    const bitmap = await createImageBitmap(file);
    const w = 160, h = Math.max(1, Math.round((bitmap.height / bitmap.width) * 160));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    let sum = 0, sum2 = 0; const n = w * h;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += lum; sum2 += lum * lum;
    }
    const mean = sum / n;
    const variance = sum2 / n - mean * mean;
    const std = Math.sqrt(Math.max(0, variance));
    // Documento real (texto, foto, brasão) tem contraste; folha em branco é quase uniforme.
    return std >= 22;
  } catch {
    return true; // se não der para analisar, não bloqueia
  }
}

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

    const ok = await looksLikeDocument(file);
    if (!ok) {
      setErr("A imagem parece estar em branco ou ilegível. Envie uma foto nítida do documento oficial (com texto e foto visíveis).");
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "documents");
    fd.append("folder", docType);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || "Falha no upload."); setBusy(false); return; }
      setPath(json.path);
    } catch {
      setErr("Falha de conexão no upload.");
    }
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
