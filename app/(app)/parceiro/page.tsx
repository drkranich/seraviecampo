import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { greeting } from "@/lib/greeting";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PARCEIRO_NAV } from "@/components/AppShell";
import { stripeEnabled } from "@/lib/stripe";
import { getPlanById, experiencePlanIdOf, experienceCommissionPct } from "@/lib/plans-db";
import { formatMoney } from "@/lib/money";
import { EXP_STATUS_LABEL, EXP_STATUS_STYLE, formatExpPrice, type Experience, type ExperienceBooking } from "@/lib/experiences";

export default async function ParceiroPage() {
  const { user, profile } = await requireRole("parceiro");
  const supabase = await createClient();

  const [{ data: expData }, { data: bookData }, { data: acc }] = await Promise.all([
    supabase.from("experiences").select("*").eq("producer_id", user.id),
    supabase.from("experience_bookings").select("*").eq("producer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("stripe_account_id, stripe_charges_enabled, currency").eq("id", user.id).single(),
  ]);

  const exps = (expData ?? []) as Experience[];
  const bookings = (bookData ?? []) as ExperienceBooking[];
  const ativos = exps.filter((e) => !e.archived);
  const paid = bookings.filter((b) => b.payment_status === "pago");
  const currency = (acc?.currency as string) || exps[0]?.currency || "BRL";
  const receita = paid.reduce((s, b) => s + (b.total_cents || 0), 0);

  const planId = await experiencePlanIdOf(supabase, user.id);
  const plan = await getPlanById(supabase, planId);
  const pct = await experienceCommissionPct(supabase, user.id);

  const connected = Boolean(acc?.stripe_account_id) && Boolean(acc?.stripe_charges_enabled);
  const expName = new Map(exps.map((e) => [e.id, e.title]));
  const recent = bookings.slice(0, 5);

  const stat = (label: string, value: string) => (
    <div className="glass rounded-2xl border border-campo-border p-5">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 font-serif text-2xl text-forest-100">{value}</p>
    </div>
  );

  return (
    <AppShell badge="Parceiro de Experiências" nav={PARCEIRO_NAV} userName={profile?.full_name ?? "Parceiro"} profileHref="/parceiro/perfil"
      title={greeting(profile?.full_name)} subtitle="Ofereça vivências extraordinárias e receba com transparência.">

      {!connected && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4">
          <p className="text-sm text-stone-300">Conecte sua conta Stripe para receber pelas reservas das suas experiências.</p>
          <Link href="/parceiro/financeiro" className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Conectar recebimentos</Link>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stat("Experiências ativas", String(ativos.length))}
        {stat("Reservas pagas", String(paid.length))}
        {stat("Receita confirmada", formatExpPrice(receita, currency))}
        {stat("Sua comissão", `${pct}%`)}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="glass rounded-2xl border border-campo-border p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Reservas recentes</h2>
            <Link href="/parceiro/experiencias" className="text-xs text-gold hover:underline">Ver todas</Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">Nenhuma reserva ainda. Crie sua primeira experiência.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-forest-100">{expName.get(b.experience_id) ?? "Experiência"}</p>
                    <p className="text-xs text-stone-500">{new Date(b.date).toLocaleDateString("pt-BR")} · {b.people} pessoa(s) · {formatExpPrice(b.total_cents, b.currency)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] ${EXP_STATUS_STYLE[b.status]}`}>{EXP_STATUS_LABEL[b.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-3 font-serif text-lg text-forest-100">Seu plano</h2>
          <p className="font-serif text-xl text-gold">{plan?.name ?? "Experiências — Inicial"}</p>
          <p className="mt-1 text-sm text-stone-400">Mensalidade {formatMoney(plan?.price_cents ?? 0, currency)} · comissão {pct}% por reserva.</p>
          <Link href="/parceiro/experiencias" className="mt-4 inline-block rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Gerenciar plano e experiências</Link>
          {!stripeEnabled() && <p className="mt-3 text-xs text-stone-500">Pagamentos em configuração pela plataforma.</p>}
        </section>
      </div>
    </AppShell>
  );
}
