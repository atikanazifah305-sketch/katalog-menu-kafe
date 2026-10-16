import { InventoryItem, ItemFormData, StockLog, UserProfile } from '@/types/inventory';
import { getSupabase, isSupabaseConfigured } from './supabase';

const LOCAL_STORAGE_ITEMS_KEY = 'inventaris_items_v1';
const LOCAL_STORAGE_LOGS_KEY = 'inventaris_logs_v1';
const LOCAL_STORAGE_USER_KEY = 'inventaris_user_v1';

// Initial Mock Data jika belum ada koneksi Supabase atau local data
const INITIAL_DEMO_ITEMS: InventoryItem[] = [
  {
    id: 'item-1',
    sku: 'SKU-LP-001',
    name: 'Laptop Asus Zenbook 14 OLED',
    category: 'Elektronik',
    quantity: 18,
    min_stock: 5,
    unit: 'Unit',
    purchase_price: 13500000,
    selling_price: 15999000,
    location: 'Rak A1 - Elektronik',
    description: 'Intel Core i7 13th Gen, 16GB RAM, 1TB SSD, Layar 2.8K OLED',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-2',
    sku: 'SKU-MS-002',
    name: 'Logitech MX Master 3S Wireless Mouse',
    category: 'Elektronik',
    quantity: 34,
    min_stock: 10,
    unit: 'Pcs',
    purchase_price: 1250000,
    selling_price: 1650000,
    location: 'Rak A2 - Aksesoris',
    description: 'Ergonomic mouse 8K DPI quiet click sensor, Bluetooth & Bolt USB',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-3',
    sku: 'SKU-KB-003',
    name: 'Keychron K2 Pro Mechanical Keyboard',
    category: 'Elektronik',
    quantity: 12,
    min_stock: 5,
    unit: 'Unit',
    purchase_price: 1400000,
    selling_price: 1850000,
    location: 'Rak A2 - Aksesoris',
    description: 'Wireless QMK/VIA Custom Mechanical Keyboard, Red Switch RGB',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-4',
    sku: 'SKU-MN-004',
    name: 'Monitor Dell UltraSharp 27 Inch 4K U2723QE',
    category: 'Elektronik',
    quantity: 7,
    min_stock: 4,
    unit: 'Unit',
    purchase_price: 7200000,
    selling_price: 8499000,
    location: 'Rak B1 - Display',
    description: 'IPS Black Technology, USB-C 90W Power Delivery hub',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-5',
    sku: 'SKU-PP-005',
    name: 'Kertas HVS PaperOne A4 80gr',
    category: 'ATK & Kantor',
    quantity: 4,
    min_stock: 15,
    unit: 'Rim',
    purchase_price: 48000,
    selling_price: 58000,
    location: 'Gudang Belakang - Rak B4',
    description: 'Kertas HVS putih bersih kualitas tinggi, isi 500 lembar per rim',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-6',
    sku: 'SKU-PN-006',
    name: 'Pulpen Gel Pilot G2 0.5mm Hitam',
    category: 'ATK & Kantor',
    quantity: 50,
    min_stock: 20,
    unit: 'Box',
    purchase_price: 120000,
    selling_price: 145000,
    location: 'Rak C1 - Alat Tulis',
    description: '1 box isi 12 pulpen gel tinta pekat dan lancar',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-7',
    sku: 'SKU-CH-007',
    name: 'Kursi Kerja Ergonomis Pexio Taylor',
    category: 'Perabotan',
    quantity: 3,
    min_stock: 5,
    unit: 'Unit',
    purchase_price: 1850000,
    selling_price: 2350000,
    location: 'Gudang Perabot - P1',
    description: 'Bahan mesh sejuk, sandaran 2D lumbar support, hydraulic class 4',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-8',
    sku: 'SKU-DK-008',
    name: 'Meja Kerja Minimalis Kayu Jati 140cm',
    category: 'Perabotan',
    quantity: 0,
    min_stock: 3,
    unit: 'Unit',
    purchase_price: 1200000,
    selling_price: 1650000,
    location: 'Gudang Perabot - P2',
    description: 'Kaki besi hollow hitam doff tahan karat, daun meja solid wood',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper LocalStorage
const getLocalItems = (): InventoryItem[] => {
  if (typeof window === 'undefined') return INITIAL_DEMO_ITEMS;
  const stored = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(INITIAL_DEMO_ITEMS));
    return INITIAL_DEMO_ITEMS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_DEMO_ITEMS;
  }
};

const saveLocalItems = (items: InventoryItem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items));
  }
};

const getLocalLogs = (): StockLog[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

const saveLocalLog = (log: Omit<StockLog, 'id' | 'created_at'>) => {
  const logs = getLocalLogs();
  const newLog: StockLog = {
    ...log,
    id: `log-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  logs.unshift(newLog);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  }
};

// ==========================================
// OPERASI DATA BARANG (CRUD & STOK)
// ==========================================

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase get error, falling back to local storage:', error.message);
        return getLocalItems();
      }
      if (data && data.length > 0) {
        return data as InventoryItem[];
      }
      // Jika database Supabase masih kosong, kita bisa kembalikan array kosong atau sinkronkan data awal
      return data || [];
    } catch (err) {
      console.warn('Supabase fetch exception, fallback to local:', err);
      return getLocalItems();
    }
  }
  return getLocalItems();
};

export const createInventoryItem = async (formData: ItemFormData): Promise<InventoryItem> => {
  const supabase = getSupabase();
  const newItemData = {
    ...formData,
    quantity: Number(formData.quantity) || 0,
    min_stock: Number(formData.min_stock) || 0,
    purchase_price: Number(formData.purchase_price) || 0,
    selling_price: Number(formData.selling_price) || 0,
  };

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('items')
        .insert([newItemData])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Catat log stok awal
      await createStockLogRecord({
        item_id: data.id,
        item_name: data.name,
        type: 'IN',
        amount: data.quantity,
        previous_stock: 0,
        new_stock: data.quantity,
        reason: 'Inisialisasi stok barang baru',
      });

      return data as InventoryItem;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error creating in Supabase:', errorMessage);
      throw err;
    }
  }

  // Fallback LocalStorage
  const items = getLocalItems();
  const created: InventoryItem = {
    ...newItemData,
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  items.unshift(created);
  saveLocalItems(items);

  saveLocalLog({
    item_id: created.id,
    item_name: created.name,
    type: 'IN',
    amount: created.quantity,
    previous_stock: 0,
    new_stock: created.quantity,
    reason: 'Inisialisasi stok barang baru (Lokal)',
  });

  return created;
};

export const updateInventoryItem = async (id: string, formData: Partial<ItemFormData>): Promise<InventoryItem> => {
  const supabase = getSupabase();
  const updateData = {
    ...formData,
    quantity: formData.quantity !== undefined ? Number(formData.quantity) : undefined,
    min_stock: formData.min_stock !== undefined ? Number(formData.min_stock) : undefined,
    purchase_price: formData.purchase_price !== undefined ? Number(formData.purchase_price) : undefined,
    selling_price: formData.selling_price !== undefined ? Number(formData.selling_price) : undefined,
    updated_at: new Date().toISOString(),
  };

  // Bersihkan undefined
  Object.keys(updateData).forEach(
    (key) => (updateData as Record<string, unknown>)[key] === undefined && delete (updateData as Record<string, unknown>)[key]
  );

  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data as InventoryItem;
  }

  // Fallback LocalStorage
  const items = getLocalItems();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) throw new Error('Barang tidak ditemukan');

  const current = items[index];
  const updated: InventoryItem = {
    ...current,
    sku: formData.sku !== undefined ? formData.sku : current.sku,
    name: formData.name !== undefined ? formData.name : current.name,
    category: formData.category !== undefined ? formData.category : current.category,
    quantity: formData.quantity !== undefined ? Number(formData.quantity) : current.quantity,
    min_stock: formData.min_stock !== undefined ? Number(formData.min_stock) : current.min_stock,
    unit: formData.unit !== undefined ? formData.unit : current.unit,
    purchase_price: formData.purchase_price !== undefined ? Number(formData.purchase_price) : current.purchase_price,
    selling_price: formData.selling_price !== undefined ? Number(formData.selling_price) : current.selling_price,
    location: formData.location !== undefined ? formData.location : current.location,
    description: formData.description !== undefined ? formData.description : current.description,
    updated_at: new Date().toISOString(),
  };

  items[index] = updated;
  saveLocalItems(items);
  return updated;
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  // Fallback LocalStorage
  const items = getLocalItems();
  const filtered = items.filter((i) => i.id !== id);
  saveLocalItems(filtered);
};

export const adjustItemStock = async (
  item: InventoryItem,
  delta: number,
  reason: string = 'Penyesuaian Cepat'
): Promise<InventoryItem> => {
  const previousStock = item.quantity;
  const newStock = Math.max(0, previousStock + delta);
  const type = delta > 0 ? 'IN' : 'OUT';

  const updated = await updateInventoryItem(item.id, {
    quantity: newStock,
  });

  await createStockLogRecord({
    item_id: item.id,
    item_name: item.name,
    type: delta === 0 ? 'ADJUSTMENT' : type,
    amount: Math.abs(delta),
    previous_stock: previousStock,
    new_stock: newStock,
    reason,
  });

  return updated;
};

export const createStockLogRecord = async (
  log: Omit<StockLog, 'id' | 'created_at'>
): Promise<void> => {
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.from('stock_logs').insert([log]);
      return;
    } catch (err) {
      console.warn('Gagal mencatat log ke Supabase:', err);
    }
  }
  saveLocalLog(log);
};

export const getStockLogs = async (): Promise<StockLog[]> => {
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('stock_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        return data as StockLog[];
      }
    } catch {
      // fallback
    }
  }
  return getLocalLogs();
};

// ==========================================
// AUTENTIKASI (SUPABASE AUTH / DEMO AUTH)
// ==========================================

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        return {
          id: data.user.id,
          email: data.user.email || 'user@example.com',
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          role: data.user.user_metadata?.role || 'Admin Gudang',
        };
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Cek local user jika mode demo
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
  }
  return null;
};

export const loginWithEmail = async (email: string, password: string): Promise<UserProfile> => {
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        throw new Error(
          'Email atau kata sandi tidak cocok, atau akun belum dibuat di Supabase. Silakan klik tab "Daftar Akun" di atas untuk membuat akun terlebih dahulu.'
        );
      }
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error(
          'Email belum dikonfirmasi. Silakan periksa inbox email Anda, atau nonaktifkan "Confirm email" di Supabase Dashboard (Authentication > Providers > Email).'
        );
      }
      throw new Error(error.message);
    }
    if (!data.user) {
      throw new Error('Gagal mendapatkan sesi pengguna.');
    }
    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email || email,
      full_name: data.user.user_metadata?.full_name || email.split('@')[0],
      role: 'Staff Inventaris',
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    }
    return profile;
  }

  // Demo Login
  if (!email || !password) {
    throw new Error('Email dan password wajib diisi.');
  }
  if (password.length < 6) {
    throw new Error('Password minimal 6 karakter.');
  }

  const demoUser: UserProfile = {
    id: 'demo-user-1',
    email,
    full_name: email.split('@')[0].toUpperCase(),
    role: 'Admin Inventaris (Demo)',
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoUser));
  }
  return demoUser;
};

export const loginDemoUser = async (): Promise<UserProfile> => {
  const demoUser: UserProfile = {
    id: 'demo-user-1',
    email: 'admin@inventarispro.id',
    full_name: 'Admin Gudang (Demo)',
    role: 'Staff Inventaris',
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoUser));
  }
  return demoUser;
};

export const registerWithEmail = async (email: string, password: string, fullName: string): Promise<UserProfile> => {
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'Staff Inventaris',
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    const hasSession = Boolean(data.session);
    const profile: UserProfile = {
      id: data.user?.id || 'new-user',
      email: data.user?.email || email,
      full_name: fullName,
      role: 'Staff Inventaris',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    }

    // Jika Supabase mengaktifkan email confirmation, data.session adalah null
    if (!hasSession && data.user) {
      throw new Error(
        'Akun berhasil didaftarkan di Supabase! Harap periksa email Anda untuk konfirmasi, ATAU nonaktifkan "Confirm email" di Dashboard Supabase (Authentication > Providers > Email) agar bisa langsung login.'
      );
    }

    return profile;
  }

  // Demo Register
  if (!email || !password) {
    throw new Error('Email dan password wajib diisi.');
  }
  const demoUser: UserProfile = {
    id: `demo-${Date.now()}`,
    email,
    full_name: fullName || email.split('@')[0],
    role: 'Staff Inventaris (Demo)',
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoUser));
  }
  return demoUser;
};

export const logoutUser = async (): Promise<void> => {
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase logout error:', e);
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  }
};

export const subscribeToAuthChanges = (callback: (user: UserProfile | null) => void) => {
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          role: session.user.user_metadata?.role || 'Staff Inventaris',
        };
        callback(profile);
      } else {
        // Jangan timpa jika ada user demo lokal
        if (typeof window !== 'undefined' && localStorage.getItem(LOCAL_STORAGE_USER_KEY)) {
          try {
            callback(JSON.parse(localStorage.getItem(LOCAL_STORAGE_USER_KEY)!));
            return;
          } catch {
            // ignore
          }
        }
        callback(null);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }
  return () => {};
};
