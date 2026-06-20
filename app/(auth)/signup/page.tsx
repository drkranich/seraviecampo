import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, SIGNUP_ROLES, type UserRole } from "@/lib/roles";
import { getRequestInfo } from "@/lib/request-info";
import { countryOf } from "@/lib/countries";
import { CountrySelect } from "@/components/CountrySelect";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function signup(formData: FormData) {
    "use server";
    const fullName = String(formData.get("full_name"));
    const email = String(formData.get("email")).trim().toLowerCase();
    const password = String(formData.get("password"));
    const role = String(formData.get("role")) as UserRole;
    const country = String(formData.get("country") || "BR");
    const terms = formData.get("terms");

    if (!terms) {
      redirect(`/signup?error=${encodeURIComponent("É preciso aceitar os termos")}`);
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (error) {
      redirect(`/signup?error=${encodeURIComponent(error.message)}`);
    }

    // Sem sessão = o projeto exige confirmação de e-mail antes de entrar
    if (!data.session) {
      redirect("/login?check_email=1");
    }

    // Sessão criada: registra o aceite dos termos (com IP/país/dispositivo) e segue
    if (data.user) {
      const info = await getRequestInfo();
      await supabase
        .from("profiles")
        .update({
          terms_accepted_at: new Date().toISOString(),
          last_ip: info.ip, last_country: info.country, last_device: info.device,
          country, currency: countryOf(country).currency,
        })
        .eq("id", data.user.id);

      const { data: terms } = await supabase
        .from("legal_terms").select("slug, content, version").eq("slug", "cancelamento").single();
      if (terms) {
        await supabase.from("term_acceptances").insert({
          user_id: data.user.id,
          terms_slug: terms.slug,
          terms_version: terms.version,
          content_snapshot: terms.content,
          ip: info.ip, country: info.country, device: info.device, user_agent: info.userAgent,
          full_name: fullName, email,
        });
      }
    }

    redirect("/verificacao");
  }

  return (
    <>
      <h1 className="font-serif text-2xl text-forest-100">Criar conta</h1>
      <p className="mt-1 text-sm text-stone-400">Junte-se ao ecossistema Seravie Campo</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <form action={signup} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm text-stone-300">Nome completo</label>
          <input
            name="full_name"
            required
            className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold"
            placeholder="Seu nome"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-stone-300">E-mail</label>
          <input
            name="email"
            type="email"
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold"
            placeholder="voce@email.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-stone-300">Senha</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold"
            placeholder="mínimo 6 caracteres"
          />
        </div>

        <CountrySelect />

        <fieldset>
          <legend className="mb-2 block text-sm text-stone-300">Eu sou</legend>
          <div className="space-y-2">
            {SIGNUP_ROLES.map((r, i) => (
              <label
                key={r.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-campo-border bg-campo-bg p-3 transition hover:border-gold/50 has-[:checked]:border-gold has-[:checked]:bg-forest-900/40"
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  defaultChecked={i === 0}
                  className="mt-1 accent-gold"
                />
                <span>
                  <span className="block text-sm font-medium text-forest-100">{r.label}</span>
                  <span className="block text-xs text-stone-400">{r.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-start gap-2 text-xs text-stone-400">
          <input type="checkbox" name="terms" className="mt-0.5 accent-gold" />
          <span>
            Li e aceito os Termos de Uso, a Política de Privacidade e o{" "}
            <strong>Termo de Cancelamento e Políticas de Compra</strong> (cancelamento em até 24h após a compra; sem frete grátis).
            Entendo que a Seravie Campo conecta usuários e que meu aceite é registrado com data, IP, país e dispositivo.
          </span>
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-gold py-2.5 font-medium text-campo-bg transition hover:bg-gold-light"
        >
          Criar conta
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-400">
        Já tem conta?{" "}
        <Link href="/login" className="text-gold hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
