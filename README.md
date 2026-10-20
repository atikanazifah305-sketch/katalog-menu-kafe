# ☕ Katalog Menu Kafe & Sistem Pemesanan Meja Mandiri

Aplikasi web modern untuk katalog menu kafe dan pemesanan mandiri dari meja (*table ordering*) yang dibangun menggunakan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, dan terintegrasi dengan **Supabase** (Database PostgreSQL & Otentikasi Staf).

---

## ✨ Fitur Utama

### 👥 1. Portal Pelanggan (Menu Digital & Pemesanan Meja)
*Dapat diakses langsung di rute utama `/` tanpa perlu login.*

- **Katalog Menu Digital**:
  - Filter kategori sajian: Kopi Panas/Dingin, Teh & Segar, Makanan Utama, Camilan & Pastry.
  - Pencarian cepat instan nama dan kategori menu.
  - Label ketersediaan menu (Tersedia / Habis) secara *real-time*.
- **Pemesanan Mandiri per Meja**:
  - Pilih meja (Meja 01 - Meja 08, Area Bar, atau Takeaway).
  - Masukkan nama pemesan dan catatan khusus untuk setiap menu (misal: *less sugar, es dipisah*).
  - Keranjang pesanan interaktif (+/- jumlah item dan kalkulasi harga otomatis).
- **Pilihan Metode Pembayaran**:
  - 💵 **Tunai / Cash (Bayar di Kasir)**:
    - Menghasilkan struk pemesanan digital (`KF-XXXX`).
    - Menampilkan detail pesanan untuk ditunjukkan ke meja kasir saat pembayaran tunai.
  - 📱 **QRIS Mandiri (Scan Langsung di Meja)**:
    - Menampilkan kode QRIS standar nasional lengkap dengan nominal tagihan tepat.
    - Pelanggan membayar mandiri lewat m-Banking / e-Wallet (BCA, GoPay, OVO, DANA, ShopeePay).
    - Setelah konfirmasi pembayaran, pelanggan cukup duduk santai menunggu pesanan diantar ke meja tanpa perlu antre ke kasir.
  - 🏦 **Transfer Bank (BCA & Mandiri)**:
    - Menampilkan nomor rekening kafe resmi dengan fitur **Salin 1-Klik**.
    - Konfirmasi mandiri dari meja, status pesanan otomatis berpindah ke *"Sedang Diracik"*.
- **Riwayat Pesanan Pelanggan**:
  - Drawer riwayat pesanan meja tersimpan di browser untuk memantau status atau mencetak ulang struk digital.

---

### 🔒 2. Portal Manajemen Staf & Barista (`/dashboard`)
*Dilindungi secara ketat dengan Supabase Auth & Passcode Keamanan Staf.*

- **Keamanan Akun Staf**:
  - Pelanggan biasa dicegah mendaftar ke portal staf berkat verifikasi **Kode Sandi Rahasia Staf** (`STAFF_SECRET_PASSCODE`).
  - Halaman dashboard terlindungi di tingkat server (*Server-side authentication*).
- **Manajemen Menu Lengkap (CRUD)**:
  - Tambah menu baru dengan kategori, harga, dan kontrol stok.
  - Edit detail sajian kapan saja melalui modal interaktif.
  - Hapus menu dengan dialog konfirmasi.
  - **Quick Stock Adjustment**: Tambah atau kurangi stok langsung dari tabel dengan 1-klik (`+` / `-`).
  - **Toggle Ketersediaan**: Ubah status ketersediaan menu (*Ready* / *Habis*) dalam sekejap.
- **Ringkasan Metrik**:
  - Total sajian aktif, sajian siap disajikan, sajian habis/kritis, dan estimasi valuasi stok.

---

## 🚀 Panduan Memulai

### 1. Menjalankan Server Pengembangan Lokal
Pastikan Node.js (v18+) sudah terinstal di komputer:

```bash
npm install
npm run dev
```

Buka peramban di:
- **Menu Pelanggan**: [http://localhost:3000](http://localhost:3000)
- **Portal Staf**: [http://localhost:3000/login](http://localhost:3000/login) (atau [http://localhost:3000/dashboard](http://localhost:3000/dashboard))

---

### 2. Konfigurasi Lingkungan (`.env.local`)

Buat file `.env.local` pada direktori root dengan variabel berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
STAFF_SECRET_PASSCODE=KAFE2026
```

> **Catatan**: `STAFF_SECRET_PASSCODE` digunakan untuk memverifikasi pendaftaran akun baru staf agar pelanggan biasa tidak dapat membuat akun di dashboard manajemen.

---

## 📁 Struktur Direktori Proyek

```
INVENTARIS/
├── src/
│   ├── app/
│   │   ├── actions.ts           # Server Actions CRUD menu (add, update, delete, toggle)
│   │   ├── auth/
│   │   │   └── actions.ts       # Server Actions Auth Staf (login, signup dengan passcode, signout)
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Dashboard manajemen staf terlindungi
│   │   ├── login/
│   │   │   └── page.tsx         # Halaman login & register staf
│   │   ├── globals.css          # Desain tema Tailwind & utilitas CSS
│   │   ├── layout.tsx           # Root layout aplikasi
│   │   └── page.tsx             # Halaman utama katalog menu pelanggan
│   ├── components/
│   │   ├── CustomerMenu.tsx     # Komponen menu pelanggan, keranjang, checkout Cash/QRIS/TF, & struk
│   │   ├── MenuCatalog.tsx      # Tabel manajemen menu staf (+/- stok, edit, hapus)
│   │   ├── AddMenuForm.tsx      # Form tambah menu baru
│   │   └── LoginForm.tsx        # Form login/register staf dengan proteksi passcode
│   ├── types/
│   │   └── menu.ts              # Definisi tipe MenuItem & kategori
│   └── utils/
│       └── supabase/
│           ├── client.ts        # Client Supabase browser
│           └── server.ts        # Client Supabase server dengan proteksi cookie
├── supabase/
│   ├── schema.sql               # Skrip SQL tabel menu_items dan kebijakan RLS
│   └── add_stock_column.sql     # Skrip migrasi kolom stock jika belum ada
├── .env.example
├── package.json
└── README.md
```

---

## 🛠️ Lisensi
Dilisensikan di bawah [MIT License](LICENSE).
