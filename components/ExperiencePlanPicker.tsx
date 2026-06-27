import { formatMoney } from "@/lib/money";
import type { DbPlan } from "@/lib/plans-db";

// Planos de Experiências: mensalidade + comissão própria (diferente de produtos).
export function ExperiencePlanPicker({
  plans,
  currentPlanId,
  status,
  enabled,
}: {
  plans: DbPlan[];
  currentPlanId: string;
  status: string;
  enabled: boolean;
}) {
  const active = ["ativa", "active", "ativo", "trialing"].includes(status);
  return (
    <section className="glass rounded-2xl border border-campo-border p-6">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-serif text-lg text-forest-100">Plano de Experiências</h2>
        {active && <span className="rounded-full border border-forest-700 bg-forest-900/40 px-3 py-0.5 text-xs text-forest-200">Plano ativo</span>}
      </div>
      <p className="mb-5 text-sm text-stone-400">
        A mensalidade libera a oferta de experiências e define a <strong className="text-gold">comissão por reserva</strong> — separada da comissão de produtos.
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = active && p.id === currentPlanId;
          const isFree = (p.price_cents ?? 0) <= 0;
          return (
            <article key={p.id} className={`flex flex-col rounded-2xl border p-5 ${isCurrent ? "border-gold/60 bg-gold/5" : "border-campo-border bg-campo-surface2/40"}`}>
              <h3 className="font-serif text-xl text-forest-100">{p.name}</h3>
              <p className="text-xs text-stone-500">{p.tagline}</p>
              <p className="mt-3 font-serif text-2xl text-gold">
                {isFree ? "Grátis" : formatMoney(p.price_cents, "BRL")}
                {!isFree && <span className="text-sm text-stone-500"> /mês</span>}
              </p>
              <p className="mt-1 text-sm text-stone-300">Comissão <strong className="text-gold">{p.commission_pct ?? 15}%</strong> por reserva</p>

              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-stone-300">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><span className="mt-0.5 text-leaf">✓</span> {f}</li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <span className="block rounded-lg border border-forest-700 bg-forest-900/40 py-2.5 text-center text-sm text-forest-200">Plano atual</span>
                ) : (
                  <form action="/api/stripe/exp-subscribe" method="post">
                    <input type="hidden" name="plan" value={p.id} />
                    <button disabled={!isFree && !enabled}
                      className="w-full rounded-lg bg-gold py-2.5 text-sm font-medium text-campo-bg transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50">
                      {isFree ? "Usar este plano" : enabled ? `Assinar ${p.name}` : "Pagamentos em configuração"}
                    </button>
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
