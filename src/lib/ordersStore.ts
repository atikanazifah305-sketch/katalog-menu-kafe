import fs from 'fs';
import path from 'path';
import { CafeOrder, OrderStatus } from '@/types/order';
import { createClient } from '@/utils/supabase/server';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'orders.json');

// Memory cache untuk performa tinggi
let memoryOrders: CafeOrder[] = [];
let isInitialized = false;

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error creating data directory/file:', err);
  }
}

function loadOrdersFromFile(): CafeOrder[] {
  try {
    ensureDataFile();
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content || '[]');
    }
  } catch (err) {
    console.error('Error reading orders from file:', err);
  }
  return [];
}

function saveOrdersToFile(orders: CafeOrder[]) {
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing orders to file:', err);
  }
}

function initMemory() {
  if (!isInitialized) {
    memoryOrders = loadOrdersFromFile();
    isInitialized = true;
  }
}

/**
 * Menyimpan pesanan baru (disimpan ke file lokal & dicoba sinkron ke Supabase)
 */
export async function saveOrder(order: CafeOrder): Promise<CafeOrder> {
  initMemory();

  // Cek apakah order sudah ada di memory
  const existingIdx = memoryOrders.findIndex((o) => o.id === order.id);
  if (existingIdx > -1) {
    memoryOrders[existingIdx] = { ...order, updated_at: new Date().toISOString() };
  } else {
    memoryOrders.unshift(order);
  }

  saveOrdersToFile(memoryOrders);

  // Coba simpan ke Supabase jika tabel 'orders' sudah ada
  try {
    const supabase = await createClient();
    await supabase.from('orders').upsert({
      id: order.id,
      table_number: order.table_number,
      customer_name: order.customer_name,
      items: order.items,
      total_price: order.total_price,
      payment_method: order.payment_method,
      status: order.status,
      created_at: order.created_at,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Fallback senyap jika tabel Supabase belum dibuat
  }

  return order;
}

/**
 * Mengambil semua pesanan (paling baru di atas)
 */
export async function getAllOrders(): Promise<CafeOrder[]> {
  initMemory();

  // Coba ambil dari Supabase terlebih dahulu
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      memoryOrders = data as CafeOrder[];
      saveOrdersToFile(memoryOrders);
      return memoryOrders;
    }
  } catch {
    // Abaikan jika Supabase orders belum ada
  }

  return memoryOrders;
}

/**
 * Mengambil detail pesanan berdasarkan ID
 */
export async function getOrderById(orderId: string): Promise<CafeOrder | null> {
  initMemory();
  const found = memoryOrders.find((o) => o.id === orderId);
  return found || null;
}

/**
 * Memperbarui status pesanan (contoh: pending_verification -> verified_paid)
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<CafeOrder | null> {
  initMemory();

  const idx = memoryOrders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;

  const updated: CafeOrder = {
    ...memoryOrders[idx],
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  memoryOrders[idx] = updated;
  saveOrdersToFile(memoryOrders);

  // Sync update ke Supabase jika tersedia
  try {
    const supabase = await createClient();
    await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: updated.updated_at,
      })
      .eq('id', orderId);
  } catch {
    // Fallback senyap
  }

  return updated;
}
