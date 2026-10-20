'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export interface AuthState {
  error?: string | null;
  success?: string | null;
}

/**
 * Server Action untuk Login dengan Email & Password via Supabase Auth
 */
export async function login(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString().trim();

  if (!email || !password) {
    return { error: 'Email dan kata sandi wajib diisi.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Translate pesan umum Supabase ke Bahasa Indonesia
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email atau kata sandi salah. Silakan periksa kembali.' };
    }
    if (error.message.includes('Email not confirmed')) {
      return { 
        error: 'Email belum dikonfirmasi. Silakan periksa inbox email Anda atau nonaktifkan Confirm Email di Dashboard Supabase.' 
      };
    }
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

/**
 * Server Action untuk Pendaftaran Akun Baru (Sign Up) via Supabase Auth
 */
export async function signup(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString().trim();
  const fullName = formData.get('fullName')?.toString().trim() || 'Staf Kafe';

  if (!email || !password) {
    return { error: 'Email dan kata sandi wajib diisi.' };
  }

  if (password.length < 6) {
    return { error: 'Kata sandi minimal 6 karakter.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    if (error.message.includes('User already registered')) {
      return { error: 'Email ini sudah terdaftar. Silakan langsung login.' };
    }
    return { error: error.message };
  }

  // Jika session langsung aktif (auto-confirm aktif di Supabase)
  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/dashboard');
  }

  // Jika memerlukan konfirmasi email
  return {
    success: 'Pendaftaran berhasil! Akun Anda telah dibuat. Silakan login atau periksa email konfirmasi jika fitur verifikasi aktif di Supabase.',
  };
}

/**
 * Server Action untuk Logout / Sign Out
 */
export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
