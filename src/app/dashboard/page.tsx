import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { MenuItem } from '@/types/menu';
import DashboardViewSwitcher from '@/components/DashboardViewSwitcher';
import { getAllOrders } from '@/lib/ordersStore';
import { mergeStockWithMenuItems } from '@/lib/stockStore';
import { signout } from '@/app/auth/actions';
import { getCafeSettings } from '@/lib/settingsStore';
import Link from 'next/link';
import { 
  Coffee, 
  AlertTriangle, 
  LogOut,
  User as UserIcon,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StaffDashboardPage() {
  const supabase = await createClient();

  // 1. Verifikasi Autentikasi Pengguna (Khusus Staf Karyawan)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Verifikasi Hak Akses / Role Karyawan (Proteksi Tambahan)
  const role = user.user_metadata?.role;
  if (role && role !== 'staff') {
    redirect('/?error=unauthorized');
  }

  let menuItems: MenuItem[] = [];
  let fetchError: string | null = null;

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      fetchError = error.message;
    } else {
      menuItems = mergeStockWithMenuItems(data || []);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      fetchError = err.message;
    } else {
      fetchError = 'Gagal terhubung ke Supabase. Periksa konfigurasi .env.local Anda.';
    }
  }

  const displayName = user.user_metadata?.full_name || 'Staf Karyawan';
  const initialOrders = await getAllOrders();
  const initialSettings = getCafeSettings();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased pb-20 selection:bg-amber-500 selection:text-white">
      {/* Background Glow Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-7">
        {/* Banner Navigasi Khusus Staf */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Panel Khusus Staf & Karyawan (Manajemen Menu, Stok, dan Harga)</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 hover:underline"
          >
            <span>Buka Tampilan Menu Pelanggan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Header Dashboard Staf */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Dashboard Staf Kafe
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Akses Karyawan
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Kelola sajian menu kafe, kategori, harga, dan ketersediaan stok
              </p>
            </div>
          </div>

          {/* User Profile & Logout Button */}
          <div className="flex items-center gap-3 self-end sm:self-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs uppercase">
              {displayName[0] || <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden sm:flex flex-col text-left pr-2">
              <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                {user.email}
              </span>
            </div>

            <form action={signout}>
              <button
                type="submit"
                title="Keluar dari akun staf"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </header>

        {/* Notifikasi jika ada kendala database */}
        {fetchError && (
          <div className="p-4 sm:p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-amber-800 dark:text-amber-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
              <div className="text-xs sm:text-sm space-y-2">
                <p className="font-semibold">
                  Tabel `menu_items` belum terdeteksi atau konfigurasi database perlu diperiksa:
                </p>
                <p className="font-mono text-xs bg-amber-100 dark:bg-amber-900/60 p-2 rounded-lg">
                  {fetchError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modul Dashboard Interaktif dengan Pengalih Mode Kasir & Admin Toko */}
        <DashboardViewSwitcher
          initialOrders={initialOrders}
          menuItems={menuItems}
          initialSettings={initialSettings}
        />
      </div>
    </main>
  );
}
