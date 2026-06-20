"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAuthedClient } from "@/lib/supabase/server";

async function authedAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "super_admin") redirect("/login");
  const { data: { session } } = await supabase.auth.getSession();
  const db = session ? createAuthedClient(session.access_token) : supabase;
  return { db };
}

export async function setVerification(userId: string, status: "verificado" | "rejeitado" | "em_analise") {
  const { db } = await authedAdmin();
  await db.from("profiles").update({ verification_status: status }).eq("id", userId);
  revalidatePath("/admin/aprovacoes");
  revalidatePath("/admin/usuarios");
}
