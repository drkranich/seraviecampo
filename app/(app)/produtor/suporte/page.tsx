import { requireRole } from "@/lib/guard";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { SupportChat } from "@/components/SupportChat";

export default async function SuportePage() {
  const { user, profile } = await requireRole("produtor");
  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Usuário"} title="Suporte" subtitle="Fale com a equipe Seravie Campo.">
      <div className="max-w-2xl">
        <SupportChat threadUserId={user.id} />
      </div>
    </AppShell>
  );
}
