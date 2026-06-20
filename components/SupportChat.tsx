"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Msg = { id: string; sender: string; body: string; created_at: string };

export function SupportChat({ threadUserId, asSupport = false }: { threadUserId: string; asSupport?: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("support_messages").select("id, sender, body, created_at")
      .eq("user_id", threadUserId).order("created_at", { ascending: true });
    setMsgs((data ?? []) as Msg[]);
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadUserId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true); setText("");
    await supabase.from("support_messages").insert({ user_id: threadUserId, sender: asSupport ? "support" : "user", body });
    await load();
    setSending(false);
  }

  return (
    <div className="glass flex h-[62vh] flex-col rounded-2xl border border-campo-border">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {msgs.length === 0 ? (
          <p className="text-sm text-stone-500">{asSupport ? "Sem mensagens deste usuário." : "Nenhuma mensagem ainda. Escreva sua dúvida — o suporte responde por aqui."}</p>
        ) : (
          msgs.map((m) => {
            const mine = asSupport ? m.sender === "support" : m.sender === "user";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-gold text-campo-bg" : "bg-campo-surface2 text-stone-200"}`}>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={`mt-0.5 text-[0.6rem] ${mine ? "text-campo-bg/70" : "text-stone-500"}`}>
                    {m.sender === "support" ? "Suporte" : "Cliente"} · {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-campo-border p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva uma mensagem…"
          className="flex-1 rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none focus:border-gold" />
        <button disabled={sending} className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light disabled:opacity-50">Enviar</button>
      </form>
    </div>
  );
}
