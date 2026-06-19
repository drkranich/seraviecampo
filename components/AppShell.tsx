import { Sidebar, type NavItem } from "@/components/Sidebar";

export type { NavItem };

export function AppShell({
  title,
  subtitle,
  badge,
  nav,
  userName,
  profileHref,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  nav?: NavItem[];
  userName?: string;
  profileHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar nav={nav ?? []} badge={badge} userName={userName} profileHref={profileHref} />

      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
          <div className="mb-8">
            {badge && (
              <span className="mb-2 inline-block rounded-full border border-gold/40 px-3 py-0.5 text-xs uppercase tracking-wider text-gold">
                {badge}
              </span>
            )}
            <h1 className="font-serif text-3xl text-forest-100">{title}</h1>
            {subtitle && <p className="mt-1 text-stone-400">{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export function ModuleCard({ title, desc }: { title: string; desc: string }) {
  return (
    <article className="glass rounded-2xl border border-campo-border p-5">
      <h3 className="font-serif text-lg text-forest-100">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-400">{desc}</p>
      <span className="mt-3 inline-block text-xs uppercase tracking-wider text-stone-600">Em breve</span>
    </article>
  );
}

// Navegação por perfil (barra lateral)
export const CLIENTE_NAV: NavItem[] = [
  { href: "/cliente", label: "Descobertas", icon: "discover" },
  { href: "/cliente/cesta", label: "Cesta", icon: "cart" },
  { href: "/cliente/pedidos", label: "Meus pedidos", icon: "orders" },
];

export const PRODUTOR_NAV: NavItem[] = [
  { href: "/produtor", label: "Início", icon: "home" },
  { href: "/produtor/produtos", label: "Produtos", icon: "products" },
  { href: "/produtor/pedidos", label: "Pedidos", icon: "orders" },
  { href: "/produtor/perfil", label: "Perfil", icon: "profile" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Visão geral", icon: "chart" },
  { href: "/admin/aprovacoes", label: "Aprovações", icon: "approve" },
  { href: "/admin/usuarios", label: "Usuários", icon: "users" },
];

export const ENTREGADOR_NAV: NavItem[] = [
  { href: "/entregador", label: "Rotas", icon: "routes" },
  { href: "/entregador/ganhos", label: "Ganhos", icon: "earnings" },
  { href: "/entregador/historico", label: "Histórico", icon: "history" },
];
