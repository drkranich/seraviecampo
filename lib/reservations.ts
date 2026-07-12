export type ReservationStatus = "reservado" | "confirmado" | "concluido" | "cancelado";

export const RES_STATUS_LABEL: Record<ReservationStatus, string> = {
  reservado: "Reservado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const RES_STATUS_STYLE: Record<ReservationStatus, string> = {
  reservado: "border-gold/40 bg-gold/10 text-gold",
  confirmado: "border-leaf-dark/60 bg-leaf-dark/20 text-leaf-light",
  concluido: "border-forest-700 bg-forest-900/40 text-forest-200",
  cancelado: "border-red-900/50 bg-red-950/40 text-red-300",
};

export type Reservation = {
  id: string; product_id: string; producer_id: string; customer_id: string;
  quantity: number; status: ReservationStatus; note: string | null; created_at: string;
};
