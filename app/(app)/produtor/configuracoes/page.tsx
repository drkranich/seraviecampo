import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";

export default async function ConfiguracoesProdutorPage() {
  const { user, profile } = await requireRole("produtor");

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil" title="Configurações" subtitle="Sua conta e preferências.">
      <section className="glass mb-4 max-w-2xl rounded-2xl border border-campo-border p-6">
        <h2 className="font-serif text-lg text-forest-100">Conta</h2>
        <p className="mt-2 text-sm text-stone-400">E-mail: <span className="text-stone-200">{user.email}</span></p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/produtor/perfil" className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Editar perfil</Link>
          <Link href="/produtor/financeiro" className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Financeiro</Link>
          <Link href="/produtor/assinatura" className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Meu plano</Link>
        </div>
      </section>

      <section className="glass max-w-2xl rounded-2xl border border-campo-border p-6">
        <h2 className="font-serif text-lg text-forest-100">Sessão</h2>
        <p className="mt-2 text-sm text-stone-400">Encerrar a sessão neste dispositivo.</p>
        <form action="/auth/signout" method="post" className="mt-4">
          <button className="rounded-lg border border-red-900/50 px-4 py-2 text-sm text-red-300 transition hover:bg-red-950/40">Sair da conta</button>
        </form>
      </section>
    </AppShell>
  );
}
