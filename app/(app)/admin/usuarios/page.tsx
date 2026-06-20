import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { ROLE_LABEL, type UserRole } from "@/lib/roles";
import { VERIFICATION_LABEL, VERIFICATION_STYLE } from "@/lib/profile";

type Row = { id: string; role: UserRole; full_name: string | null; city: string | null; state: string | null; verification_status: string; created_at: string };

export default async function UsuariosPage() {
  const { profile } = await requireRole("super_admin");
  const supabase = await createClient();

  const [{ data }, { data: emails }] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name, city, state, verification_status, created_at").order("created_at", { ascending: false }),
    supabase.rpc("admin_emails"),
  ]);
  const rows = (data ?? []) as Row[];
  const emailOf = new Map(((emails ?? []) as { id: string; email: string }[]).map((e) => [e.id, e.email]));

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} userName={profile?.full_name ?? "Administrador"} title="Usuários" subtitle={`${rows.length} no ecossistema`}>
      <div className="overflow-hidden rounded-2xl border border-campo-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-campo-surface2 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3">Local</th>
              <th className="px-4 py-3">Verificação</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-campo-border glass">
            {rows.map((u) => (
              <tr key={u.id} className="transition hover:bg-campo-surface2">
                <td className="px-4 py-3 text-forest-100">{u.full_name || "—"}</td>
                <td className="px-4 py-3 text-stone-400">{emailOf.get(u.id) || "—"}</td>
                <td className="px-4 py-3 text-stone-400">{ROLE_LABEL[u.role]}</td>
                <td className="px-4 py-3 text-stone-400">{[u.city, u.state].filter(Boolean).join(", ") || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 text-[0.65rem] ${VERIFICATION_STYLE[u.verification_status]}`}>
                    {VERIFICATION_LABEL[u.verification_status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/usuarios/${u.id}`} className="text-xs text-gold hover:underline">Ver detalhes →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
