'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { ResearchMilestone } from '@/types'
import { Toast } from '@/components/ui/Toast'

interface MilestoneListProps {
  initial: ResearchMilestone[]
  userId: string
}

function mapRow(row: Record<string, unknown>): ResearchMilestone {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    dueDate: row.due_date as string | null,
    achieved: row.achieved as boolean,
    achievedAt: row.achieved_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function MilestoneList({ initial, userId }: MilestoneListProps) {
  const [milestones, setMilestones] = useState<ResearchMilestone[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const showError = (msg: string) => setToast({ message: msg, type: 'error' })
  const showSuccess = (msg: string) => setToast({ message: msg, type: 'success' })

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    setSubmitting(true)

    const tempId = `temp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: ResearchMilestone = {
      id: tempId,
      userId,
      title: newTitle.trim(),
      dueDate: newDueDate || null,
      achieved: false,
      achievedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    setMilestones(prev => [...prev, optimistic])
    setNewTitle('')
    setNewDueDate('')
    setShowForm(false)

    const { data: saved, error } = await supabase
      .from('research_milestones')
      .insert({
        user_id: userId,
        title: optimistic.title,
        due_date: optimistic.dueDate,
      })
      .select()
      .single()

    if (error || !saved) {
      setMilestones(prev => prev.filter(m => m.id !== tempId))
      showError('マイルストーンの追加に失敗しました')
    } else {
      setMilestones(prev => prev.map(m => m.id === tempId ? mapRow(saved) : m))
    }
    setSubmitting(false)
  }

  const handleToggleAchieved = async (milestone: ResearchMilestone) => {
    const newAchieved = !milestone.achieved
    const achievedAt = newAchieved ? new Date().toISOString() : null
    setMilestones(prev =>
      prev.map(m => m.id === milestone.id ? { ...m, achieved: newAchieved, achievedAt } : m)
    )

    const { error } = await supabase
      .from('research_milestones')
      .update({ achieved: newAchieved, achieved_at: achievedAt })
      .eq('id', milestone.id)

    if (error) {
      setMilestones(prev =>
        prev.map(m => m.id === milestone.id ? { ...m, achieved: milestone.achieved, achievedAt: milestone.achievedAt } : m)
      )
      showError('更新に失敗しました')
    } else if (newAchieved) {
      showSuccess('達成しました！')
    }
  }

  const handleDelete = async (milestone: ResearchMilestone) => {
    if (!confirm(`「${milestone.title}」を削除しますか？`)) return
    setMilestones(prev => prev.filter(m => m.id !== milestone.id))

    const { error } = await supabase
      .from('research_milestones')
      .delete()
      .eq('id', milestone.id)

    if (error) {
      setMilestones(prev => [...prev, milestone].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ))
      showError('削除に失敗しました')
    }
  }

  const isOverdue = (m: ResearchMilestone) =>
    !m.achieved && !!m.dueDate && m.dueDate < today

  const sorted = [...milestones].sort((a, b) => {
    if (a.achieved !== b.achieved) return a.achieved ? 1 : -1
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="card-title text-ink text-sm font-bold uppercase tracking-wide text-muted">マイルストーン</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 px-3 py-1.5 bg-mc-blue text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 2v8M2 6h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          追加
        </button>
      </div>

      {showForm && (
        <div className="card p-4 space-y-3">
          <input
            type="text"
            placeholder="マイルストーンのタイトル"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            autoFocus
            className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-mc-blue"
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted whitespace-nowrap">期日</label>
            <input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              className="border border-line rounded px-2 py-1 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-mc-blue"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); setNewTitle(''); setNewDueDate('') }}
              className="px-3 py-1.5 text-xs text-muted border border-line rounded-lg hover:border-navy hover:text-navy transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim() || submitting}
              className="px-3 py-1.5 text-xs bg-mc-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              追加
            </button>
          </div>
        </div>
      )}

      <div className="card divide-y divide-line">
        {sorted.length === 0 ? (
          <div className="p-6 text-center text-muted text-sm">
            マイルストーンを追加してください
          </div>
        ) : (
          sorted.map(m => (
            <div
              key={m.id}
              className={`flex items-start gap-3 px-4 py-3 ${m.achieved ? 'opacity-60' : ''}`}
            >
              <input
                type="checkbox"
                checked={m.achieved}
                onChange={() => handleToggleAchieved(m)}
                aria-label={`${m.title}を達成済みにする`}
                className="mt-0.5 h-4 w-4 rounded border-line text-mc-green accent-mc-green cursor-pointer flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm text-ink leading-snug ${m.achieved ? 'line-through text-muted' : ''}`}>
                  {m.title}
                </p>
                {m.dueDate && (
                  <p className={`text-xs mt-0.5 ${isOverdue(m) ? 'text-mc-red font-medium' : 'text-muted'}`}>
                    {isOverdue(m) && '⚠ 期限切れ · '}
                    {m.dueDate}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(m)}
                aria-label={`${m.title}を削除`}
                className="flex-shrink-0 text-muted hover:text-mc-red transition-colors p-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 3.5h10M5.5 3.5V2.5h3V3.5M5 3.5v7.5h4V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
