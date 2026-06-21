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
- [~] Stripe: checkout REAL do pedido FEITO (/api/stripe/pay-order), webhook confirma pagamento e ativa/cancela assinatura, roteamento por papel. FALTA (fase 2): split/transfer p/ produtor+entregador (helper createTransfer já pronto) — disparar no pagamento (produtor, se payout imediato) e na entrega concluída (entregador, frete), gated em conta conectada; repasse mensal por job; reembolso real na disputa.
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
- [ ] Página pública de apresentação + CMS completo (público + os 3 painéis) configurável no super admin — INCLUI editar valores/detalhes dos planos pela tela (planos saem de lib/plans.ts para o banco; ao mudar preço, gerar novo price no Stripe e atualizar o stripe_price_id).
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

## IA Rural — cobrança por uso (à parte do plano) — anotado 21/06
- A IA Rural é um add-on PAGO POR USO, independente do plano da plataforma. Já está deixado claro na aba IA Rural.
- A construir: cadastro de cartão do produtor específico para a IA (Stripe), medição de uso (tokens/consultas), cobrança por consumo (usage-based / metered billing no Stripe), e limite/trava quando sem cartão ou sem saldo. Registrar consumo por produtor numa tabela (ex.: ai_usage).
