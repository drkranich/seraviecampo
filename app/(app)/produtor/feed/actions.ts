"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const body = String(formData.get("body") || "").trim();
  const image_url = String(formData.get("image_url") || "").trim() || null;
  if (!body) redirect("/produtor/feed?error=" + encodeURIComponent("Escreva algo para publicar."));
  const { error } = await supabase.from("posts").insert({ author_id: user.id, body, image_url });
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
