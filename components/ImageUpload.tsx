"use client";

import { useRef, useState } from "react";

export function ImageUpload({
  name,
  label,
  userId,
  currentUrl,
  folder,
  shape = "square",
  bucket = "media",
  orderId,
}: {
  name: string;
  label: string;
  userId: string;
  currentUrl?: string | null;
  folder: string;
  shape?: "square" | "wide";
  bucket?: "media" | "proofs";
  orderId?: string;
}) {
  const [value, setValue] = useState(currentUrl ?? "");   // salvo no form (url p/ media, path p/ proofs)
  const [preview, setPreview] = useState(currentUrl ?? ""); // src da imagem
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setErr("Imagem muito grande (máx. 8MB)."); return; }
    setBusy(true); setErr("");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", bucket);
    fd.append("folder", folder);
    if (bucket === "proofs" && orderId) fd.append("order_id", orderId);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || "Falha no upload."); setBusy(false); return; }
      setValue(bucket === "proofs" ? (json.path ?? "") : (json.url ?? ""));
      setPreview(json.url ?? "");
    } catch {
      setErr("Falha de conexão no upload.");
    }
    setBusy(false);
  }

  function remove() {
    setValue(""); setPreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const previewCls = shape === "wide" ? "h-28 w-full rounded-xl" : "h-24 w-24 rounded-full";

  return (
    <div>
      <label className="mb-1 block text-sm text-stone-300">{label}</label>
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-4">
        <div className={`${previewCls} overflow-hidden border border-campo-border bg-campo-surface2`}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl text-stone-600">
              {shape === "wide" ? "🌄" : "🌾"}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="cursor-pointer rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">
            {busy ? "Enviando…" : value ? "Trocar imagem" : "Escolher imagem"}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onChange} disabled={busy} />
          </label>
          {value && !busy && (
            <button type="button" onClick={remove} className="text-left text-xs text-stone-500 hover:text-red-300">Remover</button>
          )}
        </div>
      </div>
      {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
    </div>
  );
}
