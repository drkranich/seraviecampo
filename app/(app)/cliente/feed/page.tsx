import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Carousel } from "@/components/Carousel";
import { type Post } from "@/lib/feed";
import { producerName } from "@/lib/profile";

export default async function FeedClientePage() {
  const { profile } = await requireRole("cliente");
  const supabase = await createClient();

  const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(80);
  const posts = (data ?? []) as Post[];

  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const { data: authors } = await supabase.from("profiles").select("id, full_name, display_name, farm_name, avatar_url, verification_status").in("id", authorIds.length ? authorIds : ["00000000-0000-0000-0000-000000000000"]);
  type A = { id: string; full_name: string | null; display_name: string | null; farm_name: string | null; avatar_url: string | null; verification_status: string };
  const aMap = new Map((authors ?? []).map((a) => [a.id, a as A]));

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Cliente"} title="Feed dos produtores" subtitle="Acompanhe os bastidores de quem produz o seu alimento.">
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">Nenhuma publicação ainda. Volte em breve!</div>
      ) : (
        <div className="max-w-2xl space-y-5">
          {posts.map((post) => {
            const a = aMap.get(post.author_id);
            return (
              <article key={post.id} className="glass rounded-2xl border border-campo-border p-5">
                <div className="flex items-center gap-3">
                  <Avatar url={a?.avatar_url} verified={a?.verification_status === "verificado"} size={42} />
                  <div className="min-w-0">
                    <Link href={`/cliente/produtor/${post.author_id}`} className="block truncate font-serif text-forest-100 hover:text-gold">{producerName(a)}</Link>
                    <p className="text-xs text-stone-500">{new Date(post.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-stone-200">{post.body}</p>
                {(post.images?.length ? post.images : post.image_url ? [post.image_url] : []).length > 0 && (
                  <div className="mt-3"><Carousel images={post.images?.length ? post.images : [post.image_url as string]} className="max-h-96" /></div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
