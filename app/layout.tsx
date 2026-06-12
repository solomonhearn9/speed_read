import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://speedread.cc'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'SpeedRead — How fast can you read?',
  description: 'Take the 30-second reading challenge and discover your WPM score. Train faster reading with structured levels and story adventures.',
  icons: {
    icon: '/og-logo.png',
    apple: '/og-logo.png',
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
        url: '/og-logo.png',
        width: 906,
        height: 247,
        alt: 'SpeedRead',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpeedRead — How fast can you read?',
    description: 'Take the 30-second reading challenge and discover your WPM score.',
    images: ['/og-logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}


