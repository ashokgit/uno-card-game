import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { SettingsProvider } from '@/contexts/settings-context'

export const metadata: Metadata = {
  title: 'UNO Arena - Ultimate Card Game',
  description: 'Experience the ultimate UNO card game with stunning graphics, smooth animations, and competitive gameplay in the UNO Arena!',
  generator: 'UNO Arena',
  keywords: 'UNO, card game, multiplayer, arena, gaming',
  authors: [{ name: 'UNO Arena Team' }],
  icons: {
    icon: '/uno-arena-logo.ico',
    shortcut: '/uno-arena-logo.ico',
    apple: '/uno-arena-logo.ico',
  },
  openGraph: {
    title: 'UNO Arena - Ultimate Card Game',
    description: 'Experience the ultimate UNO card game with stunning graphics, smooth animations, and competitive gameplay in the UNO Arena!',
    type: 'website',
    images: ['/uno-arena.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Fascinate&display=swap" rel="stylesheet" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  )
}
