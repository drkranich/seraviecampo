import { requireRole } from "@/lib/guard";
import { AppShell, ModuleCard } from "@/components/AppShell";

export default async function ClientePage() {
  const { profile } = await requireRole("cliente");
  return (
    <AppShell
      badge="Clube Gourmet"
      title="Sabores que nascem na serra"
      subtitle={`Olá, ${profile?.full_name?.split(" ")[0] || "cliente"}. Conheça quem produz.`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard title="Descobertas" desc="Produtores próximos, novidades da semana e colheita fresca de hoje." />
        <ModuleCard title="Perfil do Produtor" desc="Fotos, história, família e produção. Você compra a história." />
        <ModuleCard title="Cesta & Compra" desc="Adicionar à cesta, escolher entrega, Pix ou cartão." />
        <ModuleCard title="Clube Gourmet" desc="Cestas Mantiqueira, Queijos de Minas, Cafés Especiais." />
        <ModuleCard title="Feed Social" desc="'José acabou de colher os morangos.' Acompanhe a produção." />
        <ModuleCard title="Assinaturas" desc="Receba sua cesta automaticamente toda semana." />
      </div>
    </AppShell>
  );
}
