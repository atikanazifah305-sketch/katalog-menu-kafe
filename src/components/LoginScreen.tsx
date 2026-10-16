'use client';

import React, { useState } from 'react';
import { Package, Lock, Mail, User, LogIn, UserPlus, Zap, Database, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import styles from './LoginScreen.module.css';
import { loginWithEmail, registerWithEmail, loginDemoUser } from '@/lib/inventoryService';
import { UserProfile } from '@/types/inventory';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  isSupabaseLive: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  isSupabaseLive,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setLoading(true);
      if (tab === 'login') {
        const user = await loginWithEmail(email, password);
        onLoginSuccess(user);
      } else {
        const user = await registerWithEmail(email, password, fullName);
        if (isSupabaseLive) {
          setSuccessMsg(
            'Pendaftaran berhasil! Akun Anda telah terdaftar di database Supabase.'
          );
        }
        onLoginSuccess(user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat otentikasi.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setErrorMsg('');
    try {
      setLoading(true);
      // Demo login bypass lokal instan tanpa gagal kredensial
      const user = await loginDemoUser();
      onLoginSuccess(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal demo login.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <div className={styles.logoIcon}>
            <Package size={30} strokeWidth={2.4} />
          </div>
          <h1 className={styles.title}>InventarisPro</h1>
          <p className={styles.subtitle}>
            Masuk dengan akun Supabase Anda untuk mengakses dashboard manajemen inventaris &amp; stok
          </p>

          <div className={styles.supabasePill}>
            <Database size={13} />
            <span>{isSupabaseLive ? 'Supabase Auth Aktif' : 'Mode Demo Offline'}</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabSwitcher}>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === 'login' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
          >
            <LogIn size={15} />
            <span>Masuk</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === 'register' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
          >
            <UserPlus size={15} />
            <span>Daftar Akun</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className={`${styles.alertBox} ${styles.alertError}`} style={{ marginBottom: '1rem', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorMsg}</span>
            </div>
            {tab === 'login' && errorMsg.includes('Daftar Akun') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setTab('register');
                  setErrorMsg('');
                }}
                style={{ marginTop: '0.65rem', alignSelf: 'flex-start', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              >
                <span>Buka Form Pendaftaran</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className={`${styles.alertBox} ${styles.alertSuccess}`} style={{ marginBottom: '1rem' }}>
            <CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Petunjuk Tab */}
        <div
          style={{
            fontSize: '0.785rem',
            color: 'var(--text-dim)',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {tab === 'login' ? (
            <span>
              ℹ️ Masuk dengan email &amp; sandi akun yang sudah terdaftar. Belum punya akun? Klik tab <strong>Daftar Akun</strong>.
            </span>
          ) : (
            <span>
              ℹ️ Daftarkan email dan kata sandi baru untuk staf/admin gudang ke database Supabase Anda.
            </span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {tab === 'register' && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Nama Lengkap *</label>
              <div className={styles.inputWrapper}>
                <User size={16} className={styles.inputIcon} />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  className={styles.input}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Akun *</label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                type="email"
                required
                placeholder="nama@perusahaan.com"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Kata Sandi *</label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? (
              <span>Memverifikasi...</span>
            ) : tab === 'login' ? (
              <>
                <LogIn size={17} />
                <span>Masuk ke Dashboard</span>
              </>
            ) : (
              <>
                <UserPlus size={17} />
                <span>Daftar Akun Baru</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className={styles.divider}>
          <span className={styles.dividerText}>Atau Uji Cepat</span>
        </div>

        {/* Quick Demo */}
        <button
          type="button"
          className={`btn btn-secondary btn-sm ${styles.demoBtn}`}
          onClick={handleQuickDemo}
          disabled={loading}
          title="Masuk langsung ke dashboard menggunakan sesi demo tanpa kredensial Supabase"
        >
          <Zap size={14} color="#f59e0b" />
          <span>Masuk Sebagai Akun Demo (1-Klik)</span>
        </button>
      </div>
    </div>
  );
};
