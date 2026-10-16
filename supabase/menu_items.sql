-- =======================================================
-- 1. SQL MIGRATION: KATALOG MENU KAFE
-- Tabel: menu_items
-- =======================================================

-- Buat ekstensi jika belum ada untuk uuid generator
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Buat tabel menu_items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    stock INTEGER NOT NULL DEFAULT 20,
    is_ready BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nonaktifkan RLS sementara agar mudah diuji secara langsung
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;

-- Tambahkan indeks untuk performa query sorting & category filter
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items (category);
CREATE INDEX IF NOT EXISTS idx_menu_items_created_at ON menu_items (created_at DESC);

-- =======================================================
-- SEED DATA (Opsional - Data Awal Menu Kafe Populer)
-- =======================================================
INSERT INTO menu_items (name, category, price, is_ready)
VALUES
  ('Caramel Macchiato', 'Kopi', 34000, true),
  ('Espresso Single Origin', 'Kopi', 20000, true),
  ('Cold Brew Classic', 'Kopi', 28000, true),
  ('Matcha Fusion Latte', 'Non-Kopi', 32000, true),
  ('Artisan Earl Grey Peach', 'Non-Kopi', 25000, false),
  ('Belgium Dark Chocolate', 'Non-Kopi', 30000, true),
  ('Croissant Butter Almond', 'Snack', 26000, true),
  ('Truffle Parmesan Fries', 'Snack', 28000, true),
  ('Nasi Goreng Wagyu Cafe Special', 'Makanan', 48000, true),
  ('Spaghetti Aglio Olio Smoked Beef', 'Makanan', 42000, true)
ON CONFLICT DO NOTHING;
