# Seravie Campo — Pendências para o final do projeto

Itens deixados conscientemente para a reta final (não bloqueiam o desenvolvimento atual).

## Infra / Produção
- [ ] **Reativar "Confirm email"** no Supabase Auth + configurar **SMTP próprio**
      (SendGrid/Resend) para escalar e-mails. Foi desligado na fase de teste para
      evitar o "email rate limit exceeded" do SMTP nativo do Supabase.
- [ ] **Bug do upload de imagem (RLS "new row violates row-level security policy")**
      — investigar a fundo a entrega do token de sessão no Storage. As policies
      estão corretas (validado por simulação). Afeta avatar, capa e foto de produto.
      Plano B: usar a service_role key no upload do servidor.
- [ ] **Stripe**: plugar as chaves reais (Connect + assinaturas) como secrets na
      Cloudflare e criar os price IDs no painel do Stripe.
- [ ] **Passkey/WebAuthn**: atualizar RP ID para `seraviecampo.com` e Origins para
      `https://seraviecampo.com` / `https://www.seraviecampo.com`.
- [ ] Reverter a conta de teste para o papel desejado quando necessário
      (hoje `helvokhelvok@gmail.com` está como super_admin).

## GPS (em fases)
- [ ] **Fase 1** — captura de localização (API de geolocalização do navegador),
      colunas lat/lng no perfil, "produtores próximos" por distância (Haversine).
- [ ] **Fase 2** — mapa visual com Leaflet + OpenStreetMap (sem chave), geofencing.
- [ ] **Fase 3** — rastreamento ao vivo do entregador (Supabase Realtime) +
      comprovante por foto com geolocalização. Opcional: mapa premium (Mapbox/Google).

## Diferenciais do projeto (roadmap)
- [ ] Assinatura recorrente de cestas (Clube Gourmet de verdade)
- [ ] Reserva de colheita (compra antes de colher)
- [ ] Feed social ("José colheu os morangos")
- [ ] IA Rural (sugestões de produção/demanda)
- [ ] Economia Circular Local (impacto na comunidade) no Seravie Hub

## Atualização
- [x] Confirm email desligado (fase de teste) — **religar + SMTP próprio em produção**.
- [x] Trava de documento (KYC) ativa; contas de teste atuais isentas (`kyc_exempt`).
- [ ] Stripe: além dos planos do produtor, configurar price IDs de **cliente** e **entregador**:
      `STRIPE_PRICE_CLI_SABOR`, `STRIPE_PRICE_CLI_GOURMET`, `STRIPE_PRICE_ENT_PRO`, `STRIPE_PRICE_ENT_PREMIUM`.
- [~] Bug do upload de imagem: corrigido (upload via navegador). Confirmar em produção.

## Backlog grande (solicitado em 20/06/2026) — priorizar por leva
### Bugs críticos do fluxo de compra
- [x] (8) RLS "new row violates row-level security policy" AINDA ocorre em: foto do usuário, capa do produtor, foto de produto, e entregador/cliente. Corrigir DEFINITIVAMENTE (investigar bucket/policy real).
- [x] (9) Etapa de PAGAMENTO final não existe: cliente faz pedido e escolhe forma de pagamento, mas não há a tela de pagar de fato. Criar a finalização de pagamento.
- [x] (5) Upload de documento (RG/CNH) aceita foto de papel em branco. Adicionar validação de que é documento oficial.

### Dinheiro / repasses
- [x] (1) Frete dinâmico por localização (estilo Uber), automático, incluso no valor final, sem prejuízo a produtor/cliente, beneficiando o entregador. REMOVER toda menção a "frete grátis".
- [x] (2) Super admin: aba PAGAMENTOS — ver valores de entregadores pagos à plataforma (% de entrega e/ou assinatura), valores do produtor (mensalidade), valores de cada cliente.
- [x] (6) Produtor escolhe receber: (a) acumulado mensal já com mensalidade+comissão descontadas, ou (b) no dia útil seguinte à compra. Criar COMISSÃO em todos os planos pagos do produtor. NENHUM plano do produtor é gratuito.

### Super admin / dados
- [x] (4) Área Usuários: ver e-mail, cidade, IP, dados sensíveis (identidade), comprovantes e orofacial — inclusive dos CLIENTES (hoje não aparecem).
- [x] (terms) Termos de cancelamento assinados: aceite no cadastro com IP, dispositivo, país, hora; PDF; super admin vê aceites e edita os termos versionados.

### Alcance / planos
- [x] (3) Internacionalizar: Europa, América Latina e EUA; GPS e moeda adequados a cada país (não limitar ao Brasil).
- [x] (10) Plano "Avulso Grátis" do cliente = degustação de 15 dias / 5 compras; depois exige plano pago.

### Futuro (anotado)
- [ ] (7) Apps nativos Android e iOS.
- [ ] (11) Página pública de apresentação + CMS completo (público + os 3 painéis), configurável no super admin.
- [ ] (12) Aba INBOX no super admin para mensagens de usuários, produtores, entregadores e leads (Google, redes sociais etc.).

## Notas técnicas (20/06)
- Upload corrigido: agora passa por `/api/upload` (rota de servidor autenticada via cookie). Opcional p/ robustez máxima: definir `SUPABASE_SERVICE_ROLE_KEY` como secret no Cloudflare (a rota usa automaticamente se existir; NUNCA commitar essa chave).
- Validação de documento é heurística (rejeita imagem em branco/uniforme). Verificação oficial de identidade (KYC real) exige provedor de visão — anotado para o futuro.

## Notas (frete/pagamentos)
- Frete calculado no checkout por distância (haversine produtor↔cliente). Tarifa: base R$5 + R$1,20/km, mín. R$6 (R$9 sem GPS). Plataforma fica com 20% do frete; o resto é do entregador.
- Planos do produtor agora são todos pagos com comissão (Campo 12%, Gourmet 8%, Premium 5%). Adicionar `STRIPE_PRICE_CAMPO` no Stripe.
- Produtor escolhe repasse (mensal x dia útil seguinte) em Financeiro. O processamento real do repasse/cobrança depende da ativação do Stripe.

## Notas (dados admin + termos)
- Super admin: Usuários agora lista e-mail e tem página de detalhe com IP/país/dispositivo, documento (RG/CNH) e orofacial (selfie) via link assinado — inclusive clientes.
- Aba Termos: edita a política (versionada) e lista todos os aceites; cada aceite gera um 'documento assinado' imprimível (PDF pelo navegador) com IP, país, dispositivo, data/hora.
- IP/país dependem dos headers do Cloudflare (cf-connecting-ip / cf-ipcountry) — funcionam em produção; em localhost podem vir vazios.
- E-mail vem de auth.users via função SECURITY DEFINER admin_emails() (só super_admin).

## Notas (i18n + degustação)
- País e moeda agora ficam no perfil (cadastro, conta do cliente e perfil do produtor); lista cobre Brasil, América Latina, Europa e EUA. GPS já é global (lat/lng + haversine).
- Helper `formatMoney(cents, currency, locale)` criado. Próximo passo incremental: trocar `formatBRL` por `formatMoney` nas telas onde se conhece a moeda da entidade (produto/produtor/pedido) — base já pronta.
- Degustação do cliente: plano Avulso = 15 dias OU 5 compras; o checkout bloqueia após o limite e direciona para assinar um plano pago. Banner de status na aba Assinatura.

## Ainda na fila (futuro)
- (7) Apps nativos Android/iOS · (11) Página pública + CMS completo · (12) Inbox de mensagens/leads no super admin.

## Correção definitiva do upload (20/06)
- Causa raiz: o cliente cookie no worker não anexava o JWT ao Storage (caía como anon -> RLS bloqueava).
- Solução: a rota /api/upload agora usa `createAuthedClient(token)` (opção `accessToken`), que anexa o JWT do usuário a TODAS as requisições, inclusive Storage. RLS reconhece `auth.uid()` e a policy `<uid>/...` passa. Vale para foto de usuário, capa, produto, feed e documentos. (Service-role continua opcional como camada extra.)

## Conexão produtor ↔ entregador
- Produtor (em "Pedidos"), no status "Em preparo": "Despachar p/ entregador" (entra no pool) OU "Vou entregar eu mesmo".
- Se despachado e ninguém aceitar: botão "Assumir a entrega" no lado do produtor.
- Entregador vê o pool de entregas disponíveis (exceto as próprias do produtor), aceita e marca como entregue. Frete (delivery_fee) é o ganho do entregador.

## Cancelamento de assinatura (20/06)
- Botão "Cancelar assinatura" nas 3 áreas (cliente, produtor, entregador), visível quando há plano pago ativo.
- Regra: cancela a renovação (cancel_at_period_end=true). O mês atual é cobrado integral (sem pró-rata/reembolso) e nada é cobrado no próximo ciclo; acesso segue até o fim do período.
- Quando o Stripe for ativado: a ação deve também chamar a API do Stripe para cancelar no fim do período (hoje só marca no banco).

## Comprovantes, chat e IA (20/06)
- Registro de SAÍDA (produtor): ao despachar/assumir, captura foto + assinatura digital + data/hora (dispatch_*). Substitui os botões antigos.
- Comprovante de ENTREGA (entregador e produtor auto-entrega): foto da assinatura do cliente + foto do produto + data/hora (delivery_*). Visível ao cliente em Meus Pedidos.
- Chat de suporte: aba "Suporte" para cliente/produtor/entregador + "Inbox" no super admin. Atualiza a cada 4s (quase tempo real). Tabela support_messages com RLS.
- IA Rural (produtor): aba /produtor/ia + rota /api/ia. Provedor compatível com OpenAI. ATIVAR com secrets no Cloudflare: AI_API_KEY (obrigatória), AI_BASE_URL e AI_MODEL (opcionais). Sem a chave, a interface avisa que está inativa.
- Lembrete: uploads de comprovante usam a mesma rota /api/upload (recomendado ativar SUPABASE_SERVICE_ROLE_KEY como secret p/ 100% de garantia).

## ⭐ CONFIGURAÇÃO DE AMANHÃ — chaves/APIs (tudo já codado, só faltam os secrets)
Adicionar como **Secrets** no Cloudflare (Workers & Pages → projeto seraviecampo → Settings → Variables and Secrets) e no `.env.local` para teste. NUNCA commitar os valores.

### 1) Supabase (uploads 100% à prova de RLS)
- `SUPABASE_SERVICE_ROLE_KEY` = chave service_role (Supabase → Settings → API).

### 2) IA Rural (assistente do produtor)
- `AI_API_KEY` = chave do provedor (OpenAI-compatível).
- `AI_BASE_URL` (opcional, padrão https://api.openai.com/v1) · `AI_MODEL` (opcional, padrão gpt-4o-mini).

### 3) Stripe — pagamentos de produtor, entregador e cliente
Objetivo: cliente paga; produtor e entregador recebem; plataforma fica com mensalidade + comissão + fatia do frete.
- Chaves base: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Price IDs das assinaturas (criar produtos/preços no painel Stripe e colar):
  - Produtor: `STRIPE_PRICE_CAMPO`, `STRIPE_PRICE_GOURMET`, `STRIPE_PRICE_PREMIUM`
  - Cliente: `STRIPE_PRICE_CLI_SABOR`, `STRIPE_PRICE_CLI_GOURMET`
  - Entregador: `STRIPE_PRICE_ENT_PRO`, `STRIPE_PRICE_ENT_PREMIUM`
- Stripe Connect (já há /api/stripe/connect): onboarding de produtor e entregador para receberem repasses.
- A fazer no código quando ativarmos (estrutura já existe, falta plugar valores reais):
  - Checkout real do pedido (hoje a tela de pagamento só confirma) → cobrar via Stripe e usar split/transfer para produtor e entregador.
  - Repasse do produtor conforme `payout_mode` (mensal x dia útil seguinte).
  - Cancelar assinatura também no Stripe (cancel_at_period_end) — hoje só marca no banco.
  - Reembolso real ao resolver disputa (hoje só marca payment_status='reembolsado').
- Webhook do Stripe → atualizar status de assinatura/pagamento no banco.

> Estado atual: app inteiro funciona sem essas chaves (modo "em configuração"). Ao adicionar os secrets e plugar os valores, os pagamentos passam a rodar de verdade.

## Anotado p/ amanhã/futuro (20/06, reforço)
- [x] Frete dinâmico por localização — JÁ FEITO (haversine no checkout; incluso no total; 80% entregador / 20% plataforma; sem frete grátis).
- [ ] Página pública de apresentação da Seravie Campo.
- [ ] CMS completo de edição: da página pública E dos 3 painéis (cliente, produtor, entregador); as configurações dos dois CMSs ficam no super admin.
- [ ] Versão mobile nativa iOS e Android (futuro).
- [ ] Múltiplas fotos (carrossel) por postagem do feed e por produto — hoje só 1 foto. Exige guardar várias URLs (array/tabela), upload múltiplo e visualizador carrossel.

## Segurança (hoje, 21/06) — feito
- [x] Comprovantes (assinatura/foto de saída e entrega) movidos para bucket PRIVADO `proofs` com RLS por participante do pedido; exibição via URL assinada.
- [x] `admin_emails()` sem execução anônima (revoke anon/public; só authenticated, e ainda filtra por super_admin).
- [x] RLS conferida em todas as 13 tabelas (todas com políticas).
### Falta (toggles no painel — sua ação)
- [ ] Supabase Auth → ativar "Leaked password protection".
- [ ] Supabase Auth → reativar "Confirm email" + configurar SMTP próprio (p/ produção).
### Tabelas/edge p/ futuro
- [ ] Novas tabelas conforme features: product_images/post_images (carrossel), reviews, coupons, cms_pages/blocks, notifications, payouts (Stripe).
- [ ] Edge Functions / cron só quando: webhook Stripe e jobs agendados (expirar degustação/reservas, repasses).

## Stripe (hoje, 21/06) — feito (falta só as chaves)
- [x] Pagamento do pedido via Stripe Checkout (/api/stripe/pay-order); cliente paga cartão/Pix. Sem chave, segue confirmação local.
- [x] Webhook real (/api/stripe/webhook): confirma pagamento do pedido (payment/payment_intent) e ativa/cancela assinatura. Usa SUPABASE_SERVICE_ROLE_KEY.
- [x] Assinaturas roteadas por papel (cliente/produtor/entregador).
- [ ] FASE 2 (precisa Connect + chaves p/ testar): split/transfer do valor para produtor e entregador; onboarding Connect do entregador; repasse conforme payout_mode; reembolso real ao resolver disputa.
- Chaves p/ ativar: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY, os 7 price IDs, e SUPABASE_SERVICE_ROLE_KEY (p/ o webhook escrever).
- Webhook no painel Stripe → endpoint: https://seraviecampo.com/api/stripe/webhook (eventos: checkout.session.completed, payment_intent.succeeded, customer.subscription.updated, customer.subscription.deleted).

## CMS interno — planos editáveis pelo super admin (anotado 21/06)
- No painel do super admin, eu (admin) poderei EDITAR os valores e detalhes de cada plano (produtor, cliente, entregador) pela tela, e a mudança é renderizada para todos os usuários — sem mexer no código.
- Implementação prevista: mover os planos de `lib/plans.ts` (hardcoded) para uma tabela no banco (ex.: `plans`: id, role, nome, tagline, price_cents, commission_pct, features[], stripe_price_id, ativo). O app passa a ler do banco; o super admin edita via CMS.
- Integração Stripe: ao alterar o preço, criar um NOVO price no Stripe (preços são imutáveis) e atualizar o `stripe_price_id` do plano — idealmente via API direto pela tela (com a chave já configurada), para não depender de env/redeploy.
- Faz parte do CMS interno geral (que também edita: página pública + textos/imagens dos 3 painéis). Config dos dois CMSs fica no super admin.

## Conta bancária para receber (Stripe Connect) — anotado 21/06
- Produtor E entregador devem cadastrar a conta bancária via onboarding do Stripe Connect para receberem os repasses.
- Estado: o produtor já tem o fluxo (/api/stripe/connect → Financeiro). FALTA:
  - Replicar o onboarding Connect para o ENTREGADOR (rota + botão na área dele, ex.: Configurações/Ganhos).
  - A rota /api/stripe/connect hoje é fixa no produtor (URLs /produtor/financeiro); generalizar por papel.
  - Bloquear repasse/saque enquanto charges_enabled/payouts_enabled = false (conta incompleta).
  - Fase 2 dos pagamentos: usar essas contas para o split/transfer (frete → entregador; venda menos comissão → produtor).
