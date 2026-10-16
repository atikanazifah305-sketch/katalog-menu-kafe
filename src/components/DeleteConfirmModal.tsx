'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fb7185', fontWeight: 700 }}>
            <AlertTriangle size={20} />
            <span>Konfirmasi Hapus Barang</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Apakah Anda yakin ingin menghapus barang{' '}
            <strong style={{ color: '#fff' }}>"{item.name}"</strong> (SKU:{' '}
            <code style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{item.sku}</code>)?
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            Tindakan ini tidak dapat dibatalkan. Riwayat stok dan data barang ini akan dihapus secara permanen.
          </p>
        </div>

        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            background: 'rgba(10, 15, 29, 0.4)',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            <Trash2 size={16} />
            <span>{loading ? 'Menghapus...' : 'Ya, Hapus Barang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
