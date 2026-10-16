-- ========================================================
-- PERBAIKAN ROW LEVEL SECURITY (RLS) SUPABASE
-- Jalankan skrip ini di menu SQL Editor pada Dashboard Supabase Anda
-- ========================================================

-- 1. Hapus kebijakan lama (jika ada)
drop policy if exists "Izinkan baca semua barang untuk user login" on public.items;
drop policy if exists "Izinkan tambah barang untuk user login" on public.items;
drop policy if exists "Izinkan update barang untuk user login" on public.items;
drop policy if exists "Izinkan hapus barang untuk user login" on public.items;
drop policy if exists "Akses bebas inventaris" on public.items;
drop policy if exists "Akses penuh inventaris" on public.items;

drop policy if exists "Izinkan baca log stok untuk user login" on public.stock_logs;
drop policy if exists "Izinkan insert log stok untuk user login" on public.stock_logs;
drop policy if exists "Akses penuh log stok" on public.stock_logs;

-- 2. Buat kebijakan baru yang mengizinkan akses (SELECT, INSERT, UPDATE, DELETE) untuk peran anon dan authenticated
create policy "Akses penuh inventaris"
  on public.items
  for all
  to public
  using (true)
  with check (true);

create policy "Akses penuh log stok"
  on public.stock_logs
  for all
  to public
  using (true)
  with check (true);

-- 3. Pastikan RLS aktif
alter table public.items enable row level security;
alter table public.stock_logs enable row level security;
