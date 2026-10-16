'use client';

import React from 'react';
import { Package, Layers, CircleDollarSign, AlertTriangle, AlertCircle } from 'lucide-react';
import styles from './StatsCards.module.css';
import { InventoryStats } from '@/types/inventory';

interface StatsCardsProps {
  stats: InventoryStats;
  onFilterLowStock: () => void;
  onFilterOutOfStock: () => void;
  onResetFilter: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  onFilterLowStock,
  onFilterOutOfStock,
  onResetFilter,
}) => {
  // Format Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className={styles.statsGrid}>
      {/* 1. Total Jenis Barang */}
      <div className={styles.statCard} onClick={onResetFilter} role="button" style={{ cursor: 'pointer' }}>
        <div style={{ background: '#3b82f6' }} className={styles.glowBackground} />
        <div className={styles.cardHeader}>
          <span className={styles.statTitle}>Total Jenis Barang</span>
          <div className={`${styles.iconContainer} ${styles.iconBlue}`}>
            <Package size={22} />
          </div>
        </div>
        <div>
          <div className={styles.statValue}>{stats.totalItems.toLocaleString('id-ID')}</div>
          <div className={styles.statSubtext}>SKU terdaftar di sistem</div>
        </div>
      </div>

      {/* 2. Total Kuantitas Stok */}
      <div className={styles.statCard}>
        <div style={{ background: '#10b981' }} className={styles.glowBackground} />
        <div className={styles.cardHeader}>
          <span className={styles.statTitle}>Kuantitas Stok</span>
          <div className={`${styles.iconContainer} ${styles.iconEmerald}`}>
            <Layers size={22} />
          </div>
        </div>
        <div>
          <div className={styles.statValue}>{stats.totalUnits.toLocaleString('id-ID')}</div>
          <div className={styles.statSubtext}>Unit barang fisik tersedia</div>
        </div>
      </div>

      {/* 3. Estimasi Nilai Inventaris */}
      <div className={styles.statCard}>
        <div style={{ background: '#a855f7' }} className={styles.glowBackground} />
        <div className={styles.cardHeader}>
          <span className={styles.statTitle}>Estimasi Nilai Stok</span>
          <div className={`${styles.iconContainer} ${styles.iconPurple}`}>
            <CircleDollarSign size={22} />
          </div>
        </div>
        <div>
          <div className={styles.statValue} style={{ fontSize: '1.45rem' }}>
            {formatRupiah(stats.totalValue)}
          </div>
          <div className={styles.statSubtext}>Berdasarkan harga beli modal</div>
        </div>
      </div>

      {/* 4. Stok Kritis & Menipis */}
      <div
        className={styles.statCard}
        onClick={onFilterLowStock}
        role="button"
        title="Klik untuk filter barang dengan stok menipis"
        style={{ cursor: 'pointer' }}
      >
        <div style={{ background: '#f59e0b' }} className={styles.glowBackground} />
        <div className={styles.cardHeader}>
          <span className={styles.statTitle}>Stok Menipis</span>
          <div className={`${styles.iconContainer} ${styles.iconAmber}`}>
            <AlertTriangle size={22} />
          </div>
        </div>
        <div>
          <div className={styles.statValue} style={{ color: stats.lowStockCount > 0 ? '#fbbf24' : 'inherit' }}>
            {stats.lowStockCount}
          </div>
          <div className={styles.statSubtext} style={{ color: stats.lowStockCount > 0 ? '#fbbf24' : undefined }}>
            Perlu restock segera (≤ batas min)
          </div>
        </div>
      </div>

      {/* 5. Barang Habis */}
      <div
        className={styles.statCard}
        onClick={onFilterOutOfStock}
        role="button"
        title="Klik untuk filter barang yang stoknya habis"
        style={{ cursor: 'pointer' }}
      >
        <div style={{ background: '#f43f5e' }} className={styles.glowBackground} />
        <div className={styles.cardHeader}>
          <span className={styles.statTitle}>Stok Habis (0)</span>
          <div className={`${styles.iconContainer} ${styles.iconRose}`}>
            <AlertCircle size={22} />
          </div>
        </div>
        <div>
          <div className={styles.statValue} style={{ color: stats.outOfStockCount > 0 ? '#fb7185' : 'inherit' }}>
            {stats.outOfStockCount}
          </div>
          <div className={styles.statSubtext} style={{ color: stats.outOfStockCount > 0 ? '#fb7185' : undefined }}>
            Stok kosong total di gudang
          </div>
        </div>
      </div>
    </div>
  );
};
