import { requireRole } from "@/lib/guard";
import { AppShell, ENTREGADOR_NAV } from "@/components/AppShell";
import { SupportChat } from "@/components/SupportChat";

export default async function SuportePage() {
  const { user, profile } = await requireRole("entregador");
  return (
    <AppShell badge="Entregador" nav={ENTREGADOR_NAV} userName={profile?.full_name ?? "Usuário"} title="Suporte" subtitle="Fale com a equipe Seravie Campo.">
      <div className="max-w-2xl">
        <SupportChat threadUserId={user.id} />
      </div>
    </AppShell>
  );
}
