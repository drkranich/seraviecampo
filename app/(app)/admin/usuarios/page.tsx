import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { ROLE_LABEL, type UserRole } from "@/lib/roles";
import { VERIFICATION_LABEL, VERIFICATION_STYLE, locationLabel } from "@/lib/profile";
import { Avatar } from "@/components/Avatar";

type Row = {
  id: string;
  role: UserRole;
  full_name: string | null;
  display_name: string | null;
  farm_name: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  verification_status: string;
  face_verified: boolean;
  document_url: string | null;
  created_at: string;
};

const roleOptions: Array<{ value: UserRole | "todos"; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "cliente", label: "Clientes" },
  { value: "produtor", label: "Produtores" },
  { value: "parceiro", label: "Parceiros" },
  { value: "entregador", label: "Entregadores" },
  { value: "super_admin", label: "Hub" },
];

const verificationOptions = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendentes" },
  { value: "em_analise", label: "Em análise" },
  { value: "verificado", label: "Verificados" },
  { value: "rejeitado", label: "Rejeitados" },
  { value: "incompleto", label: "Cadastro incompleto" },
];

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ papel?: string; verificacao?: string; q?: string }>;
}) {
  const { profile } = await requireRole("super_admin");
  const sp = await searchParams;
  const roleFilter = (sp.papel || "todos") as UserRole | "todos";
  const verificationFilter = sp.verificacao || "todos";
  const query = (sp.q || "").trim().toLowerCase();
  const supabase = await createClient();

  const [{ data }, { data: emails }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, full_name, display_name, farm_name, city, state, avatar_url, verification_status, face_verified, document_url, created_at")
      .order("created_at", { ascending: false }),
    supabase.rpc("admin_emails"),
  ]);
  const rows = (data ?? []) as Row[];
  const emailOf = new Map(((emails ?? []) as { id: string; email: string }[]).map((email) => [email.id, email.email]));

  const filtered = rows.filter((row) => {
    const matchesRole = roleFilter === "todos" || row.role === roleFilter;
    const incomplete = !row.face_verified || !row.document_url;
    const matchesVerification =
      verificationFilter === "todos" ||
      row.verification_status === verificationFilter ||
      (verificationFilter === "incompleto" && incomplete);
    const haystack = [
      row.full_name,
      row.display_name,
      row.farm_name,
      row.city,
      row.state,
      ROLE_LABEL[row.role],
      emailOf.get(row.id),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesRole && matchesVerification && matchesQuery;
  });

  const counts = {
    total: rows.length,
    clientes: rows.filter((row) => row.role === "cliente").length,
    fornecedores: rows.filter((row) => row.role === "produtor" || row.role === "parceiro").length,
    entregadores: rows.filter((row) => row.role === "entregador").length,
    pendentes: rows.filter((row) => row.verification_status === "pendente" || row.verification_status === "em_analise" || !row.face_verified || !row.document_url).length,
  };
  const reviewQueue = rows
    .filter((row) => row.role !== "cliente" && (row.verification_status === "pendente" || row.verification_status === "em_analise" || !row.face_verified || !row.document_url))
    .slice(0, 5);

  return (
    <AppShell
      badge="Seravie Hub"
      nav={ADMIN_NAV}
      userName={profile?.full_name ?? "Administrador"}
      title="Usuários"
      subtitle={`${filtered.length} exibidos de ${rows.length} contas no ecossistema`}
    >
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Total" value={String(counts.total)} />
        <Stat label="Clientes" value={String(counts.clientes)} />
        <Stat label="Fornecedores" value={String(counts.fornecedores)} />
        <Stat label="Entregadores" value={String(counts.entregadores)} />
        <Stat label="Para revisar" value={String(counts.pendentes)} warn={counts.pendentes > 0} />
      </section>

      {reviewQueue.length > 0 && (
        <section className="mb-6 rounded-2xl border border-gold/30 bg-gold/5 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg text-forest-100">Fila de revisão</h2>
              <p className="text-sm text-stone-400">Contas que precisam de documento, selfie ou decisão de verificação.</p>
            </div>
            <Link href="/admin/aprovacoes" className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Abrir aprovações</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {reviewQueue.map((row) => (
              <UserMiniCard key={row.id} row={row} email={emailOf.get(row.id) ?? ""} />
            ))}
          </div>
        </section>
      )}

      <form action="/admin/usuarios" className="mb-5 rounded-2xl border border-campo-border bg-campo-surface2/35 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <label>
            <span className="mb-1 block text-xs uppercase tracking-wider text-stone-500">Busca</span>
            <input
              name="q"
              defaultValue={sp.q || ""}
              placeholder="Nome, e-mail, cidade ou papel"
              className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none focus:border-gold"
            />
          </label>
          <Select name="papel" label="Papel" value={roleFilter} options={roleOptions} />
          <Select name="verificacao" label="Verificação" value={verificationFilter} options={verificationOptions} />
          <div className="flex items-end gap-2">
            <button className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Filtrar</button>
            <Link href="/admin/usuarios" className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-300 transition hover:border-gold/50">Limpar</Link>
          </div>
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border bg-campo-bg/30 p-10 text-center text-stone-400">
          Nenhum usuário encontrado com esses filtros.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-campo-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-campo-surface2 text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3">Confiança</th>
                <th className="px-4 py-3">Cadastro</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-campo-border glass">
              {filtered.map((row) => {
                const missing = [
                  !row.face_verified ? "selfie" : "",
                  !row.document_url ? "documento" : "",
                ].filter(Boolean);

                return (
                  <tr key={row.id} className="transition hover:bg-campo-surface2">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar url={row.avatar_url} size={40} verified={row.verification_status === "verificado"} fallback={fallbackFor(row)} />
                        <div className="min-w-0">
                          <p className="truncate text-forest-100">{displayName(row)}</p>
                          <p className="truncate text-xs text-stone-500">{row.farm_name && row.farm_name !== displayName(row) ? row.farm_name : row.display_name || "Sem nome público"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-400">{emailOf.get(row.id) || "—"}</td>
                    <td className="px-4 py-3 text-stone-400">{ROLE_LABEL[row.role]}</td>
                    <td className="px-4 py-3 text-stone-400">{locationLabel(row) || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit rounded-full border px-2 py-0.5 text-[0.65rem] ${VERIFICATION_STYLE[row.verification_status] ?? ""}`}>
                          {VERIFICATION_LABEL[row.verification_status] ?? row.verification_status}
                        </span>
                        {missing.length > 0 && <span className="text-[0.65rem] text-gold">Falta {missing.join(" e ")}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-500">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/usuarios/${row.id}`} className="text-xs text-gold hover:underline">Ver detalhes →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label>
      <span className="mb-1 block text-xs uppercase tracking-wider text-stone-500">{label}</span>
      <select name={name} defaultValue={value} className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none focus:border-gold">
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function UserMiniCard({ row, email }: { row: Row; email: string }) {
  return (
    <Link href={`/admin/usuarios/${row.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-campo-border bg-campo-bg/45 p-3 transition hover:border-gold/50">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar url={row.avatar_url} size={40} verified={row.verification_status === "verificado"} fallback={fallbackFor(row)} />
        <div className="min-w-0">
          <p className="truncate text-sm text-forest-100">{displayName(row)}</p>
          <p className="truncate text-xs text-stone-500">{ROLE_LABEL[row.role]} · {email || "sem e-mail"}</p>
        </div>
      </div>
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] ${VERIFICATION_STYLE[row.verification_status] ?? ""}`}>
        {VERIFICATION_LABEL[row.verification_status] ?? row.verification_status}
      </span>
    </Link>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="glass rounded-2xl border border-campo-border p-5">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-2 font-serif text-2xl ${warn ? "text-gold" : "text-forest-100"}`}>{value}</p>
    </div>
  );
}

function displayName(row: Row) {
  return row.farm_name || row.display_name || row.full_name || "Conta sem nome";
}

function fallbackFor(row: Row) {
  if (row.role === "produtor") return "PR";
  if (row.role === "entregador") return "EN";
  if (row.role === "parceiro") return "EX";
  if (row.role === "super_admin") return "SA";
  return "CL";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}
