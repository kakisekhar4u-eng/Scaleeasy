-- Migration 009: Module 8 — Multi-Carrier Logistics

create table shipments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  order_id uuid references order_cards(id) not null,
  provider text not null, -- 'bluedart' | 'delhivery' | etc.
  tracking_id text not null unique,
  status text not null default 'booked', -- 'booked' | 'in_transit' | 'delivered' | 'failed'
  delivery_proof_url text,
  delivered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table shipments enable row level security;
create policy shipments_same_store on shipments
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);
