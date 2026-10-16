'use client';

import React from 'react';
import { History, X, ArrowDownRight, ArrowUpRight, RotateCcw } from 'lucide-react';
import { StockLog } from '@/types/inventory';

interface StockLogModalProps {
  isOpen: boolean;
  logs: StockLog[];
  onClose: () => void;
}

export const StockLogModal: React.FC<StockLogModalProps> = ({
  isOpen,
  logs,
  onClose,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
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
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <History size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Riwayat Pergerakan Stok</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Catatan otomatis setiap penambahan, pengurangan, dan penyesuaian barang
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1rem 1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Belum ada riwayat pergerakan stok yang tercatat.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {logs.map((log) => {
                const isIncoming = log.type === 'IN';
                const isOutgoing = log.type === 'OUT';

                return (
                  <div
                    key={log.id}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isIncoming
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isOutgoing
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                          color: isIncoming ? '#34d399' : isOutgoing ? '#f87171' : '#60a5fa',
                        }}
                      >
                        {isIncoming ? (
                          <ArrowUpRight size={18} />
                        ) : isOutgoing ? (
                          <ArrowDownRight size={18} />
                        ) : (
                          <RotateCcw size={16} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                          {log.item_name || 'Barang Inventaris'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {log.reason || (isIncoming ? 'Barang Masuk' : isOutgoing ? 'Barang Keluar' : 'Penyesuaian')} •{' '}
                          {formatDate(log.created_at)}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: isIncoming ? '#34d399' : isOutgoing ? '#f87171' : '#60a5fa',
                        }}
                      >
                        {isIncoming ? `+${log.amount}` : isOutgoing ? `-${log.amount}` : `${log.amount}`}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                        {log.previous_stock} &rarr; {log.new_stock}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(10, 15, 29, 0.4)',
          }}
        >
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
