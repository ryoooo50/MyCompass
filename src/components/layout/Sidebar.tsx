'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/',
    label: 'ホーム',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M2 7L9 2L16 7V16H11V11H7V16H2V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/tasks',
    label: 'タスク',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M3 4h12M3 9h12M3 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="15" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: '/finance',
    label: '財務',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 8h14" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/research',
    label: '研究',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/work',
    label: 'アルバイト',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 5V3.5C6 2.672 6.672 2 7.5 2h3c.828 0 1.5.672 1.5 1.5V5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 9h12" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: '/reports',
    label: '日報',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="3" y="2" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 7h6M6 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/schedule',
    label: '予定',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="14" height="13" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 7h14M6 2v2M12 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/apps',
    label: 'アプリ',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-navy sidebar-texture text-white">
      {/* ロゴ */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg border border-accent shrink-0">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="6.5" stroke="#d4935c" strokeWidth="1.5" />
            <path d="M9 3L9 9L13 13" stroke="#d4935c" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <span className="font-bold text-[15px] tracking-tight">My Compass</span>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="メインナビゲーション">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                active
                  ? 'bg-white/10 text-white shadow-[inset_4px_0_0_var(--accent)]'
                  : 'text-white/60 hover:bg-white/8 hover:text-white',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
