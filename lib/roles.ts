export type UserRole = "super_admin" | "produtor" | "cliente" | "entregador";

// Mapa de papel -> rota inicial do dashboard
export const ROLE_HOME: Record<UserRole, string> = {
  super_admin: "/admin",
  produtor: "/produtor",
  cliente: "/cliente",
  entregador: "/entregador",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Seravie Hub",
  produtor: "Produtor Rural",
  cliente: "Cliente",
  entregador: "Entregador",
};

// Papéis que um usuário pode escolher ao se cadastrar (admin é interno)
export const SIGNUP_ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "cliente", label: "Cliente", desc: "Quero comprar produtos frescos do campo" },
  { value: "produtor", label: "Produtor Rural", desc: "Quero vender minha produção" },
  { value: "entregador", label: "Entregador", desc: "Quero fazer entregas na minha região" },
];
