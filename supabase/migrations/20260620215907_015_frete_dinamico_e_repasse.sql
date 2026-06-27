alter table public.profiles add column if not exists payout_mode text not null default 'mensal';

create or replace function public.checkout(p_name text, p_phone text, p_address text, p_notes text, p_payment payment_method)
returns setof uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_customer uuid := auth.uid();
  v_producer uuid;
  v_order uuid;
  v_clat double precision; v_clng double precision;
  v_plat double precision; v_plng double precision;
  v_km double precision;
  v_fee int;
  v_items int;
begin
  if v_customer is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select lat, lng into v_clat, v_clng from profiles where id = v_customer;

  for v_producer in
    select distinct p.producer_id
    from cart_items ci
    join products p on p.id = ci.product_id
    where ci.user_id = v_customer
  loop
    insert into orders (customer_id, producer_id, status, payment_method,
                        delivery_name, delivery_phone, delivery_address, delivery_notes)
    values (v_customer, v_producer, 'novo', p_payment, p_name, p_phone, p_address, p_notes)
    returning id into v_order;

    insert into order_items (order_id, product_id, product_name, unit, unit_price_cents, quantity, line_total_cents)
    select v_order, p.id, p.name, p.unit, p.price_cents, ci.quantity, (p.price_cents * ci.quantity)::int
    from cart_items ci
    join products p on p.id = ci.product_id
    where ci.user_id = v_customer and p.producer_id = v_producer;

    select lat, lng into v_plat, v_plng from profiles where id = v_producer;

    -- Frete dinâmico por distância (haversine). Sem coordenadas -> tarifa padrão.
    if v_clat is not null and v_clng is not null and v_plat is not null and v_plng is not null then
      v_km := 6371 * 2 * asin(sqrt(
        power(sin(radians(v_plat - v_clat) / 2), 2) +
        cos(radians(v_clat)) * cos(radians(v_plat)) * power(sin(radians(v_plng - v_clng) / 2), 2)
      ));
      v_fee := greatest(600, 500 + round(v_km * 120)::int);
    else
      v_fee := 900;
    end if;

    select coalesce(sum(line_total_cents), 0) into v_items from order_items where order_id = v_order;
    update orders set delivery_fee_cents = v_fee, total_cents = v_items + v_fee where id = v_order;

    return next v_order;
  end loop;

  delete from cart_items where user_id = v_customer;
end;
$function$;
