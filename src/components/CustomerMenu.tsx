'use client';

import { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  note: string;
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

  // State Modal Sukses Pesanan
  const [orderSuccessModal, setOrderSuccessModal] = useState<{
    isOpen: boolean;
    orderId: string;
    items: CartItem[];
    total: number;
    table: string;
    name: string;
  } | null>(null);

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

  // Handler Kirim Pesanan
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const orderId = `KF-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderSuccessModal({
      isOpen: true,
      orderId,
      items: [...cart],
      total: totalPrice,
      table: tableNumber,
      name: customerName.trim() || 'Pelanggan Meja',
    });

    setCart([]);
    setIsCartOpen(false);
  };

  // Helper WhatsApp Share format
  const getWhatsAppMessageUrl = () => {
    if (!orderSuccessModal) return '#';
    const textLines = [
      `*PESANAN KAFE BARU (${orderSuccessModal.orderId})*`,
      `Meja: ${orderSuccessModal.table}`,
      `Nama: ${orderSuccessModal.name}`,
      `----------------------------`,
      ...orderSuccessModal.items.map(
        (i) =>
          `• ${i.menuItem.name} (${i.quantity}x) - ${formatRupiah(
            i.menuItem.price * i.quantity
          )}${i.note ? `\n  Catatan: _${i.note}_` : ''}`
      ),
      `----------------------------`,
      `*Total Tagihan: ${formatRupiah(orderSuccessModal.total)}*`,
      `Mohon segera diproses, terima kasih!`,
    ];
    return `https://wa.me/?text=${encodeURIComponent(textLines.join('\n'))}`;
  };

  return (
    <div className="space-y-6">
      {/* Category Pills & Search */}
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

        {/* Search Bar */}
        <div className="relative md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kopi, hidangan, snack..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          />
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
                      /* Quantity Stepper if already in cart */
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
                      /* Add Button */
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

      {/* Floating Cart Button (Jika ada pesanan) */}
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
            <span>Lihat Pesanan</span>
            <span className="pl-2 border-l border-white/20 text-amber-100">
              {formatRupiah(totalPrice)}
            </span>
          </button>
        </div>
      )}

      {/* Drawer / Modal Keranjang Pesanan Pelanggan */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 max-h-[90vh] flex flex-col overflow-hidden animate-slide-up"
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
                    Periksa pesanan Anda sebelum dikirim ke barista
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

            {/* Informasi Nomor Meja & Pemesan */}
            <div className="grid grid-cols-2 gap-3 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Nomor Meja
                </label>
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
                  Nama Anda (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rian"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* List Item Pesanan */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 max-h-72">
              {cart.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="p-3 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                        {item.menuItem.name}
                      </h4>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                        {formatRupiah(item.menuItem.price)}
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

                  {/* Input Catatan Khusus */}
                  <input
                    type="text"
                    placeholder="Catatan (misal: less sugar, es dipisah)..."
                    value={item.note}
                    onChange={(e) => updateNote(item.menuItem.id, e.target.value)}
                    className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              ))}
            </div>

            {/* Total Tagihan & Tombol Konfirmasi */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-500 dark:text-slate-400">Total Tagihan</span>
                <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                  {formatRupiah(totalPrice)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-lg shadow-amber-600/25 active:scale-98 transition cursor-pointer"
              >
                Pesan Sekarang ({tableNumber})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sukses Pemesanan */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Pesanan Berhasil Dikirim!
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                Nomor Antrean: {orderSuccessModal.orderId}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Pesanan untuk <strong>{orderSuccessModal.table}</strong> ({orderSuccessModal.name}) telah diteruskan ke meja kasir & barista.
              </p>
            </div>

            {/* Rincian Ringkas Pesanan */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl text-left text-xs space-y-2 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-200 dark:border-slate-700">
                <span>Daftar Pesanan ({orderSuccessModal.items.length} item)</span>
                <span>{formatRupiah(orderSuccessModal.total)}</span>
              </div>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400 max-h-36 overflow-y-auto">
                {orderSuccessModal.items.map((i) => (
                  <li key={i.menuItem.id} className="flex justify-between">
                    <span>
                      {i.quantity}x {i.menuItem.name}
                    </span>
                    <span>{formatRupiah(i.menuItem.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <a
                href={getWhatsAppMessageUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20"
              >
                <Share2 className="w-3.5 h-3.5" />
                Konfirmasi Pesanan via WhatsApp
              </a>

              <button
                onClick={() => setOrderSuccessModal(null)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Tutup & Pesan Menu Lain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
