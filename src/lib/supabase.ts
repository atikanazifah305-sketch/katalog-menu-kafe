import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Ambil konfigurasi dari environment variables atau localStorage di browser
export const getSupabaseConfig = () => {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('supabase_url');
    const localKey = localStorage.getItem('supabase_anon_key');
    if (localUrl && localKey) {
      return { url: localUrl, anonKey: localKey, isCustom: true };
    }
  }

  const isValidEnv = envUrl && envUrl.startsWith('http') && !envUrl.includes('your-project-id');
  return {
    url: isValidEnv ? envUrl : '',
    anonKey: isValidEnv ? envKey : '',
    isCustom: false
  };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http') && !url.includes('your-project-id'));
};

let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !url.startsWith('http') || url.includes('your-project-id')) {
    return null;
  }

  // Jika instance sudah ada dan URL sesuai, gunakan kembali
  if (!clientInstance) {
    clientInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
};

// Reset client instance jika konfigurasi diubah di browser
export const resetSupabaseClient = () => {
  clientInstance = null;
};
