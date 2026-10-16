# 📦 InventarisPro - Sistem Manajemen Stok & Inventaris Modern

Aplikasi manajemen inventaris barang lengkap, responsif, dan elegan yang dibangun menggunakan **Next.js (App Router)** dan terintegrasi dengan **Supabase** (Database PostgreSQL & Otentikasi Pengguna).

---

## ✨ Fitur Utama

1. **🔐 Autentikasi Pengguna (Login & Registrasi)**:
   - Terintegrasi dengan **Supabase Auth** (Email & Password).
   - Dilengkapi **Mode Demo Cepat 1-Klik** untuk langsung menguji aplikasi tanpa konfigurasi awal.
   - Profil pengguna di header dengan indikator status dan tombol logout.

2. **➕ Tambah Barang Baru**:
   - Form input lengkap: Nama Barang, Kode SKU, Kategori, Stok Awal, Satuan (Pcs, Unit, Box, Rim, dll.), Harga Modal (Beli), Harga Jual, Batas Stok Minimum, Lokasi Rak/Gudang, dan Catatan.
   - **Auto-Generate SKU Generator**: Tombol otomatis untuk membuat kode SKU unik dalam 1 klik.

3. **✏️ Edit Data Barang**:
   - Perbarui informasi detail barang, harga, lokasi penyimpanan, maupun jumlah stok dengan modal interaktif.

4. **🗑️ Hapus Barang**:
   - Konfirmasi dialog pengamanan sebelum penghapusan data secara permanen.

5. **📊 Lihat & Pantau Stok (Dashboard Real-Time)**:
   - **Ringkasan KPI**:
     - Total Jenis Barang (SKU terdaftar)
     - Total Kuantitas Unit Stok fisik
     - Estimasi Nilai Stok (Total Valuasi Rupiah)
     - Peringatan Stok Menipis (≤ batas minimum)
     - Peringatan Stok Habis (0 unit)
   - **Quick Adjustment (+ / -)**: Tombol tambah atau kurangi stok langsung di baris tabel.
   - **Status Badge Pintar**:
     - 🟢 *Tersedia* (Stok aman di atas batas minimum)
     - 🟡 *Menipis* (Stok di bawah atau sama dengan batas minimum)
     - 🔴 *Habis* (Stok 0)

6. **🔍 Pencarian & Filter Canggih**:
   - Pencarian instan (Nama Barang, SKU, atau Lokasi).
   - Filter Kategori cepat (Elektronik, ATK & Kantor, Perabotan, dsb).
   - Filter Status Stok (Semua, Stok Aman, Menipis, Habis).
   - Pengurutan data (Terbaru, Nama A-Z / Z-A, Stok Terbanyak / Tersedikit, Harga Tertinggi / Terendah).

7. **📜 Riwayat Pergerakan Stok (Stock Logs)**:
   - Mencatat otomatis setiap transaksi barang masuk (`IN`), barang keluar (`OUT`), atau penyesuaian stok manual lengkap dengan tanggal dan alasan.

8. **📥 Ekspor Data ke CSV**:
   - Unduh seluruh data inventaris ke format spreadsheet CSV dalam sekali klik.

---

## 🚀 Panduan Memulai

### 1. Menjalankan Aplikasi
Aplikasi saat ini telah aktif di:
```bash
http://localhost:3001
```

Jika server dev perlu dijalankan ulang di kemudian hari:
```bash
npm run dev
```

### 2. Konfigurasi Database Supabase

Aplikasi ini dapat langsung dicoba menggunakan **Mode Demo Lokal** bawaan. Untuk menghubungkannya ke database Supabase Anda sendiri:

#### Langkah A: Buat Tabel di Supabase
1. Buka dashboard [Supabase](https://supabase.com) dan buat proyek baru.
2. Buka menu **SQL Editor** di dashboard Supabase.
3. Buka file [`supabase/schema.sql`](./supabase/schema.sql) di repositori ini, salin isinya dan klik **Run** di SQL Editor.

#### Langkah B: Hubungkan ke Aplikasi
Anda dapat memilih salah satu cara berikut:
- **Cara 1 (Langsung di UI)**: Klik pill **"Mode Demo / Supabase Live"** di navbar pojok kanan atas, lalu tempel *Project URL* dan *Anon API Key* Supabase Anda.
- **Cara 2 (File .env.local)**: Buat file `.env.local` di folder root dan isi:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  ```

---

## 📁 Struktur Direktori Proyek

```
INVENTARIS/
├── src/
│   ├── app/
│   │   ├── globals.css         # Token desain modern, dark mode, dan animasi
│   │   ├── layout.tsx          # Root layout & metadata
│   │   └── page.tsx            # Halaman Dashboard inventaris utama
│   ├── components/
│   │   ├── Navbar.tsx          # Navigasi atas, status Supabase, dan profil user
│   │   ├── StatsCards.tsx      # Kartu indikator KPI stok dan nilai aset
│   │   ├── InventoryControls.tsx # Search bar, filter kategori & status
│   │   ├── InventoryTable.tsx  # Tabel inventaris interaktif & quick adjustment (+/-)
│   │   ├── ItemModal.tsx       # Modal tambah & edit data barang
│   │   ├── DeleteConfirmModal.tsx # Dialog konfirmasi hapus barang
│   │   ├── AuthModal.tsx       # Modal masuk (login) & daftar akun
│   │   ├── SupabaseConfigModal.tsx # Pengaturan koneksi Supabase di browser
│   │   └── StockLogModal.tsx   # Modal riwayat transaksi mutasi stok
│   ├── lib/
│   │   ├── supabase.ts         # Inisialisasi client Supabase
│   │   └── inventoryService.ts # Service CRUD barang, stok, dan auth
│   └── types/
│       └── inventory.ts        # TypeScript interfaces & types
├── supabase/
│   └── schema.sql              # Skrip SQL tabel items, stock_logs, dan RLS
├── .env.example
├── package.json
└── README.md
```
