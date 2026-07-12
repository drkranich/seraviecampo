"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Msg = {
  id: string;
  sender: "visitor" | "support";
  body: string;
  created_at: string;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function PublicSupportInboxChat({ threadId, initialStatus = "open" }: { threadId: string; initialStatus?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState(initialStatus === "closed" ? "closed" : "open");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  async function load() {
    const [{ data: messages }, { data: thread }] = await Promise.all([
      supabase
        .from("public_support_messages")
        .select("id, sender, body, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true }),
      supabase.from("public_support_threads").select("status").eq("id", threadId).maybeSingle(),
    ]);
    setMsgs((messages ?? []) as Msg[]);
    setStatus(thread?.status === "closed" ? "closed" : "open");
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 4000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || status === "closed") return;
    setSending(true);
    setText("");
    await supabase.from("public_support_messages").insert({ thread_id: threadId, sender: "support", body });
    await load();
    setSending(false);
  }

  async function toggleStatus() {
    const next = status === "closed" ? "open" : "closed";
    setStatus(next);
    await supabase.from("public_support_threads").update({ status: next }).eq("id", threadId);
    await load();
  }

  return (
    <div className="glass flex h-[62vh] flex-col rounded-2xl border border-campo-border">
      <div className="flex items-center justify-between border-b border-campo-border px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Chat publico</p>
          <p className="text-sm text-stone-400">{status === "closed" ? "Conversa encerrada" : "Atendimento aberto"}</p>
        </div>
        <button onClick={toggleStatus} className="rounded-lg border border-campo-border px-3 py-2 text-xs text-stone-300 transition hover:border-gold/50 hover:text-gold">
          {status === "closed" ? "Reabrir" : "Encerrar"}
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {msgs.length === 0 ? (
          <p className="text-sm text-stone-500">Sem mensagens neste atendimento.</p>
        ) : (
          msgs.map((m) => {
            const mine = m.sender === "support";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-gold text-campo-bg" : "bg-campo-surface2 text-stone-200"}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  <p className={`mt-1 text-[0.65rem] ${mine ? "text-campo-bg/70" : "text-stone-500"}`}>
                    {mine ? "Equipe" : "Visitante"} - {formatTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-campo-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={status === "closed" ? "Reabra a conversa para responder" : "Responder ao visitante"}
          disabled={status === "closed"}
          className="flex-1 rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none focus:border-gold disabled:opacity-60"
        />
        <button disabled={sending || status === "closed"} className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light disabled:opacity-50">
          Enviar
        </button>
      </form>
    </div>
  );
}
