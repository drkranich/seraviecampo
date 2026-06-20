import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { type Product } from "@/lib/catalog";

export default async function MarketingPage() {
  const { user, profile } = await requireRole("produtor");
  const supabase = await createClient();

  const [{ data: pd }, { count: posts }] = await Promise.all([
    supabase.from("products").select("id, available, is_organic").eq("producer_id", user.id),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
  ]);
  const products = (pd ?? []) as Pick<Product, "id" | "available" | "is_organic">[];
  const total = products.length;
  const visiveis = products.filter((p) => p.available).length;
  const organicos = products.filter((p) => p.is_organic).length;

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil" title="Marketing" subtitle="Aumente seu alcance e atraia mais clientes.">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card label="Produtos visíveis" value={`${visiveis}/${total}`} accent />
        <Card label="Orgânicos" value={String(organicos)} />
        <Card label="Publicações no feed" value={String(posts ?? 0)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Action href="/produtor/feed" title="Publicar no feed" desc="Mostre a colheita do dia, bastidores e novidades. Posts aparecem para os clientes." cta="Abrir feed" />
        <Action href="/produtor/produtos" title="Cuidar da vitrine" desc="Capriche em fotos e descrições. Produtos visíveis e bem apresentados vendem mais." cta="Meus produtos" />
        <Action href="/produtor/perfil" title="Perfil público" desc="Conte sua história e adicione foto e capa. É o que o cliente vê primeiro." cta="Editar perfil" />
        <Action href="/produtor/assinatura" title="Selo e destaque" desc="Planos pagos dão selo verificado e mais destaque na descoberta." cta="Ver planos" />
      </div>
    </AppShell>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl border border-campo-border p-5">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-2 font-serif text-2xl ${accent ? "text-gold" : "text-forest-100"}`}>{value}</p>
    </div>
  );
}
function Action({ href, title, desc, cta }: { href: string; title: string; desc: string; cta: string }) {
  return (
    <article className="glass flex flex-col rounded-2xl border border-campo-border p-5">
      <h3 className="font-serif text-lg text-forest-100">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-stone-400">{desc}</p>
      <Link href={href} className="mt-4 inline-block w-fit rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">{cta}</Link>
    </article>
  );
}
