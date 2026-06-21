"use client";

import { useRef, useState } from "react";

export function MultiImageUpload({
  name,
  label,
  folder,
  currentImages,
  max = 8,
}: {
  name: string;
  label: string;
  folder: string;
  currentImages?: string[] | null;
  max?: number;
}) {
  const [urls, setUrls] = useState<string[]>(currentImages ?? []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true); setErr("");
    const next = [...urls];
    for (const file of files) {
      if (next.length >= max) break;
      if (file.size > 8 * 1024 * 1024) { setErr("Alguma imagem passou de 8MB e foi ignorada."); continue; }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "media");
      fd.append("folder", folder);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (res.ok && json.url) next.push(json.url);
        else setErr(json.error || "Falha no upload de uma imagem.");
      } catch { setErr("Falha de conexão no upload."); }
    }
    setUrls(next);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function remove(i: number) { setUrls(urls.filter((_, idx) => idx !== i)); }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= urls.length) return;
    const arr = [...urls];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setUrls(arr);
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-stone-300">{label} <span className="text-stone-500">(até {max} — a 1ª é a capa)</span></label>
      <input type="hidden" name={name} value={JSON.stringify(urls)} />

      {urls.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {urls.map((u, i) => (
            <div key={u + i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-campo-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-0 top-0 bg-gold px-1 text-[0.55rem] text-campo-bg">capa</span>}
              <div className="absolute bottom-0 right-0 flex">
                {i > 0 && <button type="button" onClick={() => move(i, -1)} className="bg-campo-bg/80 px-1 text-xs text-stone-200">‹</button>}
                {i < urls.length - 1 && <button type="button" onClick={() => move(i, 1)} className="bg-campo-bg/80 px-1 text-xs text-stone-200">›</button>}
                <button type="button" onClick={() => remove(i)} className="bg-red-950/80 px-1 text-xs text-red-300">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {urls.length < max && (
        <label className="inline-block cursor-pointer rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">
          {busy ? "Enviando…" : "+ Adicionar fotos"}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onChange} disabled={busy} />
        </label>
      )}
      {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
    </div>
  );
}
