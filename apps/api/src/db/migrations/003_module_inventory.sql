-- Migration 003: Module 2 — Smart Inventory

create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  name text not null,
  category text,
  description text,
  primary_image_url text,
  status text not null default 'active', -- 'active' | 'archived'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) not null,
  size text,
  color text,
  sku text,
  selling_price decimal(10,2) not null,
  mrp decimal(10,2),
  created_at timestamptz default now()
);

create table inventory_stock (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid references product_variants(id) not null,
  store_id uuid references stores(id) not null,
  quantity integer not null default 0 check (quantity >= 0), -- v2.2: non-negative guard
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(variant_id, store_id) -- v2.2: prevents transferStock from losing stock
);

create table product_dna (
  product_id uuid primary key references products(id),
  velocity decimal(5,2),
  size_sell_through jsonb,
  return_rate decimal(5,2),
  health_score integer,        -- v2.2: was computed but never stored
  health_score_reason text,
  updated_at timestamptz default now()
);

create table product_journey (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) not null,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

-- RLS — Pattern A (direct store_id)
alter table products enable row level security;
create policy products_same_store on products
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

alter table inventory_stock enable row level security;
create policy inventory_stock_same_store on inventory_stock
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

-- RLS — Pattern B (join through products)
alter table product_variants enable row level security;
alter table product_dna enable row level security;
alter table product_journey enable row level security;

create policy product_variants_same_store on product_variants
for all using (
  exists (select 1 from products where products.id = product_variants.product_id
    and (products.store_id in (select store_id from users where id = auth.uid())
      or products.store_id in (select store_id from store_memberships where user_id = auth.uid())))
);
create policy product_dna_same_store on product_dna
for all using (
  exists (select 1 from products where products.id = product_dna.product_id
    and (products.store_id in (select store_id from users where id = auth.uid())
      or products.store_id in (select store_id from store_memberships where user_id = auth.uid())))
);
create policy product_journey_same_store on product_journey
for all using (
  exists (select 1 from products where products.id = product_journey.product_id
    and (products.store_id in (select store_id from users where id = auth.uid())
      or products.store_id in (select store_id from store_memberships where user_id = auth.uid())))
);
