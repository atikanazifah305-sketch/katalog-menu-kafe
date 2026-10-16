'use client';

import { useRef, useState, useTransition } from 'react';
import { addMenuItem } from '@/app/actions';
import { MENU_CATEGORIES } from '@/types/menu';
import { PlusCircle, Loader2, Sparkles, Check } from 'lucide-react';

export default function AddMenuForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (formData: FormData) => {
    setErrorMsg(null);
    setShowSuccess(false);

    startTransition(async () => {
      try {
        await addMenuItem(formData);
        formRef.current?.reset();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg('Gagal menambahkan menu baru.');
        }
      }
    });
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
      <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            Tambah Menu Baru
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daftarkan menu kopi, minuman, snack, harga, dan jumlah stok awal
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {showSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> Menu berhasil ditambahkan ke katalog!
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4">
          {/* Input Nama Menu */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Nama Menu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: Roasted Hazelnut Latte"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          {/* Dropdown Kategori */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              required
              defaultValue="Kopi"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition cursor-pointer"
            >
              {MENU_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Input Harga */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Harga (IDR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-medium">
                Rp
              </span>
              <input
                type="number"
                name="price"
                min="0"
                step="500"
                required
                placeholder="25000"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
          </div>

          {/* Input Jumlah Stok Awal */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Stok Awal
            </label>
            <input
              type="number"
              name="stock"
              min="0"
              defaultValue="20"
              required
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>
        </div>

        {/* Tombol Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-95 disabled:opacity-50 transition shadow-lg shadow-amber-600/25 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan Menu...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Tambah ke Menu
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
