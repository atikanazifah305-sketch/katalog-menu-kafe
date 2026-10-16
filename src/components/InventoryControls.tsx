'use client';

import React from 'react';
import { Search, Plus, Download, SlidersHorizontal } from 'lucide-react';
import styles from './InventoryControls.module.css';
import { FilterState, StockStatus, SortField } from '@/types/inventory';

interface InventoryControlsProps {
  filter: FilterState;
  categories: string[];
  onFilterChange: (updates: Partial<FilterState>) => void;
  onOpenAddModal: () => void;
  onExportCSV: () => void;
}

export const InventoryControls: React.FC<InventoryControlsProps> = ({
  filter,
  categories,
  onFilterChange,
  onOpenAddModal,
  onExportCSV,
}) => {
  return (
    <div className={styles.controlsWrapper}>
      {/* Baris Atas: Search Bar & Tombol Tambah Barang */}
      <div className={styles.topRow}>
        <div className={styles.searchGroup}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Cari barang berdasarkan Nama, SKU, atau Lokasi..."
            value={filter.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
        </div>

        <div className={styles.actionButtons}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onExportCSV}
            title="Export data stok barang ke file CSV"
          >
            <Download size={15} />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenAddModal}
            id="btn-tambah-barang"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {/* Baris Bawah: Filter Kategori & Urutan */}
      <div className={styles.bottomRow}>
        <div className={styles.categoryPills}>
          <button
            type="button"
            className={`${styles.pill} ${filter.category === 'all' ? styles.pillActive : ''}`}
            onClick={() => onFilterChange({ category: 'all' })}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.pill} ${filter.category === cat ? styles.pillActive : ''}`}
              onClick={() => onFilterChange({ category: cat })}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.filterSortGroup}>
          {/* Status Filter */}
          <select
            className={styles.selectInput}
            value={filter.status}
            onChange={(e) => onFilterChange({ status: e.target.value as StockStatus })}
          >
            <option value="all">Semua Status Stok</option>
            <option value="safe">Stok Aman (&gt; 10)</option>
            <option value="low">Stok Menipis (1-10)</option>
            <option value="out">Habis / Kosong (0)</option>
          </select>

          {/* Sort Filter */}
          <select
            className={styles.selectInput}
            value={`${filter.sortBy}-${filter.sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              onFilterChange({
                sortBy: field as SortField,
                sortOrder: order as 'asc' | 'desc',
              });
            }}
          >
            <option value="updated_at-desc">Terbaru Diperbarui</option>
            <option value="name-asc">Nama (A - Z)</option>
            <option value="name-desc">Nama (Z - A)</option>
            <option value="quantity-desc">Stok Terbanyak</option>
            <option value="quantity-asc">Stok Tersedikit</option>
            <option value="selling_price-desc">Harga Jual Tertinggi</option>
            <option value="selling_price-asc">Harga Jual Terendah</option>
          </select>
        </div>
      </div>
    </div>
  );
};
