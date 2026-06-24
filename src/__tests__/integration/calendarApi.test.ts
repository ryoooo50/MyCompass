import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('GET /api/calendar/events', () => {
  it('正常系: イベント一覧を返す', async () => {
    const res = await fetch('/api/calendar/events')
    expect(res.status).toBe(200)
    const data = await res.json() as unknown[]
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)
    expect((data[0] as { summary: string }).summary).toBe('テスト会議')
  })

  it('エラー系: 502 を返す場合', async () => {
    server.use(
      http.get('/api/calendar/events', () => {
        return HttpResponse.json(
          { code: 'CALENDAR_FETCH_FAILED', message: 'Google Calendar の取得に失敗しました' },
          { status: 502 }
        )
      })
    )
    const res = await fetch('/api/calendar/events')
    expect(res.status).toBe(502)
    const data = await res.json() as { code: string }
    expect(data.code).toBe('CALENDAR_FETCH_FAILED')
  })

  it('エラー系: NO_PROVIDER_TOKEN を返す場合', async () => {
    server.use(
      http.get('/api/calendar/events', () => {
        return HttpResponse.json(
          { code: 'NO_PROVIDER_TOKEN', message: 'Google トークンが見つかりません。一度ログアウトして再ログインしてください。' },
          { status: 401 }
        )
      })
    )
    const res = await fetch('/api/calendar/events')
    expect(res.status).toBe(401)
    const data = await res.json() as { code: string }
    expect(data.code).toBe('NO_PROVIDER_TOKEN')
  })
})
