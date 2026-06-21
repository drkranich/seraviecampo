// Tipos e rótulos do catálogo de produtos

export type ProductCategory =
  | "hortifruti"
  | "laticinios"
  | "ovos"
  | "carnes"
  | "mel_geleias"
  | "cafe"
  | "bebidas"
  | "paes_massas"
  | "organicos"
  | "outros";

export type ProductionStatus = "plantado" | "crescendo" | "pronto" | "reservado";

export type ProductUnit =
  | "kg"
  | "g"
  | "unidade"
  | "duzia"
  | "litro"
  | "maco"
  | "bandeja"
  | "pote"
  | "caixa";

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  hortifruti: "Hortifrúti",
  laticinios: "Laticínios",
  ovos: "Ovos",
  carnes: "Carnes",
  mel_geleias: "Mel e Geleias",
  cafe: "Café",
  bebidas: "Bebidas",
  paes_massas: "Pães e Massas",
  organicos: "Orgânicos",
  outros: "Outros",
};

export const STATUS_LABEL: Record<ProductionStatus, string> = {
  plantado: "🌱 Plantado",
  crescendo: "🌿 Crescendo",
  pronto: "🍅 Pronto para venda",
  reservado: "📦 Reservado",
};

export const UNIT_LABEL: Record<ProductUnit, string> = {
  kg: "kg",
  g: "g",
  unidade: "unidade",
  duzia: "dúzia",
  litro: "litro",
  maco: "maço",
  bandeja: "bandeja",
  pote: "pote",
  caixa: "caixa",
};

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as ProductCategory[];
export const STATUSES = Object.keys(STATUS_LABEL) as ProductionStatus[];
export const UNITS = Object.keys(UNIT_LABEL) as ProductUnit[];

// R$ a partir de centavos
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// "12,50" / "12.50" -> centavos
export function parseToCents(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const num = Number(normalized);
  if (Number.isNaN(num) || num < 0) return 0;
  return Math.round(num * 100);
}

export type Product = {
  id: string;
  producer_id: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  production_status: ProductionStatus;
  price_cents: number;
  unit: ProductUnit;
  stock: number;
  is_organic: boolean;
  available: boolean;
  available_from: string | null;
  image_url: string | null;
  images: string[];
  archived: boolean;
  created_at: string;
};
