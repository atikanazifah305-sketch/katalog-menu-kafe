export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  min_stock: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  location: string;
  description?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export type ItemFormData = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>;

export interface StockLog {
  id: string;
  item_id: string;
  item_name?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  amount: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
}

export type StockStatus = 'all' | 'safe' | 'low' | 'out';

export type SortField = 'name' | 'quantity' | 'selling_price' | 'updated_at';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  search: string;
  category: string;
  status: StockStatus;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface InventoryStats {
  totalItems: number;
  totalUnits: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}
