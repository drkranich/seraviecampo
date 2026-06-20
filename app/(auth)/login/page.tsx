import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type UserRole } from "@/lib/roles";
import { getRequestInfo } from "@/lib/request-info";
import { PasskeyButton } from "@/components/PasskeyButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string; check_email?: string }>;
}) {
  const { error, check_email } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email")).trim().toLowerCase();
    const password = String(formData.get("password"));
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = /confirm/i.test(error.message)
        ? "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada (e o spam)."
        : "E-mail ou senha inválidos.";
      redirect(`/login?error=${encodeURIComponent(msg)}`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .single();

    const info = await getRequestInfo();
    await supabase.from("profiles")
      .update({ last_ip: info.ip, last_country: info.country, last_device: info.device })
      .eq("id", user!.id);

    const role = (profile?.role ?? "cliente") as UserRole;
    redirect(ROLE_HOME[role]);
  }

  return (
    <>
      <h1 className="font-serif text-2xl text-forest-100">Bem-vindo de volta</h1>
      <p className="mt-1 text-sm text-stone-400">Acesse sua conta Seravie Campo</p>

      {check_email && (
        <div className="mt-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">
          Conta criada! Confirme seu e-mail pelo link que enviamos e depois entre aqui.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <form action={login} className="mt-6 space-y-4">
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
            className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold"
            placeholder="********"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-gold py-2.5 font-medium text-campo-bg transition hover:bg-gold-light"
        >
          Entrar
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-stone-600">
        <span className="h-px flex-1 bg-campo-border" /> ou <span className="h-px flex-1 bg-campo-border" />
      </div>

      <PasskeyButton />

      <p className="mt-6 text-center text-sm text-stone-400">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="text-gold hover:underline">
          Cadastre-se
        </Link>
      </p>
    </>
  );
}
