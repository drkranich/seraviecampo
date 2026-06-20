import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripeEnabled, createConnectAccount, createAccountLink } from "@/lib/stripe";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (!stripeEnabled()) {
    return NextResponse.redirect(`${origin}/produtor/financeiro?error=stripe_off`, { status: 303 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`, { status: 303 });

  const { data: profile } = await supabase
    .from("profiles").select("stripe_account_id").eq("id", user.id).single();

  let accountId = profile?.stripe_account_id as string | null;
  try {
    if (!accountId) {
      accountId = await createConnectAccount(user.email ?? "");
      await supabase.from("profiles").update({ stripe_account_id: accountId }).eq("id", user.id);
    }
    const link = await createAccountLink(
      accountId,
      `${origin}/produtor/financeiro?refresh=1`,
      `${origin}/produtor/financeiro?refresh=1`
    );
    return NextResponse.redirect(link, { status: 303 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.redirect(`${origin}/produtor/financeiro?error=${encodeURIComponent(msg)}`, { status: 303 });
  }
}
