-- ==========================================================
-- SCRIPT PENAMBAHAN KOLOM STOK UNTUK TABEL menu_items
-- Jalankan query ini di SQL Editor Dashboard Supabase Anda:
-- ==========================================================

-- 1. Tambahkan kolom stock (integer, default 20) jika belum ada
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 20;

-- 2. Update item yang status is_ready = false agar stoknya 0 (Habis)
UPDATE menu_items 
SET stock = 0 
WHERE is_ready = false;

-- 3. Berikan nilai stok awal 20 untuk item yang masih ready
UPDATE menu_items 
SET stock = 20 
WHERE is_ready = true AND (stock IS NULL OR stock = 0);
