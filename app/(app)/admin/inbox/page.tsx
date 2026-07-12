import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { PublicSupportInboxChat } from "@/components/PublicSupportInboxChat";
import { SupportChat } from "@/components/SupportChat";
import { ROLE_LABEL, type UserRole } from "@/lib/roles";
import { countryOf } from "@/lib/countries";

type Msg = { user_id: string; sender: string; body: string; created_at: string };
type PublicThread = {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  subject: string | null;
  source_path: string | null;
  status: string;
  last_message_at: string;
  created_at: string;
};
type PublicMsg = { thread_id: string; sender: string; body: string; created_at: string };

export default async function InboxPage({
  searchParams,
}: { searchParams: Promise<{ u?: string; p?: string }> }) {
  const { profile } = await requireRole("super_admin");
  const sp = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.from("support_messages").select("user_id, sender, body, created_at").order("created_at", { ascending: false });
  const msgs = (data ?? []) as Msg[];

  const threads = new Map<string, { last: Msg; count: number }>();
  for (const m of msgs) {
    const cur = threads.get(m.user_id);
    if (!cur) threads.set(m.user_id, { last: m, count: 1 });
    else cur.count++;
  }
  const ids = [...threads.keys()];
  const { data: profs } = await supabase.from("profiles").select("id, full_name, display_name, role").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const pmap = new Map((profs ?? []).map((p) => [p.id as string, p as { id: string; full_name: string | null; display_name: string | null; role: UserRole }]));
  const registeredList = [...threads.entries()].sort((a, b) => new Date(b[1].last.created_at).getTime() - new Date(a[1].last.created_at).getTime());

  const { data: publicThreadRows } = await supabase
    .from("public_support_threads")
    .select("id, visitor_name, visitor_email, visitor_phone, subject, source_path, status, last_message_at, created_at")
    .order("last_message_at", { ascending: false });
  const publicThreads = (publicThreadRows ?? []) as PublicThread[];
  const publicIds = publicThreads.map((thread) => thread.id);
  const { data: publicMessageRows } = await supabase
    .from("public_support_messages")
    .select("thread_id, sender, body, created_at")
    .in("thread_id", publicIds.length ? publicIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false });
  const publicLast = new Map<string, PublicMsg>();
  for (const message of (publicMessageRows ?? []) as PublicMsg[]) {
    if (!publicLast.has(message.thread_id)) publicLast.set(message.thread_id, message);
  }
  const publicMap = new Map(publicThreads.map((thread) => [thread.id, thread]));
  const totalThreads = registeredList.length + publicThreads.length;

  type Ficha = { full_name: string | null; role: UserRole; phone: string | null; city: string | null; state: string | null; country: string | null };
  let ficha: Ficha | null = null;
  let fichaEmail = "—";
  let fichaEndereco: string | null = null;
  if (sp.u) {
    const [{ data: pf }, { data: emails }, { data: lastOrder }] = await Promise.all([
      supabase.from("profiles").select("full_name, role, phone, city, state, country").eq("id", sp.u).single(),
      supabase.rpc("admin_emails"),
      supabase.from("orders").select("delivery_address, delivery_phone").eq("customer_id", sp.u).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    ficha = (pf ?? null) as Ficha | null;
    fichaEmail = ((emails ?? []) as { id: string; email: string }[]).find((e) => e.id === sp.u)?.email ?? "—";
    fichaEndereco = (lastOrder?.delivery_address as string | null) ?? null;
  }
  const selected = sp.u && pmap.get(sp.u);
  const selectedPublic = sp.p ? publicMap.get(sp.p) : null;

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} userName={profile?.full_name ?? "Administrador"} title="Inbox" subtitle={`${totalThreads} conversa(s)`}>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-2 lg:col-span-1">
          {totalThreads === 0 ? (
            <div className="rounded-2xl border border-dashed border-campo-border glass p-6 text-center text-sm text-stone-400">Nenhuma mensagem ainda.</div>
          ) : (
            <>
              {registeredList.map(([uid, t]) => {
              const p = pmap.get(uid);
              const active = sp.u === uid;
              return (
                <Link key={uid} href={`/admin/inbox?u=${uid}`} className={`block rounded-xl border p-3 transition ${active ? "border-gold/60 bg-gold/10" : "border-campo-border glass hover:border-gold/40"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-forest-100">{p?.full_name || p?.display_name || "Usuário"}</span>
                    <span className="text-[0.6rem] text-stone-500">{new Date(t.last.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <p className="truncate text-xs text-stone-500">{p ? ROLE_LABEL[p.role] : ""} · {t.last.sender === "support" ? "Você: " : ""}{t.last.body}</p>
                </Link>
              );
              })}
              {publicThreads.map((thread) => {
                const last = publicLast.get(thread.id);
                const active = sp.p === thread.id;
                return (
                  <Link key={thread.id} href={`/admin/inbox?p=${thread.id}`} className={`block rounded-xl border p-3 transition ${active ? "border-gold/60 bg-gold/10" : "border-campo-border glass hover:border-gold/40"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm text-forest-100">{thread.visitor_name || thread.visitor_email || "Visitante do site"}</span>
                      <span className="shrink-0 text-[0.6rem] text-stone-500">{new Date(thread.last_message_at || thread.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-stone-500">
                      {thread.status === "closed" ? "Encerrado" : "Chat publico"} · {last?.sender === "support" ? "Voce: " : ""}{last?.body || thread.subject || "Conversa iniciada pelo site"}
                    </p>
                  </Link>
                );
              })}
            </>
          )}
        </section>

        <section className="lg:col-span-2">
          {selected ? (
            <>
              {ficha && (
                <div className="glass mb-3 rounded-2xl border border-campo-border p-4 text-sm">
                  <p className="font-serif text-lg text-forest-100">{ficha.full_name || "Usuário"} <span className="text-xs text-stone-500">· {ROLE_LABEL[ficha.role]}</span></p>
                  <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    <p className="text-stone-400">E-mail: <span className="text-stone-200">{fichaEmail}</span></p>
                    <p className="text-stone-400">Telefone: <span className="text-stone-200">{ficha.phone || "—"}</span></p>
                    <p className="text-stone-400">Local: <span className="text-stone-200">{[ficha.city, ficha.state, countryOf(ficha.country).name].filter(Boolean).join(", ") || "—"}</span></p>
                    <p className="text-stone-400">Endereço: <span className="text-stone-200">{fichaEndereco || "—"}</span></p>
                  </div>
                  <a href={`/admin/usuarios/${sp.u}`} className="mt-2 inline-block text-xs text-gold hover:underline">Ver ficha completa →</a>
                </div>
              )}
              <SupportChat threadUserId={sp.u as string} asSupport />
            </>
          ) : selectedPublic ? (
            <>
              <div className="glass mb-3 rounded-2xl border border-campo-border p-4 text-sm">
                <p className="font-serif text-lg text-forest-100">
                  {selectedPublic.visitor_name || "Visitante do site"} <span className="text-xs text-stone-500">· Chat publico</span>
                </p>
                <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  <p className="text-stone-400">E-mail: <span className="text-stone-200">{selectedPublic.visitor_email || "-"}</span></p>
                  <p className="text-stone-400">Telefone: <span className="text-stone-200">{selectedPublic.visitor_phone || "-"}</span></p>
                  <p className="text-stone-400">Assunto: <span className="text-stone-200">{selectedPublic.subject || "Atendimento pelo site"}</span></p>
                  <p className="text-stone-400">Origem: <span className="text-stone-200">{selectedPublic.source_path || "-"}</span></p>
                </div>
              </div>
              <PublicSupportInboxChat threadId={selectedPublic.id} initialStatus={selectedPublic.status} />
            </>
          ) : (
            <div className="flex h-[62vh] items-center justify-center rounded-2xl border border-dashed border-campo-border glass text-sm text-stone-400">
              Selecione uma conversa para responder.
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
