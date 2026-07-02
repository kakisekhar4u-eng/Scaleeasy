-- Migration 004: Module 3 — AI Marketing Studio

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  title text not null,
  goal text, -- e.g. 'win_back', 'new_arrival', 'festive_sale'
  message_text text,
  segment_criteria jsonb, -- e.g. {"healthScoreBelow": 40, "relationshipStrength": "loyal"}
  status text not null default 'draft', -- 'draft' | 'live' | 'ended'
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- v2.2: was read by Checkout's attribution check but nothing ever wrote
-- to it — publishing a campaign now enrolls its segment as recipients.
create table campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) not null,
  customer_id uuid references customers(id) not null,
  sent_at timestamptz default now(),
  purchased_at timestamptz
);

-- RLS — Pattern A (campaigns has direct store_id)
alter table campaigns enable row level security;
create policy campaigns_same_store on campaigns
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

-- RLS — Pattern B (join through campaigns)
alter table campaign_recipients enable row level security;
create policy campaign_recipients_same_store on campaign_recipients
for all using (
  exists (select 1 from campaigns where campaigns.id = campaign_recipients.campaign_id
    and (campaigns.store_id in (select store_id from users where id = auth.uid())
      or campaigns.store_id in (select store_id from store_memberships where user_id = auth.uid())))
);
