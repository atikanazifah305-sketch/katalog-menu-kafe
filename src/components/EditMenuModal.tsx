'use client';

import { useState, useTransition, useEffect } from 'react';
import { updateMenuItem } from '@/app/actions';
import { MenuItem, MENU_CATEGORIES } from '@/types/menu';
import { X, Loader2, Save, CheckCircle2, XCircle, Plus, Minus, Layers } from 'lucide-react';

interface EditMenuModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditMenuModal({ item, isOpen, onClose }: EditMenuModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local state for stock and is_ready
  const [stock, setStock] = useState<number>(20);
  const [isReady, setIsReady] = useState<boolean>(true);

  // Sync state when item changes
  useEffect(() => {
    if (item) {
      setStock(item.stock !== undefined ? item.stock : 20);
      setIsReady(item.is_ready);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleStockChange = (newStock: number) => {
    const validStock = Math.max(0, newStock);
    setStock(validStock);
    // Jika stok 0, otomatis ubah status jadi Habis
    if (validStock === 0) {
      setIsReady(false);
    } else if (!isReady && validStock > 0) {
      // Jika sebelumnya habis dan stok ditambah > 0, bisa tetap atau aktifkan
      setIsReady(true);
    }
  };

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const res = await updateMenuItem(formData);
        if (!res.success) {
          setErrorMessage(res.error || 'Terjadi kesalahan saat memperbarui menu.');
          return;
        }
        onClose();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Terjadi kesalahan saat memperbarui menu.');
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              Edit Menu & Stok
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Perbarui harga, kategori, dan status ketersediaan stok
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Form Edit */}
        <form action={handleSubmit} className="mt-5 space-y-4">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="is_ready" value={isReady ? 'true' : 'false'} />

          {/* Nama Menu */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Menu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              defaultValue={item.name}
              required
              placeholder="Contoh: Caramel Macchiato"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          {/* Kategori & Harga */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                defaultValue={item.category}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              >
                {MENU_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Harga (Rp) <span className="text-red-500">*</span>
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
                  defaultValue={item.price}
                  required
                  placeholder="30000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Pengaturan Stok & Ketersediaan */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Manajemen Ketersediaan & Stok
              </span>
            </div>

            {/* Pilihan Status: Ready vs Habis */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                Status Ketersediaan
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReady(true)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isReady
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Ready (Tersedia)
                </button>

                <button
                  type="button"
                  onClick={() => setIsReady(false)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    !isReady
                      ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Habis (Kosong)
                </button>
              </div>
            </div>

            {/* Input Jumlah Stok (Porsi / Pcs) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Jumlah Stok (Porsi / Unit)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStockChange(stock - 1)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  title="Kurang 1"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  name="stock"
                  min="0"
                  value={stock}
                  onChange={(e) => handleStockChange(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-center py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <button
                  type="button"
                  onClick={() => handleStockChange(stock + 1)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  title="Tambah 1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Tip: Jika stok bernilai 0, status otomatis disetel menjadi &quot;Habis&quot;.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 disabled:opacity-50 transition shadow-lg shadow-amber-600/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
