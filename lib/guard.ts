import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type UserRole } from "@/lib/roles";

export async function requireRole(expected: UserRole) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, display_name, verification_status, face_verified, document_url, kyc_exempt")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "cliente") as UserRole;

  // Usuário no dashboard errado -> manda para o dele
  if (role !== expected) redirect(ROLE_HOME[role]);

  // Portas de entrada obrigatórias (exceto admin interno e contas isentas)
  if (role !== "super_admin" && profile) {
    if (!profile.face_verified) redirect("/verificacao");
    if (!profile.kyc_exempt && !profile.document_url) redirect("/documento");
  }

  return { user, profile };
}
