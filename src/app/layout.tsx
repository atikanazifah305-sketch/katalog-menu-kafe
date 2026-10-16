import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Katalog Menu Kafe - Sistem Manajemen Menu & Stok',
  description: 'Aplikasi katalog menu kafe modern dengan fitur CRUD lengkap terintegrasi Next.js App Router dan Supabase.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
