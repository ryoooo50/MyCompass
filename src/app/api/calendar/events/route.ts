import { createClient } from '@/lib/supabase/server'
import { fetchEvents } from '@/lib/google-calendar/client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url)
  const days = Number(searchParams.get('days') ?? 7)
  const calendarIds = searchParams.getAll('calendarIds')

  try {
    const events = await fetchEvents(providerToken, calendarIds, days)
    return NextResponse.json(events)
  } catch {
    return NextResponse.json(
      { code: 'CALENDAR_FETCH_FAILED', message: 'Google Calendar の取得に失敗しました' },
      { status: 502 }
    )
  }
}
