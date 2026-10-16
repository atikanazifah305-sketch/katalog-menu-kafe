-- ========================================================
-- KONFIRMASI INSTAN SEMUA AKUN SUPABASE TANPA EMAIL
-- Jalankan skrip ini di menu SQL Editor pada Dashboard Supabase Anda
-- ========================================================

-- Perbarui semua akun yang status email-nya belum terkonfirmasi menjadi langsung terkonfirmasi (confirmed)
update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;
