'use client';

import { useState, useEffect, useCallback } from 'react';
import { CafeOrder, OrderStatus } from '@/types/order';
import { 
  getOrdersAction, 
  updateOrderStatusAction 
} from '@/app/actions';
import { 
  QrCode, 
  Banknote, 
  Landmark, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChefHat, 
  RefreshCw, 
  AlertCircle, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';

interface StaffOrdersManagerProps {
  initialOrders?: CafeOrder[];
}

export default function StaffOrdersManager({ initialOrders = [] }: StaffOrdersManagerProps) {
  const [orders, setOrders] = useState<CafeOrder[]>(initialOrders);
  const [filter, setFilter] = useState<'all' | 'verification' | 'cash' | 'active'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getOrdersAction();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, []);

  // Polling data pesanan masuk setiap 4 detik untuk staf kasir/barista
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setActionLoadingId(orderId);
    try {
      await updateOrderStatusAction(orderId, newStatus);
      await fetchOrders();
    } catch (err) {
      console.error('Gagal memperbarui status order:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Jumlah pesanan yang butuh verifikasi QRIS / Transfer
  const pendingVerificationCount = orders.filter(
    (o) => o.status === 'pending_verification'
  ).length;

  const pendingCashCount = orders.filter((o) => o.status === 'pending_cash').length;

  // Filter list
  const filteredOrders = orders.filter((o) => {
    if (filter === 'verification') return o.status === 'pending_verification';
    if (filter === 'cash') return o.status === 'pending_cash';
    if (filter === 'active') return o.status === 'verified_paid';
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
      {/* Header Panel Verifikasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              Pesanan Masuk & Verifikasi Kasir
            </h2>
            {pendingVerificationCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse">
                {pendingVerificationCount} Perlu Dicek
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pantau pembayaran meja pelanggan. Cek mutasi rekening/EDC lalu klik verifikasi agar pesanan otomatis diproses.
          </p>
        </div>

        <button
          onClick={async () => {
            setIsLoading(true);
            await fetchOrders();
            setIsLoading(false);
          }}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          Segarkan
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
            filter === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Semua ({orders.length})
        </button>
        <button
          onClick={() => setFilter('verification')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            filter === 'verification'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20'
          }`}
        >
          Perlu Verifikasi QRIS/TF ({pendingVerificationCount})
        </button>
        <button
          onClick={() => setFilter('cash')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            filter === 'cash'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-blue-500/10 text-blue-800 dark:text-blue-300 hover:bg-blue-500/20'
          }`}
        >
          Bayar di Kasir ({pendingCashCount})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            filter === 'active'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20'
          }`}
        >
          Sedang Diracik ({orders.filter((o) => o.status === 'verified_paid').length})
        </button>
      </div>

      {/* Daftar Pesanan */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
          <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Belum ada pesanan pada filter ini
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Pesanan baru dari meja pelanggan akan otomatis tampil di sini secara real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const isPendingVerification = order.status === 'pending_verification';
            const isPendingCash = order.status === 'pending_cash';
            const isVerified = order.status === 'verified_paid';
            const isCompleted = order.status === 'completed';
            const isCancelled = order.status === 'cancelled';

            return (
              <div
                key={order.id}
                className={`p-4 sm:p-5 rounded-3xl border transition space-y-3.5 relative overflow-hidden ${
                  isPendingVerification
                    ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-400/20'
                    : isPendingCash
                    ? 'border-blue-300 bg-blue-50/30 dark:bg-blue-950/15'
                    : isVerified
                    ? 'border-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 opacity-75'
                }`}
              >
                {/* Header Kartu Pesanan */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {order.table_number}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        • {order.customer_name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                      {order.id} • {order.created_at} WIB
                    </span>
                  </div>

                  {/* Badge Status */}
                  <div>
                    {isPendingVerification && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-sm">
                        <Clock className="w-3 h-3 animate-spin" />
                        Perlu Verifikasi Kasir
                      </span>
                    )}
                    {isPendingCash && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                        <Banknote className="w-3 h-3" />
                        Bayar di Kasir
                      </span>
                    )}
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                        <ChefHat className="w-3 h-3 animate-bounce" />
                        Sedang Diracik
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Selesai Diantar
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                        <XCircle className="w-3 h-3" />
                        Dibatalkan
                      </span>
                    )}
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  {order.payment_method === 'qris' && (
                    <>
                      <QrCode className="w-4 h-4 text-emerald-500" />
                      <span>Metode: QRIS Mandiri di Meja</span>
                    </>
                  )}
                  {order.payment_method === 'transfer' && (
                    <>
                      <Landmark className="w-4 h-4 text-cyan-500" />
                      <span>Metode: Transfer Bank Mandiri</span>
                    </>
                  )}
                  {order.payment_method === 'cash' && (
                    <>
                      <Banknote className="w-4 h-4 text-amber-500" />
                      <span>Metode: Uang Tunai di Meja Kasir</span>
                    </>
                  )}
                </div>

                {/* Daftar Menu Pesanan */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 text-xs space-y-1.5 border border-slate-200/70 dark:border-slate-800">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.quantity}x {item.name}
                        </span>
                        {item.note && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 italic block">
                            Catatan: {item.note}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 flex justify-between items-center font-black text-slate-900 dark:text-white">
                    <span>Total Tagihan:</span>
                    <span className="text-amber-600 dark:text-amber-400 text-sm">
                      {formatRupiah(order.total_price)}
                    </span>
                  </div>
                </div>

                {/* Tombol Aksi Verifikasi untuk Staf */}
                <div className="pt-1 flex flex-wrap gap-2">
                  {/* Kasus A: Butuh Verifikasi QRIS / Transfer */}
                  {isPendingVerification && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'verified_paid')}
                        disabled={actionLoadingId === order.id}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verifikasi Lunas (Uang Masuk)
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                        disabled={actionLoadingId === order.id}
                        className="py-2 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60 transition cursor-pointer"
                      >
                        Tolak
                      </button>
                    </>
                  )}

                  {/* Kasus B: Pelanggan Bayar Tunai ke Kasir */}
                  {isPendingCash && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'verified_paid')}
                      disabled={actionLoadingId === order.id}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      Terima Pembayaran Tunai (Lunas)
                    </button>
                  )}

                  {/* Kasus C: Sudah Lunas & Diracik -> Tandai Selesai Diantar */}
                  {isVerified && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'completed')}
                      disabled={actionLoadingId === order.id}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Tandai Selesai Diantar ke Meja
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
