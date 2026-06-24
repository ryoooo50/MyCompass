import type { CalendarEvent, CalendarInfo } from '@/types'

const GCal = 'https://www.googleapis.com/calendar/v3'

async function gcalFetch(path: string, token: string): Promise<Response> {
  const res = await fetch(`${GCal}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 }, // 5分キャッシュ
  })
  return res
}

export async function fetchCalendars(token: string): Promise<CalendarInfo[]> {
  const res = await gcalFetch('/users/me/calendarList?minAccessRole=reader', token)
  if (!res.ok) throw new Error(`CalendarList failed: ${res.status}`)
  const json = await res.json()
  return (json.items ?? []).map((c: Record<string, string>) => ({
    id: c.id,
    name: c.summary,
    color: c.backgroundColor ?? '#4285f4',
  }))
}

export async function fetchEvents(
  token: string,
  calendarIds: string[],
  days = 7
): Promise<CalendarEvent[]> {
  const now = new Date()
  const timeMin = now.toISOString()
  const timeMax = new Date(now.getTime() + days * 86400_000).toISOString()

  const targets = calendarIds.length > 0 ? calendarIds : ['primary']

  const results = await Promise.allSettled(
    targets.map(id =>
      gcalFetch(
        `/calendars/${encodeURIComponent(id)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`,
        token
      ).then(r => {
        if (!r.ok) throw new Error(`Events failed for ${id}: ${r.status}`)
        return r.json()
      })
    )
  )

  const events: CalendarEvent[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') return
    const calendarId = targets[i]
    for (const item of result.value.items ?? []) {
      const isAllDay = !!item.start?.date
      events.push({
        id: item.id,
        title: item.summary ?? '（タイトルなし）',
        startAt: item.start?.dateTime ?? item.start?.date ?? '',
        endAt: item.end?.dateTime ?? item.end?.date ?? '',
        isAllDay,
        calendarId,
        calendarName: item.organizer?.displayName ?? calendarId,
      })
    }
  })

  return events.sort((a, b) => a.startAt.localeCompare(b.startAt))
}
