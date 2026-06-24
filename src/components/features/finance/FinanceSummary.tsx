'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { FinanceRecord, MonthlyBudget } from '@/types'

interface FinanceSummaryProps {
  records: FinanceRecord[]
  budget: MonthlyBudget | null
  userId: string
  yearMonth: string
}

function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`
}

export function FinanceSummary({ records, budget, userId, yearMonth }: FinanceSummaryProps) {
  const supabase = createClient()
  const [budgetInput, setBudgetInput] = useState(budget ? String(budget.budgetAmount) : '')
  const [currentBudget, setCurrentBudget] = useState<MonthlyBudget | null>(budget)
  const [saving, setSaving] = useState(false)
  const [showBudgetForm, setShowBudgetForm] = useState(false)

  const totalIncome = records
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalExpense = records
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0)

  const balance = totalIncome - totalExpense

  const handleBudgetSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedBudget = parseInt(budgetInput, 10)
    if (isNaN(parsedBudget) || parsedBudget <= 0) return
    setSaving(true)

    const { data, error } = await supabase
      .from('monthly_budgets')
      .upsert(
        { user_id: userId, year_month: yearMonth, budget_amount: parsedBudget },
        { onConflict: 'user_id,year_month' }
      )
      .select()
      .single()

    if (!error && data) {
      const mapped: MonthlyBudget = {
        id: data.id as string,
        userId: data.user_id as string,
        yearMonth: data.year_month as string,
        budgetAmount: data.budget_amount as number,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
      }
      setCurrentBudget(mapped)
      setShowBudgetForm(false)
    }
    setSaving(false)
  }

  const budgetDiff = currentBudget ? currentBudget.budgetAmount - totalExpense : null

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="card-title text-navy uppercase tracking-wider">{yearMonth} サマリー</h2>
        <button
          onClick={() => setShowBudgetForm(v => !v)}
          className="text-xs text-muted hover:text-navy transition-colors"
        >
          {showBudgetForm ? '閉じる' : currentBudget ? '予算を変更' : '予算を設定'}
        </button>
      </div>

      {/* サマリーグリッド */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-0.5">
          <p className="label-eyebrow text-muted">収入</p>
          <p className="finance-value text-mc-blue">{formatYen(totalIncome)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="label-eyebrow text-muted">支出</p>
          <p className="finance-value text-mc-red">{formatYen(totalExpense)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="label-eyebrow text-muted">残額</p>
          <p className={`finance-value ${balance >= 0 ? 'text-mc-green' : 'text-mc-red'}`}>
            {formatYen(balance)}
          </p>
        </div>
      </div>

      {/* 予算差分 */}
      {currentBudget && budgetDiff !== null && (
        <div className="pt-2 border-t border-line flex items-center justify-between">
          <div>
            <p className="label-eyebrow text-muted">予算</p>
            <p className="text-sm text-ink font-semibold">{formatYen(currentBudget.budgetAmount)}</p>
          </div>
          <div className="text-right">
            <p className="label-eyebrow text-muted">予算残</p>
            <p className={`text-sm font-semibold ${budgetDiff >= 0 ? 'text-mc-green' : 'text-mc-red'}`}>
              {budgetDiff >= 0 ? '+' : ''}{formatYen(budgetDiff)}
            </p>
          </div>
          {/* 予算消化バー */}
          <div className="flex-1 mx-4">
            <div className="h-2 bg-line rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  totalExpense / currentBudget.budgetAmount > 1
                    ? 'bg-mc-red'
                    : totalExpense / currentBudget.budgetAmount > 0.8
                    ? 'bg-accent'
                    : 'bg-mc-green'
                }`}
                style={{ width: `${Math.min((totalExpense / currentBudget.budgetAmount) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted text-right mt-0.5">
              {Math.round((totalExpense / currentBudget.budgetAmount) * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* 予算設定フォーム */}
      {showBudgetForm && (
        <form onSubmit={handleBudgetSave} className="pt-2 border-t border-line flex gap-2">
          <input
            type="number"
            value={budgetInput}
            onChange={e => setBudgetInput(e.target.value)}
            placeholder="予算額（円）"
            min={1}
            required
            className="flex-1 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue/30"
          />
          <button
            type="submit"
            disabled={saving || !budgetInput}
            className="px-4 py-2 text-sm bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </form>
      )}
    </div>
  )
}
