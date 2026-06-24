import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/calendar/events', () => {
    return HttpResponse.json([
      {
        id: '1',
        summary: 'テスト会議',
        start: { dateTime: '2026-06-25T10:00:00+09:00' },
        end: { dateTime: '2026-06-25T11:00:00+09:00' },
        calendarId: 'primary',
      },
    ])
  }),
  http.get('/api/calendar/calendars', () => {
    return HttpResponse.json([{ id: 'primary', summary: '個人' }])
  }),
]
