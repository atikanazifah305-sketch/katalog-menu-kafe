import fs from 'fs';
import path from 'path';
import { MenuItem } from '@/types/menu';

const DATA_DIR = path.join(process.cwd(), 'data');
const STOCKS_FILE = path.join(DATA_DIR, 'menu_stocks.json');

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STOCKS_FILE)) {
      fs.writeFileSync(STOCKS_FILE, JSON.stringify({}, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error creating data directory/file:', err);
  }
}

function loadStocksFromFile(): Record<string, number> {
  try {
    ensureDataFile();
    if (fs.existsSync(STOCKS_FILE)) {
      const content = fs.readFileSync(STOCKS_FILE, 'utf-8');
      return JSON.parse(content || '{}');
    }
  } catch (err) {
    console.error('Error reading stocks from file:', err);
  }
  return {};
}

function saveStocksToFile(stocks: Record<string, number>) {
  try {
    ensureDataFile();
    fs.writeFileSync(STOCKS_FILE, JSON.stringify(stocks, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing stocks to file:', err);
  }
}

/**
 * Mendapatkan stok menu berdasarkan ID
 */
export function getItemStock(id: string, fallbackReady: boolean = true): number {
  const stocks = loadStocksFromFile();
  if (stocks[id] !== undefined) {
    return stocks[id];
  }
  return fallbackReady ? 20 : 0;
}

/**
 * Menyimpan stok menu berdasarkan ID
 */
export function setItemStock(id: string, stock: number): void {
  const stocks = loadStocksFromFile();
  const valid = Math.max(0, Math.floor(stock));
  stocks[id] = valid;
  saveStocksToFile(stocks);
}

/**
 * Menghapus stok menu berdasarkan ID
 */
export function deleteItemStock(id: string): void {
  const stocks = loadStocksFromFile();
  if (stocks[id] !== undefined) {
    delete stocks[id];
    saveStocksToFile(stocks);
  }
}

/**
 * Menggabungkan menu item dari database dengan data stok persisten
 */
export function mergeStockWithMenuItems(items: MenuItem[]): MenuItem[] {
  const stocks = loadStocksFromFile();
  let hasChanges = false;

  const result = items.map((item) => {
    let stockValue: number;

    // Jika Supabase sudah memiliki kolom stock dan bernilai valid
    if (item.stock !== undefined && item.stock !== null && !isNaN(Number(item.stock))) {
      stockValue = Number(item.stock);
      if (stocks[item.id] !== stockValue) {
        stocks[item.id] = stockValue;
        hasChanges = true;
      }
    } else if (stocks[item.id] !== undefined) {
      stockValue = stocks[item.id];
    } else {
      // Default jika belum ada stok tercatat
      stockValue = item.is_ready ? 20 : 0;
      stocks[item.id] = stockValue;
      hasChanges = true;
    }

    return {
      ...item,
      stock: stockValue,
      is_ready: stockValue > 0 ? item.is_ready : false,
    };
  });

  if (hasChanges) {
    saveStocksToFile(stocks);
  }

  return result;
}
