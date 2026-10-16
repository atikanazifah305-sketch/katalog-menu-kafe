'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, LogIn, UserPlus, Zap } from 'lucide-react';
import { loginWithEmail, registerWithEmail, loginDemoUser } from '@/lib/inventoryService';
import { UserProfile } from '@/types/inventory';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  isSupabaseLive: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isSupabaseLive,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setLoading(true);
      if (tab === 'login') {
        const user = await loginWithEmail(email, password);
        onSuccess(user);
        onClose();
      } else {
        const user = await registerWithEmail(email, password, fullName);
        if (isSupabaseLive) {
          setSuccessMsg('Pendaftaran berhasil! Cek email untuk konfirmasi atau langsung masuk jika auto-confirm aktif.');
        }
        onSuccess(user);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat autentikasi.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setErrorMsg('');
    try {
      setLoading(true);
      const user = await loginDemoUser();
      onSuccess(user);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal demo login.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>
            <Lock size={18} color="#10b981" />
            <span>Autentikasi Pengguna</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              padding: '0.85rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === 'login' ? '2px solid #10b981' : '2px solid transparent',
              color: tab === 'login' ? '#10b981' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <LogIn size={15} />
            <span>Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              padding: '0.85rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === 'register' ? '2px solid #10b981' : '2px solid transparent',
              color: tab === 'register' ? '#10b981' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <UserPlus size={15} />
            <span>Daftar Baru</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {errorMsg && (
              <div
                style={{
                  background: 'var(--status-danger-bg)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fb7185',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.825rem',
                }}
              >
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div
                style={{
                  background: 'var(--status-success-bg)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.825rem',
                }}
              >
                {successMsg}
              </div>
            )}

            {/* Nama Lengkap jika daftar */}
            {tab === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Nama Lengkap
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-dim)',
                    }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Budi Santoso"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.5rem',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-main)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Email Akun
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                  }}
                />
                <input
                  type="email"
                  required
                  placeholder="admin@gudang.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.5rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Kata Sandi
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                  }}
                />
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.5rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading
                ? 'Memproses...'
                : tab === 'login'
                ? 'Masuk ke Sistem Inventaris'
                : 'Daftar Akun Baru'}
            </button>

            {/* Demo 1-Click Login Button */}
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <div style={{ position: 'relative', margin: '0.5rem 0' }}>
                <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
                <span
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-modal)',
                    padding: '0 0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-dim)',
                  }}
                >
                  ATAU
                </span>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: '0.5rem', border: '1px dashed var(--border-medium)' }}
                onClick={handleQuickDemoLogin}
                disabled={loading}
              >
                <Zap size={14} color="#f59e0b" />
                <span>Masuk Cepat Sebagai Akun Demo</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
