import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '@/utils/supabase/server';

import { CafeSettings, DEFAULT_SETTINGS } from '@/types/settings';
export type { CafeSettings };
export { DEFAULT_SETTINGS };

// Gunakan folder data lokal atau fallback ke os.tmpdir() jika filesystem root read-only (misal di Vercel)
const DATA_DIR = process.env.VERCEL || process.env.NODE_ENV === 'production'
  ? path.join(os.tmpdir(), 'cafe_data')
  : path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'cafe_settings.json');

let memorySettings: CafeSettings = { ...DEFAULT_SETTINGS };
let isInitialized = false;

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
    }
  } catch {
    // Abaikan jika read-only
  }
}

export function getCafeSettings(): CafeSettings {
  if (isInitialized) {
    return memorySettings;
  }

  try {
    ensureDataFile();
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(content || '{}');
      memorySettings = { ...DEFAULT_SETTINGS, ...parsed };
      isInitialized = true;
      return memorySettings;
    }
  } catch {
    // Fallback ke memory
  }

  isInitialized = true;
  return memorySettings;
}

export function saveCafeSettings(newSettings: Partial<CafeSettings>): CafeSettings {
  const current = getCafeSettings();
  const updated: CafeSettings = {
    ...current,
    ...newSettings,
  };

  memorySettings = updated;

  try {
    ensureDataFile();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch {
    // Abaikan jika read-only, data tetap di memori
  }

  return updated;
}

/**
 * Mengambil pengaturan kafe dari Supabase jika tersedia (agar tersimpan permanen di cloud)
 */
export async function getCafeSettingsAsync(): Promise<CafeSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cafe_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (!error && data) {
      const dbSettings: CafeSettings = {
        cafeName: data.cafe_name || DEFAULT_SETTINGS.cafeName,
        address: data.address || DEFAULT_SETTINGS.address,
        phone: data.phone || DEFAULT_SETTINGS.phone,
        operatingHours: data.operating_hours || DEFAULT_SETTINGS.operatingHours,
        wifiSsid: data.wifi_ssid || DEFAULT_SETTINGS.wifiSsid,
        wifiPassword: data.wifi_password || DEFAULT_SETTINGS.wifiPassword,
        isOpen: data.is_open ?? DEFAULT_SETTINGS.isOpen,
        promoBannerActive: data.promo_banner_active ?? DEFAULT_SETTINGS.promoBannerActive,
        promoBannerText: data.promo_banner_text || DEFAULT_SETTINGS.promoBannerText,
        taxPercent: Number(data.tax_percent || 0),
        serviceChargePercent: Number(data.service_charge_percent || 0),
        adminPin: data.admin_pin || DEFAULT_SETTINGS.adminPin,
      };
      memorySettings = dbSettings;
      saveCafeSettings(dbSettings);
      return dbSettings;
    }
  } catch (err) {
    console.warn('Gagal membaca cafe_settings dari Supabase:', err);
  }

  return getCafeSettings();
}

