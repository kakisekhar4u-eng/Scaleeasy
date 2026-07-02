-- Migration 006: Module 5 — Billing & Invoicing (Checkout Engine)

create table sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  customer_id uuid references customers(id),
  total decimal(10,2) not null,
  discount decimal(10,2) default 0,
  payment_mode text, -- 'cash' | 'card' | 'upi' | 'other'
  created_at timestamptz default now()
);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references sales(id) not null,
  variant_id uuid references product_variants(id) not null,
  quantity integer not null,
  price decimal(10,2) not null, -- server-calculated snapshot at time of sale
  created_at timestamptz default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references sales(id) not null unique,
  invoice_number text not null unique,
  pdf_url text,
  created_at timestamptz default now()
);

-- RLS — Pattern A (sales has direct store_id)
alter table sales enable row level security;
create policy sales_same_store on sales
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

-- RLS — Pattern B (join through sales)
alter table sale_items enable row level security;
alter table invoices enable row level security;

create policy sale_items_same_store on sale_items
for all using (
  exists (select 1 from sales where sales.id = sale_items.sale_id
    and (sales.store_id in (select store_id from users where id = auth.uid())
      or sales.store_id in (select store_id from store_memberships where user_id = auth.uid())))
);
create policy invoices_same_store on invoices
for all using (
  exists (select 1 from sales where sales.id = invoices.sale_id
    and (sales.store_id in (select store_id from users where id = auth.uid())
      or sales.store_id in (select store_id from store_memberships where user_id = auth.uid())))
);
