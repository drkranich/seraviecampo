import { requireRole } from "@/lib/guard";
import { AppShell, ModuleCard, PRODUTOR_NAV } from "@/components/AppShell";

export default async function Page() {
  const { profile } = await requireRole("produtor");
  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil" title="Produção" subtitle="Da semente à colheita.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard title="Minha Produção" desc="Plantado, crescendo, pronto e reservado." />
        <ModuleCard title="Calendário de Safra" desc="O sistema lembra o que plantar e colher." />
        <ModuleCard title="Reserva de Colheita" desc="Venda antes de colher e reduza desperdício." />
      </div>
    </AppShell>
  );
}
