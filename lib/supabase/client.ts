import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

// Cliente Supabase para uso no navegador (Client Components).
// Passkey (WebAuthn) é experimental e precisa ser habilitado aqui.
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { experimental: { passkey: true } },
  });
}
