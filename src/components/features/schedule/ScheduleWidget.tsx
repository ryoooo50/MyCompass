'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CalendarEvent } from '@/types'

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function formatTime(iso: string, isAllDay: boolean): string {
  if (isAllDay) return '終日'
  const d = new Date(iso)
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const dow = DAY_LABELS[d.getDay()]
  return `${m}/${day}（${dow}）`
}

function groupByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const dateKey = ev.startAt.slice(0, 10)
    if (!map.has(dateKey)) map.set(dateKey, [])
    map.get(dateKey)!.push(ev)
  }
  return map
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10)
}

interface ScheduleWidgetProps {
  days?: number
  compact?: boolean
}

export function ScheduleWidget({ days = 7, compact = false }: ScheduleWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/calendar/events?days=${days}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? 'カレンダーの取得に失敗しました')
      }
      setEvents(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted">
        <svg className="animate-spin mr-2 w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        読み込み中…
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-mc-red mb-2">{error}</p>
        <button onClick={load} className="text-xs text-mc-blue underline">再試行</button>
      </div>
    )
  }

  if (events.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">この期間に予定はありません</p>
  }

  const grouped = groupByDate(events)
  const displayDates = Array.from(grouped.keys()).slice(0, compact ? 3 : 7)

  return (
    <div className="space-y-4">
      {displayDates.map(date => (
        <div key={date}>
          <div className={`text-xs font-bold mb-1.5 ${isToday(date) ? 'text-accent' : 'text-muted'}`}>
            {formatDateHeader(date)}{isToday(date) ? ' · 今日' : ''}
          </div>
          <div className="space-y-1">
            {grouped.get(date)!.map(ev => (
              <div key={ev.id} className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-bg transition-colors">
                <span className="text-xs text-muted w-10 shrink-0 pt-0.5">{formatTime(ev.startAt, ev.isAllDay)}</span>
                <span className="text-sm text-ink leading-snug">{ev.title}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <button
          onClick={load}
          className="text-xs text-muted hover:text-ink flex items-center gap-1 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M10 6A4 4 0 112 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M10 3v3H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          更新
        </button>
      </div>
    </div>
  )
}
