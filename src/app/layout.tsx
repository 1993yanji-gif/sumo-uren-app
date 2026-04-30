import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sumo Urenregistratie',
  description: 'Eenvoudige urenregistratie app voor medewerkers en admin.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="antialiased">{children}</body>
    </html>
  )
}
