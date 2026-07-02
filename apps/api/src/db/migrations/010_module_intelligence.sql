-- Migration 010: Module 9 — AI Business Intelligence

create table business_briefs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  content text not null,
  signals jsonb not null, -- the raw numbers the brief was generated from, kept for audit
  provider text not null default 'rules',
  created_at timestamptz default now()
);

alter table business_briefs enable row level security;
create policy business_briefs_same_store on business_briefs
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

-- Exception (Appendix F #2, Tech Lead approved): this module reads
-- directly across other modules' tables (customers, products, campaigns,
-- order_cards) for real-time aggregation — no RLS changes needed for
-- those tables themselves, this module just queries them read-only,
-- scoped by store_id like everything else.
