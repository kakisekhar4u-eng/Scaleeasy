-- Migration 013: India Commerce Foundation (RC1)
-- Payments, WhatsApp, GST/HSN, Store Credit, Invoice templates

-- ============================================================
-- 1. PAYMENTS FOUNDATION
-- ============================================================

create table payment_transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  sale_id uuid references sales(id),
  order_id uuid references order_cards(id),
  customer_id uuid references customers(id),
  amount decimal(12,2) not null,
  currency text not null default 'INR',
  payment_method text not null, -- 'cash','card','upi','bank_transfer','store_credit'
  provider text, -- 'razorpay','stripe','manual'
  provider_transaction_id text,
  provider_order_id text,
  status text not null default 'pending', -- 'pending','authorized','captured','failed','refunded','partially_refunded'
  payment_type text not null default 'full', -- 'full','advance','partial','balance','split_part'
  split_group_id uuid, -- groups split payment parts together
  metadata jsonb default '{}'::jsonb,
  failure_reason text,
  refund_amount decimal(12,2) default 0,
  reconciled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_payment_txn_store on payment_transactions(store_id);
create index idx_payment_txn_sale on payment_transactions(sale_id);
create index idx_payment_txn_order on payment_transactions(order_id);
create index idx_payment_txn_provider on payment_transactions(provider, provider_transaction_id);
create index idx_payment_txn_split on payment_transactions(split_group_id);

alter table payment_transactions enable row level security;
create policy payment_txn_same_store on payment_transactions
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

create table payment_refunds (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  payment_id uuid references payment_transactions(id) not null,
  amount decimal(12,2) not null,
  reason text,
  provider_refund_id text,
  status text not null default 'pending', -- 'pending','processed','failed'
  credit_to_wallet boolean default false,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

alter table payment_refunds enable row level security;
create policy payment_refunds_same_store on payment_refunds
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

create table payment_webhooks (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id),
  provider text not null,
  event_type text not null,
  payload jsonb not null,
  signature text,
  verified boolean default false,
  processed boolean default false,
  error_message text,
  created_at timestamptz default now()
);

create table payment_audit_log (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  payment_id uuid references payment_transactions(id),
  action text not null,
  actor_id uuid references users(id),
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- 2. WHATSAPP BUSINESS INTEGRATION
-- ============================================================

create table whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  template_key text not null, -- 'order_confirmation','invoice','payment_receipt', etc.
  provider text not null default 'meta', -- 'meta','msg91','exotel'
  provider_template_id text,
  template_name text not null,
  language text not null default 'en',
  body_template text not null,
  header_type text, -- 'text','image','document'
  button_type text, -- 'none','url','quick_reply'
  status text not null default 'draft', -- 'draft','pending_approval','approved','rejected'
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(store_id, template_key, language)
);

alter table whatsapp_templates enable row level security;
create policy whatsapp_templates_same_store on whatsapp_templates
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

create table whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  customer_id uuid references customers(id),
  phone text not null,
  direction text not null default 'outbound', -- 'outbound','inbound'
  template_key text,
  provider text not null,
  provider_message_id text,
  message_type text not null default 'template', -- 'template','text','media','document'
  content jsonb not null, -- template params, text body, or media url
  status text not null default 'queued', -- 'queued','sent','delivered','read','failed'
  failure_reason text,
  retry_count integer default 0,
  max_retries integer default 3,
  media_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_wa_msg_store on whatsapp_messages(store_id);
create index idx_wa_msg_customer on whatsapp_messages(customer_id);
create index idx_wa_msg_status on whatsapp_messages(status);

alter table whatsapp_messages enable row level security;
create policy whatsapp_messages_same_store on whatsapp_messages
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

create table whatsapp_opt_status (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  customer_id uuid references customers(id) not null,
  phone text not null,
  opted_in boolean default false,
  opted_in_at timestamptz,
  opted_out_at timestamptz,
  source text, -- 'manual','checkout','website','whatsapp'
  created_at timestamptz default now(),
  unique(store_id, customer_id)
);

alter table whatsapp_opt_status enable row level security;
create policy whatsapp_opt_same_store on whatsapp_opt_status
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

create table whatsapp_audit_log (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  message_id uuid references whatsapp_messages(id),
  action text not null,
  actor_id uuid references users(id),
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. GST & HSN FOUNDATION
-- ============================================================

create table hsn_master (
  id uuid primary key default gen_random_uuid(),
  hsn_code text not null unique,
  description text not null,
  gst_rate decimal(5,2) not null, -- e.g. 5.00, 12.00, 18.00, 28.00
  cess_rate decimal(5,2) default 0,
  category text, -- 'goods','services'
  chapter text,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index idx_hsn_code on hsn_master(hsn_code);

create table gst_slabs (
  id uuid primary key default gen_random_uuid(),
  rate decimal(5,2) not null unique, -- 0, 5, 12, 18, 28
  label text not null, -- 'Exempt','5%','12%','18%','28%'
  is_active boolean default true,
  created_at timestamptz default now()
);

create table product_gst_mapping (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  product_id uuid references products(id) not null,
  hsn_code text references hsn_master(hsn_code),
  gst_rate decimal(5,2) not null,
  cess_rate decimal(5,2) default 0,
  tax_inclusive boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(store_id, product_id)
);

alter table product_gst_mapping enable row level security;
create policy product_gst_same_store on product_gst_mapping
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

create table store_gst_config (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null unique,
  gstin text,
  legal_name text,
  trade_name text,
  state_code text not null default '36', -- Telangana default
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  pincode text,
  default_tax_inclusive boolean default true,
  hsn_mandatory boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table store_gst_config enable row level security;
create policy store_gst_same_store on store_gst_config
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

-- ============================================================
-- 4. STORE CREDIT / LOYALTY FOUNDATION
-- ============================================================

create table store_credit_wallets (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  customer_id uuid references customers(id) not null,
  balance decimal(12,2) not null default 0,
  lifetime_earned decimal(12,2) not null default 0,
  lifetime_spent decimal(12,2) not null default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(store_id, customer_id)
);

alter table store_credit_wallets enable row level security;
create policy store_credit_same_store on store_credit_wallets
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

create table store_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references store_credit_wallets(id) not null,
  store_id uuid references stores(id) not null,
  amount decimal(12,2) not null, -- positive = credit, negative = debit
  balance_after decimal(12,2) not null,
  type text not null, -- 'refund_credit','manual_credit','gift_card','payment_debit','expiry','adjustment'
  reference_type text, -- 'sale','refund','order','gift_card','manual'
  reference_id uuid,
  note text,
  created_by uuid references users(id),
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table store_credit_transactions enable row level security;
create policy store_credit_txn_same_store on store_credit_transactions
for all using (
  store_id in (select store_id from users where id = auth.uid())
  or store_id in (select store_id from store_memberships where user_id = auth.uid())
);

create table store_credit_audit_log (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) not null,
  wallet_id uuid references store_credit_wallets(id),
  action text not null,
  actor_id uuid references users(id),
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. INVOICE FOUNDATION (for A4/thermal/PDF)
-- ============================================================

-- Extend invoices table with GST and format fields
alter table invoices add column if not exists store_id uuid references stores(id);
alter table invoices add column if not exists invoice_type text default 'tax_invoice'; -- 'tax_invoice','bill_of_supply','receipt','advance_receipt'
alter table invoices add column if not exists format text default 'a4'; -- 'a4','thermal','pdf'
alter table invoices add column if not exists gstin text;
alter table invoices add column if not exists customer_gstin text;
alter table invoices add column if not exists subtotal decimal(12,2);
alter table invoices add column if not exists cgst decimal(12,2) default 0;
alter table invoices add column if not exists sgst decimal(12,2) default 0;
alter table invoices add column if not exists igst decimal(12,2) default 0;
alter table invoices add column if not exists cess decimal(12,2) default 0;
alter table invoices add column if not exists total_tax decimal(12,2) default 0;
alter table invoices add column if not exists grand_total decimal(12,2);
alter table invoices add column if not exists qr_payment_data jsonb;
alter table invoices add column if not exists shared_via text; -- 'whatsapp','email','print','download'
alter table invoices add column if not exists shared_at timestamptz;

-- ============================================================
-- 6. STORE SETTINGS EXTENSION (localization, language)
-- ============================================================

-- Extend stores table for India localization
alter table stores add column if not exists country text default 'IN';
alter table stores add column if not exists currency text default 'INR';
alter table stores add column if not exists timezone text default 'Asia/Kolkata';
alter table stores add column if not exists date_format text default 'DD/MM/YYYY';
alter table stores add column if not exists language text default 'en';
alter table stores add column if not exists state_code text;
alter table stores add column if not exists pincode text;

-- User language preference
alter table users add column if not exists language text default 'en';

-- ============================================================
-- SEED: GST Slabs
-- ============================================================
insert into gst_slabs (rate, label) values
  (0, 'Exempt'),
  (0.25, '0.25%'),
  (3, '3%'),
  (5, '5%'),
  (12, '12%'),
  (18, '18%'),
  (28, '28%')
on conflict (rate) do nothing;

-- ============================================================
-- SEED: Common HSN codes for retail/boutique
-- ============================================================
insert into hsn_master (hsn_code, description, gst_rate, category, chapter) values
  ('6101', 'Men''s overcoats, car-coats, capes, cloaks - knitted', 12, 'goods', '61'),
  ('6102', 'Women''s overcoats, car-coats, capes, cloaks - knitted', 12, 'goods', '61'),
  ('6103', 'Men''s suits, ensembles, jackets, trousers - knitted', 12, 'goods', '61'),
  ('6104', 'Women''s suits, ensembles, jackets, dresses - knitted', 12, 'goods', '61'),
  ('6105', 'Men''s shirts - knitted or crocheted', 12, 'goods', '61'),
  ('6106', 'Women''s blouses, shirts - knitted or crocheted', 12, 'goods', '61'),
  ('6109', 'T-shirts, singlets, tank tops - knitted', 5, 'goods', '61'),
  ('6110', 'Jerseys, pullovers, cardigans, waistcoats - knitted', 12, 'goods', '61'),
  ('6201', 'Men''s overcoats, car-coats, capes, cloaks - woven', 12, 'goods', '62'),
  ('6202', 'Women''s overcoats, car-coats, capes, cloaks - woven', 12, 'goods', '62'),
  ('6203', 'Men''s suits, ensembles, jackets, trousers - woven', 12, 'goods', '62'),
  ('6204', 'Women''s suits, ensembles, jackets, dresses - woven', 12, 'goods', '62'),
  ('6205', 'Men''s shirts - woven', 12, 'goods', '62'),
  ('6206', 'Women''s blouses, shirts - woven', 12, 'goods', '62'),
  ('6211', 'Track suits, ski suits, swimwear', 12, 'goods', '62'),
  ('6214', 'Shawls, scarves, mufflers, mantillas, veils', 12, 'goods', '62'),
  ('6217', 'Clothing accessories (not knitted/crocheted)', 12, 'goods', '62'),
  ('7113', 'Articles of jewellery and parts - precious metal', 3, 'goods', '71'),
  ('7117', 'Imitation jewellery', 12, 'goods', '71'),
  ('4202', 'Trunks, suitcases, handbags, wallets', 18, 'goods', '42'),
  ('6401', 'Waterproof footwear', 18, 'goods', '64'),
  ('6402', 'Other footwear - outer soles/uppers of rubber/plastic', 18, 'goods', '64'),
  ('6403', 'Footwear - outer soles of rubber/plastic, uppers of leather', 18, 'goods', '64'),
  ('6404', 'Footwear - outer soles of rubber/plastic, uppers of textile', 18, 'goods', '64'),
  ('9988', 'Manufacturing services on physical inputs', 18, 'services', '99'),
  ('9997', 'Other services (tailoring, alterations)', 18, 'services', '99')
on conflict (hsn_code) do nothing;
