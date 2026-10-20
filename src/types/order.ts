export type PaymentMethod = 'cash' | 'qris' | 'transfer';

export type OrderStatus = 
  | 'pending_cash'          // Tunai: Menunggu pelanggan ke meja kasir
  | 'pending_verification'  // QRIS / Transfer: Pelanggan klaim sudah bayar, menunggu kasir verifikasi mutasi
  | 'verified_paid'         // LUNAS: Kasir sudah konfirmasi uang masuk, pesanan sedang diracik barista
  | 'completed'             // SELESAI: Pesanan sudah selesai diracik dan diantar ke meja
  | 'cancelled';            // BATAL: Uang tidak masuk atau pesanan dibatalkan

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface CafeOrder {
  id: string; // contoh: KF-4830
  table_number: string;
  customer_name: string;
  items: OrderItem[];
  total_price: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
}
