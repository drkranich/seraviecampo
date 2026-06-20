import { getPlan, formatPlanPrice } from "@/lib/plans";
import { CancelSubscriptionButton } from "@/components/CancelSubscriptionButton";

type Sub = { plan: string | null; status: string | null; current_period_end?: string | null; cancel_at_period_end?: boolean | null };

export function SubscriptionStatus({ sub, back }: { sub: Sub | null; back: string }) {
  const plan = sub?.plan ? getPlan(sub.plan) : undefined;
  const isPaidActive = !!(sub && sub.status === "ativa" && plan && plan.price_cents > 0);
  if (!isPaidActive) return null;
  const until = sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("pt-BR") : null;

  return (
    <div className="mb-6 rounded-2xl border border-campo-border glass p-5">
      {sub?.cancel_at_period_end ? (
        <p className="text-sm text-stone-300">
          Assinatura <strong className="text-gold">{plan?.name}</strong> cancelada{until ? ` — ativa até ${until}` : ""}. Nada será cobrado no próximo ciclo.
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-stone-200">
              Assinatura ativa: <strong className="text-gold">{plan?.name}</strong> ({formatPlanPrice(plan?.price_cents ?? 0)}/mês){until ? ` · renova em ${until}` : ""}.
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Você pode cancelar quando quiser. O mês atual é cobrado integralmente e nada é cobrado no próximo mês.
            </p>
          </div>
          <CancelSubscriptionButton back={back} />
        </div>
      )}
    </div>
  );
}
