"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type IconKey =
  | "home" | "products" | "orders" | "profile" | "cart"
  | "discover" | "routes" | "earnings" | "history" | "chart"
  | "approve" | "map" | "shield" | "users"
  | "cash" | "sprout" | "megaphone" | "crown" | "gear" | "search" | "chat" | "inbox" | "spark";

export type NavItem = { href: string; label: string; icon: IconKey };

function Icon({ name }: { name: IconKey }) {
  const common = {
    width: 18, height: 18, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<IconKey, React.ReactNode> = {
    home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
    products: <><path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" /><path d="M3.3 7L12 12l8.7-5M12 22V12" /></>,
    orders: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 9h6M9 13h6M9 17h4" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
    cart: <><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.5 13h11L21 7H6" /></>,
    discover: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
    routes: <><path d="M3 17h2l2-9h8l2 9h2" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="16.5" cy="18" r="1.5" /></>,
    earnings: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4" /></>,
    history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    chart: <><path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-7" /></>,
    approve: <><circle cx="12" cy="12" r="9" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
    map: <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></>,
    shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></>,
    users: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.5 3-5.5 6-5.5s6 2 6 5.5" /><path d="M16 5.5a3.5 3.5 0 010 6.5M18 20c0-2.5-1-4-2.5-5" /></>,
    cash: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M5 9v.01M19 15v.01" /></>,
    sprout: <><path d="M12 20v-7" /><path d="M12 13c0-3-2-5-5-5 0 3 2 5 5 5z" /><path d="M12 11c0-2.5 2-4.5 5-4.5 0 2.5-2 4.5-5 4.5z" /></>,
    megaphone: <><path d="M3 11l13-5v12L3 13z" /><path d="M16 8a3 3 0 010 6" /><path d="M6 13v4a2 2 0 003.8.9" /></>,
    crown: <><path d="M3 7l4.5 4L12 5l4.5 6L21 7l-1.5 11h-15z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
    spark: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></>,
    chat: <><path d="M21 15a2 2 0 01-2 2H8l-4 4V5a2 2 0 012-2h13a2 2 0 012 2z" /></>,
    inbox: <><path d="M3 13h4l2 3h6l2-3h4" /><path d="M5 5h14l2 8v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4z" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a7.5 7.5 0 000-3l1.8-1.4-2-3.4-2.2.9a7.5 7.5 0 00-2.6-1.5L12 1.5h-4l-.4 2.6a7.5 7.5 0 00-2.6 1.5l-2.2-.9-2 3.4L2.6 10.5a7.5 7.5 0 000 3l-1.8 1.4 2 3.4 2.2-.9a7.5 7.5 0 002.6 1.5l.4 2.6h4l.4-2.6a7.5 7.5 0 002.6-1.5l2.2.9 2-3.4z" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export function Sidebar({
  nav,
  badge,
  userName,
  profileHref,
}: {
  nav: NavItem[];
  badge?: string;
  userName?: string;
  profileHref?: string;
}) {
  const pathname = usePathname();
  const activeHref = nav.reduce((best, n) => {
    const match = pathname === n.href || pathname.startsWith(n.href + "/");
    return match && n.href.length > best.length ? n.href : best;
  }, "");

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="space-y-1">
      {nav.map((n) => {
        const active = n.href === activeHref;
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              active
                ? "bg-forest-900/70 text-gold"
                : "text-stone-400 hover:bg-campo-surface2 hover:text-stone-100"
            }`}
          >
            <Icon name={n.icon} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-campo-border bg-campo-surface/40 px-4 py-6 md:flex">
        <Link href="/" className="mb-6 shrink-0 px-2">
          <span className="block font-serif text-2xl font-semibold text-forest-100">
            Seravie <span className="text-gold">Campo</span>
          </span>
          <span className="mt-0.5 block text-[0.6rem] uppercase tracking-[0.35em] text-stone-500">
            Agro Gourmet
          </span>
        </Link>

        <div className="sidebar-scroll -mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
          <NavLinks />
        </div>

        <div className="shrink-0 space-y-3 border-t border-campo-border pt-4">
          <div className="rounded-xl border border-campo-border glass p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-campo-surface2 text-sm text-gold">
                {(userName || "S").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-forest-100">{userName || "Conta"}</p>
                {badge && <p className="truncate text-[0.65rem] uppercase tracking-wider text-stone-500">{badge}</p>}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              {profileHref && (
                <Link href={profileHref} className="text-xs text-gold hover:underline">
                  Ver perfil
                </Link>
              )}
              <form action="/auth/signout" method="post">
                <button className="text-xs text-stone-400 transition hover:text-gold">Sair</button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-20 border-b border-campo-border bg-campo-bg/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-serif text-lg text-forest-100">
            Seravie <span className="text-gold">Campo</span>
          </span>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-stone-400">Sair</button>
          </form>
        </div>
        <div className="flex gap-1 overflow-x-auto px-2 pb-2">
          {nav.map((n) => {
            const active = n.href === activeHref;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition ${
                  active ? "bg-forest-900/70 text-gold" : "text-stone-400"
                }`}
              >
                <Icon name={n.icon} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </header>
    </>
  );
}
