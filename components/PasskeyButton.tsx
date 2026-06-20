"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PasskeyButton() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onClick() {
    setBusy(true);
    setErr("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPasskey();
      if (error) {
        setBusy(false);
        setErr(translate(error.message));
        return;
      }
      window.location.href = "/auth/redirect";
    } catch {
      setBusy(false);
      setErr("Seu navegador não suporta passkeys ou a ação foi cancelada.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-campo-border py-2.5 text-sm font-medium text-stone-200 transition hover:border-gold/50 disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M12 12c-3 0-5 2-5 5v0M16 14l3 3-3 3M19 17h-7" />
        </svg>
        {busy ? "Aguardando biometria…" : "Entrar com biometria / passkey"}
      </button>
      {err && <p className="mt-2 text-center text-sm text-red-300">{err}</p>}
    </div>
  );
}

function translate(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("not found") || m.includes("no credential")) return "Nenhuma passkey encontrada neste dispositivo. Entre com e-mail e cadastre uma em Configurações.";
  if (m.includes("disabled")) return "Login por passkey não está ativo neste projeto.";
  if (m.includes("cancel") || m.includes("abort")) return "Ação cancelada.";
  return "Não foi possível entrar com passkey. Tente e-mail e senha.";
}
