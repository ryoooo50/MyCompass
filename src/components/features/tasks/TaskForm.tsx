'use client'

import { useState } from 'react'
import type { Task } from '@/types'

interface TaskFormData {
  title: string
  priority: 'high' | 'medium' | 'low'
  dueDate: string | null
  category: string | null
}

interface TaskFormProps {
  initial?: Partial<Task>
  onSubmit: (data: TaskFormData) => void
  onCancel: () => void
  loading?: boolean
}

export function TaskForm({ initial, onSubmit, onCancel, loading }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(initial?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      priority,
      dueDate: dueDate || null,
      category: category.trim() || null,
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
      <input
        type="text"
        value={category ?? ''}
        onChange={e => setCategory(e.target.value)}
        placeholder="カテゴリ（任意）"
        className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue/30"
      />
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
