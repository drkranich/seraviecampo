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
    <div id="chat-seravie" className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      {open && (
        <section className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[#3A4736] bg-[#10140E] shadow-2xl shadow-black/40">
          <header className="border-b border-[#2D3326] bg-[#171D15] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-gold">Atendimento Seravie</p>
                <h2 className="mt-1 font-serif text-2xl text-forest-50">Converse com nossa equipe</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-[#2D3326] px-2 py-1 text-sm text-stone-300 transition hover:border-gold/60 hover:text-gold"
                aria-label="Fechar atendimento"
              >
                X
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Envie sua mensagem e a equipe interna responde por aqui, ao vivo, durante o atendimento.
            </p>
          </header>

          {!thread && (
            <div className="grid gap-2 border-b border-[#2D3326] p-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="rounded-md border border-[#2D3326] bg-[#0D110B] px-3 py-2 text-sm text-forest-50 outline-none placeholder:text-stone-500 focus:border-gold" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" type="email" className="rounded-md border border-[#2D3326] bg-[#0D110B] px-3 py-2 text-sm text-forest-50 outline-none placeholder:text-stone-500 focus:border-gold" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp ou telefone" className="rounded-md border border-[#2D3326] bg-[#0D110B] px-3 py-2 text-sm text-forest-50 outline-none placeholder:text-stone-500 focus:border-gold" />
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-md border border-[#2D3326] bg-[#0D110B] px-3 py-2 text-sm text-forest-50 outline-none focus:border-gold">
                <option>Atendimento pelo site</option>
                <option>Quero anunciar</option>
                <option>Tenho duvida sobre destinos</option>
                <option>Preciso de suporte</option>
                <option>Parcerias e produtores</option>
              </select>
            </div>
          )}

          <div className="max-h-[22rem] min-h-[13rem] space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#2D3326] p-4 text-sm leading-relaxed text-stone-500">
                Escreva sua primeira mensagem. Assim que a conversa for aberta, ela aparece no Inbox interno da Seravie Campo.
              </p>
            ) : (
              messages.map((message) => {
                const mine = message.sender === "visitor";
                return (
                  <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-gold text-campo-bg" : "bg-[#1D251B] text-stone-200"}`}>
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

          <form onSubmit={submit} className="border-t border-[#2D3326] p-3">
            {error && <p className="mb-2 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-200">{error}</p>}
            {status === "closed" ? (
              <p className="rounded-md border border-[#2D3326] px-3 py-2 text-sm text-stone-400">Esta conversa foi encerrada pela equipe.</p>
            ) : (
              <div className="flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva sua mensagem" className="min-w-0 flex-1 rounded-md border border-[#2D3326] bg-[#0D110B] px-3 py-2 text-sm text-forest-50 outline-none placeholder:text-stone-500 focus:border-gold" />
                <button disabled={busy} className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-campo-bg transition hover:bg-gold-light disabled:opacity-60">
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
        className="rounded-lg border border-[#C2A878]/60 bg-gold px-5 py-3 text-sm font-semibold text-campo-bg shadow-xl shadow-black/30 transition hover:bg-gold-light"
        aria-expanded={open}
      >
        Fale com a Seravie
      </button>
    </div>
  );
}
