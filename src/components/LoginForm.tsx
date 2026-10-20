'use client';

import { useState, useTransition } from 'react';
import { login, signup, AuthState } from '@/app/auth/actions';
import { 
  Coffee, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  KeyRound
} from 'lucide-react';

export default function LoginForm() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<AuthState>({});
  const [isPending, startTransition] = useTransition();

  const handleFormSubmit = (formData: FormData) => {
    setState({});
    startTransition(async () => {
      let res: AuthState;
      if (tab === 'login') {
        res = await login(null, formData);
      } else {
        res = await signup(null, formData);
      }
      if (res) {
        setState(res);
      }
    });
  };

  return (
    <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-7 sm:p-9 space-y-6">
      {/* Brand Icon & Heading */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-600/30">
          <Coffee className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Katalog Menu Kafe
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Masuk dengan akun Supabase Auth Anda untuk mengakses Dashboard Manajemen Menu
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setTab('login');
            setState({});
          }}
          className={`py-2.5 rounded-xl transition cursor-pointer ${
            tab === 'login'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('register');
            setState({});
          }}
          className={`py-2.5 rounded-xl transition cursor-pointer ${
            tab === 'register'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Daftar Akun
        </button>
      </div>

      {/* Feedback Messages */}
      {state.error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {state.success && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.success}</span>
        </div>
      )}

      {/* Form Fields */}
      <form action={handleFormSubmit} className="space-y-4">
        {/* Nama Lengkap (Khusus Register) */}
        {tab === 'register' && (
          <>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="Contoh: Barista Andi"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            {/* Kode Rahasia Staf Karyawan (Proteksi Akses) */}
            <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Kode Rahasia Staf <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                  Khusus Karyawan
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-amber-500" />
                <input
                  type="password"
                  name="staffPasscode"
                  required
                  placeholder="Masukkan kode rahasia staf"
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-tight">
                🔒 Pelanggan umum dilarang mendaftar. Hubungi manajer kafe untuk mendapatkan kode.
              </p>
            </div>
          </>
        )}

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Alamat Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="email"
              name="email"
              required
              placeholder="nama@kafeanda.com"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Kata Sandi <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-[0.98] disabled:opacity-50 transition shadow-lg shadow-amber-600/25 cursor-pointer mt-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memproses...
            </>
          ) : tab === 'login' ? (
            <>
              Masuk ke Dashboard
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Daftar Akun Baru
              <ShieldCheck className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Info Footer */}
      <div className="pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
        Dilindungi oleh <strong>Supabase Authentication</strong> terenkripsi.
      </div>
    </div>
  );
}
