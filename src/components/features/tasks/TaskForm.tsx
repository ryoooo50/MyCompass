'use client'

import { useState } from 'react'
import type { Task } from '@/types'

interface TaskFormData {
  title: string
  priority: 'high' | 'medium' | 'low'
  dueDate: string | null
  categories: string[]
}

interface TaskFormProps {
  initial?: Partial<Task>
  availableCategories: string[]
  onSubmit: (data: TaskFormData) => void
  onCancel: () => void
  onAddCategory: (name: string) => void
  loading?: boolean
}

export function TaskForm({ initial, availableCategories, onSubmit, onCancel, onAddCategory, loading }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(initial?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [categories, setCategories] = useState<string[]>(initial?.categories ?? [])
  const [newCatInput, setNewCatInput] = useState('')
  const [showNewCatInput, setShowNewCatInput] = useState(false)

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const handleAddNewCategory = () => {
    const name = newCatInput.trim()
    if (!name) return
    onAddCategory(name)
    setCategories(prev => prev.includes(name) ? prev : [...prev, name])
    setNewCatInput('')
    setShowNewCatInput(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      priority,
      dueDate: dueDate || null,
      categories,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="タスクのタイトル"
        className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue/30 focus:border-mc-blue"
        required
        autoFocus
      />

      <div className="flex gap-2">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as 'high' | 'medium' | 'low')}
          className="flex-1 px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue/30 bg-white"
        >
          <option value="high">優先度：高</option>
          <option value="medium">優先度：中</option>
          <option value="low">優先度：低</option>
        </select>
        <input
          type="date"
          value={dueDate ?? ''}
          onChange={e => setDueDate(e.target.value)}
          className="flex-1 px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue/30"
        />
      </div>

      {/* カテゴリー選択 */}
      <div>
        <p className="text-xs text-muted mb-1.5">カテゴリー（複数選択可）</p>
        <div className="flex flex-wrap gap-1.5">
          {availableCategories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                categories.includes(cat)
                  ? 'bg-navy text-white border-navy'
                  : 'bg-white text-muted border-line hover:border-navy hover:text-navy'
              }`}
            >
              {cat}
            </button>
          ))}

          {showNewCatInput ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newCatInput}
                onChange={e => setNewCatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddNewCategory() }
                  if (e.key === 'Escape') setShowNewCatInput(false)
                }}
                placeholder="カテゴリー名"
                className="px-2 py-0.5 text-xs border border-mc-blue rounded-full w-28 focus:outline-none focus:ring-1 focus:ring-mc-blue/30"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddNewCategory}
                className="px-2 py-0.5 text-xs bg-mc-blue text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                追加
              </button>
              <button
                type="button"
                onClick={() => setShowNewCatInput(false)}
                className="text-xs text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewCatInput(true)}
              className="px-2.5 py-1 text-xs rounded-full border border-dashed border-line text-muted hover:border-navy hover:text-navy transition-colors"
            >
              ＋ 新規
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-muted hover:text-ink transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-4 py-2 bg-mc-blue text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? '保存中…' : initial?.id ? '更新' : '追加'}
        </button>
      </div>
    </form>
  )
}
