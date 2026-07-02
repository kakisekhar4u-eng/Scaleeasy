-- Migration 012: AI Rendering Pipeline
-- Extends Module 2's products table and Module 6's saved_looks, to
-- support: (a) tryon2buy auto-generating a catalog image on upload, and
-- (b) a standalone/embeddable try-on widget for anonymous website
-- visitors (not just logged-in Scaleeasy customers).

alter table products add column if not exists raw_image_url text;
-- raw_image_url = what was actually uploaded (e.g. a flat-lay photo).
-- primary_image_url = what customers see — starts as a copy of
-- raw_image_url, gets replaced with the tryon2buy-rendered version once
-- generation completes (see catalog/events.js).
alter table products add column if not exists image_generation_status text default 'pending';
-- 'pending' | 'processing' | 'ready' | 'failed' — lets the frontend show
-- a "still preparing photos" state instead of a broken image.
alter table products add column if not exists catalog_render_job_id text;

-- saved_looks previously required a logged-in customer_id (v2.2). The
-- standalone try-on widget (for a store's own external website) has
-- anonymous visitors — no Scaleeasy login at all — so this needs to be
-- optional, anchored to the product instead.
alter table saved_looks add column if not exists product_id uuid references products(id);
alter table saved_looks add column if not exists store_id uuid references stores(id);
alter table saved_looks alter column customer_id drop not null;

-- Storage bucket for the try-on widget's photo uploads. Public-read (so
-- tryon2buy's API can fetch the image by URL), insert-only for anonymous
-- visitors, no update/delete — a visitor can add a photo but can't
-- overwrite or remove anyone else's.
insert into storage.buckets (id, name, public)
values ('tryon-uploads', 'tryon-uploads', true)
on conflict (id) do nothing;

create policy "Anyone can upload a try-on photo"
on storage.objects for insert
with check (bucket_id = 'tryon-uploads');

create policy "Try-on photos are publicly readable"
on storage.objects for select
using (bucket_id = 'tryon-uploads');

-- Deliberately no update/delete policy — uploads are write-once. Old
-- photos aren't automatically cleaned up yet; add a scheduled cleanup
-- job (e.g. delete anything older than 24h) before this matters at scale.
