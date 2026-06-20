"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Passkey = { id: string; friendly_name?: string; created_at: string; last_used_at?: string };

export function PasskeyManager() {
  const [list, setList] = useState<Passkey[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.passkey.list();
      setList((data as Passkey[] | null) ?? []);
    } catch { /* ignora */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function register() {
    setBusy(true); setMsg(""); setErr("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.registerPasskey();
      if (error) setErr(translate(error.message));
      else { setMsg("Passkey cadastrada com sucesso."); await load(); }
    } catch {
      setErr("Seu navegador não suporta passkeys ou a ação foi cancelada.");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    setBusy(true); setMsg(""); setErr("");
    try {
      const supabase = createClient();
      await supabase.auth.passkey.delete({ passkeyId: id });
      await load();
    } catch { setErr("Não foi possível remover."); }
    setBusy(false);
  }

  return (
    <section className="glass max-w-2xl rounded-2xl border border-campo-border p-6">
      <h2 className="font-serif text-xl text-forest-100">Acesso por biometria (Passkey)</h2>
      <p className="mt-1 text-sm text-stone-400">
        Cadastre uma passkey para entrar com biometria, PIN ou chave de segurança — sem senha.
      </p>

      {msg && <div className="mt-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">{msg}</div>}
      {err && <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{err}</div>}

      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-stone-500">Carregando…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhuma passkey cadastrada ainda.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((k) => (
              <li key={k.id} className="flex items-center justify-between rounded-lg border border-campo-border bg-campo-surface2 px-3 py-2">
                <div>
                  <p className="text-sm text-forest-100">{k.friendly_name || "Passkey"}</p>
                  <p className="text-xs text-stone-500">criada em {new Date(k.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <button onClick={() => remove(k.id)} disabled={busy} className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50">
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={register}
        disabled={busy}
        className="mt-5 rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light disabled:opacity-50"
      >
        {busy ? "Aguardando…" : "+ Cadastrar passkey"}
      </button>
    </section>
  );
}

function translate(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("exists")) return "Este dispositivo já tem uma passkey cadastrada.";
  if (m.includes("too_many") || m.includes("maximum")) return "Você atingiu o limite de passkeys.";
  if (m.includes("cancel") || m.includes("abort")) return "Ação cancelada.";
  return "Não foi possível cadastrar a passkey.";
}
