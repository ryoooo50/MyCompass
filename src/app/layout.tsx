import type { Metadata } from 'next'
import Script from 'next/script'
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b2d4e" />
      </head>
      <body>
        {children}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(function(err) {
                  console.warn('[SW] Registration failed:', err);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
