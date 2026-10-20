'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MenuItem } from '@/types/menu';
import { CafeOrder } from '@/types/order';
import AddMenuForm from '@/components/AddMenuForm';
import MenuCatalog from '@/components/MenuCatalog';
import StaffOrdersManager from '@/components/StaffOrdersManager';
import TableQrGenerator from '@/components/TableQrGenerator';
import CashierPosTerminal from '@/components/CashierPosTerminal';
import AdminAnalytics from '@/components/AdminAnalytics';
import AdminStoreSettings from '@/components/AdminStoreSettings';
import { CafeSettings, DEFAULT_SETTINGS } from '@/types/settings';
import { batchRestockLowStockAction } from '@/app/actions';
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
  Layers, 
  ShoppingBag, 
  Printer, 
  Calendar, 
  CreditCard, 
  Banknote, 
  TrendingUp, 
  FileText, 
  RotateCcw,
  Zap,
  BarChart3,
  Store,
  Flame,
  Lock,
  Unlock,
  KeyRound
} from 'lucide-react';

export type DashboardMode = 'kasir' | 'admin' | 'semua';
export type KasirSubTab = 'pos' | 'antrean' | 'stok' | 'rekap';
export type AdminSubTab = 'katalog' | 'analisis' | 'pengaturan' | 'qr';

interface DashboardViewSwitcherProps {
  initialOrders: CafeOrder[];
  menuItems: MenuItem[];
  initialSettings?: CafeSettings;
}

export default function DashboardViewSwitcher({
  initialOrders,
  menuItems,
  initialSettings,
}: DashboardViewSwitcherProps) {
  const router = useRouter();
  const [mode, setMode] = useState<DashboardMode>('kasir');
  const [kasirSubTab, setKasirSubTab] = useState<KasirSubTab>('antrean');
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('katalog');
  const [settings, setSettings] = useState<CafeSettings>(initialSettings || DEFAULT_SETTINGS);
  const [isRestocking, setIsRestocking] = useState(false);
  const [mounted, setMounted] = useState(false);

  // State Keamanan PIN Otorisasi Admin Toko
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pendingMode, setPendingMode] = useState<DashboardMode | null>(null);

  const handleBatchRestock = async () => {
    if (!window.confirm('Isi ulang +20 porsi untuk semua menu yang habis / stok menipis?')) return;
    setIsRestocking(true);
    try {
      const res = await batchRestockLowStockAction(20);
      if (res.success) {
        alert(`Berhasil mengisi ulang stok untuk ${res.count} menu!`);
        router.refresh();
      } else {
        alert(res.error || 'Gagal melakukan restock massal.');
      }
    } catch {
      alert('Terjadi kesalahan saat restock.');
    } finally {
      setIsRestocking(false);
    }
  };

  // Cek apakah admin sudah di-unlock di sesi ini
  useEffect(() => {
    setMounted(true);
    let unlocked = false;
    try {
      unlocked = sessionStorage.getItem('cafe_admin_unlocked') === 'true';
    } catch {
      // ignore
    }
    if (unlocked) {
      setIsAdminUnlocked(true);
    }

    const saved = localStorage.getItem('cafe_staff_dashboard_mode') as DashboardMode | null;
    if (saved === 'admin' || saved === 'semua') {
      if (unlocked) {
        setMode(saved);
      } else {
        setMode('kasir'); // Default aman ke kasir jika belum memasukkan PIN Admin
      }
    } else if (saved === 'kasir') {
      setMode('kasir');
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

  // Handler klik tombol ganti mode dengan proteksi PIN Admin
  const handleModeClick = (targetMode: DashboardMode) => {
    if (targetMode === 'kasir') {
      // Mode kasir selalu terbuka untuk semua staf
      handleModeChange('kasir');
      return;
    }

    // Jika ingin beralih ke Mode Admin Toko atau Semua Fitur
    if (isAdminUnlocked) {
      handleModeChange(targetMode);
    } else {
      setPendingMode(targetMode);
      setPinInput('');
      setPinError(null);
      setIsPinModalOpen(true);
    }
  };

  // Handler verifikasi PIN
  const handlePinSubmit = (pinToTest?: string) => {
    const candidate = (pinToTest !== undefined ? pinToTest : pinInput).trim();
    const validPin = (settings.adminPin || '2026').trim();

    if (candidate === validPin) {
      setIsAdminUnlocked(true);
      setIsPinModalOpen(false);
      setPinError(null);
      try {
        sessionStorage.setItem('cafe_admin_unlocked', 'true');
      } catch {
        // ignore
      }
      handleModeChange(pendingMode || 'admin');
    } else {
      setPinError('PIN Salah! Hanya Manager / Admin yang memiliki akses.');
      setPinInput('');
    }
  };

  // Handler kunci kembali Mode Admin
  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    try {
      sessionStorage.removeItem('cafe_admin_unlocked');
    } catch {
      // ignore
    }
    handleModeChange('kasir');
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

  // Statistik Pesanan
  const pendingVerificationOrders = initialOrders.filter((o) => o.status === 'pending_verification').length;
  const pendingCashOrders = initialOrders.filter((o) => o.status === 'pending_cash').length;
  const inProgressOrders = initialOrders.filter((o) => o.status === 'verified_paid').length;

  // Rekap Transaksi Kasir (Lunas / Selesai)
  const paidOrders = useMemo(() => {
    return initialOrders.filter((o) => o.status === 'verified_paid' || o.status === 'completed');
  }, [initialOrders]);

  const totalOmzet = useMemo(() => {
    return paidOrders.reduce((acc, curr) => acc + curr.total_price, 0);
  }, [paidOrders]);

  const cashOmzet = useMemo(() => {
    return paidOrders
      .filter((o) => o.payment_method === 'cash')
      .reduce((acc, curr) => acc + curr.total_price, 0);
  }, [paidOrders]);

  const nonCashOmzet = useMemo(() => {
    return paidOrders
      .filter((o) => o.payment_method !== 'cash')
      .reduce((acc, curr) => acc + curr.total_price, 0);
  }, [paidOrders]);

  const totalCupsSold = useMemo(() => {
    return paidOrders.reduce((acc, curr) => {
      return acc + curr.items.reduce((a, b) => a + b.quantity, 0);
    }, 0);
  }, [paidOrders]);

  return (
    <div className="space-y-7">
      {/* Tombol Pengalih Mode (Mode Kasir vs Mode Admin Toko vs Semua Fitur) */}
      <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
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

            {/* Tombol Kunci Admin (Tampil jika Admin sedang terbuka) */}
            {isAdminUnlocked && (
              <button
                type="button"
                onClick={handleLockAdmin}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer"
                title="Kunci kembali Mode Admin agar kasir tidak dapat mengubah data"
              >
                <Lock className="w-3 h-3" />
                <span>Kunci Admin</span>
              </button>
            )}
          </div>

          {/* Segmented Control Switcher */}
          <div className="grid grid-cols-3 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs font-bold sm:w-auto w-full gap-1">
            {/* Tombol Mode Kasir (Selalu Terbuka) */}
            <button
              id="btn-mode-kasir"
              type="button"
              onClick={() => handleModeClick('kasir')}
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

            {/* Tombol Mode Admin Toko (Diproteksi PIN) */}
            <button
              id="btn-mode-admin"
              type="button"
              onClick={() => handleModeClick('admin')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 sm:px-4 rounded-lg transition-all cursor-pointer ${
                mode === 'admin'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAdminUnlocked ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>Admin Toko</span>
            </button>

            {/* Tombol Semua Fitur (Diproteksi PIN) */}
            <button
              id="btn-mode-semua"
              type="button"
              onClick={() => handleModeClick('semua')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 sm:px-4 rounded-lg transition-all cursor-pointer ${
                mode === 'semua'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAdminUnlocked ? (
                <LayoutGrid className="w-4 h-4" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>Semua</span>
            </button>
          </div>
        </div>

        {/* Keterangan singkat fungsi mode yang sedang aktif */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {mode === 'kasir' && (
            <span>
              <strong>Mode Kasir:</strong> Lengkap dengan Mesin POS Order Walk-in, Kalkulator Kembalian Tunai, Cetak Struk Thermal, Verifikasi QRIS Meja, dan Rekap Omzet Harian.
            </span>
          )}
          {mode === 'admin' && (
            <span>
              <strong>Mode Admin Toko:</strong> Pendaftaran menu baru, penyesuaian harga jual, kontrol stok barang, dan cetak QR Code Meja Kafe.
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
      {/* 1. TAMPILAN MODE KASIR LENGKAP ALA KAFE PROFESIONAL      */}
      {/* ======================================================== */}
      {(mode === 'kasir' || mode === 'semua') && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Sub-Navigasi Khusus Kasir (POS, Antrean Meja, Cek Stok, Rekap Omzet) */}
          {mode === 'kasir' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setKasirSubTab('antrean')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer relative ${
                    kasirSubTab === 'antrean'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Kasir Meja (Pesanan QR)</span>
                  {pendingVerificationOrders > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] bg-red-500 text-white rounded-full animate-pulse font-black">
                      {pendingVerificationOrders}
                    </span>
                  )}
                  {pendingCashOrders > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] bg-blue-500 text-white rounded-full font-black">
                      {pendingCashOrders} Tunai
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setKasirSubTab('pos')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    kasirSubTab === 'pos'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Kasir Manual (Walk-in / Tanpa HP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setKasirSubTab('rekap')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    kasirSubTab === 'rekap'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Rekap Kasir Hari Ini</span>
                </button>

                <button
                  type="button"
                  onClick={() => setKasirSubTab('stok')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    kasirSubTab === 'stok'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Box className="w-4 h-4" />
                  <span>Stok Bar</span>
                </button>
              </div>

              {/* Status Ringkas Omzet */}
              <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 pr-2">
                <span className="text-slate-400">Total Omzet Kasir:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                  {formatRupiah(totalOmzet)}
                </span>
              </div>
            </div>
          )}

          {/* Kartu Ringkasan Cepat Kasir */}
          {mode === 'kasir' && (
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

          {/* SUB-TAB 1: MESIN KASIR POS (WALK-IN ORDER & BILLING) */}
          {(kasirSubTab === 'pos' || mode === 'semua') && (
            <section className="space-y-3">
              {mode === 'kasir' && (
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    <span>Mesin Kasir POS Kafe (Sentuh Menu & Buat Tagihan)</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    Klik menu untuk menambah pesanan walk-in
                  </span>
                </div>
              )}
              <CashierPosTerminal
                menuItems={menuItems}
                onOrderSuccess={() => router.refresh()}
              />
            </section>
          )}

          {/* SUB-TAB 2: ANTREAN MEJA & VERIFIKASI QRIS/CASH */}
          {(kasirSubTab === 'antrean' || mode === 'semua') && (
            <section className="space-y-3">
              {mode === 'kasir' && (
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span>Antrean Pesanan Masuk dari Meja Pelanggan</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    Pesanan otomatis tersinkron real-time
                  </span>
                </div>
              )}
              <StaffOrdersManager initialOrders={initialOrders} />
            </section>
          )}

          {/* SUB-TAB 3: REKAP KASIR HARI INI */}
          {mode === 'kasir' && kasirSubTab === 'rekap' && (
            <section className="space-y-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <span>Rekap Transaksi Kasir Hari Ini</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Ringkasan pendapatan kasir, transaksi lunas, dan pembagian metode bayar
                    </p>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Laporan Rekap</span>
                  </button>
                </div>

                {/* 4 Kartu Rekap Omzet */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Total Omzet Kasir</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {formatRupiah(totalOmzet)}
                    </p>
                    <p className="text-[10px] text-emerald-700/80 mt-1">{paidOrders.length} transaksi lunas</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Pemasukan Tunai (Cash)</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {formatRupiah(cashOmzet)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Uang fisik di laci kasir</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-xs font-bold text-cyan-800 dark:text-cyan-300">QRIS / Non-Tunai</p>
                    <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
                      {formatRupiah(nonCashOmzet)}
                    </p>
                    <p className="text-[10px] text-cyan-700/80 mt-1">Masuk ke rekening/EDC</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Total Cup/Porsi Terjual</p>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                      {totalCupsSold} unit
                    </p>
                    <p className="text-[10px] text-amber-700/80 mt-1">Dari seluruh transaksi</p>
                  </div>
                </div>

                {/* Tabel Riwayat Transaksi Lunas */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Daftar Transaksi Kasir Terbaru
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3">ID & Waktu</th>
                          <th className="p-3">Meja / Tipe</th>
                          <th className="p-3">Pelanggan</th>
                          <th className="p-3">Item Pesanan</th>
                          <th className="p-3">Metode</th>
                          <th className="p-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paidOrders.slice(0, 10).map((o) => (
                          <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                              #{o.id}
                              <div className="text-[10px] text-slate-400 font-normal">
                                {new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {o.table_number}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">
                              {o.customer_name}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                              {o.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                            </td>
                            <td className="p-3">
                              <span className="uppercase text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                {o.payment_method}
                              </span>
                            </td>
                            <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                              {formatRupiah(o.total_price)}
                            </td>
                          </tr>
                        ))}

                        {paidOrders.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              Belum ada transaksi lunas hari ini
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SUB-TAB 4: CEK KETERSEDIAAN STOK BAR */}
          {(kasirSubTab === 'stok' || mode === 'semua') && (
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
          
          {/* Sub-Navigasi Khusus Mode Admin Toko */}
          {mode === 'admin' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setAdminSubTab('katalog')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    adminSubTab === 'katalog'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Box className="w-4 h-4" />
                  <span>Katalog & Stok</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminSubTab('analisis')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    adminSubTab === 'analisis'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analisis & Best Sellers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminSubTab('pengaturan')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    adminSubTab === 'pengaturan'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Pengaturan Kafe & Wi-Fi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminSubTab('qr')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    adminSubTab === 'qr'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Cetak QR Meja</span>
                </button>
              </div>

              {/* Status Toko Aktif */}
              <div className="hidden md:flex items-center gap-2 text-xs font-bold pr-2">
                <span className="text-slate-400">Status Kafe:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  settings.isOpen
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                }`}>
                  {settings.isOpen ? '🟢 Buka' : '🔴 Tutup Sementara'}
                </span>
              </div>
            </div>
          )}

          {/* SUB-TAB ADMIN 1: KATALOG & STOK */}
          {(adminSubTab === 'katalog' || mode === 'semua') && (
            <div className="space-y-6">
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

              {/* Form Tambah Menu Baru (Khusus Admin) */}
              <section>
                <AddMenuForm />
              </section>

              {/* Manajemen Data Menu & Stok dengan Tombol Restock Massal */}
              <section className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Manajemen Data Menu & Stok
                    </h2>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Menampilkan {menuItems.length} menu terdaftar • {lowStockMenu + outOfStockMenu} stok butuh perhatian
                    </span>
                  </div>

                  {/* Tombol Restock Cepat Massal (+20 Porsi) */}
                  {lowStockMenu + outOfStockMenu > 0 && (
                    <button
                      type="button"
                      disabled={isRestocking}
                      onClick={handleBatchRestock}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-amber-900 dark:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm"
                    >
                      <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span>
                        {isRestocking
                          ? 'Sedang Mengisi Ulang...'
                          : `⚡ Restock Cepat ${lowStockMenu + outOfStockMenu} Menu Menipis (+20 Porsi)`}
                      </span>
                    </button>
                  )}
                </div>
                <MenuCatalog initialItems={menuItems} />
              </section>
            </div>
          )}

          {/* SUB-TAB ADMIN 2: ANALISIS PENJUALAN & BEST SELLERS */}
          {(adminSubTab === 'analisis' || mode === 'semua') && (
            <AdminAnalytics orders={initialOrders} menuItems={menuItems} />
          )}

          {/* SUB-TAB ADMIN 3: PENGATURAN TOKO & WI-FI */}
          {(adminSubTab === 'pengaturan' || mode === 'semua') && (
            <AdminStoreSettings
              initialSettings={settings}
              onSaved={(newS) => {
                setSettings(newS);
                router.refresh();
              }}
            />
          )}

          {/* SUB-TAB ADMIN 4: GENERATOR & CETAK QR MEJA */}
          {(adminSubTab === 'qr' || mode === 'semua') && (
            <section>
              <TableQrGenerator />
            </section>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL OTORISASI PIN ADMIN TOKO (Proteksi Kasir vs Admin)
          ========================================================================= */}
      {isPinModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => {
            setIsPinModalOpen(false);
            setPinInput('');
            setPinError(null);
          }}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon Header */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Otorisasi Admin Toko
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Mode Admin memuat analisis omzet, ubah harga, dan pengaturan kafe. Masukkan PIN Admin untuk melanjutkan:
              </p>
            </div>

            {/* Notifikasi Error jika PIN Salah */}
            {pinError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {/* Input Tersembunyi untuk Keyboard Fisik */}
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={pinInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPinInput(val);
                setPinError(null);
                const valid = (settings.adminPin || '2026').trim();
                if (val === valid) {
                  handlePinSubmit(val);
                }
              }}
              className="sr-only"
            />

            {/* Indikator Visual Titik-Titik PIN */}
            <div className="flex items-center justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    pinInput.length > idx
                      ? 'bg-amber-600 scale-110 shadow-sm shadow-amber-600/40 ring-4 ring-amber-500/20'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {/* Touch Numpad (Sangat Nyaman di Layar Sentuh Tablet Kasir) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => (
                <button
                  key={btn}
                  type="button"
                  onClick={() => {
                    setPinError(null);
                    if (btn === 'C') {
                      setPinInput('');
                    } else if (btn === '⌫') {
                      setPinInput((prev) => prev.slice(0, -1));
                    } else {
                      if (pinInput.length < 6) {
                        const next = pinInput + btn;
                        setPinInput(next);
                        const valid = (settings.adminPin || '2026').trim();
                        if (next === valid) {
                          handlePinSubmit(next);
                        }
                      }
                    }
                  }}
                  className={`h-12 rounded-2xl font-extrabold text-base transition active:scale-95 cursor-pointer ${
                    btn === 'C'
                      ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                      : btn === '⌫'
                      ? 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      : 'text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white shadow-xs'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Tombol Aksi Batal */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsPinModalOpen(false);
                  setPinInput('');
                  setPinError(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal (Tetap di Mode Kasir)
              </button>
            </div>

            <p className="text-[10px] text-slate-400 pt-1">
              Default PIN: <strong className="font-mono text-slate-600 dark:text-slate-300">2026</strong> (Dapat diubah di Tab Pengaturan Kafe)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
