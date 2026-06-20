"use client";
import { cancelSubscription } from "@/lib/actions/subscription";

export function CancelSubscriptionButton({ back }: { back: string }) {
  return (
    <form
      action={cancelSubscription}
      onSubmit={(e) => {
        if (!confirm("Cancelar a assinatura? O mês atual será cobrado integralmente e nada será cobrado no próximo mês.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="back" value={back} />
      <button className="rounded-lg border border-red-900/50 px-4 py-2 text-sm text-red-300 transition hover:bg-red-950/40">
        Cancelar assinatura
      </button>
    </form>
  );
}
