import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Jika pengguna sudah login, arahkan langsung ke dashboard staf
  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden antialiased selection:bg-amber-500 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/15 dark:bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-orange-500/15 dark:bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-amber-600/10 dark:bg-amber-600/5 rounded-full blur-3xl" />
      </div>

      {/* Navigasi Kembali ke Menu Pelanggan */}
      <div className="w-full max-w-md mb-4 flex justify-start">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Menu Pelanggan</span>
        </Link>
      </div>

      <div className="w-full flex justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
