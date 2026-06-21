# Seravie Campo — O que falta para concluir o projeto

> Frete dinâmico: CONCLUÍDO (haversine no checkout, incluso no total, 80% entregador / 20% plataforma, sem 'frete grátis').
>
> Estado atual: app funcional ponta a ponta (4 perfis, pedidos, frete dinâmico, comprovantes de saída/entrega, disputas, chat de suporte, IA estruturada, termos assinados, multi-país). Type-check limpo. Falta ativar chaves e endurecer para produção.

## 0) Ativação imediata (chaves — combinado p/ amanhã)
- [x] `SUPABASE_SERVICE_ROLE_KEY` (uploads 100%).
- [x] `AI_API_KEY` (+ `AI_BASE_URL`, `AI_MODEL`) — IA Rural (Gemini). Ativa; só limitada pela cota do plano Google.
- [x] Stripe: chaves + 7 price IDs + webhook configurados no Cloudflare.

## 1) SEGURANÇA
- [x] "Confirm email" + SMTP (Resend) configurados.
- [x] Proteção de senha vazada ligada. (Falta: revisar advisors de performance ao final.)
- [x] Comprovantes/assinaturas em bucket PRIVADO `proofs` (acesso por participante do pedido + admin, via signed URL). FEITO.
- [ ] KYC real de documento (provedor de visão/OCR) — hoje é heurística anti-papel-branco.
- [ ] Verificação orofacial com liveness real (hoje é captura simples).
- [ ] Rate limiting e limites de tamanho/quantidade nas rotas `/api/upload` e `/api/ia` (anti-abuso).
- [ ] Moderação de conteúdo (feed, fotos) — denúncia + filtro.
- [ ] LGPD/GDPR: consentimento, exportação e exclusão de conta, política de retenção de dados.
- [ ] Auditoria/logs de ações sensíveis (admin, reembolsos, mudança de papel).
- [ ] Headers de segurança/CSP no Cloudflare; rotação de secrets; backups (Supabase PITR).
- [x] RLS revisada: 13 tabelas com RLS + políticas; admin_emails sem acesso anônimo. (Falta: testes de isolamento automatizados.)

## 2) BACKEND
- [x] Onboarding Stripe Connect também para o ENTREGADOR (em Configurações) + rota /api/stripe/connect generalizada por papel + status (charges_enabled). FEITO.
- [~] Stripe: checkout REAL do pedido FEITO (/api/stripe/pay-order), webhook confirma pagamento e ativa/cancela assinatura, roteamento por papel. [x] split/transfer FEITO: produtor (produtos−comissão) no pagamento se payout imediato; entregador/auto-entrega (frete−taxa) na entrega concluída; flags producer_paid_out/courier_paid_out evitam duplicidade. FALTA: repasse MENSAL por job agendado (produtores em modo 'mensal'); reembolso real (transfer reversal) na disputa.
- [ ] Notificações: e-mail/push/WhatsApp (novo pedido, mudança de status, nova mensagem de suporte).
- [ ] Realtime de verdade (Supabase Realtime) p/ chat e status do pedido (hoje é polling 4s).
- [ ] Geocoding de endereço (endereço → lat/lng) p/ frete mais preciso (hoje usa GPS do perfil).
- [ ] Jobs agendados: encerrar degustação, expirar reservas, fechar repasses mensais.
- [ ] Tipos gerados do banco (`supabase gen types`) p/ tipagem forte.
- [ ] Tratamento de erros consistente nas server actions.

## 3) INFRA / DEVOPS
- [x] Secrets no Cloudflare (item 0).
- [ ] Domínio próprio + DNS + SSL; ajustar URLs de redirect de auth e o RP ID do passkey p/ o domínio.
- [ ] Ambientes separados (staging x produção) + previews por branch.
- [ ] CI no PR: type-check + lint + build (resolver o aviso de build do GitHub).
- [ ] Monitoramento de erros (ex: Sentry) e analytics de uso.
- [ ] Otimização de imagens (resize no upload / CDN) e limpeza de arquivos órfãos no Storage.

## 4) FRONTEND / UX
- [ ] Trocar `<img>` por `next/image` (performance/LCP).
- [ ] Estados de carregamento (loading.tsx/skeletons) e de erro (error.tsx).
- [ ] Acessibilidade: foco/teclado nos dropdowns, contraste, labels, leitores de tela.
- [ ] Mobile: sidebar vira menu hambúrguer; revisar todas as telas no celular.
- [ ] SEO/metadata, Open Graph, favicon e PWA (manifest) p/ "instalar" no celular.
- [ ] i18n real: traduzir a interface conforme o idioma do país (hoje tudo em pt-BR).
- [ ] Mostrar preços na moeda do usuário em TODAS as telas (`formatMoney`) — base já pronta.
- [ ] Máscaras de formulário (telefone, placa, preço) e validação no cliente.
- [x] Carrossel de várias fotos no feed E nos produtos: coluna images[] + upload múltiplo + visualizador carrossel (detalhe do produto e feed dos dois lados). FEITO.

## 5) FUNCIONALIDADES / NEGÓCIO (backlog)
- [ ] Apps nativos Android e iOS. (PROJETO À PARTE — outro dia.)
- [x] CMS completo: (1) página pública editável (/admin/site); (2) PLANOS editáveis no banco (/admin/planos) com geração de novo price no Stripe ao alterar o valor — todas as telas/cálculos (assinatura, comissão, checkout) leem do banco; (3) AVISOS editáveis por painel (cliente/produtor/entregador). FEITO.
- [ ] GPS fases 2/3: rastreamento da entrega em tempo real no mapa + ETA.
- [ ] Avaliações/notas (cliente avalia produtor e entregador).
- [ ] Cupons/promoções, cesta recorrente (assinatura de cesta), reserva de colheita avançada.
- [ ] Relatórios e exportação (CSV) no super admin.
- [ ] Onboarding guiado por papel.

## 6) QUALIDADE / TESTES
- [ ] Testes automatizados (unit, integração, e2e) — hoje só type-check.
- [ ] Teste de carga e de RLS (isolamento entre usuários).
- [ ] Revisão de segurança independente antes do lançamento.

## 7) LANÇAMENTO
- [ ] Revisão jurídica dos termos e políticas (cancelamento, intermediação, privacidade).
- [ ] Limpeza das contas/dados de teste e seed de demonstração.
- [ ] Plano de suporte/SLA e canais de contato.

## IA Rural — cobrança por uso (à parte do plano) — PARCIALMENTE FEITO 21/06
- A IA Rural é um add-on PAGO POR USO, independente do plano da plataforma. Já está deixado claro na aba IA Rural.
- A construir: cadastro de cartão do produtor específico para a IA (Stripe), medição de uso (tokens/consultas), cobrança por consumo (usage-based / metered billing no Stripe), e limite/trava quando sem cartão ou sem saldo. Registrar consumo por produtor numa tabela (ex.: ai_usage).

## Pagamentos — pendências (após split)
- [x] Job mensal: rota protegida /api/cron/monthly — repassa pedidos pagos não repassados (modo 'mensal') e cobra o uso da IA (off_session) dos meses fechados. FALTA: agendar o gatilho mensal (Cron Trigger/agendador externo) + reembolso real na disputa.
- [ ] Reembolso real na disputa (transfer reversal + refund) quando o super admin marcar reembolso.
- [x] IA Rural: cartão próprio (setup) + medição de uso por mês + gate (sem cartão, bloqueia). Falta só o débito mensal do acumulado.

## Receita da plataforma (mensalidade + comissão) — referência
- Mensalidade (plano do produtor/entregador): cobrada pela Stripe Billing (assinatura recorrente) no cartão do usuário → cai direto no saldo da plataforma. 100% seu, automático.
- Comissão sobre vendas: retida automaticamente no split — a plataforma recebe o total do pedido e transfere ao produtor (vendas − comissão). A comissão nunca sai da conta da plataforma.
- Modo "imediato": comissão retida no ato do pagamento. Modo "mensal": acumula e o JOB MENSAL transfere o líquido (vendas − comissão − mensalidade) ao produtor. (Job a construir.)

## ✅ CHECKLIST — Migração para domínio próprio (quando tiver)
Ao apontar o domínio definitivo (ex.: seusite.com.br) para o Worker, trocar SÓ o domínio nestes lugares (chaves/secrets continuam iguais):
- [ ] cron-job.org → editar a URL do cronjob: https://SEUSITE/api/cron/monthly?key=CRON_SECRET (ou header Authorization).
- [ ] Stripe → Developers → Webhooks → editar endpoint para https://SEUSITE/api/stripe/webhook.
- [ ] Stripe → Connect/branding e URLs de retorno usam o origin da requisição (automático) — conferir após migrar.
- [ ] Supabase → Auth → URL Configuration → Site URL = https://SEUSITE e Redirect URLs (ex.: https://SEUSITE/auth/callback).
- [ ] Passkey/WebAuthn → RP ID = domínio final (quando ativarmos passkeys em produção).
- [ ] Cloudflare → adicionar o domínio (Custom domain) ao Worker/Pages e validar SSL.
- [ ] Depois de validar: desativar o uso do *.workers.dev (deixar só o domínio oficial).
- Não muda: CRON_SECRET, STRIPE_*, SUPABASE_SERVICE_ROLE_KEY, AI_*, RESEND_API_KEY.
