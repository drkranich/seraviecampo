"use client";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { dispatchWithProof } from "@/lib/actions/dispatch";

export function DispatchProof({ orderId, back }: { orderId: string; back: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">
        Registrar saída do pedido
      </button>
    );
  }
  return (
    <form action={dispatchWithProof} className="mt-2 w-full space-y-3 rounded-xl border border-campo-border bg-campo-surface2/50 p-3">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="back" value={back} />
      <p className="text-sm text-stone-300">Registro de saída (foto, assinatura e data/hora automáticas)</p>
      <ImageUpload name="photo_url" label="Foto do pedido na saída" userId="" folder="saida" shape="wide" bucket="proofs" orderId={orderId} />
      <ImageUpload name="signature_url" label="Assinatura digital (sua)" userId="" folder="saida-assinatura" shape="wide" bucket="proofs" orderId={orderId} />
      <div className="flex flex-wrap gap-2">
        <button name="mode" value="dispatch" className="rounded-lg border border-gold/50 px-4 py-1.5 text-sm text-gold transition hover:bg-gold/10">Despachar p/ entregador</button>
        <button name="mode" value="self" className="rounded-lg bg-gold px-4 py-1.5 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Vou entregar eu mesmo</button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm text-stone-400 hover:text-stone-200">Cancelar</button>
      </div>
    </form>
  );
}
