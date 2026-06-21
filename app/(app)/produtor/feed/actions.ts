"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const body = String(formData.get("body") || "").trim();
  let images: string[] = [];
  try { const r = JSON.parse(String(formData.get("images") || "[]")); if (Array.isArray(r)) images = r.filter((x) => typeof x === "string"); } catch { images = []; }
  if (!body) redirect("/produtor/feed?error=" + encodeURIComponent("Escreva algo para publicar."));
  const { error } = await supabase.from("posts").insert({ author_id: user.id, body, image_url: images[0] ?? null, images });
  if (error) redirect("/produtor/feed?error=" + encodeURIComponent(error.message));
  revalidatePath("/produtor/feed");
  redirect("/produtor/feed?ok=1");
}

export async function deletePost(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("posts").delete().eq("id", id).eq("author_id", user.id);
  revalidatePath("/produtor/feed");
  redirect("/produtor/feed?del=1");
}
