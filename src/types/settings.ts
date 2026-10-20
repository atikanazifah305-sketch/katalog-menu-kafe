export interface CafeSettings {
  cafeName: string;
  address: string;
  phone: string;
  operatingHours: string;
  wifiSsid: string;
  wifiPassword: string;
  isOpen: boolean;
  promoBannerActive: boolean;
  promoBannerText: string;
  taxPercent: number;
  serviceChargePercent: number;
  adminPin: string;
}

export const DEFAULT_SETTINGS: CafeSettings = {
  cafeName: 'Kafe Atika Nazifah',
  address: 'Jl. Ahmad Yani No. 12, Coffee Bar & Resto',
  phone: '0812-3456-7890',
  operatingHours: '08:00 - 22:00 WIB',
  wifiSsid: 'KafeAtika_5G',
  wifiPassword: 'kopi2026',
  isOpen: true,
  promoBannerActive: true,
  promoBannerText: '✨ Promo Spesial: Dapatkan diskon 10% untuk pesanan Dine-In hari ini!',
  taxPercent: 0,
  serviceChargePercent: 0,
  adminPin: '2026',
};
