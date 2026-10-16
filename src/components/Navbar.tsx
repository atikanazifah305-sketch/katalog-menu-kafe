'use client';

import React from 'react';
import { Package, Database, LogIn, LogOut, History, ShieldCheck } from 'lucide-react';
import styles from './Navbar.module.css';
import { UserProfile } from '@/types/inventory';

interface NavbarProps {
  user: UserProfile | null;
  isSupabaseLive: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenSupabaseConfig: () => void;
  onOpenStockLogs: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isSupabaseLive,
  onOpenAuth,
  onLogout,
  onOpenSupabaseConfig,
  onOpenStockLogs,
}) => {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandGroup}>
          <div className={styles.logoIconWrapper}>
            <Package size={22} strokeWidth={2.4} />
          </div>
          <div className={styles.brandInfo}>
            <div className={styles.brandTitle}>
              InventarisPro
              <span className={styles.brandBadge}>Next.js + Supabase</span>
            </div>
            <div className={styles.brandTagline}>Sistem Manajemen Stok & Inventaris Real-Time</div>
          </div>
        </div>

        <div className={styles.actionsGroup}>
          {/* Supabase Status Pill */}
          <button
            type="button"
            className={styles.statusPill}
            onClick={onOpenSupabaseConfig}
            title="Klik untuk konfigurasi URL & API Key Supabase"
          >
            <div className={isSupabaseLive ? styles.dotConnected : styles.dotDemo} />
            <Database size={14} style={{ color: isSupabaseLive ? '#34d399' : '#f59e0b' }} />
            <span>{isSupabaseLive ? 'Supabase Live' : 'Mode Demo / Offline'}</span>
          </button>

          {/* Riwayat Log Tombol */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenStockLogs}
            title="Lihat riwayat pergerakan stok"
          >
            <History size={15} />
            <span style={{ display: 'inline' }}>Riwayat Stok</span>
          </button>

          {/* Auth Button / User Profile */}
          {user ? (
            <div className={styles.userMenu}>
              <div className={styles.userAvatar}>
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <span className={styles.userName} title={user.email}>
                {user.full_name || user.email}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onLogout}
                title="Keluar / Logout"
                style={{ padding: '0.2rem 0.4rem', color: '#f87171' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" onClick={onOpenAuth}>
              <LogIn size={15} />
              <span>Masuk / Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
