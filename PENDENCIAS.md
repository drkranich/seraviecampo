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
