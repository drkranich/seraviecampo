"use client";
import { useState } from "react";

const KINDS = [
  { id: "producao", label: "O que produzir", ph: "Ex: tenho 2 hectares na serra, hoje produzo queijo e morango..." },
  { id: "descricao", label: "Descrição de produto", ph: "Ex: Queijo Minas curado 8 meses, leite cru da fazenda" },
  { id: "preco", label: "Sugestão de preço", ph: "Ex: geleia artesanal de amora, pote 250g" },
  { id: "livre", label: "Pergunta livre", ph: "Pergunte qualquer coisa sobre sua produção..." },
];

export function IAAssistant() {
  const [kind, setKind] = useState("producao");
  const [prompt, setPrompt] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const cur = KINDS.find((k) => k.id === kind)!;

  async function run() {
    setBusy(true); setErr(""); setOut("");
    try {
      const r = await fetch("/api/ia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, prompt }) });
      const j = await r.json();
      if (!r.ok) setErr(j.error || "Erro ao consultar a IA.");
      else setOut(j.text || "Sem resposta.");
    } catch { setErr("Falha de conexão."); }
    setBusy(false);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button key={k.id} type="button" onClick={() => { setKind(k.id); setOut(""); setErr(""); }}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${kind === k.id ? "border-gold bg-gold/10 text-gold" : "border-campo-border text-stone-300 hover:border-gold/50"}`}>
            {k.label}
          </button>
        ))}
      </div>

      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder={cur.ph}
        className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold" />

      <button onClick={run} disabled={busy}
        className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light disabled:opacity-50">
        {busy ? "Consultando a IA…" : "Perguntar à IA Rural"}
      </button>

      {err && <div className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">{err}</div>}
      {out && (
        <div className="glass whitespace-pre-wrap rounded-2xl border border-campo-border p-5 text-sm leading-relaxed text-stone-200">{out}</div>
      )}
    </div>
  );
}
