"use client";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { completeDelivery } from "@/lib/actions/delivery";

export function DeliveryProof({ orderId, back }: { orderId: string; back: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="rounded-lg bg-leaf px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-leaf-light">
        Concluir entrega
      </button>
    );
  }
  return (
    <form action={completeDelivery} className="mt-2 w-full space-y-3 rounded-xl border border-campo-border bg-campo-surface2/50 p-3">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="back" value={back} />
      <p className="text-sm text-stone-300">Comprovante de entrega</p>
      <ImageUpload name="signature_url" label="Assinatura do cliente" userId="" folder="assinatura" shape="wide" bucket="proofs" orderId={orderId} />
      <ImageUpload name="photo_url" label="Foto do produto entregue" userId="" folder="entrega" shape="wide" bucket="proofs" orderId={orderId} />
      <div className="flex gap-2">
        <button className="rounded-lg bg-leaf px-4 py-1.5 text-sm font-medium text-campo-bg transition hover:bg-leaf-light">Confirmar entrega</button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm text-stone-400 hover:text-stone-200">Cancelar</button>
      </div>
    </form>
  );
}
