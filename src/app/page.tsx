import { createClient } from '@/utils/supabase/server';
import { MenuItem } from '@/types/menu';
import { mergeStockWithMenuItems } from '@/lib/stockStore';
import { getCafeSettings } from '@/lib/settingsStore';
import CustomerMenu from '@/components/CustomerMenu';
import Link from 'next/link';
import { 
  Coffee, 
  Lock, 
  Sparkles, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  AlertTriangle,
  Wifi,
  Megaphone,
  Store
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CustomerHomePage() {
  const supabase = await createClient();

  // 1. Cek apakah ada staf yang sedang login (opsional)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Ambil data menu kafe (Akses Publik / Tanpa Perlu Login)
  let menuItems: MenuItem[] = [];
  let fetchError: string | null = null;

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      fetchError = error.message;
    } else {
      menuItems = mergeStockWithMenuItems(data || []);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      fetchError = err.message;
    } else {
      fetchError = 'Gagal memuat katalog menu.';
    }
  }

  const staffDisplayName = user?.user_metadata?.full_name || user?.email || 'Staf Kafe';

  // 3. Ambil pengaturan kafe dinamis (nama toko, jam operasional, wifi, promo banner)
  const cafeSettings = getCafeSettings();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased pb-28 selection:bg-amber-500 selection:text-white">
      {/* Background Glow Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top Banner Staf (Hanya Tampil Jika Staf Sedang Login) */}
      {user && (
        <div className="bg-amber-600 text-white text-xs py-2 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-200" />
              <span>
                Sedang login sebagai <strong>{staffDisplayName}</strong> (Akun Staf)
              </span>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 font-bold underline hover:text-amber-100"
            >
              <span>Buka Dashboard Manajemen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Banner Pengumuman Promo Kafe Dinamis (Diatur dari Mode Admin) */}
      {cafeSettings.promoBannerActive && cafeSettings.promoBannerText && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 shadow-sm flex items-center justify-center gap-2">
          <Megaphone className="w-4 h-4 shrink-0 animate-bounce" />
          <span className="text-center">{cafeSettings.promoBannerText}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header Kafe Elegan untuk Pelanggan */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-900 via-amber-950 to-slate-950 text-white shadow-xl shadow-amber-950/20 relative overflow-hidden">
          {/* Subtle Ambient Background Deco */}
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{cafeSettings.isOpen ? 'Buka Sekarang • Menu Digital' : 'Tutup Sementara'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {cafeSettings.cafeName || 'Katalog Menu & Pemesanan Meja'}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-amber-200/80 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {cafeSettings.operatingHours || '08:00 - 22:00 WIB'}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {cafeSettings.address || 'Dine-in (Pesan di Meja) & Takeaway'}
              </span>
              {cafeSettings.wifiSsid && (
                <span className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-amber-200">
                  <Wifi className="w-3.5 h-3.5 text-amber-400" />
                  Wi-Fi: <strong className="text-white">{cafeSettings.wifiSsid}</strong> (Pass: {cafeSettings.wifiPassword || 'Gratis'})
                </span>
              )}
            </div>
          </div>

          {/* Tombol Akses Khusus Staf / Karyawan */}
          <div className="relative z-10 self-stretch sm:self-auto flex items-center">
            {user ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Panel Manajemen Staf</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-xs transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Portal Karyawan / Staf</span>
              </Link>
            )}
          </div>
        </header>

        {/* Notifikasi Kendala Database jika ada */}
        {fetchError && (
          <div className="p-4 sm:p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-amber-800 dark:text-amber-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
              <div className="text-xs sm:text-sm">
                <p className="font-semibold">Katalog menu sedang dipersiapkan:</p>
                <p className="font-mono text-xs mt-1">{fetchError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tampilan Menu Pelanggan (Client Component) */}
        <section>
          <CustomerMenu initialItems={menuItems} initialSettings={cafeSettings} />
        </section>
      </div>
    </main>
  );
}
