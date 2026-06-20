"use client";

import { useRef, useState } from "react";

export function ImageUpload({
  name,
  label,
  currentUrl,
  shape = "square",
}: {
  name: string;
  label: string;
  userId?: string; // mantido por compatibilidade (upload agora é no servidor)
  currentUrl?: string | null;
  folder?: string;
  shape?: "square" | "wide";
}) {
  const [preview, setPreview] = useState(currentUrl ?? "");
  const [keepUrl, setKeepUrl] = useState(currentUrl ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  function remove() {
    setPreview("");
    setKeepUrl("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const previewCls = shape === "wide" ? "h-28 w-full rounded-xl" : "h-24 w-24 rounded-full";

  return (
    <div>
      <label className="mb-1 block text-sm text-stone-300">{label}</label>
      {/* URL atual (mantida se nenhum arquivo novo for escolhido) */}
      <input type="hidden" name={name} value={keepUrl} />

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
            {preview ? "Trocar imagem" : "Escolher imagem"}
            <input
              ref={fileRef}
              type="file"
              name={`${name}_file`}
              accept="image/*"
              className="hidden"
              onChange={onChange}
            />
          </label>
          {preview && (
            <button type="button" onClick={remove} className="text-left text-xs text-stone-500 hover:text-red-300">
              Remover
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-stone-600">JPG ou PNG, até 5MB. Salva ao gravar o formulário.</p>
    </div>
  );
}
