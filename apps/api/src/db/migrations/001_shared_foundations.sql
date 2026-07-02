-- Migration 001: Shared foundation tables (Handbook Ch. 5, 6, 7, 7A — v2.2)
-- Run this first. Every module depends on these tables.

create extension if not exists pgcrypto;

create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mode text not null default 'retail', -- 'retail' | 'boutique'
  created_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users(id), -- Supabase Auth
  store_id uuid references stores(id) not null, -- user's default/home store
  full_name text,
  experience_mode text not null, -- 'owner' | 'manager' | 'associate' | 'consultant'
  created_at timestamptz default now()
);

-- v2.2: lets one owner access multiple stores without breaking the
-- single-storeId-per-request assumption every module makes (see Ch. 7A).
create table store_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  store_id uuid references stores(id) not null,
  role text not null default 'associate',
  created_at timestamptz default now(),
  unique(user_id, store_id)
);

-- Event Bus (Ch. 5)
create table events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null,
  emitted_by text not null,
  created_at timestamptz default now()
);
create index idx_events_type on events(event_type);

-- v2.2: dead-letter table for event handlers that throw (Ch. 5)
create table failed_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) not null,
  event_type text not null,
  payload jsonb not null,
  error_message text,
  retry_count integer default 0,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- Connector Layer (Ch. 6)
create table connectors (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  provider text not null,
  status text not null default 'not_connected', -- 'not_connected' | 'connected' | 'needs_attention'
  encrypted_credentials text,
  scopes jsonb default '[]'::jsonb,
  expires_at timestamptz,
  last_error text,
  connected_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(store_id, provider)
);

-- v2.2: generic in-app notifications, used by Module 7's notifyAssociate()
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  type text not null,
  reference_id uuid,
  message text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- RLS: enable on every store-owned table as each module's migration adds it.
alter table stores enable row level security;
alter table connectors enable row level security;

create policy connectors_same_store on connectors
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

-- AI Engine cache (added when wiring in core/aiEngine.js)
create table ai_cache (
  cache_key text primary key,
  result text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Adds provider tracking to the AI cache — lets you see, honestly, how
-- much of your "AI" usage is actually free (rules/ollama) vs paid
-- (anthropic), instead of just assuming.
alter table ai_cache add column if not exists provider text default 'rules';

-- FIXED (multi-tenant review pass): users, store_memberships, and
-- notifications had no RLS. Currently the frontend never queries these
-- directly (only the backend does, which bypasses RLS anyway), so this
-- wasn't yet exploitable — but it's exactly the kind of gap that stays
-- invisible until someone builds a feature (e.g. an "assign associate"
-- picker) that queries Supabase directly from the browser, at which
-- point it would silently leak every store's users. Closing it now,
-- before that's possible, rather than after.

alter table users enable row level security;
create policy users_same_store on users
for select using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

alter table store_memberships enable row level security;
create policy store_memberships_own_rows on store_memberships
for select using (user_id = auth.uid());

alter table notifications enable row level security;
create policy notifications_own_rows on notifications
for all using (user_id = auth.uid());
