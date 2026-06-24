'use client'

import type { WorkShift } from '@/types'

interface EarningsSummaryProps {
  shifts: WorkShift[]
}

function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60
}

export function EarningsSummary({ shifts }: EarningsSummaryProps) {
  const confirmed = shifts.filter(s => s.confirmed)

  const totalMinutes = confirmed.reduce((acc, s) => {
    const hours = calcHours(s.startTime, s.endTime)
    return acc + Math.round(hours * 60)
  }, 0)

  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  const totalEarnings = confirmed.reduce((acc, s) => {
    const hours = calcHours(s.startTime, s.endTime)
    return acc + Math.round(s.hourlyRate * hours) + s.transportFee
  }, 0)

  return (
    <div className="card p-5 grid grid-cols-2 gap-6">
      <div>
        <p className="label-eyebrow text-muted mb-1">確定済み勤務時間</p>
        <p className="metric-value text-navy">
          {totalHours}
          <span className="text-lg font-semibold ml-0.5">時間</span>
          {remainingMinutes > 0 && (
            <>
              {remainingMinutes}
              <span className="text-lg font-semibold ml-0.5">分</span>
            </>
          )}
        </p>
      </div>
      <div>
        <p className="label-eyebrow text-muted mb-1">給与見込み（確定分）</p>
        <p className="metric-value text-accent">
          ¥{totalEarnings.toLocaleString()}
        </p>
      </div>
    </div>
  )
}
