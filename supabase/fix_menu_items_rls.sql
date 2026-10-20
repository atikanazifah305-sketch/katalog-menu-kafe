-- ========================================================
-- PERBAIKAN ROW LEVEL SECURITY (RLS) & KOLOM STOK UNTUK menu_items
-- Jalankan skrip ini di menu SQL Editor pada Dashboard Supabase Anda:
-- https://supabase.com/dashboard/project/dmilbcbayjlpzgjioxlt/sql/new
-- ========================================================

-- 1. Tambahkan kolom stock jika belum ada
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 20;

-- 2. Sinkronkan nilai stok awal:
-- Item yang tidak ready diset stok 0
UPDATE public.menu_items 
SET stock = 0 
WHERE is_ready = false;

-- Item yang ready diset stok minimal 20 jika masih 0 atau null
UPDATE public.menu_items 
SET stock = 20 
WHERE is_ready = true AND (stock IS NULL OR stock = 0);

-- 3. Hapus policy lama jika ada untuk menghindari konflik
DROP POLICY IF EXISTS "Akses penuh menu_items untuk semua" ON public.menu_items;
DROP POLICY IF EXISTS "Izinkan baca menu untuk semua" ON public.menu_items;
DROP POLICY IF EXISTS "Izinkan staf tambah menu" ON public.menu_items;
DROP POLICY IF EXISTS "Izinkan staf update menu" ON public.menu_items;
DROP POLICY IF EXISTS "Izinkan staf hapus menu" ON public.menu_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.menu_items;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.menu_items;
DROP POLICY IF EXISTS "Enable update for all users" ON public.menu_items;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.menu_items;

-- 4. Aktifkan Row Level Security (RLS) pada tabel menu_items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 5. Buat kebijakan baru yang mengizinkan seluruh operasi (SELECT, INSERT, UPDATE, DELETE)
-- untuk peran publik (anon key yang digunakan aplikasi web)
CREATE POLICY "Akses penuh menu_items untuk semua"
  ON public.menu_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
