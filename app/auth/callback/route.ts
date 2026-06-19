import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type UserRole } from "@/lib/roles";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user!.id)
        .single();
      const role = (profile?.role ?? "cliente") as UserRole;
      return NextResponse.redirect(`${origin}${ROLE_HOME[role]}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Falha na autenticação`);
}
