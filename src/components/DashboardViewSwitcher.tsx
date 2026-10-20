'use client';

import { useState, useEffect } from 'react';
import { MenuItem } from '@/types/menu';
import { CafeOrder } from '@/types/order';
import AddMenuForm from '@/components/AddMenuForm';
import MenuCatalog from '@/components/MenuCatalog';
import StaffOrdersManager from '@/components/StaffOrdersManager';
import TableQrGenerator from '@/components/TableQrGenerator';
import { 
  Receipt, 
  Settings, 
  LayoutGrid, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Database, 
  AlertTriangle, 
  Box, 
  QrCode,
  Clock,
  Sparkles,
  Info,
  Layers
} from 'lucide-react';

export type DashboardMode = 'kasir' | 'admin' | 'semua';

interface DashboardViewSwitcherProps {
  initialOrders: CafeOrder[];
  menuItems: MenuItem[];
}

export default function DashboardViewSwitcher({
  initialOrders,
  menuItems,
}: DashboardViewSwitcherProps) {
  const [mode, setMode] = useState<DashboardMode>('kasir');
  const [mounted, setMounted] = useState(false);

  // Muat preferensi mode staf dari localStorage jika ada
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('cafe_staff_dashboard_mode') as DashboardMode | null;
    if (saved && (saved === 'kasir' || saved === 'admin' || saved === 'semua')) {
      setMode(saved);
    }
  }, []);

  const handleModeChange = (newMode: DashboardMode) => {
    setMode(newMode);
    try {
      localStorage.setItem('cafe_staff_dashboard_mode', newMode);
    } catch {
      // Abaikan jika quota / restricted
    }
  };

  // Statistik Menu & Stok
  const totalMenu = menuItems.length;
  const readyMenu = menuItems.filter(
    (item) => item.is_ready && (item.stock === undefined || item.stock > 0)
  ).length;
  const lowStockMenu = menuItems.filter((item) => {
    const s = typeof item.stock === 'number' ? item.stock : item.is_ready ? 20 : 0;
    return item.is_ready && s >= 1 && s <= 5;
  }).length;
  const outOfStockMenu = menuItems.filter((item) => !item.is_ready || item.stock === 0).length;
  const totalStockUnits = menuItems.reduce((acc, curr) => acc + (curr.stock || 0), 0);
  const avgPrice =
    totalMenu > 0
      ? Math.round(menuItems.reduce((acc, curr) => acc + Number(curr.price || 0), 0) / totalMenu)
      : 0;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Statistik Pesanan (dari initialOrders)
  const pendingVerificationOrders = initialOrders.filter((o) => o.status === 'pending_verification').length;
  const pendingCashOrders = initialOrders.filter((o) => o.status === 'pending_cash').length;
  const inProgressOrders = initialOrders.filter((o) => o.status === 'verified_paid').length;

  return (
    <div className="space-y-7">
      {/* Tombol Pengalih Mode (Mode Kasir vs Mode Admin Toko vs Semua Fitur) */}
      <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
              Mode Tampilan:
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
              mode === 'kasir'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : mode === 'admin'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30'
            }`}>
              {mode === 'kasir' && '🟢 Aktif: Mode Kasir'}
              {mode === 'admin' && '🟡 Aktif: Mode Admin Toko'}
              {mode === 'semua' && '🔵 Aktif: Semua Fitur'}
            </span>
          </div>

          {/* Segmented Control Switcher */}
          <div className="grid grid-cols-3 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs font-bold sm:w-auto w-full gap-1">
            {/* Tombol Mode Kasir */}
            <button
              id="btn-mode-kasir"
              type="button"
              onClick={() => handleModeChange('kasir')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 sm:px-4 rounded-lg transition-all cursor-pointer ${
                mode === 'kasir'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Kasir</span>
              {pendingVerificationOrders > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-red-500 text-white rounded-full animate-pulse">
                  {pendingVerificationOrders}
                </span>
              )}
            </button>

            {/* Tombol Mode Admin Toko */}
            <button
              id="btn-mode-admin"
              type="button"
              onClick={() => handleModeChange('admin')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 sm:px-4 rounded-lg transition-all cursor-pointer ${
                mode === 'admin'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Admin Toko</span>
            </button>

            {/* Tombol Semua Fitur */}
            <button
              id="btn-mode-semua"
              type="button"
              onClick={() => handleModeChange('semua')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 sm:px-4 rounded-lg transition-all cursor-pointer ${
                mode === 'semua'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Semua</span>
            </button>
          </div>
        </div>

        {/* Keterangan singkat fungsi mode yang sedang aktif */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {mode === 'kasir' && (
            <span>
              <strong>Mode Kasir:</strong> Fokus verifikasi pembayaran meja pelanggan (QRIS / Tunai), pantau racikan barista, dan periksa ketersediaan stok cepat.
            </span>
          )}
          {mode === 'admin' && (
            <span>
              <strong>Mode Admin Toko:</strong> Fokus pendaftaran menu baru, penyesuaian harga jual, kontrol stok barang, dan cetak QR Code Meja Kafe.
            </span>
          )}
          {mode === 'semua' && (
            <span>
              <strong>Semua Fitur:</strong> Menampilkan seluruh modul operasional kasir dan manajemen admin kafe dalam satu tampilan lengkap.
            </span>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 1. TAMPILAN MODE KASIR                                   */}
      {/* ======================================================== */}
      {(mode === 'kasir' || mode === 'semua') && (
        <div className="space-y-6 animate-fade-in">
          {mode === 'kasir' && (
            /* Kartu Statistik Cepat Operasional Kasir */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Verifikasi QRIS/TF</p>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {pendingVerificationOrders} pesanan
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bayar di Kasir (Tunai)</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {pendingCashOrders} pesanan
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Sedang Diracik</p>
                  <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                    {inProgressOrders} pesanan
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Habis / Menipis</p>
                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    {outOfStockMenu + lowStockMenu} menu
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modul Pesanan Masuk & Verifikasi Kasir */}
          <section>
            <StaffOrdersManager initialOrders={initialOrders} />
          </section>

          {/* Pada Mode Kasir, tampilkan pula katalog stok untuk cek cepat ketersediaan menu */}
          {mode === 'kasir' && (
            <section className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Ketersediaan Stok Menu di Bar</span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      (Cek stok & tandai habis jika bahan habis)
                    </span>
                  </h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {menuItems.length} menu terdaftar
                </span>
              </div>
              <MenuCatalog initialItems={menuItems} />
            </section>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TAMPILAN MODE ADMIN TOKO                              */}
      {/* ======================================================== */}
      {(mode === 'admin' || mode === 'semua') && (
        <div className="space-y-6 animate-fade-in">
          {/* Kartu Statistik Inventaris & Penjualan (Khusus Admin / Tampilan Penuh) */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Menu</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{totalMenu}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Menu Ready</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{readyMenu}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Stok Habis</p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{outOfStockMenu}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Stok</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{totalStockUnits} porsi</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Rata-rata Harga</p>
                <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {formatRupiah(avgPrice)}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Stok Menipis</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{lowStockMenu}</p>
                  <span className="text-[10px] font-semibold text-amber-600/80 dark:text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    1-5 porsi
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Generator & Cetak QR Code Meja Kafe (Self-Order) */}
          <section>
            <TableQrGenerator />
          </section>

          {/* Form Tambah Menu Baru (Khusus Admin) */}
          <section>
            <AddMenuForm />
          </section>

          {/* Manajemen Data Menu & Stok (Edit Harga, Kategori, Hapus) */}
          <section className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Manajemen Data Menu & Stok
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Menampilkan {menuItems.length} menu terdaftar
              </span>
            </div>
            <MenuCatalog initialItems={menuItems} />
          </section>
        </div>
      )}
    </div>
  );
}
