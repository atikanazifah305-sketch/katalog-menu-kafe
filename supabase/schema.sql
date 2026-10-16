-- ===================================================
-- SKEMA DATABASE SUPABASE UNTUK SISTEM INVENTARIS
-- ===================================================

-- 1. Buat Tabel Profil Pengguna (opsional jika menggunakan Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'staff',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Buat Tabel Barang / Inventaris (Items)
create table if not exists public.items (
  id uuid default gen_random_uuid() primary key,
  sku text not null unique,
  name text not null,
  category text not null,
  quantity integer not null default 0 check (quantity >= 0),
  min_stock integer not null default 5 check (min_stock >= 0),
  unit text not null default 'Pcs',
  purchase_price numeric(15, 2) not null default 0,
  selling_price numeric(15, 2) not null default 0,
  location text default 'Gudang Utama',
  description text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Buat Tabel Riwayat Transaksi Stok (Stock Logs)
create table if not exists public.stock_logs (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.items(id) on delete cascade not null,
  type text not null check (type in ('IN', 'OUT', 'ADJUSTMENT')),
  amount integer not null,
  previous_stock integer not null,
  new_stock integer not null,
  reason text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.items enable row level security;
alter table public.stock_logs enable row level security;
alter table public.profiles enable row level security;

-- 5. Kebijakan RLS (Policy)
-- Hapus policy lama jika ada
drop policy if exists "Izinkan baca semua barang untuk user login" on public.items;
drop policy if exists "Izinkan tambah barang untuk user login" on public.items;
drop policy if exists "Izinkan update barang untuk user login" on public.items;
drop policy if exists "Izinkan hapus barang untuk user login" on public.items;
drop policy if exists "Akses penuh inventaris" on public.items;

drop policy if exists "Izinkan baca log stok untuk user login" on public.stock_logs;
drop policy if exists "Izinkan insert log stok untuk user login" on public.stock_logs;
drop policy if exists "Akses penuh log stok" on public.stock_logs;

-- Izinkan akses penuh (SELECT, INSERT, UPDATE, DELETE) untuk peran anon dan authenticated
create policy "Akses penuh inventaris"
  on public.items for all
  to public
  using (true)
  with check (true);

create policy "Akses penuh log stok"
  on public.stock_logs for all
  to public
  using (true)
  with check (true);

-- 6. Trigger untuk auto-update kolom updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create or replace trigger on_items_updated
  before update on public.items
  for each row
  execute function public.handle_updated_at();

-- 7. Data Sampel Awal (Seed Data)
insert into public.items (sku, name, category, quantity, min_stock, unit, purchase_price, selling_price, location, description)
values
  ('SKU-LP-001', 'Laptop Asus Zenbook 14 OLED', 'Elektronik', 18, 5, 'Unit', 13500000, 15999000, 'Rak A1 - Elektronik', 'Intel Core i7, 16GB RAM, 1TB SSD'),
  ('SKU-MS-002', 'Logitech MX Master 3S Mouse', 'Elektronik', 34, 10, 'Pcs', 1250000, 1650000, 'Rak A2 - Aksesoris', 'Wireless ergonomic mouse, Bluetooth & Bolt'),
  ('SKU-KB-003', 'Keychron K2 Pro Mechanical Keyboard', 'Elektronik', 12, 5, 'Unit', 1400000, 1850000, 'Rak A2 - Aksesoris', 'RGB Wireless Mechanical Keyboard Red Switch'),
  ('SKU-MN-004', 'Monitor Dell UltraSharp 27 Inch 4K', 'Elektronik', 7, 4, 'Unit', 7200000, 8499000, 'Rak B1 - Display', 'IPS Black Panel, USB-C 90W Hub'),
  ('SKU-PP-005', 'Kertas HVS PaperOne A4 80gr', 'ATK & Kantor', 4, 15, 'Rim', 48000, 58000, 'Gudang Belakang - B4', 'Kertas fotokopi & print premium 1 dus isi 5 rim'),
  ('SKU-PN-006', 'Pulpen Pilot G2 0.5mm Hitam', 'ATK & Kantor', 45, 20, 'Box', 120000, 145000, 'Rak C1 - Alat Tulis', '1 box isi 12 pulpen gel'),
  ('SKU-CH-007', 'Kursi Kerja Ergonomis Pexio', 'Perabotan', 3, 5, 'Unit', 1850000, 2350000, 'Gudang Perabot - P1', 'Mesh breathable, lumbar support adjustable'),
  ('SKU-DK-008', 'Meja Kerja Minimalis Kayu Jati 140cm', 'Perabotan', 0, 3, 'Unit', 1200000, 1650000, 'Gudang Perabot - P2', 'Kaki besi hollow hitam, top solid jati belanda')
on conflict (sku) do nothing;
