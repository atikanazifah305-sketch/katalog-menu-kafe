-- ==========================================================
-- SKEMA TABEL ORDERS (PESANAN MEJA KAFE & VERIFIKASI KASIR)
-- & PENGATURAN KAFE (PROFIL, WI-FI, PROMO)
-- ==========================================================

-- 1. Buat Tabel orders (Pesanan Masuk dari Meja & POS Kasir)
create table if not exists public.orders (
  id text primary key, -- contoh: 'KF-4830'
  table_number text not null, -- contoh: 'Meja 01'
  customer_name text not null, -- contoh: 'Rian'
  items jsonb not null default '[]'::jsonb, -- daftar sajian menu yang dipesan
  total_price numeric(15, 2) not null default 0,
  payment_method text not null, -- 'cash' | 'qris' | 'transfer'
  status text not null default 'pending_verification', -- 'pending_cash' | 'pending_verification' | 'verified_paid' | 'completed' | 'cancelled'
  created_at text not null default to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_at text not null default to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);

-- Aktifkan RLS untuk orders
alter table public.orders enable row level security;

-- Kebijakan Akses Orders (Pelanggan & Staf Kasir)
drop policy if exists "Akses publik orders" on public.orders;
create policy "Akses publik orders"
  on public.orders for all
  to public
  using (true)
  with check (true);

-- Indeks pencarian orders
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

-- 2. Buat Tabel cafe_settings (Pengaturan Profil Kafe, Wi-Fi, dan Promo)
create table if not exists public.cafe_settings (
  id text primary key default 'default',
  cafe_name text default 'Kafe Atika Nazifah',
  address text default 'Jl. Ahmad Yani No. 12, Coffee Bar & Resto',
  phone text default '0812-3456-7890',
  operating_hours text default '08:00 - 22:00 WIB',
  wifi_ssid text default 'KafeAtika_5G',
  wifi_password text default 'kopi2026',
  is_open boolean default true,
  promo_banner_active boolean default true,
  promo_banner_text text default '✨ Promo Spesial: Dapatkan diskon 10% untuk pesanan Dine-In hari ini!',
  tax_percent numeric(5, 2) default 0,
  service_charge_percent numeric(5, 2) default 0,
  updated_at text default to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);

-- Aktifkan RLS untuk cafe_settings
alter table public.cafe_settings enable row level security;

-- Kebijakan Akses Pengaturan Kafe
drop policy if exists "Akses publik cafe_settings" on public.cafe_settings;
create policy "Akses publik cafe_settings"
  on public.cafe_settings for all
  to public
  using (true)
  with check (true);

-- Masukkan data awal jika belum ada
insert into public.cafe_settings (id, cafe_name, is_open)
values ('default', 'Kafe Atika Nazifah', true)
on conflict (id) do nothing;
