# 🌿 Seravie Campo

**Sistema Operacional da Economia Local** — conectando produtores rurais, consumidores, entregadores e o poder público dentro de um único ecossistema digital.

> Seravie Campo não é um marketplace. É a infraestrutura digital que conecta agro, gastronomia, turismo, logística, assinaturas e comércio local de uma região.

## Visão

O pequeno produtor não sofre apenas para vender — ele não possui canal digital, catálogo organizado, logística, previsão de demanda nem CRM. O consumidor de cidades pequenas não sabe quem produz nem onde comprar produtos frescos. O Seravie Campo resolve os dois lados criando uma **rede econômica regional**.

## Os 4 perfis

| Perfil | Experiência | Essência |
| --- | --- | --- |
| **Seravie OS (Super Admin)** | Dashboard executivo, mapa nacional, aprovações estilo Stripe, moderação, inteligência estratégica | O cérebro do ecossistema |
| **Produtor Rural** | Minha Produção, calendário de safra, produtos com história, pedidos, IA Rural, turismo rural | Vender mais, perder menos tempo |
| **Cliente Final** | Home cinematográfica, descobertas, perfil do produtor, Clube Gourmet, feed social | Um clube gourmet, não um marketplace |
| **Entregador** | Rotas, ganhos, entregas, GPS, comprovante por foto | Economia logística local |

## Posicionamento jurídico

A Seravie Campo nasce como **plataforma de intermediação tecnológica** (modelo Airbnb/Uber/iFood): conecta usuários, disponibiliza tecnologia, catálogo, comunicação, geolocalização, reputação e ferramentas — **não** produz, armazena, transporta, embala nem garante qualidade. Aceite obrigatório de termos por perfil, verificação forte e Central de Conflitos fazem parte da arquitetura.

## Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (Postgres + Auth + Storage + RLS)
- **Deploy:** Cloudflare Workers (OpenNext)

## Rodando localmente

\`\`\`bash
npm install
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm run dev
\`\`\`

Acesse http://localhost:3000

## Banco de dados (Supabase)

As migrations ficam em \`supabase/migrations/\`. A integração GitHub do Supabase sincroniza o schema com o banco de produção ao fazer merge no branch \`main\`.

## Roadmap por fases

1. **Fase 1** — Marketplace local: catálogo, pedidos, entregas
2. **Fase 2** — Assinaturas, logística compartilhada, PWA
3. **Fase 3** — ERP Rural: financeiro, emissão fiscal, CRM
4. **Fase 4** — Crédito rural, seguro agrícola, insumos, cooperativas
5. **Fase 5** — IA de previsão de demanda, plantio e preços

---

© 2026 Seravie Campo — Conectando campo e cidade com produtos extraordinários.

---

## Autenticação (Supabase)

Fluxo implementado com `@supabase/ssr`:

- `/signup` — cadastro com escolha de papel (cliente, produtor, entregador) e aceite obrigatório de termos
- `/login` — acesso, com redirecionamento automático para o dashboard do papel
- `/auth/callback` — troca de código (confirmação de e-mail / OAuth)
- `/auth/signout` — encerrar sessão
- `middleware.ts` — protege `/admin`, `/produtor`, `/cliente`, `/entregador`

Cada perfil tem seu dashboard guardado por papel (`lib/guard.ts`). O papel `super_admin` é interno (atribuído manualmente no banco), não aparece no cadastro público.

### Configuração no painel Supabase

Em **Authentication > URL Configuration**, adicione as Redirect URLs:

- `http://localhost:3000/auth/callback` (dev)
- `https://seraviecampo.com/auth/callback` (produção)
- `https://www.seraviecampo.com/auth/callback` (alias)
- `https://seraviecampo.com/**` e `https://www.seraviecampo.com/**` (painéis e rotas do app)

Para promover alguém a admin, no SQL Editor:

```sql
update public.profiles set role = 'super_admin' where id = 'UUID-DO-USUARIO';
```

## Deploy na Cloudflare (OpenNext)

O projeto usa o adaptador **`@opennextjs/cloudflare`** (Cloudflare Workers, runtime Node.js).

Domínio oficial de produção: `https://seraviecampo.com`.

```bash
# preview local no runtime do Workers
npm run preview

# deploy manual
npm run deploy
```

Para CI/CD via Git, conecte o repositório em **Cloudflare > Workers & Pages > Create > Workers > Connect to Git**. Defina as variáveis de ambiente no painel da Cloudflare:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> Variáveis `NEXT_PUBLIC_*` são embutidas no build — configure-as antes do build na Cloudflare.
