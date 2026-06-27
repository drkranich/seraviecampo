export type UserRole = "super_admin" | "produtor" | "cliente" | "entregador" | "parceiro";

// Mapa de papel -> rota inicial do dashboard
export const ROLE_HOME: Record<UserRole, string> = {
  super_admin: "/admin",
  produtor: "/produtor",
  cliente: "/cliente",
  entregador: "/entregador",
  parceiro: "/parceiro",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Seravie Hub",
  produtor: "Produtor Rural",
  cliente: "Cliente",
  entregador: "Entregador",
  parceiro: "Parceiro de Experiências",
};

// Papéis que um usuário pode escolher ao se cadastrar (admin é interno)
export const SIGNUP_ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "cliente", label: "Cliente", desc: "Quero comprar produtos frescos do campo" },
  { value: "produtor", label: "Produtor Rural", desc: "Quero vender minha produção" },
  { value: "entregador", label: "Entregador", desc: "Quero fazer entregas na minha região" },
  { value: "parceiro", label: "Parceiro de Experiências", desc: "Quero ofertar vivências, turismo, oficinas e degustações" },
];
