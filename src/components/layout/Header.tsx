'use client'

import { createClient } from '@/lib/supabase/browser'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  onMenuOpen?: () => void
}

function formatDateJa(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export default function Header({ onMenuOpen }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [now, setNow] = useState<Date | null>(null)

  // クライアントマウント後にのみ日付をセット（SSRとの不一致を防ぐ）
  useEffect(() => {
    setNow(new Date())
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 bg-paper border-b border-line flex items-center justify-between px-4 shrink-0">
      {/* ハンバーガー（モバイルのみ） */}
      <button
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-bg transition-colors"
        onClick={onMenuOpen}
        aria-label="メニューを開く"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M2 4h14M2 9h14M2 14h14" stroke="#172033" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* 日付 */}
      <time
        className="text-sm font-medium text-muted md:ml-0 ml-auto mr-2"
        dateTime={now?.toISOString() ?? ''}
      >
        {now ? formatDateJa(now) : ''}
      </time>

      {/* ログアウト */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors px-3 py-1.5 rounded-lg hover:bg-bg"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        ログアウト
      </button>
    </header>
  )
}
