-- Migration 008: Module 7 — Orders
-- Zero owned business data beyond status and amounts — everything else
-- (customer, product, blueprint) is a reference to another module's table.

create table order_cards (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  customer_id uuid references customers(id) not null,
  product_id uuid references products(id),
  blueprint_id uuid references garment_blueprints(id),
  status text not null default 'enquired', -- 'enquired' | 'confirmed' | 'completed' | 'delivered'
  source text, -- 'catalog' | 'manual' | etc.
  advance_amount decimal(10,2) default 0,
  total_amount decimal(10,2) default 0,
  balance_amount decimal(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table order_cards enable row level security;
create policy order_cards_same_store on order_cards
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);
