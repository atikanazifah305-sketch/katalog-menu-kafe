-- ==========================================================
-- SKEMA TABEL ORDERS (PESANAN MEJA KAFE & VERIFIKASI KASIR)
-- ==========================================================

create table if not exists public.orders (
  id text primary key, -- contoh: 'KF-4830'
  table_number text not null, -- contoh: 'Meja 01'
  customer_name text not null, -- contoh: 'Rian'
  items jsonb not null default '[]'::jsonb, -- daftar sajian menu yang dipesan
  total_price numeric(15, 2) not null default 0,
  payment_method text not null check (payment_method in ('cash', 'qris', 'transfer')),
  status text not null default 'pending_verification' check (status in ('pending_cash', 'pending_verification', 'verified_paid', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Aktifkan RLS
alter table public.orders enable row level security;

-- Kebijakan Akses:
-- 1. Siapapun (pelanggan publik) bisa membuat pesanan (INSERT) dan membaca status pesanan (SELECT)
drop policy if exists "Akses publik orders" on public.orders;
create policy "Akses publik orders"
  on public.orders for all
  to public
  using (true)
  with check (true);

-- Indeks pencarian
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
