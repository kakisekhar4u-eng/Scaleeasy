-- Migration 007: Module 6 — Boutique Experience Engine (+ 6A AI Style Studio)

create table garment_blueprints (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  customer_id uuid references customers(id) not null,
  product_id uuid references products(id), -- optional style reference
  status text not null default 'draft', -- 'draft' | 'measuring' | 'stitching' | 'ready' | 'delivered'
  fabric text,
  style_notes text,
  target_delivery_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table blueprint_notes (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid references garment_blueprints(id) not null,
  associate_id uuid references users(id),
  note_text text not null,
  created_at timestamptz default now()
);

-- Reusable across a customer's repeat Blueprints (Ch.2 Living Objects
-- list) — not owned by any single Blueprint, which is why this
-- references customers directly, not garment_blueprints.
create table measurements (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) not null,
  values jsonb not null, -- e.g. {"bust": 36, "waist": 30, "hip": 38, "shoulder": 14}
  taken_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- FIXED (this pass): saved_looks now has a direct store_id column
-- (added when the tryon2buy pipeline was built), so it belongs on the
-- simpler Pattern A policy — and needs to work for anonymous rows
-- (customer_id null, standalone try-on widget) too, which the old
-- join-through-customers policy silently couldn't cover.
create table saved_looks (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id), -- nullable — anonymous widget visitors have none
  product_id uuid references products(id),
  store_id uuid references stores(id) not null,
  status text not null default 'processing', -- 'processing' | 'ready' | 'failed'
  provider_job_id text,
  result_image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS — Pattern A (direct store_id)
alter table garment_blueprints enable row level security;
create policy garment_blueprints_same_store on garment_blueprints
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

alter table saved_looks enable row level security;
create policy saved_looks_same_store on saved_looks
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

-- RLS — Pattern B (join through parent)
alter table blueprint_notes enable row level security;
alter table measurements enable row level security;

create policy blueprint_notes_same_store on blueprint_notes
for all using (
  exists (select 1 from garment_blueprints where garment_blueprints.id = blueprint_notes.blueprint_id
    and (garment_blueprints.store_id in (select store_id from users where id = auth.uid())
      or garment_blueprints.store_id in (select store_id from store_memberships where user_id = auth.uid())))
);
create policy measurements_same_store on measurements
for all using (
  exists (select 1 from customers where customers.id = measurements.customer_id
    and (customers.store_id in (select store_id from users where id = auth.uid())
      or customers.store_id in (select store_id from store_memberships where user_id = auth.uid())))
);
