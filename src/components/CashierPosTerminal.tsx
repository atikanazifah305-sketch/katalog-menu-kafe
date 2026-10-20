'use client';

import { useState, useMemo, useRef } from 'react';
import { MenuItem } from '@/types/menu';
import { CafeOrder, OrderItem, PaymentMethod, OrderType } from '@/types/order';
import { createPosOrderAction } from '@/app/actions';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Receipt, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Printer, 
  RotateCcw, 
  Utensils, 
  ShoppingBag, 
  Coffee, 
  Sparkles, 
  AlertCircle, 
  X,
  FileText,
  User,
  ArrowRight,
  Tag
} from 'lucide-react';

interface CashierPosTerminalProps {
  menuItems: MenuItem[];
  cashierName?: string;
  onOrderSuccess?: () => void;
}

interface CartItem extends OrderItem {
  maxStock: number;
}

export default function CashierPosTerminal({
  menuItems,
  cashierName = 'Kasir Kafe',
  onOrderSuccess,
}: CashierPosTerminalProps) {
  // State Filter & Pencarian
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State Keranjang Kasir (Cart)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState<string>('Meja 01');
  const [customerName, setCustomerName] = useState<string>('');

  // State Modal Pembayaran & Struk
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [customCashInput, setCustomCashInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State Struk Transaksi Selesai
  const [completedOrder, setCompletedOrder] = useState<CafeOrder | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Kategori Menu yang tersedia
  const categories = useMemo(() => {
    const cats = ['Semua'];
    menuItems.forEach((m) => {
      if (m.category && !cats.includes(m.category)) {
        cats.push(m.category);
      }
    });
    return cats;
  }, [menuItems]);

  // Filter Menu Berdasarkan Kategori dan Pencarian
  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Perhitungan Keranjang
  const totalItemsCount = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  }, [cart]);

  const grandTotal = subtotal;

  // Kembalian
  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'cash') return 0;
    return Math.max(0, cashReceived - grandTotal);
  }, [cashReceived, grandTotal, paymentMethod]);

  const isCashSufficient = useMemo(() => {
    if (paymentMethod !== 'cash') return true;
    return cashReceived >= grandTotal && grandTotal > 0;
  }, [cashReceived, grandTotal, paymentMethod]);

  // Format Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Tambah Menu ke Keranjang Kasir
  const handleAddToCart = (item: MenuItem) => {
    const availableStock = typeof item.stock === 'number' ? item.stock : item.is_ready ? 20 : 0;
    if (availableStock <= 0 || !item.is_ready) return;

    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItemId === item.id);
      if (existing) {
        if (existing.quantity >= availableStock) {
          alert(`Stok untuk "${item.name}" hanya tersedia ${availableStock} porsi.`);
          return prev;
        }
        return prev.map((ci) =>
          ci.menuItemId === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
          maxStock: availableStock,
          note: '',
        },
      ];
    });
  };

  // Ubah Jumlah Qty di Keranjang
  const handleUpdateQty = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((ci) => {
          if (ci.menuItemId === menuItemId) {
            const nextQty = ci.quantity + delta;
            if (nextQty > ci.maxStock) {
              alert(`Maksimal stok tersedia adalah ${ci.maxStock} porsi.`);
              return ci;
            }
            return { ...ci, quantity: nextQty };
          }
          return ci;
        })
        .filter((ci) => ci.quantity > 0);
    });
  };

  // Update Catatan Khusus Item
  const handleUpdateNote = (menuItemId: string, note: string) => {
    setCart((prev) =>
      prev.map((ci) => (ci.menuItemId === menuItemId ? { ...ci, note } : ci))
    );
  };

  // Hapus Item dari Keranjang
  const handleRemoveItem = (menuItemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.menuItemId !== menuItemId));
  };

  // Reset Keranjang
  const handleResetCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Kosongkan keranjang transaksi kasir ini?')) {
      setCart([]);
      setCustomerName('');
    }
  };

  // Buka Modal Pembayaran Kasir
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setErrorMessage(null);
    setPaymentMethod('cash');
    setCashReceived(grandTotal); // default uang pas
    setCustomCashInput(grandTotal.toString());
    setIsPaymentModalOpen(true);
  };

  // Pilih Uang Cepat (Quick Cash Buttons)
  const handleSelectQuickCash = (amount: number) => {
    setCashReceived(amount);
    setCustomCashInput(amount.toString());
  };

  // Input Uang Kustom
  const handleCustomCashChange = (valStr: string) => {
    setCustomCashInput(valStr);
    const parsed = parseInt(valStr.replace(/\D/g, ''), 10);
    setCashReceived(isNaN(parsed) ? 0 : parsed);
  };

  // Selesaikan Transaksi Kasir (Bayar Sekarang)
  const handleProcessPayment = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && !isCashSufficient) {
      setErrorMessage('Nominal uang tunai yang diterima kurang dari total belanja.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const generatedId = `POS-${Date.now().toString().slice(-6)}`;
    const newOrder: CafeOrder = {
      id: generatedId,
      table_number: orderType === 'take_away' ? 'Take Away' : tableNumber,
      customer_name: customerName.trim() || 'Pelanggan Walk-in',
      items: cart.map(({ menuItemId, name, price, quantity, note }) => ({
        menuItemId,
        name,
        price,
        quantity,
        note: note?.trim() || undefined,
      })),
      total_price: grandTotal,
      payment_method: paymentMethod,
      status: 'verified_paid', // Langsung lunas
      order_type: orderType,
      cash_received: paymentMethod === 'cash' ? cashReceived : grandTotal,
      change_returned: paymentMethod === 'cash' ? changeAmount : 0,
      cashier_name: cashierName,
      created_at: new Date().toISOString(),
    };

    try {
      const res = await createPosOrderAction(newOrder);
      if (!res.success) {
        setErrorMessage(res.error || 'Gagal memproses transaksi kasir.');
        setIsProcessing(false);
        return;
      }

      // Berhasil
      setCompletedOrder(res.order || newOrder);
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);

      // Bersihkan keranjang
      setCart([]);
      setCustomerName('');
      if (onOrderSuccess) onOrderSuccess();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cetak Struk
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* ======================================================== */}
      {/* TAMPILAN UTAMA POS (GRID MENU KIRI + BILL KASIR KANAN)     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* KOLOM KIRI: KATALOG MENU SENTUH KASIR (7 KOLOM) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Header & Filter Pencarian */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kopi, makanan, snack..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Info Kasir Aktif */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kasir: {cashierName}</span>
              </div>
            </div>

            {/* Filter Tabs Kategori */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Menu Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredMenu.map((item) => {
              const stock = typeof item.stock === 'number' ? item.stock : item.is_ready ? 20 : 0;
              const isOutOfStock = stock <= 0 || !item.is_ready;
              const isLowStock = !isOutOfStock && stock <= 5;
              const inCartQty = cart.find((ci) => ci.menuItemId === item.id)?.quantity || 0;

              return (
                <div
                  key={item.id}
                  onClick={() => !isOutOfStock && handleAddToCart(item)}
                  className={`relative p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between select-none ${
                    isOutOfStock
                      ? 'opacity-50 bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] cursor-pointer'
                  }`}
                >
                  {/* Badge Qty in Cart */}
                  {inCartQty > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md animate-scale-in">
                      {inCartQty}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                      <span>{item.category}</span>
                      {isOutOfStock ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">Habis</span>
                      ) : isLowStock ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">Sisa {stock}</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">Stok: {stock}</span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight">
                      {item.name}
                    </h4>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(Number(item.price))}
                    </span>
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredMenu.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500">
                <Coffee className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">Tidak ada menu yang sesuai</p>
                <p className="text-xs">Coba kata kunci pencarian atau kategori lain</p>
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: PANEL KERANJANG KASIR (BILL / POS CART) (5 KOLOM) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-4 flex flex-col justify-between">
          
          <div className="space-y-4">
            {/* Header Keranjang Kasir */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Keranjang Pesanan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {totalItemsCount} item dipilih
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={handleResetCart}
                  title="Kosongkan keranjang"
                  className="p-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Pilihan Tipe Pesanan: Dine In vs Take Away */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setOrderType('dine_in')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition cursor-pointer ${
                  orderType === 'dine_in'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Dine In (Meja)</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('take_away')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition cursor-pointer ${
                  orderType === 'take_away'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Take Away</span>
              </button>
            </div>

            {/* Input Nama Pelanggan & Nomor Meja */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Nama Pelanggan
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Budi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {orderType === 'dine_in' ? (
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Nomor Meja
                  </label>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {[...Array(15)].map((_, i) => {
                      const num = String(i + 1).padStart(2, '0');
                      return (
                        <option key={num} value={`Meja ${num}`}>
                          Meja {num}
                        </option>
                      );
                    })}
                    <option value="Meja Bar">Meja Bar</option>
                    <option value="Meja VIP">Meja VIP</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Status Order
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Bawa Pulang</span>
                  </div>
                </div>
              )}
            </div>

            {/* Daftar Item di Keranjang */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {cart.map((ci) => (
                <div
                  key={ci.menuItemId}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                        {ci.name}
                      </h5>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatRupiah(ci.price)}
                      </span>
                    </div>

                    {/* Tombol Qty */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                      <button
                        onClick={() => handleUpdateQty(ci.menuItemId, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">
                        {ci.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(ci.menuItemId, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Input Catatan Item (Less ice, dsb) */}
                  <input
                    type="text"
                    value={ci.note || ''}
                    onChange={(e) => handleUpdateNote(ci.menuItemId, e.target.value)}
                    placeholder="Catatan: less ice, manis sedang..."
                    className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder-slate-400"
                  />
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">Keranjang masih kosong</p>
                  <p className="text-[11px]">Pilih menu di sebelah kiri untuk menambah pesanan</p>
                </div>
              )}
            </div>
          </div>

          {/* Rincian Total & Tombol Bayar */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal ({totalItemsCount} item)</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Total Bayar</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-lg">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
            </div>

            {/* Tombol Buka Checkout Pembayaran */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Bayar Pesanan (Rp {grandTotal.toLocaleString('id-ID')})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL PEMBAYARAN KASIR (PAYMENT CHECKOUT MODAL)          */}
      {/* ======================================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Pembayaran Kasir
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {orderType === 'take_away' ? 'Take Away' : tableNumber} • {customerName || 'Pelanggan'}
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grand Total Display */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Total Tagihan
              </span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatRupiah(grandTotal)}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Pilihan Metode Pembayaran */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="text-xs">Uang Tunai</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'qris'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-xs">QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('debit')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'debit'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Debit / EDC</span>
                </button>
              </div>
            </div>

            {/* FORM KHUSUS UANG TUNAI (CASH CALCULATOR) */}
            {paymentMethod === 'cash' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Nominal Uang Diterima dari Pelanggan
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">Rp</span>
                    <input
                      type="text"
                      value={customCashInput}
                      onChange={(e) => handleCustomCashChange(e.target.value)}
                      placeholder="50000"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Tombol Uang Cepat (Quick Cash Chips) */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectQuickCash(grandTotal)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200"
                  >
                    Uang Pas ({formatRupiah(grandTotal)})
                  </button>
                  {[20000, 50000, 100000, 200000].map((amt) => {
                    if (amt >= grandTotal) {
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleSelectQuickCash(amt)}
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
                      : `Kurang ${formatRupiah(grandTotal - cashReceived)}`}
                  </span>
                </div>
              </div>
            )}

            {/* TAMPILAN KHUSUS QRIS KASIR */}
            {paymentMethod === 'qris' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center space-y-2">
                <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl shadow border border-slate-200 flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-slate-800" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  Scan QRIS Kasir Kafe Atika Nazifah
                </p>
                <p className="text-[11px] text-slate-500">
                  Tunjukkan layar ini ke pelanggan untuk dipindai melalui BCA Mobile, GoPay, OVO, atau Dana
                </p>
              </div>
            )}

            {/* TAMPILAN KHUSUS DEBIT */}
            {paymentMethod === 'debit' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center space-y-2">
                <CreditCard className="w-8 h-8 mx-auto text-emerald-600" />
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  Gesek / Tempel Kartu di Mesin EDC Kasir
                </p>
                <p className="text-[11px] text-slate-500">
                  Pastikan struk EDC telah berhasil dicetak sebelum menyelesaikan transaksi
                </p>
              </div>
            )}

            {/* Tombol Konfirmasi Selesai & Cetak Struk */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-1/3 py-3 rounded-2xl font-semibold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing || (paymentMethod === 'cash' && !isCashSufficient)}
                onClick={handleProcessPayment}
                className="w-2/3 py-3 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <span>Menyimpan Transaksi...</span>
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
      {/* MODAL STRUK KASIR OTENTIK (THERMAL RECEIPT)              */}
      {/* ======================================================== */}
      {isReceiptModalOpen && completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative w-full max-w-sm bg-white text-slate-900 rounded-3xl shadow-2xl p-6 overflow-hidden space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Action Bar Atas Modal */}
            <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-300">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Transaksi Berhasil!
              </span>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AREA STRUK FISIK (Bisa Dicetak via window.print) */}
            <div 
              id="printable-receipt" 
              className="bg-amber-50/40 p-4 rounded-xl border border-dashed border-slate-300 font-mono text-xs text-slate-800 space-y-3"
            >
              {/* Header Kafe */}
              <div className="text-center space-y-0.5">
                <h4 className="font-black text-sm uppercase tracking-wider">KAFE ATIKA NAZIFAH</h4>
                <p className="text-[10px] text-slate-500">Jl. Utama Coffee Bar & Resto</p>
                <p className="text-[10px] text-slate-500">Telp: 0812-3456-7890</p>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>No. Struk:</span>
                  <span className="font-bold">#{completedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{new Date(completedOrder.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{completedOrder.cashier_name || cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipe / Meja:</span>
                  <span className="font-bold">{completedOrder.table_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{completedOrder.customer_name}</span>
                </div>
              </div>

              {/* Rincian Produk */}
              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1.5">
                {completedOrder.items.map((it, idx) => (
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
                  <span>TOTAL:</span>
                  <span>{formatRupiah(completedOrder.total_price)}</span>
                </div>
                {completedOrder.payment_method === 'cash' && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Bayar Tunai:</span>
                      <span>{formatRupiah(completedOrder.cash_received || completedOrder.total_price)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(completedOrder.change_returned || 0)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Metode:</span>
                  <span className="uppercase font-bold">{completedOrder.payment_method} (LUNAS)</span>
                </div>
              </div>

              {/* Footer Ucapan & Password Wifi */}
              <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[10px] text-slate-500 space-y-0.5">
                <p className="font-bold">Terima kasih atas kunjungan Anda!</p>
                <p>Selamat menikmati sajian kafe kami.</p>
                <p className="pt-1 text-[9px] text-slate-400">Wi-Fi: KafeAtika / Pass: kopi2026</p>
              </div>
            </div>

            {/* Tombol Cetak & Transaksi Baru */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Pesanan Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
