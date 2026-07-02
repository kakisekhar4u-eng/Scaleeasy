-- Migration 002: Module 1 — Customer CRM

create table customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  full_name text not null,
  phone text not null,
  whatsapp_id text,
  preferred_associate_id uuid references users(id),
  health_score integer default 50,
  health_score_reason text,
  relationship_strength text default 'new',
  lifetime_value decimal(10,2) default 0,
  customer_since timestamptz default now(),
  last_visit_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table customer_fashion_dna (
  customer_id uuid primary key references customers(id),
  preferred_sizes jsonb,
  preferred_colors jsonb,
  preferred_brands jsonb,
  budget_band text,
  occasion_preferences jsonb,
  preferred_channel text,
  updated_at timestamptz default now()
);

create table customer_memory (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) not null,
  associate_id uuid references users(id),
  note_text text not null,
  created_at timestamptz default now()
);

create table customer_tags (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) not null,
  tag text not null,
  source text,
  created_at timestamptz default now()
);

create table customer_timeline (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) not null,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

-- RLS (Ch.7A) — Pattern A for customers (has store_id directly)
alter table customers enable row level security;
create policy customers_same_store on customers
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

-- RLS — Pattern B for child tables (join through customers)
alter table customer_fashion_dna enable row level security;
alter table customer_memory enable row level security;
alter table customer_tags enable row level security;
alter table customer_timeline enable row level security;

create policy customer_fashion_dna_same_store on customer_fashion_dna
for all using (
  exists (select 1 from customers where customers.id = customer_fashion_dna.customer_id
    and (customers.store_id in (select store_id from users where id = auth.uid())
      or customers.store_id in (select store_id from store_memberships where user_id = auth.uid())))
);
create policy customer_memory_same_store on customer_memory
for all using (
  exists (select 1 from customers where customers.id = customer_memory.customer_id
    and (customers.store_id in (select store_id from users where id = auth.uid())
      or customers.store_id in (select store_id from store_memberships where user_id = auth.uid())))
);
create policy customer_tags_same_store on customer_tags
for all using (
  exists (select 1 from customers where customers.id = customer_tags.customer_id
    and (customers.store_id in (select store_id from users where id = auth.uid())
      or customers.store_id in (select store_id from store_memberships where user_id = auth.uid())))
);
create policy customer_timeline_same_store on customer_timeline
for all using (
  exists (select 1 from customers where customers.id = customer_timeline.customer_id
    and (customers.store_id in (select store_id from users where id = auth.uid())
      or customers.store_id in (select store_id from store_memberships where user_id = auth.uid())))
);

-- Added when Module 6's try-on automation was wired up: try-on activity
-- signals a category preference, which didn't have its own column
-- (preferred_brands existed but meant something different).
alter table customer_fashion_dna add column if not exists preferred_categories jsonb default '[]'::jsonb;
