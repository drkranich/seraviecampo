export type DisputeStatus = "aberta" | "em_analise" | "reembolsada" | "encerrada_sem_reembolso" | "recusada";

export const DISPUTE_STATUS_LABEL: Record<DisputeStatus, string> = {
  aberta: "Aberta",
  em_analise: "Em análise",
  reembolsada: "Reembolsada",
  encerrada_sem_reembolso: "Encerrada (sem reembolso)",
  recusada: "Recusada",
};

export const DISPUTE_STATUS_STYLE: Record<DisputeStatus, string> = {
  aberta: "border-gold/40 bg-gold/10 text-gold",
  em_analise: "border-khaki/60 bg-khaki/15 text-cream",
  reembolsada: "border-forest-700 bg-forest-900/40 text-forest-200",
  encerrada_sem_reembolso: "border-stone-700 bg-stone-900/40 text-stone-300",
  recusada: "border-red-900/50 bg-red-950/40 text-red-300",
};

export const DISPUTE_REASONS: { value: string; label: string }[] = [
  { value: "nao_entregue", label: "Pedido não foi entregue" },
  { value: "produto_errado", label: "Produto errado ou faltando" },
  { value: "produto_avariado", label: "Produto avariado / estragado" },
  { value: "atraso", label: "Atraso na entrega" },
  { value: "cobranca", label: "Problema na cobrança" },
  { value: "outro", label: "Outro motivo" },
];

export const DISPUTE_REASON_LABEL: Record<string, string> =
  Object.fromEntries(DISPUTE_REASONS.map((r) => [r.value, r.label]));

export type Dispute = {
  id: string;
  order_id: string;
  opened_by: string;
  opened_role: string;
  reason: string;
  description: string | null;
  status: DisputeStatus;
  resolution_note: string | null;
  refunded: boolean;
  stripe_dispute_id: string | null;
  stripe_refund_id: string | null;
  refund_amount_cents: number | null;
  stripe_status: string | null;
  stripe_reason: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};
