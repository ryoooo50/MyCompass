import { createClient } from '@/lib/supabase/server'
import { fetchEvents } from '@/lib/google-calendar/client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: '認証が必要です' }, { status: 401 })
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('google_provider_token, calendar_ids')
    .eq('user_id', user.id)
    .single()

  const providerToken = settings?.google_provider_token
  if (!providerToken) {
    return NextResponse.json(
      { code: 'NO_PROVIDER_TOKEN', message: 'Google トークンが見つかりません。一度ログアウトして再ログインしてください。' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const days = Number(searchParams.get('days') ?? 7)
  const calendarIds: string[] = settings?.calendar_ids ?? []

  try {
    const events = await fetchEvents(providerToken, calendarIds, days)
    return NextResponse.json(events)
  } catch (e) {
    // Google が 401 を返した場合はトークン期限切れ
    const msg = e instanceof Error && e.message.includes('401')
      ? 'Google トークンの有効期限が切れました。再ログインしてください。'
      : 'Google Calendar の取得に失敗しました'
    return NextResponse.json({ code: 'CALENDAR_FETCH_FAILED', message: msg }, { status: 502 })
  }
}
