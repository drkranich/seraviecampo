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
export function producerName(p: Partial<PublicProfile> | null | undefined): string {
  if (!p) return "Produtor";
  return p.farm_name || p.display_name || p.full_name || "Produtor";
}

export function locationLabel(p: Partial<PublicProfile> | null | undefined): string {
  if (!p) return "";
  return [p.city, p.state].filter(Boolean).join(", ");
}
