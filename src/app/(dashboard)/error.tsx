'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="bg-paper rounded-card shadow-card max-w-md w-full p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-mc-red/10 flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-mc-red"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-ink mb-2">エラーが発生しました</h2>
        <p className="text-muted text-sm mb-6">
          このページの読み込み中に問題が発生しました。再試行するか、ホームに戻ってください。
        </p>
        {error.digest && (
          <p className="text-xs text-muted/60 font-mono mb-4">ID: {error.digest}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 bg-navy text-white py-2.5 rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
          >
            再試行
          </button>
          <Link
            href="/"
            className="flex-1 bg-line text-ink py-2.5 rounded-lg text-sm font-medium hover:bg-line/70 transition-colors text-center"
          >
            ホームへ戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
