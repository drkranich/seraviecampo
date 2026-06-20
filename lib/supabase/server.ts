import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Cliente Supabase para uso no servidor (Server Components / Route Handlers)
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Chamado de um Server Component - ignorado se houver middleware.
        }
      },
    },
  });
}

// Cliente que injeta o token de acesso do usuário via opção `accessToken`.
// Assim TODAS as requisições (Postgres e Storage) chegam autenticadas e a RLS
// reconhece auth.uid(). Use apenas para dados/storage — não tem .auth.
export function createAuthedClient(accessToken: string) {
  return createRawClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    accessToken: async () => accessToken,
  });
}
