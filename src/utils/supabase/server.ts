import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Membuat instance client Supabase untuk Server Component, Server Actions, dan Route Handlers.
 * Menggunakan cookieStore asinkron dari next/headers (standar Next.js App Router).
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Konfigurasi Supabase tidak lengkap. Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY sudah disetel di .env.local'
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Method setAll dipanggil dari Server Component.
          // Ini dapat diabaikan jika middleware menyegarkan sesi pengguna.
        }
      },
    },
  });
}
