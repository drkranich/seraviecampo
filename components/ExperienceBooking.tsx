"use client";

import { useState } from "react";
import { formatExpPrice } from "@/lib/experiences";

export function ExperienceBooking({
  experienceId,
  priceCents,
  currency,
  capacity,
  enabled,
}: {
  experienceId: string;
  priceCents: number;
  currency: string;
  capacity: number;
  enabled: boolean;
}) {
  const [people, setPeople] = useState(1);
  const total = priceCents * people;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action="/api/stripe/pay-experience" method="post" className="glass rounded-2xl border border-campo-border p-5">
      <input type="hidden" name="experience_id" value={experienceId} />

      <p className="font-serif text-2xl text-gold">
        {formatExpPrice(priceCents, currency)}
        <span className="text-sm text-stone-500"> /pessoa</span>
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-stone-400">Data</label>
          <input name="date" type="date" min={today} required
            className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-400">Horário</label>
          <input name="time" type="time"
            className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold" />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs text-stone-400">Pessoas (até {capacity})</label>
        <input name="people" type="number" min={1} max={capacity} value={people}
          onChange={(e) => setPeople(Math.max(1, Math.min(capacity, Number(e.target.value) || 1)))}
          className="w-28 rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold" />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs text-stone-400">Observação (opcional)</label>
        <textarea name="note" rows={2} placeholder="Restrições alimentares, ocasião especial..."
          className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none focus:border-gold" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-campo-border pt-3">
        <span className="text-sm text-stone-400">Total</span>
        <span className="font-serif text-xl text-forest-100">{formatExpPrice(total, currency)}</span>
      </div>

      <button disabled={!enabled}
        className="mt-4 w-full rounded-lg bg-gold py-3 font-medium text-campo-bg transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50">
        {enabled ? "Reservar e pagar" : "Pagamento online indisponível"}
      </button>
      <p className="mt-2 text-center text-xs text-stone-600">Pagamento seguro via Stripe. Você só confirma após o pagamento.</p>
    </form>
  );
}
