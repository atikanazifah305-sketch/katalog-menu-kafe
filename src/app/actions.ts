'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { CafeOrder, OrderStatus } from '@/types/order';
import { 
  saveOrder, 
  getAllOrders, 
  getOrderById, 
  updateOrderStatus 
} from '@/lib/ordersStore';
import { setItemStock, getItemStock, deleteItemStock } from '@/lib/stockStore';

/**
 * Menambahkan menu baru ke database Supabase
 */
export async function addMenuItem(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name')?.toString().trim();
  const category = formData.get('category')?.toString().trim();
  const priceRaw = formData.get('price')?.toString().trim();
  const stockRaw = formData.get('stock')?.toString().trim();
  const isReadyRaw = formData.get('is_ready')?.toString().trim();

  if (!name || !category || !priceRaw) {
    throw new Error('Nama, kategori, dan harga menu wajib diisi.');
  }

  const price = parseFloat(priceRaw);
  if (isNaN(price) || price < 0) {
    throw new Error('Harga harus berupa angka valid dan tidak negatif.');
  }

  const stock = stockRaw ? parseInt(stockRaw, 10) : 20;
  const is_ready = isReadyRaw !== undefined ? isReadyRaw === 'true' : stock > 0;

  // Mencoba insert dengan kolom stock & is_ready
  let { data, error } = await supabase.from('menu_items').insert([
    {
      name,
      category,
      price,
      stock: isNaN(stock) ? 20 : Math.max(0, stock),
      is_ready: stock === 0 ? false : is_ready,
    },
  ]).select('id').single();

  // Fallback jika kolom 'stock' belum ditambahkan ke schema Supabase
  if (error && error.code === 'PGRST204') {
    const fallback = await supabase.from('menu_items').insert([
      {
        name,
        category,
        price,
        is_ready,
      },
    ]).select('id').single();
    error = fallback.error;
    data = fallback.data;
  }

  if (error) {
    console.error('Gagal menambahkan menu:', error);
    throw new Error(`Gagal menambahkan menu: ${error.message}`);
  }

  if (data?.id) {
    setItemStock(data.id, isNaN(stock) ? 20 : Math.max(0, stock));
  }

  revalidatePath('/');
  revalidatePath('/dashboard');
}

/**
 * Mengubah data menu berdasarkan ID (termasuk Nama, Kategori, Harga, Status Stok, dan Jumlah Stok)
 */
export async function updateMenuItem(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get('id')?.toString().trim();
  const name = formData.get('name')?.toString().trim();
  const category = formData.get('category')?.toString().trim();
  const priceRaw = formData.get('price')?.toString().trim();
  const stockRaw = formData.get('stock')?.toString().trim();
  const isReadyRaw = formData.get('is_ready')?.toString().trim();

  if (!id || !name || !category || !priceRaw) {
    throw new Error('Data pembaruan tidak lengkap.');
  }

  const price = parseFloat(priceRaw);
  if (isNaN(price) || price < 0) {
    throw new Error('Harga harus berupa angka valid dan tidak negatif.');
  }

  // Tentukan status ketersediaan dan jumlah stok
  const stock = stockRaw ? parseInt(stockRaw, 10) : undefined;
  const is_ready = isReadyRaw !== undefined ? isReadyRaw === 'true' : true;

  // Siapkan payload update
  const payload: Record<string, unknown> = {
    name,
    category,
    price,
    is_ready,
  };

  if (stock !== undefined && !isNaN(stock)) {
    payload.stock = Math.max(0, stock);
    // Jika stok 0, otomatis status menjadi tidak ready (Habis)
    if (payload.stock === 0) {
      payload.is_ready = false;
    }
  }

  // Coba update data lengkap
  let { error } = await supabase
    .from('menu_items')
    .update(payload)
    .eq('id', id);

  // Jika kolom 'stock' belum ada di database (PGRST204), update tanpa field 'stock'
  if (error && error.code === 'PGRST204') {
    delete payload.stock;
    const fallback = await supabase
      .from('menu_items')
      .update(payload)
      .eq('id', id);
    error = fallback.error;
  }

  if (error) {
    console.error('Gagal memperbarui menu:', error);
    throw new Error(`Gagal memperbarui menu: ${error.message}`);
  }

  if (stock !== undefined && !isNaN(stock)) {
    setItemStock(id, Math.max(0, stock));
  }

  revalidatePath('/');
  revalidatePath('/dashboard');
}

/**
 * Mengubah cepat jumlah stok (misal: tombol + / - stok)
 */
export async function updateMenuStock(id: string, newStock: number) {
  const supabase = await createClient();
  const stock = Math.max(0, newStock);
  const is_ready = stock > 0;

  let { error } = await supabase
    .from('menu_items')
    .update({ stock, is_ready })
    .eq('id', id);

  // Fallback jika kolom stock belum ada di tabel Supabase
  if (error && error.code === 'PGRST204') {
    const fallback = await supabase
      .from('menu_items')
      .update({ is_ready })
      .eq('id', id);
    error = fallback.error;
  }

  if (error) {
    console.error('Gagal memperbarui stok:', error);
    throw new Error(`Gagal memperbarui stok: ${error.message}`);
  }

  setItemStock(id, stock);

  revalidatePath('/');
  revalidatePath('/dashboard');
}

/**
 * Mengubah status ketersediaan menu (Ready / Habis)
 */
export async function toggleMenuStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient();
  const nextStatus = !currentStatus;

  const payload: Record<string, unknown> = { is_ready: nextStatus };

  let { error } = await supabase
    .from('menu_items')
    .update(payload)
    .eq('id', id);

  if (error) {
    console.error('Gagal mengubah status menu:', error);
    throw new Error(`Gagal mengubah status menu: ${error.message}`);
  }

  if (!nextStatus) {
    setItemStock(id, 0);
  } else {
    const current = getItemStock(id, false);
    if (current === 0) setItemStock(id, 20);
  }

  revalidatePath('/');
  revalidatePath('/dashboard');
}

/**
 * Menghapus menu dari database berdasarkan ID
 */
export async function deleteMenuItem(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Gagal menghapus menu:', error);
    throw new Error(`Gagal menghapus menu: ${error.message}`);
  }

  deleteItemStock(id);

  revalidatePath('/');
  revalidatePath('/dashboard');
}

/**
 * Menyimpan pesanan baru yang dikirim oleh pelanggan
 */
export async function submitOrderAction(order: CafeOrder) {
  try {
    const saved = await saveOrder(order);
    revalidatePath('/dashboard');
    return { success: true, order: saved };
  } catch (err: unknown) {
    console.error('Gagal submit order:', err);
    return { success: false, order, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Mengambil seluruh daftar pesanan meja untuk staf
 */
export async function getOrdersAction(): Promise<CafeOrder[]> {
  try {
    return await getAllOrders();
  } catch (err) {
    console.error('Gagal mengambil orders:', err);
    return [];
  }
}

/**
 * Kasir/Barista mengubah status pesanan (Verifikasi Lunas, Selesai, Batal)
 */
export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  try {
    const updated = await updateOrderStatus(orderId, status);
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true, order: updated };
  } catch (err: unknown) {
    console.error('Gagal update order status:', err);
    return { success: false, order: null };
  }
}

/**
 * Pelanggan mengecek status pembayaran pesanan secara berkala (polling)
 */
export async function checkOrderStatusAction(orderId: string): Promise<{ status: OrderStatus | null }> {
  try {
    const order = await getOrderById(orderId);
    return { status: order ? order.status : null };
  } catch {
    return { status: null };
  }
}
