import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { Carousel } from "@/components/Carousel";
import { type Post } from "@/lib/feed";
import { createPost, deletePost } from "./actions";

export default async function FeedProdutorPage({
  searchParams,
}: { searchParams: Promise<{ ok?: string; del?: string; error?: string }> }) {
  const { user, profile } = await requireRole("produtor");
  const sp = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.from("posts").select("*").eq("author_id", user.id).order("created_at", { ascending: false });
  const posts = (data ?? []) as Post[];

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} title="Feed social" subtitle="Compartilhe novidades, bastidores e colheitas com seus clientes.">
      {sp.ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Publicado!</div>}
      {sp.del && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Publicação removida.</div>}
      {sp.error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{decodeURIComponent(sp.error)}</div>}

      <form action={createPost} className="mb-8 max-w-2xl space-y-3 rounded-2xl border border-campo-border glass p-5">
        <textarea name="body" rows={3} required placeholder="O que está acontecendo na sua produção hoje?" className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold" />
        <MultiImageUpload name="images" label="Fotos (opcional)" folder="post" />
        <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Publicar</button>
      </form>

      <h2 className="mb-3 font-serif text-xl text-forest-100">Minhas publicações</h2>
      {posts.length === 0 ? (
        <p className="text-sm text-stone-500">Nenhuma publicação ainda.</p>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {posts.map((post) => {
            const del = deletePost.bind(null, post.id);
            return (
              <article key={post.id} className="glass rounded-2xl border border-campo-border p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-stone-500">{new Date(post.created_at).toLocaleString("pt-BR")}</p>
                  <form action={del}><button className="text-xs text-red-300 hover:underline">Excluir</button></form>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-stone-200">{post.body}</p>
                {(post.images?.length ? post.images : post.image_url ? [post.image_url] : []).length > 0 && (
                  <div className="mt-3"><Carousel images={post.images?.length ? post.images : [post.image_url as string]} className="max-h-80" /></div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
