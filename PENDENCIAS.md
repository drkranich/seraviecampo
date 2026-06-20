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
- [ ] **Passkey/WebAuthn**: atualizar RP ID e Origins para o domínio definitivo
      quando houver (hoje aponta para localhost).
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
- [ ] (3) Internacionalizar: Europa, América Latina e EUA; GPS e moeda adequados a cada país (não limitar ao Brasil).
- [ ] (10) Plano "Avulso Grátis" do cliente = degustação de 15 dias / 5 compras; depois exige plano pago.

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
