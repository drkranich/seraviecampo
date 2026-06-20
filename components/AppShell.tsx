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
  { href: "/cliente/explorar", label: "Explorar", icon: "search" },
  { href: "/cliente/clube", label: "Clube Gourmet", icon: "crown" },
  { href: "/cliente/cesta", label: "Cesta", icon: "cart" },
  { href: "/cliente/pagamento", label: "Pagamento", icon: "cash" },
  { href: "/cliente/pedidos", label: "Meus pedidos", icon: "orders" },
  { href: "/cliente/proximos", label: "Perto de mim", icon: "map" },
  { href: "/cliente/reservas", label: "Reservas", icon: "sprout" },
  { href: "/cliente/feed", label: "Feed", icon: "megaphone" },
  { href: "/cliente/assinatura", label: "Assinatura", icon: "crown" },
  { href: "/cliente/suporte", label: "Suporte", icon: "chat" },
  { href: "/cliente/conta", label: "Conta", icon: "profile" },
];

export const PRODUTOR_NAV: NavItem[] = [
  { href: "/produtor", label: "Visão Geral", icon: "home" },
  { href: "/produtor/pedidos", label: "Pedidos", icon: "orders" },
  { href: "/produtor/produtos", label: "Produtos", icon: "products" },
  { href: "/produtor/reservas", label: "Reservas", icon: "sprout" },
  { href: "/produtor/feed", label: "Feed", icon: "megaphone" },
  { href: "/produtor/clientes", label: "Clientes", icon: "users" },
  { href: "/produtor/entregas", label: "Entregas", icon: "routes" },
  { href: "/produtor/financeiro", label: "Financeiro", icon: "cash" },
  { href: "/produtor/producao", label: "Produção", icon: "sprout" },
  { href: "/produtor/insights", label: "Insights", icon: "chart" },
  { href: "/produtor/ia", label: "IA Rural", icon: "spark" },
  { href: "/produtor/marketing", label: "Marketing", icon: "megaphone" },
  { href: "/produtor/assinatura", label: "Meu Plano", icon: "crown" },
  { href: "/produtor/perfil", label: "Perfil", icon: "profile" },
  { href: "/produtor/suporte", label: "Suporte", icon: "chat" },
  { href: "/produtor/configuracoes", label: "Configurações", icon: "gear" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Visão Geral", icon: "chart" },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: "cash" },
  { href: "/admin/aprovacoes", label: "Aprovações", icon: "approve" },
  { href: "/admin/usuarios", label: "Usuários", icon: "users" },
  { href: "/admin/cidades", label: "Cidades", icon: "map" },
  { href: "/admin/moderacao", label: "Moderação", icon: "shield" },
  { href: "/admin/disputas", label: "Disputas", icon: "approve" },
  { href: "/admin/inbox", label: "Inbox", icon: "inbox" },
  { href: "/admin/termos", label: "Termos", icon: "shield" },
];

export const ENTREGADOR_NAV: NavItem[] = [
  { href: "/entregador", label: "Entregas", icon: "routes" },
  { href: "/entregador/rotas", label: "Rotas e Mapa", icon: "map" },
  { href: "/entregador/ganhos", label: "Ganhos", icon: "earnings" },
  { href: "/entregador/historico", label: "Histórico", icon: "history" },
  { href: "/entregador/assinatura", label: "Meu Plano", icon: "crown" },
  { href: "/entregador/perfil", label: "Perfil", icon: "profile" },
  { href: "/entregador/suporte", label: "Suporte", icon: "chat" },
  { href: "/entregador/configuracoes", label: "Configurações", icon: "gear" },
];
