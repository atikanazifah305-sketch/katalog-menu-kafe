'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, PackagePlus, Save } from 'lucide-react';
import styles from './ItemModal.module.css';
import { InventoryItem, ItemFormData } from '@/types/inventory';

interface ItemModalProps {
  isOpen: boolean;
  itemToEdit: InventoryItem | null;
  onClose: () => void;
  onSave: (data: ItemFormData, id?: string) => Promise<void>;
}

const DEFAULT_CATEGORIES = [
  'Elektronik',
  'ATK & Kantor',
  'Perabotan',
  'Aksesoris Komputer',
  'Bahan Baku',
  'Peralatan Kebersihan',
  'Lainnya',
];

const DEFAULT_UNITS = ['Pcs', 'Unit', 'Box', 'Rim', 'Kg', 'Liter', 'Set', 'Pack', 'Roll'];

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  itemToEdit,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<ItemFormData>({
    sku: '',
    name: '',
    category: 'Elektronik',
    quantity: 10,
    min_stock: 5,
    unit: 'Pcs',
    purchase_price: 0,
    selling_price: 0,
    location: 'Gudang Utama - Rak A1',
    description: '',
  });

  const [customCategory, setCustomCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        sku: itemToEdit.sku,
        name: itemToEdit.name,
        category: itemToEdit.category,
        quantity: itemToEdit.quantity,
        min_stock: itemToEdit.min_stock,
        unit: itemToEdit.unit,
        purchase_price: itemToEdit.purchase_price,
        selling_price: itemToEdit.selling_price,
        location: itemToEdit.location || '',
        description: itemToEdit.description || '',
      });
      if (!DEFAULT_CATEGORIES.includes(itemToEdit.category)) {
        setCustomCategory(true);
      } else {
        setCustomCategory(false);
      }
    } else {
      // Inisialisasi item baru dengan SKU acak
      generateRandomSKU('Elektronik');
    }
    setErrorMessage('');
  }, [itemToEdit, isOpen]);

  const generateRandomSKU = (cat: string) => {
    const prefix = cat ? cat.substring(0, 2).toUpperCase() : 'SK';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({
      ...prev,
      sku: `SKU-${prefix}-${randNum}`,
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Nama barang wajib diisi.');
      return;
    }
    if (!formData.sku.trim()) {
      setErrorMessage('Kode SKU barang wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData, itemToEdit ? itemToEdit.id : undefined);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <PackagePlus size={20} color="#10b981" />
            <span>{itemToEdit ? 'Edit Data Barang' : 'Tambah Barang Baru'}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

            <div className={styles.formGrid}>
              {/* Nama Barang */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Nama Barang *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Contoh: Laptop Asus Zenbook 14 OLED"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* SKU & Generator */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Kode SKU / Barcode *</label>
                <div className={styles.skuInputGroup}>
                  <input
                    type="text"
                    className={`${styles.input} ${styles.skuInput}`}
                    placeholder="SKU-LP-1234"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => generateRandomSKU(formData.category)}
                    title="Buat SKU Otomatis"
                  >
                    <Sparkles size={14} color="#10b981" />
                  </button>
                </div>
              </div>

              {/* Kategori */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Kategori *</label>
                {!customCategory ? (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <select
                      className={styles.select}
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setCustomCategory(true);
                          setFormData({ ...formData, category: '' });
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__custom__">+ Tambah Kategori Baru...</option>
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Ketik kategori baru..."
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setCustomCategory(false);
                        setFormData({ ...formData, category: 'Elektronik' });
                      }}
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>

              {/* Stok Saat Ini */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Kuantitas Stok Awal *</label>
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Satuan & Batas Min */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Satuan Barang *</label>
                <select
                  className={styles.select}
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  {DEFAULT_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batas Stok Minimum */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Batas Peringatan Stok Min</label>
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Lokasi Rak */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Lokasi Rak / Gudang</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Contoh: Rak A2 - Lantai 1"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              {/* Harga Beli */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Harga Beli Modal (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  className={styles.input}
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {/* Harga Jual */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Harga Jual (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  className={styles.input}
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {/* Deskripsi */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Catatan / Deskripsi Tambahan</label>
                <textarea
                  rows={2}
                  className={styles.textarea}
                  placeholder="Informasi spesifikasi barang, nomor batch, supplier, dsb..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={16} />
              <span>{isSubmitting ? 'Menyimpan...' : itemToEdit ? 'Simpan Perubahan' : 'Tambah Barang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
