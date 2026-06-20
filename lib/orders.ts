import type { ProductUnit } from "@/lib/catalog";

export type OrderStatus =
  | "novo"
  | "preparando"
  | "saiu_entrega"
  | "entregue"
  | "cancelado";

export type PaymentMethod = "pix" | "cartao" | "dinheiro";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  novo: "Novo pedido",
  preparando: "Preparando",
  saiu_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

// Cor do badge por status (classes Tailwind)
export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  novo: "bg-gold/15 text-gold border-gold/40",
  preparando: "bg-forest-900/60 text-forest-200 border-forest-700",
  saiu_entrega: "bg-blue-950/50 text-blue-300 border-blue-900/60",
  entregue: "bg-forest-800/60 text-forest-200 border-forest-600",
  cancelado: "bg-red-950/40 text-red-300 border-red-900/50",
};

// Próximo status no fluxo do produtor (null = fim)
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  novo: "preparando",
  preparando: "saiu_entrega",
  saiu_entrega: "entregue",
};

export const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  novo: "Aceitar e preparar",
  preparando: "Saiu para entrega",
  saiu_entrega: "Marcar como entregue",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro na entrega",
};

export const PAYMENT_METHODS = Object.keys(PAYMENT_LABEL) as PaymentMethod[];

export type OrderItem = {
  id: string;
  product_name: string;
  unit: ProductUnit;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
};

export type Order = {
  id: string;
  customer_id: string;
  producer_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  total_cents: number;
  delivery_name: string | null;
  delivery_phone: string | null;
  delivery_address: string | null;
  delivery_notes: string | null;
  delivery_person_id: string | null;
  delivery_fee_cents: number;
  payment_status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
};

export type PaymentStatus = "pendente" | "pago" | "na_entrega" | "reembolsado";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pendente: "Pagamento pendente",
  pago: "Pago",
  na_entrega: "Pagar na entrega",
  reembolsado: "Reembolsado",
};

export const PAYMENT_STATUS_STYLE: Record<PaymentStatus, string> = {
  pendente: "border-gold/40 bg-gold/10 text-gold",
  pago: "border-forest-700 bg-forest-900/40 text-forest-200",
  na_entrega: "border-blue-900/60 bg-blue-950/40 text-blue-300",
  reembolsado: "border-red-900/50 bg-red-950/40 text-red-300",
};
