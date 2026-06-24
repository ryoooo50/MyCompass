'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { DailyReport } from '@/types'
import { Toast } from '@/components/ui/Toast'

interface ReportEditorProps {
  todayDate: string
  initialSelectedDate?: string
  initialReport: DailyReport | null
  userId: string
  onSaved?: (report: DailyReport) => void
}

export function ReportEditor({
  todayDate,
  initialSelectedDate,
  initialReport,
  userId,
  onSaved,
}: ReportEditorProps) {
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate ?? todayDate)
  const [report, setReport] = useState<DailyReport | null>(initialReport)
  const [doneToday, setDoneToday] = useState(initialReport?.doneToday ?? '')
  const [insights, setInsights] = useState(initialReport?.insights ?? '')
  const [tomorrowPlan, setTomorrowPlan] = useState(initialReport?.tomorrowPlan ?? '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const supabase = createClient()

  const isAllEmpty =
    (doneToday ?? '').trim() === '' &&
    (insights ?? '').trim() === '' &&
    (tomorrowPlan ?? '').trim() === ''

  const handleDateChange = useCallback(
    async (date: string) => {
      setSelectedDate(date)

      const { data } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', userId)
        .eq('report_date', date)
        .maybeSingle()

      const mapped: DailyReport | null = data
        ? {
            id: data.id as string,
            userId: data.user_id as string,
            reportDate: data.report_date as string,
            doneToday: data.done_today as string | null,
            insights: data.insights as string | null,
            tomorrowPlan: data.tomorrow_plan as string | null,
            createdAt: data.created_at as string,
            updatedAt: data.updated_at as string,
          }
        : null

      setReport(mapped)
      setDoneToday(mapped?.doneToday ?? '')
      setInsights(mapped?.insights ?? '')
      setTomorrowPlan(mapped?.tomorrowPlan ?? '')
    },
    [supabase, userId]
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        user_id: userId,
        report_date: selectedDate,
        done_today: doneToday.trim() || null,
        insights: insights.trim() || null,
        tomorrow_plan: tomorrowPlan.trim() || null,
      }

      const { data, error } = await supabase
        .from('daily_reports')
        .upsert(payload, { onConflict: 'user_id,report_date' })
        .select()
        .single()

      if (error || !data) {
        setToast({ message: '保存に失敗しました', type: 'error' })
        return
      }

      const saved: DailyReport = {
        id: data.id as string,
        userId: data.user_id as string,
        reportDate: data.report_date as string,
        doneToday: data.done_today as string | null,
        insights: data.insights as string | null,
        tomorrowPlan: data.tomorrow_plan as string | null,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
      }

      setReport(saved)
      setToast({ message: '日報を保存しました', type: 'success' })
      onSaved?.(saved)
    } finally {
      setSaving(false)
    }
  }

  const selectDate = (date: string) => {
    void handleDateChange(date)
  }

  return (
    <div className="card p-6 space-y-5">
      {/* ヘッダー行: タイトル + 日付ピッカー */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="card-title text-navy uppercase tracking-wide">日報を記録</h2>
        <input
          type="date"
          value={selectedDate}
          max={todayDate}
          onChange={(e) => selectDate(e.target.value)}
          className="text-sm border border-line rounded-lg px-3 py-1.5 text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-mc-blue/30"
          aria-label="日付を選択"
        />
      </div>

      {/* 全フィールドが空でかつDB未記録の場合の案内 */}
      {isAllEmpty && report === null && (
        <p className="text-sm text-muted">今日の日報を記録しましょう</p>
      )}

      {/* フォームフィールド */}
      <div className="space-y-4">
        <div>
          <label className="label-eyebrow text-muted block mb-1.5" htmlFor="done-today">
            今日やったこと
          </label>
          <textarea
            id="done-today"
            rows={4}
            value={doneToday}
            onChange={(e) => setDoneToday(e.target.value)}
            placeholder="今日取り組んだことを書きましょう"
            className="w-full resize-none rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-mc-blue/30"
          />
        </div>

        <div>
          <label className="label-eyebrow text-muted block mb-1.5" htmlFor="insights">
            気づき・メモ
          </label>
          <textarea
            id="insights"
            rows={4}
            value={insights}
            onChange={(e) => setInsights(e.target.value)}
            placeholder="気づきや学んだことを書きましょう"
            className="w-full resize-none rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-mc-blue/30"
          />
        </div>

        <div>
          <label className="label-eyebrow text-muted block mb-1.5" htmlFor="tomorrow-plan">
            明日やること
          </label>
          <textarea
            id="tomorrow-plan"
            rows={4}
            value={tomorrowPlan}
            onChange={(e) => setTomorrowPlan(e.target.value)}
            placeholder="明日の予定や目標を書きましょう"
            className="w-full resize-none rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-mc-blue/30"
          />
        </div>
      </div>

      {/* 保存ボタン（右下） */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-mc-blue text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : '保存する'}
        </button>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
