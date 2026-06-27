import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripeEnabled, createExperienceCheckout } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const form = await request.formData();
  const expId = String(form.get("experience_id") || "");
  const date = String(form.get("date") || "");
  const time = String(form.get("time") || "");
  const note = String(form.get("note") || "").trim() || null;
  let people = Number(form.get("people") || 1);

  const back = `${origin}/experiencias/${expId}`;
  if (!stripeEnabled()) return NextResponse.redirect(`${back}?error=${encodeURIComponent("Pagamentos em configuração.")}`, { status: 303 });
  if (!expId || !date) return NextResponse.redirect(`${back}?error=${encodeURIComponent("Escolha a data da experiência.")}`, { status: 303 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?next=/experiencias/${expId}`, { status: 303 });

  const { data: exp } = await supabase
    .from("experiences").select("id, producer_id, title, price_cents, currency, capacity, active, archived")
    .eq("id", expId).maybeSingle();
  if (!exp || !exp.active || exp.archived) return NextResponse.redirect(`${back}?error=${encodeURIComponent("Experiência indisponível.")}`, { status: 303 });

  people = Math.max(1, Math.min(Number(exp.capacity) || 1, people || 1));
  const total = (exp.price_cents as number) * people;
  const currency = (exp.currency as string) || "BRL";

  const { data: booking, error } = await supabase.from("experience_bookings").insert({
    experience_id: exp.id,
    producer_id: exp.producer_id,
    customer_id: user.id,
    date,
    time,
    people,
    total_cents: total,
    currency,
    note,
  }).select("id").single();
  if (error || !booking) return NextResponse.redirect(`${back}?error=${encodeURIComponent(error?.message || "Falha ao criar a reserva.")}`, { status: 303 });

  try {
    const url = await createExperienceCheckout({
      amountCents: total,
      currency,
      bookingId: booking.id as string,
      description: `Experiência: ${exp.title}`,
      customerEmail: user.email ?? "",
      successUrl: `${back}?ok=1`,
      cancelUrl: `${back}?canceled=1`,
    });
    return NextResponse.redirect(url, { status: 303 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.redirect(`${back}?error=${encodeURIComponent(msg)}`, { status: 303 });
  }
}
