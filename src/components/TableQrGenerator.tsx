'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Printer, 
  Download, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Coffee, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Settings2,
  Smartphone,
  Info
} from 'lucide-react';

interface TableItem {
  id: string;
  name: string;
  number: number;
}

export default function TableQrGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [tableCount, setTableCount] = useState<number>(10);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [selectedTableId, setSelectedTableId] = useState<string>('all');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Set default domain ke origin browser saat load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Generate daftar meja berdasarkan tableCount
  const tables: TableItem[] = Array.from({ length: tableCount }, (_, i) => {
    const num = i + 1;
    const name = `Meja ${num < 10 ? '0' + num : num}`;
    return {
      id: `meja-${num}`,
      name,
      number: num,
    };
  });

  // Generate QR Code untuk setiap meja
  useEffect(() => {
    if (!baseUrl) return;

    let isMounted = true;
    setIsGenerating(true);

    const generateAllQrs = async () => {
      const newMap: Record<string, string> = {};

      for (const t of tables) {
        // Link target yang akan dibuka pelanggan saat scan QR
        // Contoh: https://kafeanda.com/?meja=Meja%2001
        const targetUrl = `${baseUrl.replace(/\/$/, '')}/?meja=${encodeURIComponent(t.name)}`;
        
        try {
          const dataUrl = await QRCode.toDataURL(targetUrl, {
            width: 500,
            margin: 2,
            color: {
              dark: '#1e293b', // slate-800
              light: '#ffffff',
            },
            errorCorrectionLevel: 'H',
          });
          newMap[t.id] = dataUrl;
        } catch (err) {
          console.error(`Gagal generate QR untuk ${t.name}:`, err);
        }
      }

      if (isMounted) {
        setQrMap(newMap);
        setIsGenerating(false);
      }
    };

    generateAllQrs();

    return () => {
      isMounted = false;
    };
  }, [baseUrl, tableCount]);

  // Handler Salin Link Meja
  const handleCopyLink = (tableName: string, tableId: string) => {
    const targetUrl = `${baseUrl.replace(/\/$/, '')}/?meja=${encodeURIComponent(tableName)}`;
    navigator.clipboard.writeText(targetUrl);
    setCopiedId(tableId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handler Download Gambar QR Meja Satuan
  const handleDownloadQr = (tableName: string, tableId: string) => {
    const dataUrl = qrMap[tableId];
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR-${tableName.replace(/\s+/g, '-').toUpperCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler Cetak / Print Lembar Stand Meja
  const handlePrint = () => {
    window.print();
  };

  // Filter meja yang ditampilkan di preview
  const displayTables = selectedTableId === 'all' 
    ? tables 
    : tables.filter((t) => t.id === selectedTableId);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none overflow-hidden transition-all">
      {/* Header Bar Accordion */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors select-none"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md shadow-amber-500/25">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Generator & Cetak QR Code Meja Kafe
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Siap Cetak
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cetak stand akrilik / stiker meja agar pelanggan cukup scan kamera HP untuk langsung memesan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-200/60 dark:border-amber-900/60">
            {tableCount} Meja Aktif
          </span>
          <button
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Konten Terbuka */}
      {isOpen && (
        <div className="p-6 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-6">
          {/* Panel Pengaturan Generator */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-amber-500" />
                Konfigurasi Link & Jumlah Meja
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Input Base URL Web */}
              <div className="md:col-span-7">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alamat Web Kafe (URL Tujuan Scan)
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://kafe-anda.vercel.app"
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Ganti ke domain publik (misal Vercel) jika sudah di-deploy agar bisa di-scan dari HP pelanggan mana saja.
                </p>
              </div>

              {/* Jumlah Meja */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Jumlah Meja
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={tableCount}
                  onChange={(e) => setTableCount(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                  className="w-full px-3 py-2 text-xs font-bold text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Filter Tampilan Meja */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Preview Meja
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="all">Semua Meja ({tableCount} Meja)</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                Format scan otomatis: <code className="text-[11px] font-bold text-amber-600 dark:text-amber-400">?meja=Meja%2001</code>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white active:scale-95 transition shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Stand Meja (Print / PDF)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Area Preview Kartu QR Meja (Siap Cetak) */}
          <div ref={printAreaRef} id="printable-qr-area">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayTables.map((table) => {
                const qrImage = qrMap[table.id];
                const tableUrl = `${baseUrl.replace(/\/$/, '')}/?meja=${encodeURIComponent(table.name)}`;

                return (
                  <div
                    key={table.id}
                    className="qr-card-print relative flex flex-col items-center justify-between bg-white text-slate-900 border-2 border-slate-300 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all text-center overflow-hidden"
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    {/* Hiasan Atas */}
                    <div className="w-full flex items-center justify-between pb-3 border-b-2 border-dashed border-slate-200 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                          <Coffee className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black tracking-wider uppercase text-slate-800">
                          KAFE MENU
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Self Order
                      </span>
                    </div>

                    {/* Judul & Nomor Meja */}
                    <div className="my-1">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Silakan Duduk di
                      </p>
                      <h3 className="text-2xl font-black tracking-tight text-amber-600">
                        {table.name.toUpperCase()}
                      </h3>
                    </div>

                    {/* Gambar QR Code */}
                    <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-inner my-2">
                      {qrImage ? (
                        <img
                          src={qrImage}
                          alt={`QR Code ${table.name}`}
                          className="w-44 h-44 object-contain mx-auto"
                        />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center bg-slate-100 rounded-xl text-xs text-slate-400">
                          Membuat QR...
                        </div>
                      )}
                    </div>

                    {/* Petunjuk Pemesanan */}
                    <div className="w-full my-2 space-y-1 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 text-left">
                      <p className="text-[11px] font-bold text-amber-900 text-center mb-1">
                        Cara Pesan Mandiri:
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-700">
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-[9px]">1</span>
                        <span>Buka kamera HP Anda & arahkan ke QR</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-700">
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-[9px]">2</span>
                        <span>Pilih menu favorit & bayar mandiri</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-700">
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-[9px]">3</span>
                        <span>Pesanan diantar langsung ke meja Anda!</span>
                      </div>
                    </div>

                    {/* Tombol Aksi Staf (Disembunyikan saat di-print) */}
                    <div className="no-print w-full flex items-center justify-center gap-1.5 pt-3 mt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleDownloadQr(table.name, table.id)}
                        title="Download gambar QR Code"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        onClick={() => handleCopyLink(table.name, table.id)}
                        title="Salin Link Meja"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                      >
                        {copiedId === table.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      <a
                        href={tableUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Coba buka halaman menu meja ini"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-amber-700 bg-amber-100/70 hover:bg-amber-200/70 transition cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Test</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CSS Khusus Print agar hanya kartu QR meja yang dicetak ke kertas / PDF */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-area, #printable-qr-area * {
            visibility: visible !important;
          }
          #printable-qr-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
          }
          #printable-qr-area .grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
          .qr-card-print {
            border: 2px solid #334155 !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            padding: 18px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
