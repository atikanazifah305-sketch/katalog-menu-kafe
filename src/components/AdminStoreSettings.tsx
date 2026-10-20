'use client';

import { useState, useTransition } from 'react';
import type { CafeSettings } from '@/types/settings';
import { updateCafeSettingsAction } from '@/app/actions';
import { 
  Store, 
  Wifi, 
  Megaphone, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Percent, 
  Power,
  Sparkles,
  Loader2,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

interface AdminStoreSettingsProps {
  initialSettings: CafeSettings;
  onSaved?: (settings: CafeSettings) => void;
}

export default function AdminStoreSettings({
  initialSettings,
  onSaved,
}: AdminStoreSettingsProps) {
  const [settings, setSettings] = useState<CafeSettings>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await updateCafeSettingsAction(settings);
        if (res.success) {
          setSuccessMessage('Pengaturan kafe berhasil disimpan dan disinkronkan ke seluruh sistem!');
          if (onSaved) onSaved(res.settings);
          setTimeout(() => setSuccessMessage(null), 4000);
        } else {
          setErrorMessage('Gagal menyimpan pengaturan.');
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Alert Notifikasi Sukses / Error */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid 2 Kolom: Profil Kafe & Wi-Fi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* KARTU 1: PROFIL & STATUS OPERASIONAL KAFE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Identitas & Operasional Toko
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nama kafe, alamat, kontak WhatsApp, dan jam operasional
                </p>
              </div>
            </div>

            {/* Toggle Status Buka / Tutup */}
            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, isOpen: !prev.isOpen }))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer ${
                settings.isOpen
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{settings.isOpen ? 'Toko Buka' : 'Toko Tutup'}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Nama Kafe */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Kafe / Coffee Shop
              </label>
              <input
                type="text"
                value={settings.cafeName}
                onChange={(e) => setSettings({ ...settings, cafeName: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Alamat Kafe */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Kafe (Tampil di Struk Kasir)
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Telepon / WA */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Jam Operasional */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jam Operasional
                </label>
                <input
                  type="text"
                  value={settings.operatingHours}
                  onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
                  placeholder="08:00 - 22:00 WIB"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* KARTU 2: PENGATURAN PASSWORD WI-FI MEJA KAFE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Pengaturan Wi-Fi Meja Pelanggan
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Otomatis tampil di struk kasir dan halaman menu ponsel pelanggan
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Jaringan Wi-Fi (SSID)
              </label>
              <input
                type="text"
                value={settings.wifiSsid}
                onChange={(e) => setSettings({ ...settings, wifiSsid: e.target.value })}
                placeholder="KafeAtika_5G"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kata Sandi Wi-Fi (Password)
              </label>
              <input
                type="text"
                value={settings.wifiPassword}
                onChange={(e) => setSettings({ ...settings, wifiPassword: e.target.value })}
                placeholder="kopi2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            {/* Pratinjau Tampilan Wi-Fi */}
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-800 text-blue-900 dark:text-blue-300 space-y-1">
              <span className="font-bold block flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Pratinjau di Struk & Menu Pelanggan:
              </span>
              <p className="font-mono text-xs">
                Wi-Fi: <strong>{settings.wifiSsid || 'KafeAtika'}</strong> • Sandi: <strong>{settings.wifiPassword || 'kopi2026'}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 2 Kolom Bawah: Banner Promo & Pajak */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* KARTU 3: BANNER PROMO & PENGUMUMAN KATALOG */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Banner Pengumuman & Promo
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Teks berjalan / banner di atas katalog menu pelanggan
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, promoBannerActive: !prev.promoBannerActive }))}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                settings.promoBannerActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {settings.promoBannerActive ? 'Aktif' : 'Nonaktif'}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Teks Pengumuman Promo
              </label>
              <textarea
                rows={3}
                value={settings.promoBannerText}
                onChange={(e) => setSettings({ ...settings, promoBannerText: e.target.value })}
                placeholder="Contoh: ✨ Promo Spesial Hari Ini: Beli 2 Kopi Gratis 1 Donat!"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* KARTU 4: PENGATURAN PAJAK RESTO (PB1) & SERVICE CHARGE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Pajak Restoran (PB1) & Biaya Layanan
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur persentase pajak restoran dan service charge (opsional)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pajak Restoran (PB1 %)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={settings.taxPercent}
                onChange={(e) => setSettings({ ...settings, taxPercent: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Set 0% jika harga sudah termasuk pajak</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Biaya Layanan (Service %)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={settings.serviceChargePercent}
                onChange={(e) => setSettings({ ...settings, serviceChargePercent: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Set 0% jika bebas service charge</span>
            </div>
          </div>
        </div>

        {/* PIN Keamanan Mode Admin */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                PIN Keamanan Otorisasi Admin Toko
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PIN ini wajib dimasukkan oleh kasir jika ingin membuka Mode Admin Toko atau mengubah pengaturan kafe.
              </p>
            </div>
          </div>

          <div className="max-w-xs space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              PIN Admin Toko (4-6 digit angka)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={settings.adminPin || '2026'}
              onChange={(e) => setSettings({ ...settings, adminPin: e.target.value.replace(/\D/g, '') })}
              placeholder="2026"
              className="w-full px-3.5 py-2.5 text-sm tracking-widest font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <span className="text-[10px] text-slate-400 block">
              Default: <strong>2026</strong>. Hanya berikan PIN ini kepada Owner / Store Manager.
            </span>
          </div>
        </div>
      </div>

      {/* Tombol Simpan Perubahan */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-95 disabled:opacity-50 transition shadow-xl shadow-amber-600/30 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan Pengaturan...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Kafe</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
