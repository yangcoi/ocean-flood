import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['vietnamese', 'latin'],
  weight: ['500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ocean Flood — Cảnh Báo Ngập & Tìm Đường Tránh Ngập TP.HCM',
  description:
    'Hệ thống dự báo ngập sớm 1–3h theo mưa & triều cường Phú An, ngôn ngữ cảnh báo kép cho Xe máy & Ô tô, và lộ trình tránh ngập tại Bình Thạnh, Quận 7, Quận 8, TP. Thủ Đức.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ocean Flood',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0F19' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="w-screen h-dvh overflow-hidden bg-[var(--surface-canvas)] text-[var(--text-primary)] antialiased select-none">
        {children}
      </body>
    </html>
  );
}
