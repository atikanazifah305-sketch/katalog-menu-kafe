export interface MenuItem {
  id: string;
  name: string;
  category: 'Kopi' | 'Non-Kopi' | 'Makanan' | 'Snack' | string;
  price: number;
  stock?: number;
  is_ready: boolean;
  created_at: string;
}

export type MenuCategory = 'Kopi' | 'Non-Kopi' | 'Makanan' | 'Snack';

export const MENU_CATEGORIES: MenuCategory[] = ['Kopi', 'Non-Kopi', 'Makanan', 'Snack'];
