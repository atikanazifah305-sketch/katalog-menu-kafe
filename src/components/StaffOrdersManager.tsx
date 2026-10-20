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
  ShoppingBag,
  Printer,
  X,
  RotateCcw,
  DollarSign,
  ArrowRight
} from 'lucide-react';

interface StaffOrdersManagerProps {
  initialOrders?: CafeOrder[];
}

export default function StaffOrdersManager({ initialOrders = [] }: StaffOrdersManagerProps) {
  const [orders, setOrders] = useState<CafeOrder[]>(initialOrders);
  const [filter, setFilter] = useState<'all' | 'verification' | 'cash' | 'active'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // State Modal Pembayaran Kasir (Meja Bayar Tunai)
  const [payingOrder, setPayingOrder] = useState<CafeOrder | null>(null);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [customCashInput, setCustomCashInput] = useState<string>('');
  const [isProcessingPay, setIsProcessingPay] = useState<boolean>(false);

  // State Modal Cetak Struk
  const [receiptOrder, setReceiptOrder] = useState<CafeOrder | null>(null);

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

  // Buka Modal Terima Tunai untuk Pesanan Meja
  const handleOpenCashPay = (order: CafeOrder) => {
    setPayingOrder(order);
    setCashReceived(order.total_price); // default uang pas
    setCustomCashInput(order.total_price.toString());
  };

  // Kalkulasi Kembalian Meja
  const changeAmount = payingOrder ? Math.max(0, cashReceived - payingOrder.total_price) : 0;
  const isCashSufficient = payingOrder ? cashReceived >= payingOrder.total_price : false;

  // Konfirmasi Terima Pembayaran Tunai di Kasir
  const handleConfirmCashPay = async () => {
    if (!payingOrder) return;
    setIsProcessingPay(true);
    try {
      await updateOrderStatusAction(payingOrder.id, 'verified_paid');
      const updatedOrder: CafeOrder = {
        ...payingOrder,
        status: 'verified_paid',
        cash_received: cashReceived,
        change_returned: changeAmount,
      };
      await fetchOrders();
      setPayingOrder(null);
      setReceiptOrder(updatedOrder); // Langsung buka struk kasir
    } catch (err) {
      console.error('Gagal konfirmasi pembayaran kasir:', err);
    } finally {
      setIsProcessingPay(false);
    }
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
              Pesanan Masuk & Kasir Meja Pelanggan
            </h2>
            {pendingVerificationCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse">
                {pendingVerificationCount} Perlu Dicek
              </span>
            )}
            {pendingCashCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white">
                {pendingCashCount} Bayar di Kasir
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pelanggan memesan mandiri via QR meja. Kasir memverifikasi pembayaran QRIS atau menerima uang tunai langsung.
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
                    ? 'border-blue-300 bg-blue-50/30 dark:bg-blue-950/15 ring-2 ring-blue-400/20'
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
                      #{order.id} • {order.created_at ? new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''} WIB
                    </span>
                  </div>

                  {/* Badge Status */}
                  <div>
                    {isPendingVerification && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-sm">
                        <Clock className="w-3 h-3 animate-spin" />
                        Perlu Verifikasi QRIS
                      </span>
                    )}
                    {isPendingCash && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-600 text-white animate-pulse">
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
                      <Banknote className="w-4 h-4 text-blue-500" />
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
                    <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatRupiah(order.total_price)}
                    </span>
                  </div>
                </div>

                {/* Tombol Aksi Verifikasi & Kasir */}
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

                  {/* Kasus B: Pelanggan Bayar Tunai ke Meja Kasir */}
                  {isPendingCash && (
                    <button
                      onClick={() => handleOpenCashPay(order)}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-600/25 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Terima Uang Tunai & Hitung Kembalian</span>
                    </button>
                  )}

                  {/* Kasus C: Sudah Lunas & Sedang Diracik -> Tandai Selesai Diantar */}
                  {isVerified && (
                    <div className="w-full flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        disabled={actionLoadingId === order.id}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tandai Selesai Diantar
                      </button>
                      <button
                        onClick={() => setReceiptOrder(order)}
                        title="Cetak Struk Transaksi"
                        className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Struk</span>
                      </button>
                    </div>
                  )}

                  {/* Kasus D: Selesai Diantar -> Bisa Cetak Struk Kapan Saja */}
                  {isCompleted && (
                    <div className="w-full flex justify-end">
                      <button
                        onClick={() => setReceiptOrder(order)}
                        title="Cetak Struk Transaksi"
                        className="py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Ulang Struk</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TERIMA UANG TUNAI & HITUNG KEMBALIAN (KASIR MEJA)  */}
      {/* ======================================================== */}
      {payingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-blue-600" />
                  <span>Kasir Pembayaran Tunai</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {payingOrder.table_number} • {payingOrder.customer_name} (#{payingOrder.id})
                </p>
              </div>
              <button
                onClick={() => setPayingOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Tagihan Meja */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                Total Tagihan Meja
              </span>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                {formatRupiah(payingOrder.total_price)}
              </div>
            </div>

            {/* Input Nominal Uang Diterima */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Nominal Uang Tunai yang Diterima
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    value={customCashInput}
                    onChange={(e) => {
                      setCustomCashInput(e.target.value);
                      const parsed = parseInt(e.target.value.replace(/\D/g, ''), 10);
                      setCashReceived(isNaN(parsed) ? 0 : parsed);
                    }}
                    placeholder="50000"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Tombol Cepat Nominal */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCashReceived(payingOrder.total_price);
                    setCustomCashInput(payingOrder.total_price.toString());
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 hover:bg-blue-200"
                >
                  Uang Pas ({formatRupiah(payingOrder.total_price)})
                </button>
                {[20000, 50000, 100000, 200000].map((amt) => {
                  if (amt >= payingOrder.total_price) {
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setCashReceived(amt);
                          setCustomCashInput(amt.toString());
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      >
                        Rp {amt.toLocaleString('id-ID')}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Hasil Kalkulasi Kembalian */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Uang Kembalian:
                </span>
                <span
                  className={`text-lg font-black ${
                    isCashSufficient
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {isCashSufficient
                    ? formatRupiah(changeAmount)
                    : `Kurang ${formatRupiah(payingOrder.total_price - cashReceived)}`}
                </span>
              </div>
            </div>

            {/* Tombol Konfirmasi Selesai */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPayingOrder(null)}
                className="w-1/3 py-3 rounded-2xl font-semibold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessingPay || !isCashSufficient}
                onClick={handleConfirmCashPay}
                className="w-2/3 py-3 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessingPay ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lunas & Cetak Struk</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL STRUK CETAK THERMAL RESMI KAFE                     */}
      {/* ======================================================== */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative w-full max-w-sm bg-white text-slate-900 rounded-3xl shadow-2xl p-6 overflow-hidden space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-300">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Struk Pembayaran Meja
              </span>
              <button
                onClick={() => setReceiptOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FORMAT STRUK FISIK KAFE */}
            <div className="bg-amber-50/40 p-4 rounded-xl border border-dashed border-slate-300 font-mono text-xs text-slate-800 space-y-3">
              <div className="text-center space-y-0.5">
                <h4 className="font-black text-sm uppercase tracking-wider">KAFE ATIKA NAZIFAH</h4>
                <p className="text-[10px] text-slate-500">Jl. Utama Coffee Bar & Resto</p>
                <p className="text-[10px] text-slate-500">Telp: 0812-3456-7890</p>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>No. Order:</span>
                  <span className="font-bold">#{receiptOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{new Date(receiptOrder.created_at || Date.now()).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Meja:</span>
                  <span className="font-bold">{receiptOrder.table_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{receiptOrder.customer_name}</span>
                </div>
              </div>

              {/* Rincian Produk */}
              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1.5">
                {receiptOrder.items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{it.quantity}x {it.name}</span>
                      <span>{formatRupiah(it.price * it.quantity)}</span>
                    </div>
                    {it.note && (
                      <p className="text-[10px] text-slate-500 italic pl-3">
                        * {it.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Kalkulasi Pembayaran */}
              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>TOTAL TAGIHAN:</span>
                  <span>{formatRupiah(receiptOrder.total_price)}</span>
                </div>
                {receiptOrder.payment_method === 'cash' && receiptOrder.cash_received && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Uang Tunai:</span>
                      <span>{formatRupiah(receiptOrder.cash_received)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(receiptOrder.change_returned || 0)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Metode:</span>
                  <span className="uppercase font-bold">{receiptOrder.payment_method} (LUNAS)</span>
                </div>
              </div>

              {/* Footer Wi-Fi */}
              <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[10px] text-slate-500 space-y-0.5">
                <p className="font-bold">Terima kasih atas kunjungan Anda!</p>
                <p>Selamat menikmati sajian kafe kami.</p>
                <p className="pt-1 text-[9px] text-slate-400">Wi-Fi: KafeAtika / Pass: kopi2026</p>
              </div>
            </div>

            {/* Tombol Cetak Struk */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptOrder(null)}
                className="py-2.5 px-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
