'use client';

import React, { useState, useEffect } from 'react';
import { Database, Check, Copy, ExternalLink, X, RefreshCw, AlertCircle } from 'lucide-react';
import { getSupabaseConfig, resetSupabaseClient } from '@/lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (url.trim() && anonKey.trim()) {
      localStorage.setItem('supabase_url', url.trim());
      localStorage.setItem('supabase_anon_key', anonKey.trim());
      resetSupabaseClient();
      setMsg('Konfigurasi Supabase berhasil disimpan! Aplikasi akan menggunakan database Supabase.');
      setTimeout(() => {
        onConfigUpdated();
        onClose();
      }, 900);
    } else {
      setMsg('Harap isi URL dan Anon Key dengan benar.');
    }
  };

  const handleResetToDemo = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    resetSupabaseClient();
    setUrl('');
    setAnonKey('');
    setMsg('Kembali ke Mode Demo Lokal (LocalStorage).');
    setTimeout(() => {
      onConfigUpdated();
      onClose();
    }, 800);
  };

  const sqlSample = `-- 1. Buka Supabase Dashboard > SQL Editor
-- 2. Jalankan skrip ini untuk membuat tabel:
create table if not exists public.items (
  id uuid default gen_random_uuid() primary key,
  sku text not null unique,
  name text not null,
  category text not null,
  quantity integer not null default 0 check (quantity >= 0),
  min_stock integer not null default 5,
  unit text not null default 'Pcs',
  purchase_price numeric(15, 2) not null default 0,
  selling_price numeric(15, 2) not null default 0,
  location text default 'Gudang Utama',
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.items enable row level security;
drop policy if exists "Akses bebas inventaris" on public.items;
create policy "Akses bebas inventaris" on public.items for all to public using (true) with check (true);

alter table public.stock_logs enable row level security;
drop policy if exists "Akses bebas log stok" on public.stock_logs;
create policy "Akses bebas log stok" on public.stock_logs for all to public using (true) with check (true);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Pengaturan Koneksi Supabase</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Hubungkan backend Supabase atau gunakan file .env.local
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {msg && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.825rem',
              }}
            >
              {msg}
            </div>
          )}

          <div
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '0.825rem',
              color: '#93c5fd',
              display: 'flex',
              gap: '0.65rem',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              Anda dapat memasukkan kredensial Supabase di bawah ini atau menaruhnya di file{' '}
              <code style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>.env.local</code>. Data akan otomatis
              sinkron!
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Project URL (NEXT_PUBLIC_SUPABASE_URL)
            </label>
            <input
              type="text"
              placeholder="https://abcdefghijkl.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.825rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Anon Public API Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
            </label>
            <textarea
              rows={2}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Quick SQL Helper */}
          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowSql(!showSql)}
              style={{ width: '100%', justifyContent: 'space-between' }}
            >
              <span>{showSql ? 'Sembunyikan SQL Skema' : 'Lihat Skrip SQL Tabel Supabase'}</span>
              <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{showSql ? '▲' : '▼'}</span>
            </button>

            {showSql && (
              <div
                style={{
                  marginTop: '0.65rem',
                  position: 'relative',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={copySql}>
                    {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copied ? 'Tersalin!' : 'Salin SQL'}</span>
                  </button>
                </div>
                <pre
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#94a3b8',
                    overflowX: 'auto',
                    maxHeight: '160px',
                  }}
                >
                  {sqlSample}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 15, 29, 0.4)',
          }}
        >
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleResetToDemo}>
            <RefreshCw size={14} />
            <span>Gunakan Demo Lokal</span>
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Batal
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
              Simpan &amp; Hubungkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
