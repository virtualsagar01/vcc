-- Virtual Card Nepal — Supabase schema
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create sequence if not exists vcn_order_sequence start 1;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  category text,
  category_label text,
  description text,
  short_description text,
  image_url text,
  theme_accent text,
  base_usd numeric(10,2) default 0,
  issuance_fee_usd numeric(10,2) default 0,
  funding_fee_percent numeric(5,2) default 0,
  processing_fee_usd numeric(10,2) default 0,
  is_virtual boolean default false,
  min_amount numeric(10,2),
  max_amount numeric(10,2),
  denominations jsonb default '[]'::jsonb,
  features jsonb default '[]'::jsonb,
  validity text,
  delivery_time text,
  starting_price_npr numeric(12,2) default 0,
  badge_text text,
  support_note text,
  active boolean default true,
  display_order int default 0,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  card_name text,
  billing_address text,
  product_id uuid references products(id) on delete set null,
  product_name text,
  product_category text,
  amount_usd numeric(10,2),
  total_npr numeric(12,2),
  payment_screenshot_url text,
  payment_method text default 'esewa',
  transaction_id text,
  transaction_url text,
  status text default 'Pending Verification',
  notes text,
  internal_notes text,
  card_details jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists settings (
  id int primary key default 1,
  brand_name text default 'Virtual Card Nepal',
  brand_tagline text default 'Black Matte Platinum Virtual Dollar Cards & Gift Cards',
  custom_domain text default '',
  exchange_rate numeric(10,2) default 173.00,
  commission_percent numeric(5,2) default 4.00,
  live_forex_rate numeric(10,2),
  markup_percent numeric(5,2),
  auto_sync_live_rate boolean default false,
  rate_last_synced timestamptz,
  esewa_qr_url text,
  esewa_id text,
  esewa_account_name text,
  contact_whatsapp text,
  contact_email text,
  contact_telegram text,
  contact_phone text,
  social_facebook text,
  social_instagram text,
  social_tiktok text,
  social_youtube text,
  store_notice text,
  footer_text text,
  support_hours text,
  crypto_payment_address text,
  crypto_payment_network text,
  payment_methods jsonb default '[]'::jsonb,
  updated_at timestamptz,
  constraint settings_single_row check (id = 1)
);

insert into settings (id, exchange_rate, commission_percent, brand_name)
values (1, 173.00, 4.00, 'Virtual Card Nepal')
on conflict (id) do nothing;

-- Generate VCN-YYYY-0001 style IDs atomically.
create or replace function next_order_number()
returns bigint
language sql
security definer
as $$ select nextval('vcn_order_sequence'); $$;

grant execute on function next_order_number() to anon, authenticated, service_role;

-- Storage bucket used by checkout uploads.
insert into storage.buckets (id, name, public)
values ('payment-screenshots', 'payment-screenshots', true)
on conflict (id) do update set public = true;

-- Public catalog/settings reads are handled by Render using the service role.
-- Keep tables inaccessible to browser clients so the service role is the only DB writer.
alter table products enable row level security;
alter table orders enable row level security;
alter table settings enable row level security;

drop policy if exists "public products read" on products;
drop policy if exists "public settings read" on settings;

-- No anon/authenticated table policies are required because the app talks to Postgres through Render.
-- Supabase Auth is used only for admin login; Render validates the Supabase access token.


-- Safe migrations for existing installations
alter table products add column if not exists active boolean default true;
alter table products add column if not exists display_order int default 0;
create index if not exists products_catalog_order_idx on products (active, display_order, created_at);

alter table settings add column if not exists payment_methods jsonb default '[]'::jsonb;

-- v2 additions: product/site assets and card reload transactions
alter table products add column if not exists image_url text;
alter table products add column if not exists active boolean default true;
alter table products add column if not exists display_order int default 0;

create table if not exists reload_transactions (
  id uuid primary key default gen_random_uuid(),
  reload_id text unique not null,
  order_id text references orders(order_id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  card_identifier text not null,
  amount_usd numeric(10,2) not null,
  total_npr numeric(12,2) not null,
  payment_method text not null,
  transaction_id text,
  transaction_url text,
  payment_screenshot_url text,
  status text default 'Pending Verification',
  internal_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

alter table reload_transactions enable row level security;

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = true;
