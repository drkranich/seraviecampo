// Configuração pública do Supabase.
// A URL e a chave "anon/publishable" são PÚBLICAS por design (vão para o
// navegador e são protegidas por Row Level Security). Mantê-las como padrão
// garante que o build (ex: Cloudflare) sempre tenha valores válidos, mesmo
// sem variáveis de ambiente. NUNCA coloque a service_role key aqui.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://higwkhczomxpqmgjmczc.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZ3draGN6b214cHFtZ2ptY3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4OTM3MjksImV4cCI6MjA5NzQ2OTcyOX0.CINa-BSZVBpKf59QPViURkAW0z5zsGCXsqbotEd45E0";
