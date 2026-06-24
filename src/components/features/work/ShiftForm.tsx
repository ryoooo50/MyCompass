'use client'

import { useState, useEffect } from 'react'
import type { WorkShift } from '@/types'

const LAST_HOURLY_RATE_KEY = 'work_last_hourly_rate'

interface ShiftFormData {
  date: string
  startTime: string
  endTime: string
  hourlyRate: number
  transportFee: number
}

interface ShiftFormProps {
  initial?: WorkShift
  onSubmit: (data: ShiftFormData) => void
  onCancel: () => void
  loading?: boolean
}

function getDefaultHourlyRate(): number {
  if (typeof window === 'undefined') return 1000
  const saved = localStorage.getItem(LAST_HOURLY_RATE_KEY)
  if (saved) {
    const parsed = parseInt(saved, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return 1000
}

export function ShiftForm({ initial, onSubmit, onCancel, loading = false }: ShiftFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(initial?.date ?? today)
  const [startTime, setStartTime] = useState(initial?.startTime ?? '09:00')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '17:00')
  const [hourlyRate, setHourlyRate] = useState(initial?.hourlyRate ?? 0)
  const [transportFee, setTransportFee] = useState(initial?.transportFee ?? 0)
  const [hourlyRateLoaded, setHourlyRateLoaded] = useState(false)

  useEffect(() => {
    if (!initial && !hourlyRateLoaded) {
      setHourlyRate(getDefaultHourlyRate())
      setHourlyRateLoaded(true)
    }
  }, [initial, hourlyRateLoaded])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !startTime || !endTime || hourlyRate <= 0) return
    if (startTime >= endTime) return

    localStorage.setItem(LAST_HOURLY_RATE_KEY, String(hourlyRate))
    onSubmit({ date, startTime, endTime, hourlyRate, transportFee })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="label-eyebrow text-muted block mb-1" htmlFor="shift-date">日付</label>
          <input
            id="shift-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-mc-blue"
          />
        </div>
        <div>
          <label className="label-eyebrow text-muted block mb-1" htmlFor="shift-start">開始時刻</label>
          <input
            id="shift-start"
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-mc-blue"
          />
        </div>
        <div>
          <label className="label-eyebrow text-muted block mb-1" htmlFor="shift-end">終了時刻</label>
          <input
            id="shift-end"
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-mc-blue"
          />
        </div>
        <div>
          <label className="label-eyebrow text-muted block mb-1" htmlFor="shift-rate">時給（円）</label>
          <input
            id="shift-rate"
            type="number"
            value={hourlyRate}
            onChange={e => setHourlyRate(Number(e.target.value))}
            min={1}
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-mc-blue"
          />
        </div>
        <div>
          <label className="label-eyebrow text-muted block mb-1" htmlFor="shift-transport">交通費（円）</label>
          <input
            id="shift-transport"
            type="number"
            value={transportFee}
            onChange={e => setTransportFee(Number(e.target.value))}
            min={0}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-mc-blue"
          />
        </div>
      </div>
      {startTime && endTime && startTime >= endTime && (
        <p className="text-mc-red text-xs">終了時刻は開始時刻より後にしてください</p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-muted border border-line rounded-lg hover:bg-bg transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={loading || !date || !startTime || !endTime || hourlyRate <= 0 || startTime >= endTime}
          className="px-4 py-2 text-sm bg-mc-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '保存中…' : initial ? '更新' : '追加'}
        </button>
      </div>
    </form>
  )
}
