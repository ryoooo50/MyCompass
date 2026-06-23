'use client'

import { createClient } from '@/lib/supabase/browser'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/calendar.readonly',
      },
    })
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="card p-10 w-full max-w-sm text-center">
        {/* ロゴ */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl border-2 border-accent mb-6">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="10" stroke="#d4935c" strokeWidth="2" />
            <path d="M14 4 L14 14 L20 20" stroke="#d4935c" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="page-heading text-navy mb-1">My Compass</h1>
        <p className="text-sm text-muted mb-8">生活・研究・仕事の現在地を一か所で</p>

        {error === 'unauthorized' && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-mc-red/20 rounded-lg">
            <p className="text-sm text-mc-red">このアカウントはアクセスできません。</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-mc-blue text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-blue focus-visible:ring-offset-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#fff" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
            <path fill="#ffffffaa" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
            <path fill="#ffffffaa" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
            <path fill="#ffffffaa" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
          </svg>
          Google でログイン
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
