'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="ja">
      <body style={{ margin: 0, minHeight: '100vh', background: '#f3f5f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 2px rgba(11,45,78,.04), 0 3px 12px rgba(11,45,78,.06)', maxWidth: 448, width: '100%', padding: 32, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(204,91,104,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 24, height: 24, color: '#cc5b68' }} fill="none" viewBox="0 0 24 24" stroke="#cc5b68" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#172033', marginBottom: 8 }}>エラーが発生しました</h1>
          <p style={{ color: '#6b7c93', fontSize: '0.875rem', marginBottom: 24 }}>
            予期しないエラーが発生しました。ページを再読み込みしてください。
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: 'rgba(107,124,147,.6)', fontFamily: 'monospace', marginBottom: 16 }}>ID: {error.digest}</p>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{ width: '100%', background: '#0b2d4e', color: '#fff', padding: '10px 0', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer' }}
          >
            ページを再読み込み
          </button>
        </div>
      </body>
    </html>
  )
}
