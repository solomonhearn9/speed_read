import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Speed Reader - RSVP Reading Tool',
  description: 'Rapid Serial Visual Presentation speed reading application with Optimal Recognition Point',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}


