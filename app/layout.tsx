import type { Metadata, Viewport } from 'next'
import { Fraunces } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import Providers from '@/components/Providers'

const fraunces = Fraunces({
  subsets: ['latin'],
  // Variable font: weights 400–600+ available; SOFT + opsz for soft optical sizing
  axes: ['SOFT', 'opsz'],
  variable: '--font-fraunces',
  display: 'swap',
})

const generalSans = localFont({
  src: [
    {
      path: '../public/fonts/GeneralSans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/GeneralSans-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/GeneralSans-Semibold.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-general-sans',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0B0D',
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://speedread.cc'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'SpeedRead — How fast can you read?',
  description: 'Take the 30-second reading challenge and discover your WPM score. Train faster reading with structured levels and story adventures.',
  icons: {
    icon: '/logo1.png',
    apple: '/logo1.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'SpeedRead',
    title: 'SpeedRead — How fast can you read?',
    description: 'Take the 30-second reading challenge and discover your WPM score.',
    images: [
      {
        url: '/logo1.png',
        width: 1809,
        height: 452,
        alt: 'SpeedRead',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpeedRead — How fast can you read?',
    description: 'Take the 30-second reading challenge and discover your WPM score.',
    images: ['/logo1.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${generalSans.variable}`}>
      <body className={`${generalSans.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
