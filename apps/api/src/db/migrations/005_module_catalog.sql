-- Migration 005: Module 4 — AI Digital Catalog

create table catalog_links (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  customer_id uuid references customers(id), -- nullable: can be a general link, not customer-specific
  token text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- No store_id, even transitively through one parent — written by the
-- public, unauthenticated catalog surface by design (Ch.7A). Protected
-- by catalog_links token validation at the application layer, not RLS.
create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) not null,
  product_id uuid references products(id) not null,
  created_at timestamptz default now(),
  unique(customer_id, product_id)
);

create table catalog_views (
  id uuid primary key default gen_random_uuid(),
  catalog_link_id uuid references catalog_links(id) not null,
  product_id uuid references products(id) not null,
  created_at timestamptz default now()
);

-- RLS — Pattern A (catalog_links has direct store_id; this is the
-- associate-facing management table, not the public browsing surface)
alter table catalog_links enable row level security;
create policy catalog_links_same_store on catalog_links
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

-- wishlist_items and catalog_views deliberately have NO RLS policy —
-- see Ch.7A. They're written via token-validated public endpoints only.
