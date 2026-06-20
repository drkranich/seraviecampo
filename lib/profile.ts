import type { UserRole } from "@/lib/roles";

export type PublicProfile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  cover_url: string | null;
  farm_name: string | null;
  verification_status: "pendente" | "em_analise" | "verificado" | "rejeitado";
};

// Nome de exibição do produtor (fazenda > display_name > full_name)
export function producerName(p?: { farm_name?: string | null; display_name?: string | null; full_name?: string | null } | null): string {
  if (!p) return "Produtor";
  return p.farm_name || p.display_name || p.full_name || "Produtor";
}

export function locationLabel(p?: { city?: string | null; state?: string | null } | null): string {
  if (!p) return "";
  return [p.city, p.state].filter(Boolean).join(", ");
}

export const VERIFICATION_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  verificado: "Verificado",
  rejeitado: "Rejeitado",
};

export const VERIFICATION_STYLE: Record<string, string> = {
  pendente: "border-gold/40 bg-gold/10 text-gold",
  em_analise: "border-blue-900/60 bg-blue-950/40 text-blue-300",
  verificado: "border-forest-700 bg-forest-900/40 text-forest-200",
  rejeitado: "border-red-900/50 bg-red-950/40 text-red-300",
};
