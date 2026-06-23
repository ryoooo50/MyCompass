import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Compass',
  description: '生活・研究・仕事の現在地と次の行動を一か所で',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
