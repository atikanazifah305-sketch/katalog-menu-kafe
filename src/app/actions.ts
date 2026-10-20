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
import { setItemStock, getItemStock, deleteItemStock, reduceItemStock } from '@/lib/stockStore';
import { getCafeSettings, getCafeSettingsAsync, saveCafeSettings, CafeSettings } from '@/lib/settingsStore';

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Menambahkan menu baru ke database Supabase
 */
export async function addMenuItem(formData: FormData): Promise<ActionResult<{ id?: string }>> {
  try {
    const supabase = await createClient();

    const name = formData.get('name')?.toString().trim();
    const category = formData.get('category')?.toString().trim();
    const priceRaw = formData.get('price')?.toString().trim();
    const stockRaw = formData.get('stock')?.toString().trim();
    const isReadyRaw = formData.get('is_ready')?.toString().trim();

    if (!name || !category || !priceRaw) {
      return { success: false, error: 'Nama, kategori, dan harga menu wajib diisi.' };
    }

    const price = parseFloat(priceRaw);
    if (isNaN(price) || price < 0) {
      return { success: false, error: 'Harga harus berupa angka valid dan tidak negatif.' };
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

    // Fallback jika kolom 'stock' belum ditambahkan ke schema Supabase (PGRST204)
    if (error && (error.code === 'PGRST204' || error.message?.includes('stock'))) {
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
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        return {
          success: false,
          error: 'Akses ditolak oleh Row Level Security (RLS) Supabase pada tabel "menu_items". Mohon jalankan skrip fix_menu_items_rls.sql di SQL Editor Supabase untuk mengizinkan staf menambah menu.',
        };
      }
      return { success: false, error: `Gagal menambahkan menu: ${error.message}` };
    }

    if (data?.id) {
      setItemStock(data.id, isNaN(stock) ? 20 : Math.max(0, stock));
    }

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true, data: { id: data?.id } };
  } catch (err: unknown) {
    console.error('Error in addMenuItem action:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menambahkan menu.',
    };
  }
}

/**
 * Mengubah data menu berdasarkan ID (termasuk Nama, Kategori, Harga, Status Stok, dan Jumlah Stok)
 */
export async function updateMenuItem(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const id = formData.get('id')?.toString().trim();
    const name = formData.get('name')?.toString().trim();
    const category = formData.get('category')?.toString().trim();
    const priceRaw = formData.get('price')?.toString().trim();
    const stockRaw = formData.get('stock')?.toString().trim();
    const isReadyRaw = formData.get('is_ready')?.toString().trim();

    if (!id || !name || !category || !priceRaw) {
      return { success: false, error: 'Data pembaruan tidak lengkap.' };
    }

    const price = parseFloat(priceRaw);
    if (isNaN(price) || price < 0) {
      return { success: false, error: 'Harga harus berupa angka valid dan tidak negatif.' };
    }

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
    if (error && (error.code === 'PGRST204' || error.message?.includes('stock'))) {
      delete payload.stock;
      const fallback = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', id);
      error = fallback.error;
    }

    if (error) {
      console.error('Gagal memperbarui menu:', error);
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        return {
          success: false,
          error: 'Akses ditolak oleh RLS Supabase. Mohon jalankan skrip fix_menu_items_rls.sql di SQL Editor Supabase.',
        };
      }
      return { success: false, error: `Gagal memperbarui menu: ${error.message}` };
    }

    if (stock !== undefined && !isNaN(stock)) {
      setItemStock(id, Math.max(0, stock));
    }

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error in updateMenuItem action:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat memperbarui menu.',
    };
  }
}

/**
 * Mengubah cepat jumlah stok (misal: tombol + / - stok)
 */
export async function updateMenuStock(id: string, newStock: number): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const stock = Math.max(0, newStock);
    const is_ready = stock > 0;

    let { error } = await supabase
      .from('menu_items')
      .update({ stock, is_ready })
      .eq('id', id);

    // Fallback jika kolom stock belum ada di tabel Supabase
    if (error && (error.code === 'PGRST204' || error.message?.includes('stock'))) {
      const fallback = await supabase
        .from('menu_items')
        .update({ is_ready })
        .eq('id', id);
      error = fallback.error;
    }

    if (error) {
      console.error('Gagal memperbarui stok:', error);
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        return {
          success: false,
          error: 'Akses ditolak oleh RLS Supabase. Jalankan skrip fix_menu_items_rls.sql di Supabase SQL Editor.',
        };
      }
      return { success: false, error: `Gagal memperbarui stok: ${error.message}` };
    }

    setItemStock(id, stock);

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error in updateMenuStock action:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat memperbarui stok.',
    };
  }
}

/**
 * Mengubah status ketersediaan menu (Ready / Habis)
 */
export async function toggleMenuStatus(id: string, currentStatus: boolean): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const nextStatus = !currentStatus;

    const payload: Record<string, unknown> = { is_ready: nextStatus };

    let { error } = await supabase
      .from('menu_items')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Gagal mengubah status menu:', error);
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        return {
          success: false,
          error: 'Akses ditolak oleh RLS Supabase. Jalankan skrip fix_menu_items_rls.sql di Supabase SQL Editor.',
        };
      }
      return { success: false, error: `Gagal mengubah status menu: ${error.message}` };
    }

    if (!nextStatus) {
      setItemStock(id, 0);
    } else {
      const current = getItemStock(id, false);
      if (current === 0) setItemStock(id, 20);
    }

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error in toggleMenuStatus action:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mengubah status menu.',
    };
  }
}

/**
 * Menghapus menu dari database berdasarkan ID
 */
export async function deleteMenuItem(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Gagal menghapus menu:', error);
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        return {
          success: false,
          error: 'Akses ditolak oleh RLS Supabase. Jalankan skrip fix_menu_items_rls.sql di Supabase SQL Editor.',
        };
      }
      return { success: false, error: `Gagal menghapus menu: ${error.message}` };
    }

    deleteItemStock(id);

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error in deleteMenuItem action:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menghapus menu.',
    };
  }
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

/**
 * Kasir memproses transaksi langsung di meja kasir (Walk-in POS Order)
 * - Otomatis status 'verified_paid' (Lunas)
 * - Mengurangi stok barang
 * - Revalidasi halaman
 */
export async function createPosOrderAction(order: CafeOrder): Promise<{ success: boolean; order?: CafeOrder; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Simpan pesanan kasir
    const saved = await saveOrder({
      ...order,
      status: 'verified_paid', // Langsung lunas karena dibayar di kasir
      updated_at: new Date().toISOString(),
    });

    // 2. Kurangi stok masing-masing menu yang dibeli
    for (const item of order.items) {
      if (item.menuItemId) {
        const nextStock = reduceItemStock(item.menuItemId, item.quantity);

        // Update ke Supabase jika kolom stock tersedia
        try {
          await supabase
            .from('menu_items')
            .update({
              stock: nextStock,
              is_ready: nextStock > 0,
            })
            .eq('id', item.menuItemId);
        } catch {
          // Fallback senyap jika Supabase RLS atau schema terbatas
        }
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true, order: saved };
  } catch (err: unknown) {
    console.error('Gagal create POS order:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal memproses transaksi kasir.',
    };
  }
}

/**
 * Mengambil pengaturan kafe (nama, wifi, promo banner, status buka)
 */
export async function getCafeSettingsAction(): Promise<CafeSettings> {
  return await getCafeSettingsAsync();
}

/**
 * Memperbarui pengaturan kafe
 */
export async function updateCafeSettingsAction(settings: Partial<CafeSettings>): Promise<{ success: boolean; settings: CafeSettings }> {
  const updated = saveCafeSettings(settings);

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('cafe_settings').upsert({
      id: 'default',
      cafe_name: updated.cafeName,
      address: updated.address,
      phone: updated.phone,
      operating_hours: updated.operatingHours,
      wifi_ssid: updated.wifiSsid,
      wifi_password: updated.wifiPassword,
      is_open: updated.isOpen,
      promo_banner_active: updated.promoBannerActive,
      promo_banner_text: updated.promoBannerText,
      tax_percent: updated.taxPercent,
      service_charge_percent: updated.serviceChargePercent,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Gagal sync cafe_settings ke Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Koneksi Supabase error saat simpan pengaturan:', err);
  }

  revalidatePath('/');
  revalidatePath('/dashboard');
  return { success: true, settings: updated };
}

/**
 * Restock Cepat Massal: Menambah stok pada semua menu yang habis / menipis (<= 5 porsi)
 */
export async function batchRestockLowStockAction(amount: number = 20): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: items } = await supabase.from('menu_items').select('id, name, stock, is_ready');

    let count = 0;
    if (items) {
      for (const item of items) {
        const curStock = getItemStock(item.id, item.is_ready);
        if (curStock <= 5) {
          const newStock = curStock + amount;
          setItemStock(item.id, newStock);

          try {
            await supabase
              .from('menu_items')
              .update({ stock: newStock, is_ready: true })
              .eq('id', item.id);
          } catch {
            // fallback
          }
          count++;
        }
      }
    }

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true, count };
  } catch (err: unknown) {
    console.error('Error in batchRestock:', err);
    return { success: false, count: 0, error: err instanceof Error ? err.message : 'Gagal restock massal.' };
  }
}
