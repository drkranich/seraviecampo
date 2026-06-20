import { requireRole } from "@/lib/guard";
import { AppShell, ModuleCard, PRODUTOR_NAV } from "@/components/AppShell";

export default async function Page() {
  const { profile } = await requireRole("produtor");
  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil" title="Clientes" subtitle="Quem compra de você.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard title="Lista de clientes" desc="Contatos e histórico de compras de cada cliente." />
        <ModuleCard title="CRM rural" desc="Segmentação, recência e ticket médio por cliente." />
        <ModuleCard title="Mensagens" desc="Fale com seus clientes direto pela plataforma." />
      </div>
    </AppShell>
  );
}
