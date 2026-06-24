'use client'

import { useState } from 'react'
import type { DailyReport } from '@/types'

interface ReportListProps {
  initial: DailyReport[]
  onSelect: (date: string) => void
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${year}/${month}/${day}`
}

function preview(text: string | null): string {
  if (!text || text.trim() === '') return '—'
  return text.trim().slice(0, 100)
}

export function ReportList({ initial, onSelect }: ReportListProps) {
  const [reports] = useState<DailyReport[]>(initial)

  if (reports.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-muted">過去の日報はありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h2 className="card-title text-navy uppercase tracking-wide px-1">過去の日報</h2>
      <div className="card divide-y divide-line">
        {reports.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r.reportDate)}
            className="w-full text-left px-4 py-3 hover:bg-bg transition-colors group"
          >
            <div className="flex items-baseline gap-3">
              <span className="label-eyebrow text-muted shrink-0">{formatDate(r.reportDate)}</span>
              <span className="text-sm text-ink line-clamp-1 group-hover:text-mc-blue transition-colors">
                {preview(r.doneToday)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
