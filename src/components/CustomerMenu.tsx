'use client';

import { useState, useEffect } from 'react';
import { MenuItem } from '@/types/menu';
import { 
  Coffee, 
  CupSoda, 
  Utensils, 
  Cookie, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Tag, 
  Share2, 
  Clock, 
  Banknote, 
  QrCode, 
  Landmark, 
  Copy, 
  Check, 
  Receipt, 
  Sparkles, 
  ChefHat, 
  ArrowRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  note: string;
}

type PaymentMethod = 'cash' | 'qris' | 'transfer';

interface OrderRecord {
  orderId: string;
  items: CartItem[];
  total: number;
  table: string;
  name: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending_cash' | 'paid_online' | 'processing';
  createdAt: string;
}

interface CustomerMenuProps {
  initialItems: MenuItem[];
}

export default function CustomerMenu({ initialItems }: CustomerMenuProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // State Keranjang Pesanan Pelanggan
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('Meja 01');
  const [customerName, setCustomerName] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');

  // State Modal Pembayaran / Detail Struk
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [isConfirmedPaid, setIsConfirmedPaid] = useState(false);

  // State Riwayat Pesanan di LocalStorage
  const [orderHistory, setOrderHistory] = useState<OrderRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cafe_customer_orders');
      if (saved) {
        setOrderHistory(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save history to localStorage
  const saveOrderToHistory = (order: OrderRecord) => {
    try {
      const updated = [order, ...orderHistory].slice(0, 10);
      setOrderHistory(updated);
      localStorage.setItem('cafe_customer_orders', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Helper format rupiah
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper copy text
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(label);
    setTimeout(() => setIsCopied(null), 2500);
  };

  // Helper icon kategori
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Kopi':
        return <Coffee className="w-4 h-4 text-amber-500" />;
      case 'Non-Kopi':
        return <CupSoda className="w-4 h-4 text-cyan-500" />;
      case 'Makanan':
        return <Utensils className="w-4 h-4 text-orange-500" />;
      case 'Snack':
        return <Cookie className="w-4 h-4 text-rose-500" />;
      default:
        return <Tag className="w-4 h-4 text-slate-400" />;
    }
  };

  // Filter menu
  const filteredItems = initialItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan', 'Snack'];

  // Handler Tambah ke Keranjang
  const addToCart = (item: MenuItem) => {
    if (!item.is_ready) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((c) => c.menuItem.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [...prevCart, { menuItem: item, quantity: 1, note: '' }];
      }
    });
  };

  // Handler update kuantitas di keranjang
  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((c) => {
          if (c.menuItem.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Handler update catatan per item
  const updateNote = (itemId: string, note: string) => {
    setCart((prevCart) =>
      prevCart.map((c) => (c.menuItem.id === itemId ? { ...c, note } : c))
    );
  };

  // Hitung Total Item & Harga
  const totalItemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalPrice = cart.reduce(
    (acc, curr) => acc + curr.menuItem.price * curr.quantity,
    0
  );

  // Handler Checkout / Buat Pesanan
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const orderId = `KF-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: OrderRecord = {
      orderId,
      items: [...cart],
      total: totalPrice,
      table: tableNumber,
      name: customerName.trim() || 'Pelanggan Meja',
      paymentMethod: selectedPaymentMethod,
      paymentStatus: selectedPaymentMethod === 'cash' ? 'pending_cash' : 'processing',
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    saveOrderToHistory(newOrder);
    setActiveOrder(newOrder);
    setIsConfirmedPaid(false);
    setCart([]);
    setIsCartOpen(false);
  };

  // Helper WhatsApp Share format
  const getWhatsAppMessageUrl = (order: OrderRecord) => {
    const textLines = [
      `*BUKTI PEMESANAN KAFE (${order.orderId})*`,
      `Meja: ${order.table}`,
      `Nama: ${order.name}`,
      `Metode Bayar: ${
        order.paymentMethod === 'cash'
          ? 'Tunai (Bayar di Kasir)'
          : order.paymentMethod === 'qris'
          ? 'QRIS (Bayar dari Meja)'
          : 'Transfer Bank (Bayar dari Meja)'
      }`,
      `Waktu: ${order.createdAt} WIB`,
      `----------------------------`,
      ...order.items.map(
        (i) =>
          `• ${i.menuItem.name} (${i.quantity}x) - ${formatRupiah(
            i.menuItem.price * i.quantity
          )}${i.note ? `\n  Catatan: _${i.note}_` : ''}`
      ),
      `----------------------------`,
      `*Total Tagihan: ${formatRupiah(order.total)}*`,
      order.paymentMethod === 'cash'
        ? `Status: Menunggu Pembayaran Tunai di Kasir`
        : `Status: LUNAS Mandiri dari Meja (Mohon segera diracik & diantar ke meja)`,
    ];
    return `https://wa.me/?text=${encodeURIComponent(textLines.join('\n'))}`;
  };

  return (
    <div className="space-y-6">
      {/* Category Pills, Riwayat Pesanan Button, & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar & Riwayat Pesanan Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kopi, makanan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
          </div>

          {orderHistory.length > 0 && (
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition cursor-pointer"
              title="Lihat riwayat pesanan meja Anda"
            >
              <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Pesanan Saya</span>
              <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">
                {orderHistory.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Menu Pelanggan */}
      {filteredItems.length === 0 ? (
        <div className="py-20 px-6 text-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
            Menu Tidak Ditemukan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Tidak ada sajian yang sesuai dengan kata kunci atau kategori yang Anda pilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const inCart = cart.find((c) => c.menuItem.id === item.id);

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col justify-between bg-white dark:bg-slate-900 border rounded-3xl p-5 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
                  item.is_ready
                    ? 'border-slate-200/80 dark:border-slate-800 shadow-sm'
                    : 'border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
                }`}
              >
                <div>
                  {/* Category & Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                      {getCategoryIcon(item.category)}
                      {item.category}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.is_ready
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25'
                      }`}
                    >
                      {item.is_ready ? 'Ready' : 'Habis'}
                    </span>
                  </div>

                  {/* Menu Name */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 mb-1.5">
                    {item.name}
                  </h3>

                  {/* Price */}
                  <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                    {formatRupiah(item.price)}
                  </div>
                </div>

                {/* Bottom Action: Add to Cart */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  {item.is_ready ? (
                    inCart ? (
                      <div className="w-full flex items-center justify-between bg-amber-500/10 dark:bg-amber-950/40 p-1.5 rounded-2xl border border-amber-500/20">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                          {inCart.quantity} porsi
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1.5 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-95 transition shadow-md shadow-amber-600/20 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Pesan Menu
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-2xl font-semibold text-xs text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed"
                    >
                      Sementara Habis
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Cart Button (Jika ada pesanan di keranjang) */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-bounce-subtle">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-extrabold text-sm shadow-2xl shadow-amber-600/40 hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-amber-700 text-[11px] font-black flex items-center justify-center shadow">
                {totalItemCount}
              </span>
            </div>
            <span>Konfirmasi Pesanan</span>
            <span className="pl-2 border-l border-white/20 text-amber-100">
              {formatRupiah(totalPrice)}
            </span>
          </button>
        </div>
      )}

      {/* Drawer / Modal Keranjang Pesanan Pelanggan & Pemilihan Metode Pembayaran */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 max-h-[92vh] flex flex-col overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Drawer */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Keranjang Pesanan Meja
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih nomor meja dan metode pembayaran Anda
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Nomor Meja & Pemesan */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Nomor Meja *
                  </label>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="Meja 01">Meja 01</option>
                    <option value="Meja 02">Meja 02</option>
                    <option value="Meja 03">Meja 03</option>
                    <option value="Meja 04">Meja 04</option>
                    <option value="Meja 05">Meja 05</option>
                    <option value="Meja 06">Meja 06</option>
                    <option value="Meja 07">Meja 07</option>
                    <option value="Meja 08">Meja 08</option>
                    <option value="Area Bar">Area Bar / Depan</option>
                    <option value="Takeaway / Bawa Pulang">Takeaway (Bawa Pulang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Nama Pemesan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rian"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* List Item Pesanan */}
              <div className="space-y-2.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Daftar Sajian ({cart.length} menu)
                </label>
                {cart.map((item) => (
                  <div
                    key={item.menuItem.id}
                    className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                          {item.menuItem.name}
                        </h4>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                          {formatRupiah(item.menuItem.price * item.quantity)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, -1)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-600 dark:text-slate-300"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold min-w-5 text-center text-slate-800 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, 1)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-600 dark:text-slate-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => updateQuantity(item.menuItem.id, -item.quantity)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Catatan khusus (misal: less sugar, es dipisah)..."
                      value={item.note}
                      onChange={(e) => updateNote(item.menuItem.id, e.target.value)}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                ))}
              </div>

              {/* Pilihan Metode Pembayaran */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pilih Metode Pembayaran *
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Opsi 1: Cash / Tunai di Kasir */}
                  <label
                    onClick={() => setSelectedPaymentMethod('cash')}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                      selectedPaymentMethod === 'cash'
                        ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/30 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      selectedPaymentMethod === 'cash'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Tunai / Cash (Bayar di Kasir)
                        </span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedPaymentMethod === 'cash'}
                          onChange={() => setSelectedPaymentMethod('cash')}
                          className="accent-amber-600"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Pesan dari meja sekarang, lalu tunjukkan struk digital ke kasir untuk bayar tunai.
                      </p>
                    </div>
                  </label>

                  {/* Opsi 2: QRIS Mandiri */}
                  <label
                    onClick={() => setSelectedPaymentMethod('qris')}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                      selectedPaymentMethod === 'qris'
                        ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      selectedPaymentMethod === 'qris'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          QRIS Mandiri (Scan Langsung di Meja)
                          <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                            Cepat
                          </span>
                        </span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedPaymentMethod === 'qris'}
                          onChange={() => setSelectedPaymentMethod('qris')}
                          className="accent-emerald-600"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        BCA, GoPay, OVO, Dana, ShopeePay. Bayar dari meja & duduk santai menunggu pesanan diantar!
                      </p>
                    </div>
                  </label>

                  {/* Opsi 3: Transfer Bank Mandiri */}
                  <label
                    onClick={() => setSelectedPaymentMethod('transfer')}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                      selectedPaymentMethod === 'transfer'
                        ? 'border-cyan-500 bg-cyan-500/10 dark:bg-cyan-950/30 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      selectedPaymentMethod === 'transfer'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Transfer Bank (BCA / Mandiri)
                        </span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedPaymentMethod === 'transfer'}
                          onChange={() => setSelectedPaymentMethod('transfer')}
                          className="accent-cyan-600"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Transfer via m-Banking dari meja. Pesanan langsung diproses tanpa perlu ke kasir.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Total Tagihan & Tombol Konfirmasi */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-500 dark:text-slate-400">Total Tagihan</span>
                <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                  {formatRupiah(totalPrice)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-lg shadow-amber-600/25 active:scale-98 transition cursor-pointer"
              >
                Lanjutkan Pesanan ({tableNumber})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DETAIL PEMBAYARAN & STRUK (CASH vs QRIS vs TRANSFER)
          ========================================================================= */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-5 shadow-2xl animate-fade-in my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ======================= KASUS 1: BAYAR CASH / TUNAI ======================= */}
            {activeOrder.paymentMethod === 'cash' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Banknote className="w-9 h-9" />
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    Menunggu Pembayaran di Meja Kasir
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    ID Pesanan: {activeOrder.orderId}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Pesanan Anda telah tercatat di sistem. Silakan menuju meja kasir dan perlihatkan rincian struk ini untuk membayar tunai.
                  </p>
                </div>

                {/* Struk Digital Kasir */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-left text-xs space-y-3 border border-slate-200 dark:border-slate-700/80 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white block text-sm">
                        KAFE ARTISAN OFFICIAL
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {activeOrder.table} • {activeOrder.name}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px]">{activeOrder.createdAt} WIB</span>
                  </div>

                  <ul className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/50">
                    {activeOrder.items.map((i) => (
                      <li key={i.menuItem.id} className="pt-1.5 flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {i.quantity}x {i.menuItem.name}
                          </span>
                          {i.note && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 italic block">
                              Catatan: {i.note}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {formatRupiah(i.menuItem.price * i.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2 border-t-2 border-dashed border-slate-300 dark:border-slate-700 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                    <span>Total yang Harus Dibayar:</span>
                    <span className="text-amber-600 dark:text-amber-400 text-base">
                      {formatRupiah(activeOrder.total)}
                    </span>
                  </div>
                </div>

                {/* Instruksi Kasir */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-left text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-bold">Langkah Selanjutnya:</p>
                  <p>1. Datangi kasir dan sebutkan <strong>Nomor Meja: {activeOrder.table}</strong> atau <strong>{activeOrder.orderId}</strong>.</p>
                  <p>2. Bayar tunai sejumlah <strong>{formatRupiah(activeOrder.total)}</strong>.</p>
                  <p>3. Staf kasir akan mencetak struk dan pesanan Anda langsung diantar ke meja!</p>
                </div>
              </div>
            )}

            {/* ======================= KASUS 2: BAYAR MANDIRI VIA QRIS ======================= */}
            {activeOrder.paymentMethod === 'qris' && (
              <div className="space-y-4">
                {!isConfirmedPaid ? (
                  <>
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <QrCode className="w-8 h-8" />
                    </div>

                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
                        Scan QRIS Mandiri dari Meja
                      </span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                        Total: {formatRupiah(activeOrder.total)}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Pesanan {activeOrder.orderId} • {activeOrder.table} ({activeOrder.name})
                      </p>
                    </div>

                    {/* Tampilan Visual Barcode QRIS Indonesia */}
                    <div className="p-4 bg-white rounded-3xl border-2 border-slate-900 dark:border-emerald-500 shadow-xl max-w-xs mx-auto space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-[11px] font-black tracking-wider text-slate-900">QRIS STANDAR NASIONAL</span>
                        <span className="text-[10px] font-bold text-red-600">GPN</span>
                      </div>

                      {/* Mock Barcode QR Code Graphic */}
                      <div className="w-52 h-52 mx-auto bg-slate-900 p-2.5 rounded-2xl flex items-center justify-center relative overflow-hidden">
                        {/* QR Grid Pattern Simulation */}
                        <div className="w-full h-full bg-white rounded-xl p-2 grid grid-cols-6 gap-1 items-center justify-center">
                          <div className="col-span-2 row-span-2 bg-slate-950 rounded-lg flex items-center justify-center p-1">
                            <div className="w-full h-full border-4 border-white bg-slate-950 rounded" />
                          </div>
                          <div className="col-span-2 row-span-1 bg-slate-950 rounded" />
                          <div className="col-span-2 row-span-2 bg-slate-950 rounded-lg flex items-center justify-center p-1">
                            <div className="w-full h-full border-4 border-white bg-slate-950 rounded" />
                          </div>
                          <div className="col-span-2 row-span-2 bg-slate-950 rounded-lg p-1" />
                          <div className="col-span-2 row-span-2 bg-amber-600 text-white rounded-lg flex items-center justify-center">
                            <Coffee className="w-5 h-5" />
                          </div>
                          <div className="col-span-2 row-span-2 bg-slate-950 rounded-lg flex items-center justify-center p-1">
                            <div className="w-full h-full border-4 border-white bg-slate-950 rounded" />
                          </div>
                        </div>
                      </div>

                      <div className="text-center pt-1 border-t space-y-0.5">
                        <p className="text-xs font-bold text-slate-900">KAFE ARTISAN NUSANTARA</p>
                        <p className="text-[10px] text-slate-500">NMID: ID1029384756281</p>
                        <p className="text-[10px] font-semibold text-emerald-600">BCA • GoPay • OVO • DANA • ShopeePay</p>
                      </div>
                    </div>

                    {/* Step-by-Step Cara Pembayaran */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl text-left text-xs space-y-2 border border-slate-200 dark:border-slate-700/80">
                      <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-emerald-500" />
                        Tahap Pembayaran Mandiri dari Meja:
                      </p>
                      <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                        <li>Buka aplikasi m-Banking (BCA, Mandiri, BRI) atau E-Wallet (GoPay, OVO, DANA, ShopeePay).</li>
                        <li>Pilih menu <strong>Scan / Bayar QRIS</strong>.</li>
                        <li>Arahkan kamera ke QR Code di atas.</li>
                        <li>Masukkan nominal tepat: <strong>{formatRupiah(activeOrder.total)}</strong>.</li>
                        <li>Selesaikan pembayaran, lalu klik tombol konfirmasi di bawah.</li>
                      </ol>
                    </div>

                    <button
                      onClick={() => setIsConfirmedPaid(true)}
                      className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Saya Sudah Bayar via QRIS
                    </button>
                  </>
                ) : (
                  /* Sukses Konfirmasi QRIS: Pelanggan Cukup Menunggu di Meja */
                  <div className="py-6 space-y-4 animate-fade-in">
                    <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg">
                      <ChefHat className="w-10 h-10 animate-bounce" />
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Pembayaran QRIS Terverifikasi!
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                        Pesanan Sedang Disiapkan
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                        Terima kasih, <strong>{activeOrder.name}</strong>! Anda tidak perlu ke kasir. Silakan <strong>duduk santai di {activeOrder.table}</strong>, barista dan staf kafe akan segera mengantarkan pesanan Anda langsung ke meja.
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                      ✨ Status Pesanan: Sedang Diramu & Siap Diantar ke Meja
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================= KASUS 3: TRANSFER BANK MANDIRI ======================= */}
            {activeOrder.paymentMethod === 'transfer' && (
              <div className="space-y-4">
                {!isConfirmedPaid ? (
                  <>
                    <div className="w-14 h-14 mx-auto rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                      <Landmark className="w-8 h-8" />
                    </div>

                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 text-xs font-bold border border-cyan-500/30">
                        Transfer Bank Mandiri dari Meja
                      </span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                        Total Transfer: {formatRupiah(activeOrder.total)}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Pesanan {activeOrder.orderId} • {activeOrder.table} ({activeOrder.name})
                      </p>
                    </div>

                    {/* Kartu Nomor Rekening Kafe */}
                    <div className="space-y-2 text-left">
                      {/* Rekening BCA */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block">BANK BCA</span>
                          <span className="text-sm font-mono font-extrabold text-slate-900 dark:text-white">8830 1234 5678</span>
                          <span className="text-[10px] text-slate-500 block">a.n PT Kafe Artisan Nusantara</span>
                        </div>
                        <button
                          onClick={() => handleCopy('883012345678', 'bca')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition flex items-center gap-1 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          {isCopied === 'bca' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied === 'bca' ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>

                      {/* Rekening Mandiri */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">BANK MANDIRI</span>
                          <span className="text-sm font-mono font-extrabold text-slate-900 dark:text-white">137 00 1234 5678</span>
                          <span className="text-[10px] text-slate-500 block">a.n PT Kafe Artisan Nusantara</span>
                        </div>
                        <button
                          onClick={() => handleCopy('1370012345678', 'mandiri')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition flex items-center gap-1 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          {isCopied === 'mandiri' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied === 'mandiri' ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Tahap Transfer */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl text-left text-xs space-y-1.5 border border-slate-200 dark:border-slate-700/80">
                      <p className="font-bold text-slate-800 dark:text-white">Tahap Pembayaran:</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">1. Buka mobile banking dan transfer sejumlah <strong>{formatRupiah(activeOrder.total)}</strong>.</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">2. Berikan berita/keterangan: <strong>{activeOrder.orderId}</strong>.</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">3. Klik tombol &ldquo;Saya Sudah Transfer&rdquo; di bawah.</p>
                    </div>

                    <button
                      onClick={() => setIsConfirmedPaid(true)}
                      className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-600/30 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Saya Sudah Transfer Bank
                    </button>
                  </>
                ) : (
                  /* Sukses Transfer: Pelanggan Menunggu di Meja */
                  <div className="py-6 space-y-4 animate-fade-in">
                    <div className="w-20 h-20 mx-auto rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-lg">
                      <ChefHat className="w-10 h-10 animate-bounce" />
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                        Transfer Berhasil Dikonfirmasi!
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                        Pesanan Sedang Diracik
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                        Terima kasih, <strong>{activeOrder.name}</strong>! Pembayaran transfer Anda telah tercatat. Silakan <strong>tetap duduk santai di {activeOrder.table}</strong>, hidangan Anda akan segera diantar langsung ke meja.
                      </p>
                    </div>

                    <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-2xl text-xs text-cyan-800 dark:text-cyan-300 font-semibold">
                      ✨ Status Pesanan: Diproses & Siap Diantar ke Meja Anda
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons Umum (WhatsApp & Tutup) */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <a
                href={getWhatsAppMessageUrl(activeOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20"
              >
                <Share2 className="w-3.5 h-3.5" />
                {activeOrder.paymentMethod === 'cash'
                  ? 'Kirim Bukti Pesanan ke Kasir via WhatsApp'
                  : 'Kirim Notifikasi Pesanan via WhatsApp'}
              </a>

              <button
                onClick={() => {
                  setActiveOrder(null);
                  setIsConfirmedPaid(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Tutup & Kembali ke Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER RIWAYAT PESANAN SAYA (Pelanggan bisa cek status sewaktu-waktu)
          ========================================================================= */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Riwayat Pesanan Meja Saya
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {orderHistory.map((order) => (
                <div
                  key={order.orderId}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2 cursor-pointer hover:border-amber-500 transition"
                  onClick={() => {
                    setActiveOrder(order);
                    setIsConfirmedPaid(order.paymentMethod !== 'cash');
                    setIsHistoryOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900 dark:text-white">{order.orderId}</span>
                    <span className="text-amber-600 dark:text-amber-400">{formatRupiah(order.total)}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{order.table} • {order.items.length} item</span>
                    <span>{order.createdAt} WIB</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px]">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      {order.paymentMethod === 'cash' ? '💵 Bayar di Kasir' : order.paymentMethod === 'qris' ? '📱 QRIS Mandiri' : '🏦 Transfer Bank'}
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      Klik untuk Buka Struk ➔
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsHistoryOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Tutup Riwayat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
