'use client'

import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import OfflineBanner from '@/components/ui/OfflineBanner'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* サイドバー（デスクトップ） */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* モバイルメニューオーバーレイ */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-ink/40" />
        </div>
      )}

      {/* モバイルサイドバー */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar onClose={() => setMenuOpen(false)} />
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col min-w-0">
        <OfflineBanner />
        <Header onMenuOpen={() => setMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
