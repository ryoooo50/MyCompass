'use client'

import { useState } from 'react'
import type { FinanceRecord } from '@/types'

interface FinanceFormData {
  amount: number
  category: string
  type: 'income' | 'expense'
  date: string
  memo: string | null
}

interface FinanceFormProps {
  initial?: FinanceRecord
  onSubmit: (data: FinanceFormData) => void
  onCancel: () => void
  loading?: boolean
}

const INCOME_CATEGORIES = ['給与', 'バイト代', 'その他収入']
const EXPENSE_CATEGORIES = ['食費', '交通費', '娯楽', '日用品', 'その他']

export function FinanceForm({ initial, onSubmit, onCancel, loading = false }: FinanceFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const [type, setType] = useState<'income' | 'expense'>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [date, setDate] = useState(initial?.date ?? today)
  const [memo, setMemo] = useState(initial?.memo ?? '')

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const handleTypeChange = (next: 'income' | 'expense') => {
    setType(next)
    setCategory('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseInt(amount, 10)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return
    if (!category) return
    if (!date) return
    onSubmit({
      amount: parsedAmount,
      category,
      type,
      date,
      memo: memo.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 種別 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
            type === 'expense'
              ? 'bg-mc-red text-white border-mc-red'
              : 'border-line text-muted hover:border-mc-red hover:text-mc-red'
          }`}
        >
          支出
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
            type === 'income'
              ? 'bg-mc-blue text-white border-mc-blue'
              : 'border-line text-muted hover:border-mc-blue hover:text-mc-blue'
          }`}
        >
          収入
        </button>
      </div>

      {/* 金額 */}
      <div className="space-y-1">
        <label className="label-eyebrow text-muted block">金額（円）</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0"
          min={1}
          required
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue/30"
        />
      </div>

      {/* カテゴリ */}
      <div className="space-y-1">
        <label className="label-eyebrow text-muted block">カテゴリ</label>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                category === cat
                  ? 'bg-navy text-white border-navy'
                  : 'border-line text-muted hover:border-navy hover:text-navy'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder="または直接入力"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue/30 mt-2"
        />
      </div>

      {/* 日付 */}
      <div className="space-y-1">
        <label className="label-eyebrow text-muted block">日付</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue/30"
        />
      </div>

      {/* メモ */}
      <div className="space-y-1">
        <label className="label-eyebrow text-muted block">メモ（任意）</label>
        <input
          type="text"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="メモを入力"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue/30"
        />
      </div>

      {/* ボタン */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading || !amount || !category || !date}
          className="flex-1 py-2 text-sm bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors disabled:opacity-50"
        >
          {loading ? '保存中…' : initial ? '更新' : '追加'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-line text-muted rounded-lg hover:border-navy hover:text-navy transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
