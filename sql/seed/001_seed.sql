insert into public.categories (id, name, slug, sort_order)
values
  ('11111111-1111-1111-1111-111111111111', 'Apparel', 'apparel', 1)
  on conflict (id) do nothing;

insert into public.products (id, sku, name, slug, description, status, specs)
values
  ('22222222-2222-2222-2222-222222222222', 'SKU-001', 'Example T-Shirt', 'example-t-shirt', 'Comfortable cotton tee', 'published', '{"material":"cotton"}')
  on conflict (id) do nothing;

insert into public.product_categories (product_id, category_id)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111')
  on conflict do nothing;

insert into public.product_variants (id, product_id, sku, title, attributes, price_cents, currency, stock_on_hand, is_default)
values
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'SKU-001-DEFAULT', 'Default', '{"size":"M"}', 2999, 'NOK', 10, true)
  on conflict (id) do nothing;
