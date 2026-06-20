# Seravie Campo — O que falta para concluir o projeto

> Frete dinâmico: CONCLUÍDO (haversine no checkout, incluso no total, 80% entregador / 20% plataforma, sem 'frete grátis').
>
> Estado atual: app funcional ponta a ponta (4 perfis, pedidos, frete dinâmico, comprovantes de saída/entrega, disputas, chat de suporte, IA estruturada, termos assinados, multi-país). Type-check limpo. Falta ativar chaves e endurecer para produção.

## 0) Ativação imediata (chaves — combinado p/ amanhã)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (uploads 100%).
- [ ] `AI_API_KEY` (+ `AI_BASE_URL`, `AI_MODEL`) — IA Rural.
- [ ] Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` + 7 price IDs (produtor/cliente/entregador).

## 1) SEGURANÇA
- [ ] Reativar "Confirm email" + SMTP próprio em produção (hoje desligado p/ teste).
- [ ] Ligar proteção de senha vazada (Supabase Auth) e revisar advisors restantes (security + performance).
- [ ] Tornar PRIVADOS os buckets de comprovante/assinatura (hoje vão para `media` público); servir via signed URL.
- [ ] KYC real de documento (provedor de visão/OCR) — hoje é heurística anti-papel-branco.
- [ ] Verificação orofacial com liveness real (hoje é captura simples).
- [ ] Rate limiting e limites de tamanho/quantidade nas rotas `/api/upload` e `/api/ia` (anti-abuso).
- [ ] Moderação de conteúdo (feed, fotos) — denúncia + filtro.
- [ ] LGPD/GDPR: consentimento, exportação e exclusão de conta, política de retenção de dados.
- [ ] Auditoria/logs de ações sensíveis (admin, reembolsos, mudança de papel).
- [ ] Headers de segurança/CSP no Cloudflare; rotação de secrets; backups (Supabase PITR).
- [ ] Revisar RLS de TODAS as tabelas novas (disputes, posts, reservas, termos, suporte) com testes de isolamento.

## 2) BACKEND
- [ ] Stripe completo: checkout real do pedido (hoje só confirma), split/transfer p/ produtor e entregador, repasse conforme `payout_mode`, reembolso real na disputa, cancelar assinatura no Stripe, webhook idempotente.
- [ ] Notificações: e-mail/push/WhatsApp (novo pedido, mudança de status, nova mensagem de suporte).
- [ ] Realtime de verdade (Supabase Realtime) p/ chat e status do pedido (hoje é polling 4s).
- [ ] Geocoding de endereço (endereço → lat/lng) p/ frete mais preciso (hoje usa GPS do perfil).
- [ ] Jobs agendados: encerrar degustação, expirar reservas, fechar repasses mensais.
- [ ] Tipos gerados do banco (`supabase gen types`) p/ tipagem forte.
- [ ] Tratamento de erros consistente nas server actions.

## 3) INFRA / DEVOPS
- [ ] Secrets no Cloudflare (item 0).
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
- [ ] Carrossel de várias fotos por postagem do feed E por produto (hoje é só 1 foto). Migrar de coluna única para múltiplas imagens (tabela/coluna de array) + UI de upload múltiplo + visualizador carrossel.

## 5) FUNCIONALIDADES / NEGÓCIO (backlog)
- [ ] Apps nativos Android e iOS.
- [ ] Página pública de apresentação + CMS completo (público + os 3 painéis) configurável no super admin.
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
