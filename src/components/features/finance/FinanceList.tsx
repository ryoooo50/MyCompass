'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { FinanceRecord, MonthlyBudget } from '@/types'
import { FinanceForm } from './FinanceForm'
import { FinanceSummary } from './FinanceSummary'
import { Toast } from '@/components/ui/Toast'

interface FinanceListProps {
  initial: FinanceRecord[]
  initialBudget: MonthlyBudget | null
  userId: string
}

interface FinanceFormData {
  amount: number
  category: string
  type: 'income' | 'expense'
  date: string
  memo: string | null
}

function mapRow(row: Record<string, unknown>): FinanceRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    amount: row.amount as number,
    type: row.type as 'income' | 'expense',
    category: row.category as string,
    date: row.date as string,
    memo: row.memo as string | null,
    createdAt: row.created_at as string,
  }
}

function getYearMonth(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return getYearMonth(d)
}

function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`
}

export function FinanceList({ initial, initialBudget, userId }: FinanceListProps) {
  const currentYM = getYearMonth(new Date())
  const [yearMonth, setYearMonth] = useState(currentYM)
  const [allRecords, setAllRecords] = useState<FinanceRecord[]>(initial)
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set([currentYM]))
  const [budgets, setBudgets] = useState<Map<string, MonthlyBudget>>(
    initialBudget ? new Map([[initialBudget.yearMonth, initialBudget]]) : new Map()
  )
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  const supabase = createClient()
  const showError = (msg: string) => setToast({ message: msg, type: 'error' })

  const records = allRecords.filter(r => r.date.startsWith(yearMonth))
  const currentBudget = budgets.get(yearMonth) ?? null

  const loadMonth = useCallback(async (ym: string) => {
    if (loadedMonths.has(ym)) return
    setLoading(true)
    const [y, m] = ym.split('-').map(Number)
    const first = `${ym}-01`
    const lastDay = new Date(y, m, 0).getDate()
    const last = `${ym}-${String(lastDay).padStart(2, '0')}`

    const [recordsResult, budgetResult] = await Promise.all([
      supabase
        .from('finance_records')
        .select('*')
        .gte('date', first)
        .lte('date', last)
        .order('date', { ascending: false }),
      supabase
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('year_month', ym)
        .maybeSingle(),
    ])

    if (recordsResult.error) {
      showError('データの読み込みに失敗しました')
    } else {
      const fetched = (recordsResult.data ?? []).map(r => mapRow(r as Record<string, unknown>))
      setAllRecords(prev => {
        const existingIds = new Set(prev.map(r => r.id))
        const newOnes = fetched.filter(r => !existingIds.has(r.id))
        return [...prev, ...newOnes]
      })
    }

    if (!budgetResult.error && budgetResult.data) {
      const bdata = budgetResult.data as Record<string, unknown>
      const mapped: MonthlyBudget = {
        id: bdata.id as string,
        userId: bdata.user_id as string,
        yearMonth: bdata.year_month as string,
        budgetAmount: bdata.budget_amount as number,
        createdAt: bdata.created_at as string,
        updatedAt: bdata.updated_at as string,
      }
      setBudgets(prev => new Map(prev).set(ym, mapped))
    }

    setLoadedMonths(prev => new Set([...prev, ym]))
    setLoading(false)
  }, [loadedMonths, supabase, userId])

  const handleMonthChange = (delta: number) => {
    const next = addMonths(yearMonth, delta)
    setYearMonth(next)
    loadMonth(next)
  }

  const handleAdd = async (data: FinanceFormData) => {
    setSubmitting(true)
    const tempId = `temp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: FinanceRecord = {
      id: tempId,
      userId,
      ...data,
      createdAt: now,
    }
    setAllRecords(prev => [optimistic, ...prev])
    setShowForm(false)

    const { data: saved, error } = await supabase
      .from('finance_records')
      .insert({
        user_id: userId,
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: data.date,
        memo: data.memo,
      })
      .select()
      .single()

    if (error || !saved) {
      setAllRecords(prev => prev.filter(r => r.id !== tempId))
      showError('保存に失敗しました')
    } else {
      setAllRecords(prev => prev.map(r => r.id === tempId ? mapRow(saved as Record<string, unknown>) : r))
    }
    setSubmitting(false)
  }

  const handleEdit = async (id: string, data: FinanceFormData) => {
    setSubmitting(true)
    const prev = allRecords.find(r => r.id === id)!
    setAllRecords(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    setEditingId(null)

    const { error } = await supabase
      .from('finance_records')
      .update({
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: data.date,
        memo: data.memo,
      })
      .eq('id', id)

    if (error) {
      setAllRecords(records => records.map(r => r.id === id ? prev : r))
      showError('更新に失敗しました')
    }
    setSubmitting(false)
  }

  const handleDelete = async (record: FinanceRecord) => {
    if (!confirm(`この記録を削除しますか？\n${record.category} ${formatYen(record.amount)}`)) return
    setAllRecords(prev => prev.filter(r => r.id !== record.id))

    const { error } = await supabase.from('finance_records').delete().eq('id', record.id)
    if (error) {
      setAllRecords(prev => [...prev, record].sort((a, b) => b.date.localeCompare(a.date)))
      showError('削除に失敗しました')
    }
  }

  const handleExportCSV = () => {
    const headers = ['日付', '種別', 'カテゴリ', '金額', 'メモ']
    const rows = records.map(r => [
      r.date,
      r.type === 'income' ? '収入' : '支出',
      r.category,
      String(r.amount),
      r.memo ?? '',
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const bom = '﻿'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance_${yearMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="page-heading text-navy">財務管理</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs border border-line text-muted rounded-lg hover:border-navy hover:text-navy transition-colors"
          >
            CSV出力
          </button>
          <button
            onClick={() => { setShowForm(true); setEditingId(null) }}
            className="flex items-center gap-1.5 px-4 py-2 bg-mc-blue text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            記録を追加
          </button>
        </div>
      </div>

      {/* 月セレクター */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleMonthChange(-1)}
          className="p-2 rounded-lg border border-line text-muted hover:border-navy hover:text-navy transition-colors"
          aria-label="前月"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-ink min-w-[6rem] text-center">
          {yearMonth.replace('-', '年')}月
        </span>
        <button
          onClick={() => handleMonthChange(1)}
          disabled={yearMonth >= currentYM}
          className="p-2 rounded-lg border border-line text-muted hover:border-navy hover:text-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="翌月"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {loading && <span className="text-xs text-muted">読み込み中…</span>}
      </div>

      {/* サマリー */}
      <FinanceSummary
        records={records}
        budget={currentBudget}
        userId={userId}
        yearMonth={yearMonth}
      />

      {/* 追加フォーム */}
      {showForm && (
        <div className="card p-4">
          <FinanceForm
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
            loading={submitting}
          />
        </div>
      )}

      {/* 記録一覧 */}
      <div className="card divide-y divide-line">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">
            {loading ? '読み込み中…' : '「記録を追加」からこの月の記録を追加してください'}
          </div>
        ) : (
          sorted.map(record =>
            editingId === record.id ? (
              <div key={record.id} className="p-4">
                <FinanceForm
                  initial={record}
                  onSubmit={data => handleEdit(record.id, data)}
                  onCancel={() => setEditingId(null)}
                  loading={submitting}
                />
              </div>
            ) : (
              <div key={record.id} className="flex items-center gap-3 px-4 py-3">
                {/* 種別インジケーター */}
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    record.type === 'income' ? 'bg-mc-blue' : 'bg-mc-red'
                  }`}
                />
                {/* 日付 */}
                <span className="text-xs text-muted w-20 flex-shrink-0">{record.date}</span>
                {/* カテゴリ */}
                <span className="text-xs px-2 py-0.5 rounded-full bg-bg text-muted border border-line flex-shrink-0">
                  {record.category}
                </span>
                {/* メモ */}
                <span className="text-sm text-ink flex-1 truncate">{record.memo ?? ''}</span>
                {/* 金額 */}
                <span
                  className={`finance-value text-base flex-shrink-0 ${
                    record.type === 'income' ? 'text-mc-blue' : 'text-mc-red'
                  }`}
                >
                  {record.type === 'expense' ? '-' : '+'}{formatYen(record.amount)}
                </span>
                {/* アクション */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditingId(record.id); setShowForm(false) }}
                    className="p-1.5 rounded text-muted hover:text-navy hover:bg-bg transition-colors"
                    aria-label="編集"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M10 2l2 2-7 7H3v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(record)}
                    className="p-1.5 rounded text-muted hover:text-mc-red hover:bg-bg transition-colors"
                    aria-label="削除"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M11 4l-.9 7.2a1 1 0 01-1 .8H4.9a1 1 0 01-1-.8L3 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
