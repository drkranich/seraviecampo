"use client";

import { useMemo, useRef, useState } from "react";

type FieldKind = "text" | "textarea" | "url" | "image" | "select";
type SelectOption = { label: string; value: string };

export type CmsListField = {
  key: string;
  label: string;
  kind?: FieldKind;
  placeholder?: string;
  rows?: number;
  helper?: string;
  span?: "full";
  options?: SelectOption[];
};

type ObjectRow = Record<string, string>;

const inputCls = "w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-gold";
const quietButtonCls = "rounded-lg border border-campo-border px-2.5 py-1.5 text-xs text-stone-300 transition hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-35";
const imageButtonCls = "rounded-lg border border-campo-border px-3 py-2 text-xs font-medium text-stone-200 transition hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50";

function cleanString(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function normalizeObjectRows(items: object[], fields: CmsListField[], emptyItem: ObjectRow) {
  const source = items.length ? items : [emptyItem];
  return source.map((item) => {
    const raw = item as Record<string, unknown>;
    const row: ObjectRow = {};
    fields.forEach((field) => {
      row[field.key] = cleanString(raw[field.key] ?? emptyItem[field.key]);
    });
    return row;
  });
}

function hasContent(row: ObjectRow) {
  return Object.values(row).some((value) => value.trim().length > 0);
}

function moveRow<T>(rows: T[], from: number, to: number) {
  const next = [...rows];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function uploadFolderFor(listName: string, rowIndex: number, fieldKey: string) {
  return `cms-${listName}-${fieldKey}-${rowIndex + 1}`.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
}

function CmsImageInput({
  id,
  value,
  onChange,
  placeholder,
  folder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  folder: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Imagem muito grande. O limite e 8MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "media");
    formData.append("folder", folder);

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await response.json();
      if (!response.ok || !json.url) {
        setError(json.error || "Falha no upload.");
        return;
      }
      onChange(String(json.url));
    } catch {
      setError("Falha de conexao no upload.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-campo-border bg-campo-bg/35 p-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,0.38fr)_minmax(0,1fr)]">
        <div className="aspect-[16/10] overflow-hidden rounded-lg border border-campo-border bg-campo-surface2">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-stone-600">
              Sem imagem
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <input
            id={id}
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder || "Cole uma URL ou envie uma imagem"}
            className={inputCls}
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className={imageButtonCls}>
              {busy ? "Enviando..." : value ? "Trocar imagem" : "Enviar imagem"}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={busy} />
            </label>
            {value && (
              <button type="button" onClick={() => onChange("")} className="rounded-lg border border-red-900/50 px-3 py-2 text-xs text-red-300 transition hover:border-red-500/70 hover:text-red-200">
                Remover
              </button>
            )}
          </div>
          <p className="text-xs text-stone-500">Envie JPG, PNG ou WebP ate 8MB, ou cole uma URL externa.</p>
          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export function CmsStringListEditor({
  name,
  label,
  items,
  itemLabel = "Item",
  placeholder = "",
  addLabel = "Adicionar item",
}: {
  name: string;
  label: string;
  items: string[];
  itemLabel?: string;
  placeholder?: string;
  addLabel?: string;
}) {
  const [rows, setRows] = useState(() => (items.length ? items : [""]));
  const serialized = useMemo(() => JSON.stringify(rows.map((item) => item.trim()).filter(Boolean)), [rows]);

  return (
    <div className="rounded-lg border border-campo-border bg-campo-bg/30 p-3">
      <input type="hidden" name={name} value={serialized} />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <label className="block text-sm font-medium text-forest-100">{label}</label>
          <p className="mt-0.5 text-xs text-stone-500">{rows.filter((item) => item.trim()).length} itens publicados</p>
        </div>
        <button type="button" onClick={() => setRows((current) => [...current, ""])} className="rounded-lg bg-gold px-3 py-1.5 text-xs font-medium text-campo-bg transition hover:bg-gold-light">
          + {addLabel}
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-lg border border-campo-border bg-campo-surface/60 p-2 sm:grid-cols-[1fr_auto]">
            <label className="sr-only">{itemLabel} {index + 1}</label>
            <input
              value={item}
              onChange={(event) => setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? event.target.value : row)))}
              placeholder={placeholder || `${itemLabel} ${index + 1}`}
              className={inputCls}
            />
            <div className="flex items-center gap-1">
              <button type="button" title="Mover para cima" aria-label="Mover para cima" disabled={index === 0} onClick={() => setRows((current) => moveRow(current, index, index - 1))} className={quietButtonCls}>
                Subir
              </button>
              <button type="button" title="Mover para baixo" aria-label="Mover para baixo" disabled={index === rows.length - 1} onClick={() => setRows((current) => moveRow(current, index, index + 1))} className={quietButtonCls}>
                Descer
              </button>
              <button type="button" title="Remover" aria-label="Remover" onClick={() => setRows((current) => (current.length === 1 ? [""] : current.filter((_, rowIndex) => rowIndex !== index)))} className="rounded-lg border border-red-900/50 px-2.5 py-1.5 text-xs text-red-300 transition hover:border-red-500/70 hover:text-red-200">
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CmsObjectListEditor({
  name,
  label,
  items,
  fields,
  emptyItem,
  itemLabel = "Item",
  addLabel = "Adicionar item",
  titleKey,
}: {
  name: string;
  label: string;
  items: object[];
  fields: CmsListField[];
  emptyItem: ObjectRow;
  itemLabel?: string;
  addLabel?: string;
  titleKey?: string;
}) {
  const [rows, setRows] = useState(() => normalizeObjectRows(items, fields, emptyItem));
  const serialized = useMemo(() => JSON.stringify(rows.filter(hasContent)), [rows]);

  function updateValue(rowIndex: number, key: string, value: string) {
    setRows((current) => current.map((row, index) => (index === rowIndex ? { ...row, [key]: value } : row)));
  }

  return (
    <div className="rounded-lg border border-campo-border bg-campo-bg/30 p-3">
      <input type="hidden" name={name} value={serialized} />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <label className="block text-sm font-medium text-forest-100">{label}</label>
          <p className="mt-0.5 text-xs text-stone-500">{rows.filter(hasContent).length} itens publicados</p>
        </div>
        <button type="button" onClick={() => setRows((current) => [...current, emptyItem])} className="rounded-lg bg-gold px-3 py-1.5 text-xs font-medium text-campo-bg transition hover:bg-gold-light">
          + {addLabel}
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((row, rowIndex) => {
          const rowTitle = titleKey && row[titleKey] ? row[titleKey] : `${itemLabel} ${rowIndex + 1}`;

          return (
            <div key={rowIndex} className="rounded-lg border border-campo-border bg-campo-surface/60 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-forest-100">{rowTitle}</h3>
                <div className="flex items-center gap-1">
                  <button type="button" title="Mover para cima" aria-label="Mover para cima" disabled={rowIndex === 0} onClick={() => setRows((current) => moveRow(current, rowIndex, rowIndex - 1))} className={quietButtonCls}>
                    Subir
                  </button>
                  <button type="button" title="Mover para baixo" aria-label="Mover para baixo" disabled={rowIndex === rows.length - 1} onClick={() => setRows((current) => moveRow(current, rowIndex, rowIndex + 1))} className={quietButtonCls}>
                    Descer
                  </button>
                  <button type="button" title="Remover" aria-label="Remover" onClick={() => setRows((current) => (current.length === 1 ? [emptyItem] : current.filter((_, index) => index !== rowIndex)))} className="rounded-lg border border-red-900/50 px-2.5 py-1.5 text-xs text-red-300 transition hover:border-red-500/70 hover:text-red-200">
                    Remover
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {fields.map((field) => {
                  const value = row[field.key] ?? "";
                  const fieldId = `${name}-${rowIndex}-${field.key}`;
                  const wrapCls = field.span === "full" || field.kind === "textarea" || field.kind === "image" ? "sm:col-span-2" : "";

                  return (
                    <div key={field.key} className={wrapCls}>
                      <label htmlFor={fieldId} className="mb-1 block text-xs font-medium text-stone-300">{field.label}</label>
                      {field.kind === "textarea" ? (
                        <textarea
                          id={fieldId}
                          value={value}
                          onChange={(event) => updateValue(rowIndex, field.key, event.target.value)}
                          placeholder={field.placeholder}
                          rows={field.rows ?? 3}
                          className={inputCls}
                        />
                      ) : field.kind === "select" ? (
                        <select id={fieldId} value={value} onChange={(event) => updateValue(rowIndex, field.key, event.target.value)} className={inputCls}>
                          {(field.options ?? []).map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      ) : field.kind === "image" ? (
                        <CmsImageInput
                          id={fieldId}
                          value={value}
                          onChange={(nextValue) => updateValue(rowIndex, field.key, nextValue)}
                          placeholder={field.placeholder}
                          folder={uploadFolderFor(name, rowIndex, field.key)}
                        />
                      ) : (
                        <input
                          id={fieldId}
                          type="text"
                          value={value}
                          onChange={(event) => updateValue(rowIndex, field.key, event.target.value)}
                          placeholder={field.placeholder}
                          className={inputCls}
                        />
                      )}
                      {field.helper && <p className="mt-1 text-xs text-stone-500">{field.helper}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
