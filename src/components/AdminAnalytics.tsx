'use client';

import { useMemo } from 'react';
import { MenuItem } from '@/types/menu';
import { CafeOrder } from '@/types/order';
import { 
  TrendingUp, 
  Award, 
  Clock, 
  Download, 
  Printer, 
  PieChart, 
  AlertCircle, 
  Flame, 
  Coffee, 
  Calendar, 
  ArrowUpRight, 
  Layers,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface AdminAnalyticsProps {
  orders: CafeOrder[];
  menuItems: MenuItem[];
}

export default function AdminAnalytics({ orders, menuItems }: AdminAnalyticsProps) {
  // Hanya hitung pesanan yang valid (lunas / diproses / selesai)
  const validOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'cancelled');
  }, [orders]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // 1. Analisis Menu Terlaris (Best Sellers)
  const menuSalesMap = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};

    validOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.name;
        if (!map[key]) {
          const menuItem = menuItems.find((m) => m.name === item.name || m.id === item.menuItemId);
          map[key] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            category: menuItem?.category || 'Kopi',
          };
        }
        map[key].quantity += item.quantity;
        map[key].revenue += item.price * item.quantity;
      });
    });

    return Object.values(map).sort((a, b) => b.quantity - a.quantity);
  }, [validOrders, menuItems]);

  const topBestSellers = menuSalesMap.slice(0, 5);
  const maxSoldQty = topBestSellers[0]?.quantity || 1;

  // 2. Menu Kurang Laku (Slow Moving)
  const slowMovingItems = useMemo(() => {
    const soldNames = new Set(menuSalesMap.map((m) => m.name.toLowerCase()));
    const unSold = menuItems.filter((m) => !soldNames.has(m.name.toLowerCase()));
    const lowSold = menuSalesMap.filter((m) => m.quantity <= 2);

    const combined = [
      ...unSold.map((m) => ({ name: m.name, quantity: 0, category: m.category, price: Number(m.price) })),
      ...lowSold.map((m) => ({ name: m.name, quantity: m.quantity, category: m.category, price: m.revenue / m.quantity })),
    ];

    return combined.slice(0, 5);
  }, [menuItems, menuSalesMap]);

  // 3. Analisis Jam Tersibuk (Peak Hours)
  const peakHoursData = useMemo(() => {
    const slots = {
      'Pagi (08:00 - 11:00)': 0,
      'Siang (11:00 - 14:00)': 0,
      'Sore (14:00 - 18:00)': 0,
      'Malam (18:00 - 22:00)': 0,
    };

    validOrders.forEach((o) => {
      const date = new Date(o.created_at);
      const hour = date.getHours();
      if (hour >= 8 && hour < 11) slots['Pagi (08:00 - 11:00)']++;
      else if (hour >= 11 && hour < 14) slots['Siang (11:00 - 14:00)']++;
      else if (hour >= 14 && hour < 18) slots['Sore (14:00 - 18:00)']++;
      else slots['Malam (18:00 - 22:00)']++;
    });

    return slots;
  }, [validOrders]);

  const busiestSlot = useMemo(() => {
    let max = -1;
    let slotName = 'Sore (14:00 - 18:00)';
    Object.entries(peakHoursData).forEach(([slot, count]) => {
      if (count > max) {
        max = count;
        slotName = slot;
      }
    });
    return { slotName, count: Math.max(0, max) };
  }, [peakHoursData]);

  // 4. Breakdown Penjualan per Kategori
  const categorySales = useMemo(() => {
    const catMap: Record<string, number> = {
      Kopi: 0,
      'Non-Kopi': 0,
      Makanan: 0,
      Snack: 0,
    };

    validOrders.forEach((order) => {
      order.items.forEach((item) => {
        const menuItem = menuItems.find((m) => m.name === item.name || m.id === item.menuItemId);
        const cat = menuItem?.category || 'Kopi';
        if (catMap[cat] !== undefined) {
          catMap[cat] += item.price * item.quantity;
        } else {
          catMap[cat] = item.price * item.quantity;
        }
      });
    });

    const total = Object.values(catMap).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(catMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / total) * 100),
    }));
  }, [validOrders, menuItems]);

  // 5. Ekspor Data ke File CSV / Excel
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('Belum ada data transaksi untuk diekspor.');
      return;
    }

    const headers = ['Order ID', 'Waktu', 'Nomor Meja', 'Pelanggan', 'Metode Bayar', 'Status', 'Item Pesanan', 'Total Tagihan (IDR)'];
    const rows = orders.map((o) => {
      const itemsStr = o.items.map((it) => `${it.quantity}x ${it.name}`).join(' | ');
      return [
        `#${o.id}`,
        `"${new Date(o.created_at).toLocaleString('id-ID')}"`,
        `"${o.table_number}"`,
        `"${o.customer_name}"`,
        `"${o.payment_method.toUpperCase()}"`,
        `"${o.status}"`,
        `"${itemsStr}"`,
        o.total_price,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Penjualan_Kafe_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Analisis & Tombol Ekspor */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-500" />
            <span>Analisis Penjualan & Performa Menu Kafe</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data menu terlaris, waktu tersibuk pelanggan, dan ekspor laporan pembukuan toko
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Grid 2 Kolom: Best Sellers & Jam Tersibuk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* KOLOM 1: TOP 5 MENU TERLARIS (BEST SELLERS) (7 Kolom) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Top 5 Menu Paling Laris (Best Sellers)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menu yang paling banyak dipesan oleh pelanggan kafe
                </p>
              </div>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-4">
            {topBestSellers.map((item, idx) => {
              const percentage = Math.round((item.quantity / maxSoldQty) * 100);
              const rankBadge =
                idx === 0 ? 'bg-amber-500 text-white' :
                idx === 1 ? 'bg-slate-400 text-white' :
                idx === 2 ? 'bg-amber-700 text-white' :
                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';

              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${rankBadge}`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        {item.category}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {item.quantity} porsi
                      </span>
                      <span className="text-slate-400 text-[10px] block">
                        {formatRupiah(item.revenue)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Visual */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {topBestSellers.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                <Coffee className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">Belum ada data penjualan menu</p>
              </div>
            )}
          </div>
        </div>

        {/* KOLOM 2: WAKTU TERSIBUK & DISTRIBUSI KATEGORI (5 Kolom) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Kartu Jam Tersibuk (Peak Hours) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Jam Tersibuk Pelanggan (Peak Hours)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Waktu paling ramai kunjungan meja
                </p>
              </div>
            </div>

            {/* Rekomendasi Barista */}
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-2xl border border-cyan-200/80 dark:border-cyan-800 text-xs text-cyan-900 dark:text-cyan-300">
              <span className="font-bold block">🔥 Paling Ramai: {busiestSlot.slotName}</span>
              <span className="text-[11px] opacity-80">
                {busiestSlot.count} pesanan masuk pada slot waktu ini. Siapkan barista tambahan!
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {Object.entries(peakHoursData).map(([slot, count]) => (
                <div key={slot} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">{slot}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{count} pesanan</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kartu Proporsi Omzet per Kategori */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <PieChart className="w-5 h-5 text-indigo-500" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Kontribusi Omzet per Kategori
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {categorySales.map((cat) => (
                <div key={cat.category} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500 block text-[10px]">{cat.category}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                    {cat.percentage}%
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {formatRupiah(cat.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Menu Slow Moving (Evaluasi / Butuh Promo) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Evaluasi Menu Kurang Laku (Slow Moving Items)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Menu dengan penjualan rendah (0 – 2 porsi). Disarankan untuk promo diskon atau bundling paket hemat.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {slowMovingItems.map((item) => (
            <div
              key={item.name}
              className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
            >
              <span className="text-[10px] font-semibold text-slate-400">{item.category}</span>
              <h5 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">{item.name}</h5>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                  {item.quantity} terjual
                </span>
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  Perlu Promo
                </span>
              </div>
            </div>
          ))}

          {slowMovingItems.length === 0 && (
            <p className="col-span-full py-4 text-center text-xs text-slate-400">
              Hebat! Seluruh menu memiliki perputaran penjualan yang baik.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
