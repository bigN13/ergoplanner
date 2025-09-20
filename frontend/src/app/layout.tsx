import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Ergoplanner AI Suite',
    template: '%s | Ergoplanner AI Suite',
  },
  description: 'Advanced P&ID management system with AI-driven design assistance',
  keywords: [
    'P&ID',
    'Piping and Instrumentation Diagrams',
    'Engineering',
    'CAD',
    'AI',
    'Automation',
    'Process Design',
  ],
  authors: [{ name: 'Ergoplanner Team' }],
  creator: 'Ergoplanner',
  publisher: 'Ergoplanner',
  robots: {
    index: false, // Set to true in production
    follow: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ergoplanner.com',
    siteName: 'Ergoplanner AI Suite',
    title: 'Ergoplanner AI Suite',
    description: 'Advanced P&ID management system with AI-driven design assistance',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ergoplanner AI Suite',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ergoplanner AI Suite',
    description: 'Advanced P&ID management system with AI-driven design assistance',
    images: ['/og-image.png'],
    creator: '@ergoplanner',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}