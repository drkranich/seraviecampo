"use client";

import { useEffect, useRef, useState } from "react";

type PublicMessage = {
  id: string;
  sender: "visitor" | "support";
  body: string;
  created_at: string;
};

type StoredThread = {
  threadId: string;
  token: string;
  name?: string;
  email?: string;
};

const STORAGE_KEY = "seravie_public_support_thread_v1";
const CHAT_HASH = "#chat-seravie";

function readThread(): StoredThread | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredThread) : null;
  } catch {
    return null;
  }
}

function storeThread(thread: StoredThread) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(thread));
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function PublicSupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<StoredThread | null>(null);
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("Atendimento pelo site");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function loadMessages(currentThread = thread) {
    if (!currentThread) return;
    const params = new URLSearchParams({ thread_id: currentThread.threadId, token: currentThread.token });
    const res = await fetch(`/api/public-support/messages?${params.toString()}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Nao foi possivel carregar a conversa.");
      return;
    }
    setMessages(json.messages ?? []);
    setStatus(json.status === "closed" ? "closed" : "open");
  }

  useEffect(() => {
    const saved = readThread();
    if (saved) {
      setThread(saved);
      setName(saved.name ?? "");
      setEmail(saved.email ?? "");
    }

    function syncHash() {
      if (window.location.hash === CHAT_HASH) setOpen(true);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    if (!open || !thread) return;
    loadMessages(thread);
    const timer = window.setInterval(() => loadMessages(thread), 4000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, thread?.threadId, thread?.token]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open]);

  async function startConversation(message: string) {
    const res = await fetch("/api/public-support/thread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        subject,
        message,
        sourcePath: `${window.location.pathname}${window.location.search}`,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Nao foi possivel iniciar a conversa.");
    const nextThread = { threadId: json.threadId as string, token: json.token as string, name, email };
    storeThread(nextThread);
    setThread(nextThread);
    await loadMessages(nextThread);
  }

  async function sendMessage(message: string) {
    if (!thread) return startConversation(message);
    const res = await fetch("/api/public-support/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: thread.threadId, token: thread.token, body: message }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Nao foi possivel enviar a mensagem.");
    await loadMessages(thread);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message) return;
    setBusy(true);
    setError("");
    setText("");
    try {
      await sendMessage(message);
    } catch (err) {
      setText(message);
      setError(err instanceof Error ? err.message : "Nao foi possivel enviar a mensagem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="chat-seravie" className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section className="relative w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/15 bg-[#10140E]/70 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_20%_0%,rgba(194,168,120,0.24),transparent_58%),radial-gradient(circle_at_88%_12%,rgba(111,166,63,0.18),transparent_48%)]" />
          <header className="relative border-b border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-gold">Atendimento Seravie</p>
                <h2 className="mt-1 font-serif text-2xl text-forest-50">Converse com a gente</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm text-stone-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-gold/60 hover:bg-gold/10 hover:text-gold"
                aria-label="Fechar atendimento"
              >
                X
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              Envie sua mensagem. Nossa equipe acompanha por aqui e responde durante o atendimento.
            </p>
          </header>

          {!thread && (
            <div className="relative grid gap-2 border-b border-white/10 bg-black/10 p-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-forest-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none placeholder:text-stone-400 transition focus:border-gold/70 focus:bg-white/[0.09]" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" type="email" className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-forest-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none placeholder:text-stone-400 transition focus:border-gold/70 focus:bg-white/[0.09]" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp ou telefone" className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-forest-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none placeholder:text-stone-400 transition focus:border-gold/70 focus:bg-white/[0.09]" />
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-white/10 bg-[#182012] px-3 py-2 text-sm text-forest-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition focus:border-gold/70">
                <option>Atendimento pelo site</option>
                <option>Quero anunciar</option>
                <option>Tenho duvida sobre destinos</option>
                <option>Preciso de suporte</option>
                <option>Parcerias e produtores</option>
              </select>
            </div>
          )}

          <div className="relative max-h-[22rem] min-h-[13rem] space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm leading-relaxed text-stone-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                Ola! Conte como a Seravie Campo pode ajudar voce hoje.
              </p>
            ) : (
              messages.map((message) => {
                const mine = message.sender === "visitor";
                return (
                  <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.22)] ${mine ? "bg-gold/95 text-campo-bg" : "border border-white/10 bg-white/[0.07] text-stone-200 backdrop-blur"}`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
                      <p className={`mt-1 text-[0.65rem] ${mine ? "text-campo-bg/70" : "text-stone-500"}`}>
                        {mine ? "Voce" : "Equipe Seravie"} - {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="relative border-t border-white/10 bg-black/10 p-3">
            {error && <p className="mb-2 rounded-xl border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-200 backdrop-blur">{error}</p>}
            {status === "closed" ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-stone-300">Esta conversa foi encerrada pela equipe.</p>
            ) : (
              <div className="flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva sua mensagem" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-forest-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none placeholder:text-stone-400 transition focus:border-gold/70 focus:bg-white/[0.09]" />
                <button disabled={busy} className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-campo-bg shadow-[0_10px_30px_rgba(194,168,120,0.22)] transition hover:bg-gold-light disabled:opacity-60">
                  Enviar
                </button>
              </div>
            )}
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex items-center gap-3 rounded-full border border-white/20 bg-[#10140E]/72 px-4 py-3 text-sm font-semibold text-forest-50 shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-2xl transition hover:border-gold/60 hover:bg-[#10140E]/86"
        aria-expanded={open}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_18px_rgba(194,168,120,0.85)] transition group-hover:scale-110" />
        <span>Fale com a Seravie</span>
      </button>
    </div>
  );
}
