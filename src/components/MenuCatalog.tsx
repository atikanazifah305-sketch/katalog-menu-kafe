'use client';

import { useState, useTransition, useEffect } from 'react';
import { MenuItem } from '@/types/menu';
import { toggleMenuStatus, deleteMenuItem, updateMenuStock } from '@/app/actions';
import EditMenuModal from './EditMenuModal';
import { 
  Coffee, 
  CupSoda, 
  Utensils, 
  Cookie, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  LayoutGrid, 
  Table as TableIcon,
  Tag, 
  AlertCircle, 
  Plus, 
  Minus, 
  Box
} from 'lucide-react';

interface MenuCatalogProps {
  initialItems: MenuItem[];
}

export default function MenuCatalog({ initialItems }: MenuCatalogProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Sinkronkan state lokal setiap kali server revalidate initialItems
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // State untuk modal edit
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State untuk tracking item yang sedang di-toggle, dihapus, atau diubah stoknya
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Helper format rupiah
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper icon kategori
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Kopi':
        return <Coffee className="w-3.5 h-3.5 text-amber-500" />;
      case 'Non-Kopi':
        return <CupSoda className="w-3.5 h-3.5 text-cyan-500" />;
      case 'Makanan':
        return <Utensils className="w-3.5 h-3.5 text-orange-500" />;
      case 'Snack':
        return <Cookie className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Helper badge warna kategori
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Kopi':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'Non-Kopi':
        return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20';
      case 'Makanan':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20';
      case 'Snack':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
    }
  };

  // Helper status stok dinamis:
  // 🟢 Hijau (Emerald): Stok aman (> 5 porsi)
  // 🟡 Kuning (Amber): Stok menipis (1 – 5 porsi)
  // 🔴 Merah (Rose): Stok habis (0 porsi)
  const getStockBadgeInfo = (stock: number) => {
    if (stock > 5) {
      return {
        label: 'Stok Aman',
        countText: `${stock} porsi`,
        badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-500',
        dotPulse: false,
        icon: '🟢',
      };
    } else if (stock >= 1) {
      return {
        label: 'Stok Menipis',
        countText: `${stock} porsi`,
        badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-500',
        dotPulse: true,
        icon: '🟡',
      };
    } else {
      return {
        label: 'Stok Habis',
        countText: '0 porsi (Habis)',
        badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
        dotClass: 'bg-rose-500',
        dotPulse: false,
        icon: '🔴',
      };
    }
  };

  // Handler toggle status ketersediaan (dengan Optimistic Update instan)
  const handleToggleStatus = (item: MenuItem) => {
    const nextStatus = !item.is_ready;
    const nextStock = nextStatus ? (item.stock && item.stock > 0 ? item.stock : 20) : 0;

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_ready: nextStatus, stock: nextStock } : i))
    );

    setPendingActionId(item.id);
    startTransition(async () => {
      try {
        const res = await toggleMenuStatus(item.id, item.is_ready);
        if (!res.success) {
          setItems(initialItems);
          alert(res.error || 'Gagal memperbarui status');
        }
      } catch (err: unknown) {
        setItems(initialItems);
        alert(err instanceof Error ? err.message : 'Gagal memperbarui status');
      } finally {
        setPendingActionId(null);
      }
    });
  };

  // Handler ubah cepat stok (+ / -) (dengan Optimistic Update instan)
  const handleQuickStock = (item: MenuItem, delta: number) => {
    const currentStock = typeof item.stock === 'number' ? item.stock : (item.is_ready ? 20 : 0);
    const newStock = Math.max(0, currentStock + delta);
    const nextIsReady = newStock > 0;

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, stock: newStock, is_ready: nextIsReady } : i))
    );

    setPendingActionId(item.id);
    startTransition(async () => {
      try {
        const res = await updateMenuStock(item.id, newStock);
        if (!res.success) {
          setItems(initialItems);
          alert(res.error || 'Gagal memperbarui stok');
        }
      } catch (err: unknown) {
        setItems(initialItems);
        alert(err instanceof Error ? err.message : 'Gagal memperbarui stok');
      } finally {
        setPendingActionId(null);
      }
    });
  };

  // Handler hapus menu dengan konfirmasi sederhana (dengan Optimistic Update)
  const handleDelete = (item: MenuItem) => {
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus "${item.name}" dari katalog menu?`
    );
    if (!isConfirmed) return;

    setItems((prev) => prev.filter((i) => i.id !== item.id));

    setPendingActionId(item.id);
    startTransition(async () => {
      try {
        const res = await deleteMenuItem(item.id);
        if (!res.success) {
          setItems(initialItems);
          alert(res.error || 'Gagal menghapus menu');
        }
      } catch (err: unknown) {
        setItems(initialItems);
        alert(err instanceof Error ? err.message : 'Gagal menghapus menu');
      } finally {
        setPendingActionId(null);
      }
    });
  };

  // Handler buka edit modal
  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan', 'Snack'];

  return (
    <div className="space-y-6">
      {/* Search, Filter Tabs & View Mode Switch */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Layout Toggles */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              title="Tampilan Grid Card"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Tampilan Tabel"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Indikator Status Stok Legend */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs shadow-xs">
        <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-amber-500" />
          Status Stok:
        </span>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>🟢 Stok Aman (&gt; 5 porsi)</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span>🟡 Stok Menipis (1 – 5 porsi)</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25 font-semibold">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>🔴 Stok Habis (0 porsi)</span>
        </div>
      </div>

      {/* Konten Menu */}
      {filteredItems.length === 0 ? (
        <div className="py-16 px-6 text-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
            Menu Tidak Ditemukan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {initialItems.length === 0
              ? 'Database masih kosong. Silakan gunakan form di atas untuk menambahkan menu kafe pertama Anda.'
              : 'Tidak ada menu yang sesuai dengan filter atau kata kunci pencarian Anda.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const isProcessing = pendingActionId === item.id;
            const itemStock = typeof item.stock === 'number' ? item.stock : (item.is_ready ? 20 : 0);
            const stockInfo = getStockBadgeInfo(itemStock);

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col justify-between bg-white dark:bg-slate-900 border rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${
                  itemStock === 0
                    ? 'border-rose-300/80 dark:border-rose-950/70 bg-rose-50/15 dark:bg-slate-900/70'
                    : itemStock <= 5
                    ? 'border-amber-300/80 dark:border-amber-950/70 bg-amber-50/15 dark:bg-slate-900/70'
                    : 'border-slate-200/80 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div>
                  {/* Top Bar: Kategori Badge & Status Toggle */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getCategoryBadgeClass(
                        item.category
                      )}`}
                    >
                      {getCategoryIcon(item.category)}
                      {item.category}
                    </span>

                    {/* Interactive Status Toggle Badge */}
                    <button
                      onClick={() => handleToggleStatus(item)}
                      disabled={isProcessing}
                      title="Klik untuk mengubah status ketersediaan"
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition active:scale-95 cursor-pointer ${
                        item.is_ready && itemStock > 0
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 hover:bg-rose-500/25 border border-rose-500/30'
                      }`}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : item.is_ready && itemStock > 0 ? (
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-500" />
                      )}
                      <span>{item.is_ready && itemStock > 0 ? 'Ready' : 'Habis'}</span>
                    </button>
                  </div>

                  {/* Nama Menu */}
                  <h3 className="text-base font-bold text-slate-800 dark:text-white line-clamp-1 mb-1">
                    {item.name}
                  </h3>

                  {/* Harga Menu */}
                  <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mb-3">
                    {formatRupiah(item.price)}
                  </div>

                  {/* Panel Stok Interaktif dengan Badge Warna Dinamis Sesuai Aturan */}
                  <div className="p-3 bg-slate-50/90 dark:bg-slate-800/70 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                    {/* Baris Status & Jumlah Stok */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2.5 w-2.5">
                          {stockInfo.dotPulse && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          )}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${stockInfo.dotClass}`} />
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {stockInfo.label}
                        </span>
                      </div>

                      {/* Badge Dinamis: 🟢 >5 | 🟡 1-5 | 🔴 0 */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${stockInfo.badgeClass}`}
                      >
                        <Box className="w-3 h-3" />
                        <span>{stockInfo.countText}</span>
                      </span>
                    </div>

                    {/* Stepper Cepat Ubah Stok (+ / -) */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Ubah Stok:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickStock(item, -1)}
                          disabled={isProcessing || itemStock <= 0}
                          title="Kurangi stok 1 porsi"
                          className="flex items-center justify-center w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 disabled:opacity-30 transition cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-extrabold min-w-8 text-center text-slate-800 dark:text-slate-100">
                          {itemStock}
                        </span>
                        <button
                          onClick={() => handleQuickStock(item, 1)}
                          disabled={isProcessing}
                          title="Tambah stok 1 porsi"
                          className="flex items-center justify-center w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 disabled:opacity-30 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: Edit & Hapus */}
                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    Edit Detail & Stok
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Nama Menu</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Harga</th>
                  <th className="py-3.5 px-4">Kelola Stok</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {filteredItems.map((item) => {
                  const isProcessing = pendingActionId === item.id;
                  const itemStock = typeof item.stock === 'number' ? item.stock : (item.is_ready ? 20 : 0);
                  const stockInfo = getStockBadgeInfo(itemStock);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getCategoryBadgeClass(
                            item.category
                          )}`}
                        >
                          {getCategoryIcon(item.category)}
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400">
                        {formatRupiah(item.price)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-2.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${stockInfo.badgeClass}`}
                          >
                            <span className="relative flex h-2 w-2">
                              {stockInfo.dotPulse && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              )}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${stockInfo.dotClass}`} />
                            </span>
                            <span>{itemStock} porsi</span>
                            <span className="text-[10px] font-semibold opacity-75">({stockInfo.label})</span>
                          </span>

                          <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <button
                              onClick={() => handleQuickStock(item, -1)}
                              disabled={isProcessing || itemStock <= 0}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                              title="Kurang 1 porsi"
                            >
                              <Minus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                            </button>
                            <button
                              onClick={() => handleQuickStock(item, 1)}
                              disabled={isProcessing}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                              title="Tambah 1 porsi"
                            >
                              <Plus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={isProcessing}
                          title="Klik untuk mengubah status"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition active:scale-95 cursor-pointer ${
                            item.is_ready && itemStock > 0
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 hover:bg-rose-500/25 border border-rose-500/30'
                          }`}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : item.is_ready && itemStock > 0 ? (
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-500" />
                          )}
                          <span>{item.is_ready && itemStock > 0 ? 'Ready' : 'Habis'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            disabled={isProcessing}
                            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Edit Data & Stok"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={isProcessing}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                            title="Hapus Menu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Edit Menu & Stok */}
      <EditMenuModal
        item={editingItem}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
      />
    </div>
  );
}
