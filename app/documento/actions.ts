"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type UserRole } from "@/lib/roles";

export async function saveDocument(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const document_url = String(formData.get("document_url") || "").trim();
  const document_type = String(formData.get("document_type") || "").trim() || null;
  if (!document_url) redirect("/documento?error=" + encodeURIComponent("Envie o documento para continuar."));

  const { data: profile } = await supabase
    .from("profiles")
    .update({ document_url, document_type })
    .eq("id", user.id)
    .select("role")
    .single();

  const role = (profile?.role ?? "cliente") as UserRole;
  redirect(ROLE_HOME[role]);
}
