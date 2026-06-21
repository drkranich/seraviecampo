"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Msg = { id: string; sender: string; body: string; created_at: string; attachment_url: string | null; attachment_type: string | null };

export function SupportChat({ threadUserId, asSupport = false }: { threadUserId: string; asSupport?: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("support_messages").select("id, sender, body, created_at, attachment_url, attachment_type")
      .eq("user_id", threadUserId).order("created_at", { ascending: true });
    const list = (data ?? []) as Msg[];
    setMsgs(list);
    const paths = list.filter((m) => m.attachment_url).map((m) => m.attachment_url as string);
    if (paths.length) {
      const { data: urls } = await supabase.storage.from("support").createSignedUrls(paths, 3600);
      const map: Record<string, string> = {};
      (urls ?? []).forEach((u) => { if (u.path && u.signedUrl) map[u.path] = u.signedUrl; });
      setSigned(map);
    }
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

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "support");
    fd.append("thread_id", threadUserId);
    fd.append("folder", "chat");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && json.path) {
        await supabase.from("support_messages").insert({
          user_id: threadUserId, sender: asSupport ? "support" : "user",
          body: file.name, attachment_url: json.path, attachment_type: kind,
        });
        await load();
      }
    } catch { /* ignore */ }
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
  }

  return (
    <div className="glass flex h-[62vh] flex-col rounded-2xl border border-campo-border">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {msgs.length === 0 ? (
          <p className="text-sm text-stone-500">{asSupport ? "Sem mensagens deste usuário." : "Nenhuma mensagem ainda. Escreva sua dúvida — o suporte responde por aqui."}</p>
        ) : (
          msgs.map((m) => {
            const mine = asSupport ? m.sender === "support" : m.sender === "user";
            const url = m.attachment_url ? signed[m.attachment_url] : null;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-gold text-campo-bg" : "bg-campo-surface2 text-stone-200"}`}>
                  {m.attachment_url && (
                    <div className="mb-1">
                      {m.attachment_type === "image" && url && <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="" className="max-h-48 rounded-lg" /></a>}
                      {m.attachment_type === "video" && url && <video controls src={url} className="max-h-48 rounded-lg" />}
                      {m.attachment_type === "file" && url && <a href={url} target="_blank" rel="noopener noreferrer" className="underline">📎 {m.body}</a>}
                      {!url && <span className="opacity-70">📎 anexo…</span>}
                    </div>
                  )}
                  {(!m.attachment_url || m.attachment_type === "image" || m.attachment_type === "video") && m.body && (
                    <p className="whitespace-pre-wrap">{m.attachment_url ? "" : m.body}</p>
                  )}
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
      <form onSubmit={send} className="flex items-center gap-2 border-t border-campo-border p-3">
        <label className="cursor-pointer rounded-lg border border-campo-border px-3 py-2 text-sm text-stone-300 transition hover:border-gold/50" title="Anexar">
          {busy ? "…" : "📎"}
          <input ref={fileRef} type="file" accept="image/*,video/*,application/pdf" className="hidden" onChange={onFile} disabled={busy} />
        </label>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva uma mensagem…"
          className="flex-1 rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none focus:border-gold" />
        <button disabled={sending} className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light disabled:opacity-50">Enviar</button>
      </form>
    </div>
  );
}
