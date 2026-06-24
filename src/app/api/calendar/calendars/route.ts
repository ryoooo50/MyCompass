import { createClient } from '@/lib/supabase/server'
import { fetchCalendars } from '@/lib/google-calendar/client'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: '認証が必要です' }, { status: 401 })
  }

  const providerToken = session.provider_token
  if (!providerToken) {
    return NextResponse.json(
      { code: 'NO_PROVIDER_TOKEN', message: 'Google トークンが見つかりません。再ログインしてください。' },
      { status: 401 }
    )
  }

  try {
    const calendars = await fetchCalendars(providerToken)
    return NextResponse.json(calendars)
  } catch {
    return NextResponse.json(
      { code: 'CALENDAR_FETCH_FAILED', message: 'カレンダー一覧の取得に失敗しました' },
      { status: 502 }
    )
  }
}
