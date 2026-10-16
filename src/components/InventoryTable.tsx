'use client';

import React from 'react';
import { Edit2, Trash2, Plus, Minus, PackageX, MapPin } from 'lucide-react';
import styles from './InventoryTable.module.css';
import { InventoryItem } from '@/types/inventory';

interface InventoryTableProps {
  items: InventoryItem[];
  loading: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onAdjustStock: (item: InventoryItem, delta: number) => void;
  onResetFilter: () => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  loading,
  onEdit,
  onDelete,
  onAdjustStock,
  onResetFilter,
}) => {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStockBadge = (quantity: number, minStock: number) => {
    if (quantity <= 0) {
      return <span className="badge badge-danger">Habis</span>;
    }
    if (quantity <= minStock) {
      return <span className="badge badge-warning">Menipis ({quantity})</span>;
    }
    return <span className="badge badge-success">Tersedia</span>;
  };

  if (loading) {
    return (
      <div className={styles.tableContainer}>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ marginBottom: '1rem', fontWeight: 600 }}>Memuat data stok inventaris...</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Menghubungkan ke database Supabase</div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <PackageX size={36} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Tidak Ada Barang Ditemukan
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Coba sesuaikan kata kunci pencarian atau filter status stok Anda.
            </p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onResetFilter}>
            Reset Semua Filter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Barang &amp; SKU</th>
              <th className={styles.th}>Kategori &amp; Lokasi</th>
              <th className={styles.th} style={{ textAlign: 'center' }}>Jumlah Stok</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Harga Jual / Beli</th>
              <th className={styles.th}>Total Nilai</th>
              <th className={styles.th} style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {items.map((item) => {
              const totalAssetValue = item.quantity * (item.purchase_price || 0);

              return (
                <tr key={item.id}>
                  {/* 1. Nama Barang & SKU */}
                  <td className={styles.td}>
                    <div className={styles.itemMainInfo}>
                      <span className={styles.itemName}>{item.name}</span>
                      <div className={styles.itemSkuDesc}>
                        <span className={styles.skuCode}>{item.sku}</span>
                        {item.description && (
                          <span
                            title={item.description}
                            style={{
                              maxWidth: '220px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            • {item.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 2. Kategori & Lokasi */}
                  <td className={styles.td}>
                    <div>
                      <span className={styles.categoryBadge}>{item.category}</span>
                      {item.location && (
                        <div className={styles.locationText}>
                          <MapPin size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {item.location}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 3. Stok Cepat (+ / -) */}
                  <td className={styles.td} style={{ textAlign: 'center' }}>
                    <div className={styles.stockCell} style={{ justifyContent: 'center' }}>
                      <button
                        type="button"
                        className={styles.stockBtn}
                        onClick={() => onAdjustStock(item, -1)}
                        disabled={item.quantity <= 0}
                        title="Kurangi stok 1 unit"
                      >
                        <Minus size={13} />
                      </button>
                      <span className={styles.stockCount}>
                        {item.quantity}{' '}
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-dim)' }}>
                          {item.unit}
                        </span>
                      </span>
                      <button
                        type="button"
                        className={styles.stockBtn}
                        onClick={() => onAdjustStock(item, 1)}
                        title="Tambah stok 1 unit"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </td>

                  {/* 4. Status Badge */}
                  <td className={styles.td}>
                    {getStockBadge(item.quantity, item.min_stock)}
                  </td>

                  {/* 5. Harga Jual & Beli */}
                  <td className={styles.td}>
                    <div className={styles.priceGroup}>
                      <span className={styles.sellPrice}>{formatRupiah(item.selling_price)}</span>
                      <span className={styles.buyPrice}>Modal: {formatRupiah(item.purchase_price)}</span>
                    </div>
                  </td>

                  {/* 6. Total Nilai Stok */}
                  <td className={styles.td}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {formatRupiah(totalAssetValue)}
                    </span>
                  </td>

                  {/* 7. Aksi Edit & Hapus */}
                  <td className={styles.td}>
                    <div className={styles.actionsCell} style={{ justifyContent: 'center' }}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => onEdit(item)}
                        title="Edit data barang"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionDelete}`}
                        onClick={() => onDelete(item)}
                        title="Hapus barang ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
