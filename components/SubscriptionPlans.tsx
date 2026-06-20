import { formatPlanPrice, type Plan } from "@/lib/plans";

// Grade de planos com checkout (Stripe). highlightId destaca o "mais popular".
export function SubscriptionPlans({
  plans,
  currentPlan,
  enabled,
  highlightId,
}: {
  plans: Plan[];
  currentPlan: string;
  enabled: boolean;
  highlightId?: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlan;
        const isPaid = plan.price_cents > 0;
        const highlighted = plan.id === highlightId;
        return (
          <article
            key={plan.id}
            className={`glass flex flex-col rounded-2xl border p-6 ${highlighted ? "border-gold/50" : "border-campo-border"}`}
          >
            {highlighted && (
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
  );
}
