import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PARCEIRO_NAV } from "@/components/AppShell";
import { ConfirmButton } from "@/components/ConfirmButton";
import {
  EXP_CATEGORY_LABEL,
  EXP_STATUS_LABEL,
  EXP_STATUS_STYLE,
  formatExpPrice,
  type Experience,
  type ExperienceBooking,
  type ExperienceStatus,
} from "@/lib/experiences";
import { stripeEnabled } from "@/lib/stripe";
import { getExperiencePlans, experiencePlanIdOf } from "@/lib/plans-db";
import { ExperiencePlanPicker } from "@/components/ExperiencePlanPicker";
import { archiveExperience, restoreExperience, deleteExperience, setBookingStatus } from "./actions";

export default async function ExperienciasParceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; canceled?: string; error?: string }>;
}) {
  const { user, profile } = await requireRole("parceiro");
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: expData } = await supabase
    .from("experiences").select("*").eq("producer_id", user.id).order("created_at", { ascending: false });
  const all = (expData ?? []) as Experience[];
  const ativos = all.filter((e) => !e.archived);
  const arquivados = all.filter((e) => e.archived);

  const { data: bookData } = await supabase
    .from("experience_bookings").select("*").eq("producer_id", user.id).order("created_at", { ascending: false });
  const bookings = (bookData ?? []) as ExperienceBooking[];

  const expName = new Map(all.map((e) => [e.id, e.title]));
  const cliIds = [...new Set(bookings.map((b) => b.customer_id))];
  const { data: clis } = await supabase.from("profiles").select("id, full_name, display_name")
    .in("id", cliIds.length ? cliIds : ["00000000-0000-0000-0000-000000000000"]);
  const cliName = new Map((clis ?? []).map((c) => [c.id as string, (c.full_name || c.display_name || "Cliente") as string]));

  const paid = bookings.filter((b) => b.payment_status === "pago");
  const receita = paid.reduce((s, b) => s + (b.total_cents || 0), 0);
  const currency = (profile && (profile as { currency?: string }).currency) || all[0]?.currency || "BRL";

  const expPlans = await getExperiencePlans(supabase);
  const { data: expSub } = await supabase.from("experience_subscriptions").select("plan, status").eq("account_id", user.id).maybeSingle();
  const currentExpPlan = await experiencePlanIdOf(supabase, user.id);
  const expStatus = (expSub?.status as string) || "inativa";

  const stat = (label: string, value: string) => (
    <div className="glass rounded-2xl border border-campo-border p-4">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 font-serif text-2xl text-forest-100">{value}</p>
    </div>
  );

  return (
    <AppShell badge="Parceiro de Experiências" nav={PARCEIRO_NAV} userName={profile?.full_name ?? "Parceiro"} profileHref="/parceiro/perfil"
      title="Experiências" subtitle="Crie e gerencie as vivências que você oferta.">
      {sp.ok === "plano" && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Plano de experiências atualizado.</div>}
      {sp.ok && sp.ok !== "plano" && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Reserva atualizada.</div>}
      {sp.canceled && <div className="mb-4 rounded-lg border border-campo-border bg-campo-surface2 px-3 py-2 text-sm text-stone-400">Assinatura não concluída.</div>}
      {sp.error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{decodeURIComponent(sp.error)}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {stat("Experiências ativas", String(ativos.length))}
        {stat("Reservas pagas", String(paid.length))}
        {stat("Receita confirmada", formatExpPrice(receita, currency))}
      </div>

      <div className="mb-8">
        <ExperiencePlanPicker plans={expPlans} currentPlanId={currentExpPlan} status={expStatus} enabled={stripeEnabled()} />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-lg text-forest-100">Minhas experiências</h2>
        <Link href="/parceiro/experiencias/nova" className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">+ Nova experiência</Link>
      </div>

      {ativos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">
          Você ainda não criou experiências. Comece com a sua primeira vivência.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ativos.map((e) => {
            const archive = archiveExperience.bind(null, e.id);
            const del = deleteExperience.bind(null, e.id);
            const cover = e.images?.[0];
            return (
              <article key={e.id} className="glass overflow-hidden rounded-2xl border border-campo-border">
                <div className="flex">
                  <div className="h-28 w-28 shrink-0 bg-campo-surface2">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl opacity-40">🌿</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 p-4">
                    <p className="truncate font-serif text-forest-100">{e.title}</p>
                    <p className="text-xs text-stone-500">{EXP_CATEGORY_LABEL[e.category]} · {formatExpPrice(e.price_cents, e.currency)}/pessoa</p>
                    <p className="mt-1 text-xs">{e.active ? <span className="text-forest-300">● Publicada</span> : <span className="text-stone-500">○ Rascunho</span>}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-campo-border p-2">
                  <Link href={`/parceiro/experiencias/${e.id}`} className="rounded-lg border border-campo-border px-3 py-1.5 text-xs text-stone-200 transition hover:border-gold/50">Editar</Link>
                  <Link href={`/experiencias/${e.id}`} className="rounded-lg border border-campo-border px-3 py-1.5 text-xs text-stone-300 transition hover:border-gold/50">Ver página</Link>
                  <form action={archive}><button className="rounded-lg border border-campo-border px-3 py-1.5 text-xs text-stone-300 transition hover:border-gold/50">Arquivar</button></form>
                  <form action={del} className="ml-auto"><ConfirmButton message={`Excluir "${e.title}"?`} className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/40">Excluir</ConfirmButton></form>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {arquivados.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg text-stone-400">Arquivadas</h2>
          <div className="space-y-2">
            {arquivados.map((e) => {
              const restore = restoreExperience.bind(null, e.id);
              const del = deleteExperience.bind(null, e.id);
              return (
                <div key={e.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl border border-campo-border p-3">
                  <span className="text-sm text-stone-300">{e.title}</span>
                  <div className="flex items-center gap-2">
                    <form action={restore}><button className="rounded-lg border border-gold/40 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10">Restaurar</button></form>
                    <form action={del}><ConfirmButton message={`Excluir "${e.title}" definitivamente?`} className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/40">Excluir</ConfirmButton></form>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-3 font-serif text-lg text-forest-100">Reservas recebidas</h2>
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-campo-border glass p-8 text-center text-stone-400">Nenhuma reserva ainda.</div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const confirmar = setBookingStatus.bind(null, b.id, "confirmado" as ExperienceStatus);
              const concluir = setBookingStatus.bind(null, b.id, "concluido" as ExperienceStatus);
              const cancelar = setBookingStatus.bind(null, b.id, "cancelado" as ExperienceStatus);
              return (
                <div key={b.id} className="glass rounded-2xl border border-campo-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-forest-100">{expName.get(b.experience_id) ?? "Experiência"} · <span className="text-stone-400">{cliName.get(b.customer_id) ?? "Cliente"}</span></p>
                      <p className="text-xs text-stone-500">
                        {new Date(b.date).toLocaleDateString("pt-BR")}{b.time ? ` às ${b.time}` : ""} · {b.people} pessoa(s) · {formatExpPrice(b.total_cents, b.currency)}
                        {" · "}{b.payment_status === "pago" ? <span className="text-forest-300">pago</span> : <span className="text-amber-300">aguardando pagamento</span>}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs ${EXP_STATUS_STYLE[b.status]}`}>{EXP_STATUS_LABEL[b.status]}</span>
                  </div>
                  {b.status !== "concluido" && b.status !== "cancelado" && (
                    <div className="mt-3 flex gap-2">
                      {b.status === "pendente" && <form action={confirmar}><button className="rounded-lg border border-leaf-dark/60 px-3 py-1.5 text-xs text-leaf-light transition hover:bg-leaf-dark/20">Confirmar</button></form>}
                      <form action={concluir}><button className="rounded-lg border border-forest-700 px-3 py-1.5 text-xs text-forest-200 transition hover:bg-forest-900/40">Concluir</button></form>
                      <form action={cancelar}><button className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/40">Cancelar</button></form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
