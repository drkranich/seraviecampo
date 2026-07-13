export type PayoutTransferRow = {
  id: string;
  source_type: "order" | "experience_booking";
  source_id: string;
  recipient_id: string | null;
  stripe_transfer_id: string | null;
  stripe_reversal_id: string | null;
  kind: string;
  amount_cents: number;
  currency: string;
  status: "created" | "failed" | "reversed" | string;
  error: string | null;
  created_at: string;
  reversed_at: string | null;
};

export function transferStatusLabel(status: string): string {
  if (status === "created") return "Enviado";
  if (status === "failed") return "Falhou";
  if (status === "reversed") return "Estornado";
  return status || "Indefinido";
}

export function transferStatusClass(status: string): string {
  if (status === "created") return "border-forest-700 bg-forest-900/40 text-forest-200";
  if (status === "failed") return "border-red-900/50 bg-red-950/40 text-red-300";
  if (status === "reversed") return "border-khaki/60 bg-khaki/15 text-cream";
  return "border-campo-border bg-campo-surface2 text-stone-400";
}

export function transferKindLabel(kind: string): string {
  if (kind === "producer") return "Venda de produtos";
  if (kind === "courier") return "Entrega";
  if (kind === "producer_delivery") return "Autoentrega";
  if (kind === "experience") return "Experiência";
  return kind || "Repasse";
}

export function transferSourceLabel(source: string): string {
  if (source === "order") return "Pedido";
  if (source === "experience_booking") return "Reserva";
  return source || "Origem";
}

export function compactStripeId(value: string | null | undefined): string {
  if (!value) return "-";
  return value.length > 22 ? `${value.slice(0, 12)}...${value.slice(-5)}` : value;
}

export function formatDateTime(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function sumTransfers(transfers: PayoutTransferRow[], status: string): number {
  return transfers
    .filter((transfer) => transfer.status === status)
    .reduce((total, transfer) => total + transfer.amount_cents, 0);
}

