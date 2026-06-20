import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { stripeEnabled } from "@/lib/stripe";
import { PLANS, formatPlanPrice } from "@/lib/plans";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; canceled?: string; error?: string; cancelado?: string }>;
}) {
  const { user, profile } = await requireRole("produtor");
  const { ok, canceled, error, cancelado } = await searchParams;
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, cancel_at_period_end")
    .eq("account_id", user.id)
    .maybeSingle();

  const currentPlan = (sub?.status === "ativa" ? sub?.plan : "campo") as string;
  const enabled = stripeEnabled();

  const errMsg: Record<string, string> = {
    stripe_off: "Pagamentos ainda não ativados pela plataforma.",
    price_off: "Preço deste plano ainda não configurado.",
    plano_invalido: "Plano inválido.",
  };

  return (
    <AppShell
      badge="Produtor Rural" nav={PRODUTOR_NAV}
      userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil"
      title="Meu Plano" subtitle="Escolha o plano da Seravie Campo para a sua operação."
    >
      {ok && (
        <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">
          Assinatura ativada! Bem-vindo ao próximo nível.
        </div>
      )}
      {canceled && (
        <div className="mb-4 rounded-lg border border-campo-border bg-campo-surface2 px-3 py-2 text-sm text-stone-400">
          Assinatura não concluída. Você pode tentar novamente quando quiser.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {errMsg[error] ?? decodeURIComponent(error)}
        </div>
      )}

      {!enabled && (
        <div className="mb-6 rounded-xl border border-campo-border bg-campo-surface2 px-4 py-3 text-sm text-stone-400">
          Os pagamentos estão em configuração pela plataforma. Você pode ver os planos abaixo;
          a assinatura é liberada assim que o Stripe for ativado.
        </div>
      )}

      {cancelado && (
        <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Assinatura cancelada. Ativa até o fim do ciclo; sem cobrança no próximo mês.</div>
      )}
      <SubscriptionStatus sub={sub} back="/produtor/assinatura" />

      <div className="grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isPaid = plan.price_cents > 0;
          return (
            <article
              key={plan.id}
              className={`glass flex flex-col rounded-2xl border p-6 ${
                plan.id === "gourmet" ? "border-gold/50" : "border-campo-border"
              }`}
            >
              {plan.id === "gourmet" && (
                <span className="mb-2 inline-block w-fit rounded-full bg-gold/15 px-3 py-0.5 text-[0.65rem] uppercase tracking-wider text-gold">
                  Mais popular
                </span>
              )}
              <h3 className="font-serif text-2xl text-forest-100">{plan.name}</h3>
              <p className="text-sm text-stone-500">{plan.tagline}</p>
              <p className="mt-4 font-serif text-3xl text-gold">
                {formatPlanPrice(plan.price_cents)}
                {isPaid && <span className="text-sm text-stone-500"> /mês</span>}
              </p>

              <ul className="mt-5 flex-1 space-y-2 text-sm text-stone-300">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-leaf">✓</span> {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <span className="block rounded-lg border border-forest-700 bg-forest-900/40 py-2.5 text-center text-sm text-forest-200">
                    Plano atual
                  </span>
                ) : isPaid ? (
                  <form action="/api/stripe/checkout" method="post">
                    <input type="hidden" name="plan" value={plan.id} />
                    <button
                      disabled={!enabled}
                      className="w-full rounded-lg bg-gold py-2.5 font-medium text-campo-bg transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Assinar {plan.name}
                    </button>
                  </form>
                ) : (
                  <span className="block rounded-lg border border-campo-border py-2.5 text-center text-sm text-stone-500">
                    Incluído
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
