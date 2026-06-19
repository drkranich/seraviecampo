
export function AppShell({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-campo-border bg-campo-surface/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="font-serif text-xl text-forest-100">
              Seravie <span className="text-gold">Campo</span>
            </span>
            {badge && (
              <span className="rounded-full border border-gold/40 px-3 py-0.5 text-xs uppercase tracking-wider text-gold">
                {badge}
              </span>
            )}
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-stone-400 transition hover:text-gold">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-serif text-3xl text-forest-100">{title}</h1>
        {subtitle && <p className="mt-1 text-stone-400">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}

// Cartão de módulo "em construção" para os placeholders
export function ModuleCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <article className="rounded-2xl border border-campo-border bg-campo-surface p-5">
      <h3 className="font-serif text-lg text-forest-100">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-400">{desc}</p>
      <span className="mt-3 inline-block text-xs uppercase tracking-wider text-stone-600">
        Em breve
      </span>
    </article>
  );
}
