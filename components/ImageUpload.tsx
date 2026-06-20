"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ImageUpload({
  name,
  label,
  userId,
  currentUrl,
  folder,
  shape = "square",
}: {
  name: string;
  label: string;
  userId: string;
  currentUrl?: string | null;
  folder: string;
  shape?: "square" | "wide";
}) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr("Imagem muito grande (máx. 5MB)."); return; }
    setBusy(true); setErr("");

    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, {
      upsert: true,
      contentType: file.type || "image/jpeg",
    });
    if (error) { setErr(error.message); setBusy(false); return; }

    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setUrl(data.publicUrl);
    setBusy(false);
  }

  function remove() {
    setUrl("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const previewCls = shape === "wide" ? "h-28 w-full rounded-xl" : "h-24 w-24 rounded-full";

  return (
    <div>
      <label className="mb-1 block text-sm text-stone-300">{label}</label>
      <input type="hidden" name={name} value={url} />

      <div className="flex items-center gap-4">
        <div className={`${previewCls} overflow-hidden border border-campo-border bg-campo-surface2`}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl text-stone-600">
              {shape === "wide" ? "🌄" : "🌾"}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="cursor-pointer rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">
            {busy ? "Enviando…" : url ? "Trocar imagem" : "Escolher imagem"}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onChange} disabled={busy} />
          </label>
          {url && !busy && (
            <button type="button" onClick={remove} className="text-left text-xs text-stone-500 hover:text-red-300">Remover</button>
          )}
        </div>
      </div>
      {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
    </div>
  );
}
