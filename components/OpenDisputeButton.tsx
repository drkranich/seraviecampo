"use client";
import { useState } from "react";
import { openDispute } from "@/lib/actions/disputes";
import { DISPUTE_REASONS } from "@/lib/disputes";
import { FancySelect } from "@/components/FancySelect";

export function OpenDisputeButton({ orderId, back }: { orderId: string; back: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-stone-400 underline-offset-2 hover:text-gold hover:underline">
        Relatar problema / reembolso
      </button>
    );
  }
  return (
    <form action={openDispute} className="mt-2 w-full space-y-2 rounded-xl border border-campo-border bg-campo-surface2/50 p-3">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="back" value={back} />
      <FancySelect name="reason" defaultValue={DISPUTE_REASONS[0].value}
        options={DISPUTE_REASONS.map((r) => ({ value: r.value, label: r.label }))} />
      <textarea name="description" rows={2} placeholder="Descreva o que aconteceu (opcional)" className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none focus:border-gold" />
      <div className="flex gap-2">
        <button className="rounded-lg bg-gold px-4 py-1.5 text-xs font-medium text-campo-bg transition hover:bg-gold-light">Enviar</button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200">Cancelar</button>
      </div>
    </form>
  );
}
