'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { WorkShift } from '@/types'
import { ShiftForm } from './ShiftForm'
import { EarningsSummary } from './EarningsSummary'
import { Toast } from '@/components/ui/Toast'

interface ShiftFormData {
  date: string
  startTime: string
  endTime: string
  hourlyRate: number
  transportFee: number
}

interface WorkListProps {
  initial: WorkShift[]
  userId: string
  initialYear: number
  initialMonth: number
}

function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60
}

function formatDuration(start: string, end: string): string {
  const totalMinutes = Math.round(calcHours(start, end) * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (m === 0) return `${h}時間`
  return `${h}時間${m}分`
}

function mapRow(row: Record<string, unknown>): WorkShift {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    date: row.date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    hourlyRate: row.hourly_rate as number,
    transportFee: row.transport_fee as number,
    confirmed: row.confirmed as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function toYearMonth(shift: WorkShift): { year: number; month: number } {
  const [year, month] = shift.date.split('-').map(Number)
  return { year, month }
}

export function WorkList({ initial, userId, initialYear, initialMonth }: WorkListProps) {
  const [shifts, setShifts] = useState<WorkShift[]>(initial)
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  const supabase = createClient()
  const showError = (msg: string) => setToast({ message: msg, type: 'error' })
  const showSuccess = (msg: string) => setToast({ message: msg, type: 'success' })

  const visibleShifts = shifts.filter(s => {
    const ym = toYearMonth(s)
    return ym.year === year && ym.month === month
  }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const handleAdd = async (data: ShiftFormData) => {
    setSubmitting(true)
    const tempId = `temp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: WorkShift = {
      id: tempId,
      userId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      hourlyRate: data.hourlyRate,
      transportFee: data.transportFee,
      confirmed: false,
      createdAt: now,
      updatedAt: now,
    }
    setShifts(prev => [optimistic, ...prev])
    setShowForm(false)

    const { data: saved, error } = await supabase
      .from('work_shifts')
      .insert({
        user_id: userId,
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        hourly_rate: data.hourlyRate,
        transport_fee: data.transportFee,
      })
      .select()
      .single()

    if (error || !saved) {
      setShifts(prev => prev.filter(s => s.id !== tempId))
      showError('シフトの保存に失敗しました')
    } else {
      setShifts(prev => prev.map(s => s.id === tempId ? mapRow(saved) : s))
    }
    setSubmitting(false)
  }

  const handleEdit = async (id: string, data: ShiftFormData) => {
    setSubmitting(true)
    const snapshot = shifts.find(s => s.id === id)!
    setShifts(prev => prev.map(s => s.id === id
      ? { ...s, date: data.date, startTime: data.startTime, endTime: data.endTime, hourlyRate: data.hourlyRate, transportFee: data.transportFee }
      : s))
    setEditingId(null)

    const { error } = await supabase
      .from('work_shifts')
      .update({
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        hourly_rate: data.hourlyRate,
        transport_fee: data.transportFee,
      })
      .eq('id', id)

    if (error) {
      setShifts(prev => prev.map(s => s.id === id ? snapshot : s))
      showError('更新に失敗しました')
    }
    setSubmitting(false)
  }

  const handleDelete = async (shift: WorkShift) => {
    if (!confirm(`${shift.date} のシフトを削除しますか？`)) return
    setShifts(prev => prev.filter(s => s.id !== shift.id))

    const { error } = await supabase.from('work_shifts').delete().eq('id', shift.id)
    if (error) {
      setShifts(prev => [...prev, shift])
      showError('削除に失敗しました')
    }
  }

  const handleConfirm = async (shift: WorkShift) => {
    const hours = calcHours(shift.startTime, shift.endTime)
    const earnings = Math.round(shift.hourlyRate * hours) + shift.transportFee
    const duration = formatDuration(shift.startTime, shift.endTime)
    const memo = `${shift.date} バイト（${duration}）`

    setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, confirmed: true } : s))

    const { error: shiftError } = await supabase
      .from('work_shifts')
      .update({ confirmed: true })
      .eq('id', shift.id)

    if (shiftError) {
      setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, confirmed: false } : s))
      showError('確定に失敗しました')
      return
    }

    const { error: financeError } = await supabase
      .from('finance_records')
      .insert({
        user_id: userId,
        amount: earnings,
        type: 'income',
        category: 'バイト代',
        date: shift.date,
        memo,
      })

    if (financeError) {
      showError('収入記録の登録に失敗しました（シフトは確定済みです）')
    } else {
      showSuccess('シフトを確定しました')
    }
  }

  const handleUnconfirm = async (shift: WorkShift) => {
    const duration = formatDuration(shift.startTime, shift.endTime)
    const memo = `${shift.date} バイト（${duration}）`

    setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, confirmed: false } : s))

    const { error: shiftError } = await supabase
      .from('work_shifts')
      .update({ confirmed: false })
      .eq('id', shift.id)

    if (shiftError) {
      setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, confirmed: true } : s))
      showError('確定取り消しに失敗しました')
      return
    }

    await supabase
      .from('finance_records')
      .delete()
      .eq('user_id', userId)
      .eq('memo', memo)

    showSuccess('確定を取り消しました')
  }

  const monthLabel = `${year}年${month}月`

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="page-heading text-navy">アルバイト</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-mc-blue text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          シフトを追加
        </button>
      </div>

      {/* サマリー */}
      <EarningsSummary shifts={visibleShifts} />

      {/* 月セレクター */}
      <div className="flex items-center gap-3">
        <button
          onClick={prevMonth}
          aria-label="前月"
          className="p-1.5 rounded-lg border border-line hover:bg-bg transition-colors text-muted"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-ink min-w-[5rem] text-center">{monthLabel}</span>
        <button
          onClick={nextMonth}
          aria-label="翌月"
          className="p-1.5 rounded-lg border border-line hover:bg-bg transition-colors text-muted"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* 追加フォーム */}
      {showForm && (
        <div className="card p-4">
          <ShiftForm
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
            loading={submitting}
          />
        </div>
      )}

      {/* シフト一覧 */}
      <div className="card divide-y divide-line">
        {visibleShifts.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">
            {monthLabel}のシフトはありません
          </div>
        ) : (
          visibleShifts.map(shift =>
            editingId === shift.id ? (
              <div key={shift.id} className="p-4">
                <ShiftForm
                  initial={shift}
                  onSubmit={data => handleEdit(shift.id, data)}
                  onCancel={() => setEditingId(null)}
                  loading={submitting}
                />
              </div>
            ) : (
              <ShiftRow
                key={shift.id}
                shift={shift}
                onEdit={() => { setEditingId(shift.id); setShowForm(false) }}
                onDelete={() => handleDelete(shift)}
                onConfirm={() => handleConfirm(shift)}
                onUnconfirm={() => handleUnconfirm(shift)}
              />
            )
          )
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

interface ShiftRowProps {
  shift: WorkShift
  onEdit: () => void
  onDelete: () => void
  onConfirm: () => void
  onUnconfirm: () => void
}

function ShiftRow({ shift, onEdit, onDelete, onConfirm, onUnconfirm }: ShiftRowProps) {
  const hours = calcHours(shift.startTime, shift.endTime)
  const earnings = Math.round(shift.hourlyRate * hours) + shift.transportFee
  const duration = formatDuration(shift.startTime, shift.endTime)

  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-ink">{shift.date}</span>
          {shift.confirmed && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-accent/10 text-accent border border-accent/20">
              確定済み
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted">
          {shift.startTime} – {shift.endTime}　{duration}　¥{shift.hourlyRate.toLocaleString()}/h
          {shift.transportFee > 0 && `　交通費 ¥${shift.transportFee.toLocaleString()}`}
        </div>
        <div className="mt-1 text-sm font-semibold text-ink">
          ¥{earnings.toLocaleString()}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {shift.confirmed ? (
          <button
            onClick={onUnconfirm}
            className="px-3 py-1.5 text-xs border border-line rounded-lg text-muted hover:bg-bg transition-colors"
          >
            取り消し
          </button>
        ) : (
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs bg-mc-green text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            確定
          </button>
        )}
        <button
          onClick={onEdit}
          aria-label="編集"
          className="p-1.5 rounded-lg border border-line text-muted hover:bg-bg transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          aria-label="削除"
          className="p-1.5 rounded-lg border border-line text-muted hover:bg-bg hover:text-mc-red transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.5 7.5h7L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
