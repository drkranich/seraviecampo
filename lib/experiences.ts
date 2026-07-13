// Módulo Experiências: tipos, rótulos e helpers (turismo rural / vivências).
import { formatMoney } from "@/lib/money";

export type ExperienceCategory =
  | "gastronomia"
  | "colha_pague"
  | "vivencia_agricola"
  | "vida_fazenda"
  | "natureza"
  | "artesanato"
  | "bem_estar"
  | "familia"
  | "curso"
  | "turismo_rural"
  | "degustacao"
  | "evento";

export const EXP_CATEGORY_LABEL: Record<ExperienceCategory, string> = {
  gastronomia: "Gastronomia rural",
  colha_pague: "Colha e Pague",
  vivencia_agricola: "Vivência agrícola",
  vida_fazenda: "Vida na fazenda",
  natureza: "Natureza",
  artesanato: "Artesanato",
  bem_estar: "Bem-estar",
  familia: "Família",
  curso: "Curso / Oficina",
  turismo_rural: "Turismo rural",
  degustacao: "Degustação gourmet",
  evento: "Eventos",
};

export const EXP_CATEGORIES = Object.keys(EXP_CATEGORY_LABEL) as ExperienceCategory[];

export type ExperienceStatus = "pendente" | "confirmado" | "concluido" | "cancelado";

export const EXP_STATUS_LABEL: Record<ExperienceStatus, string> = {
  pendente: "Pendente",
  confirmado: "Confirmada",
  concluido: "Concluída",
  cancelado: "Cancelada",
};

export const EXP_STATUS_STYLE: Record<ExperienceStatus, string> = {
  pendente: "border-amber-900/60 text-amber-300",
  confirmado: "border-leaf-dark/60 text-leaf-light",
  concluido: "border-forest-700 text-forest-200",
  cancelado: "border-red-900/50 text-red-300",
};

export type Experience = {
  id: string;
  producer_id: string;
  title: string;
  category: ExperienceCategory;
  summary: string;
  description: string;
  duration_min: number;
  capacity: number;
  price_cents: number;
  currency: string;
  location: string;
  includes: string[];
  images: string[];
  active: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type ExperienceBooking = {
  id: string;
  experience_id: string;
  producer_id: string;
  customer_id: string;
  date: string;
  time: string;
  people: number;
  total_cents: number;
  currency: string;
  status: ExperienceStatus;
  payment_status: "pendente" | "pago" | "reembolso_pendente" | "reembolsado";
  paid_at: string | null;
  producer_paid_out: boolean;
  note: string | null;
  created_at: string;
};

// Converte "150,00" ou "150.00" em centavos.
export function priceToCents(value: string): number {
  const clean = String(value).replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number.parseFloat(clean);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function formatExpPrice(cents: number, currency = "BRL"): string {
  return formatMoney(cents, currency);
}

export function durationLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
