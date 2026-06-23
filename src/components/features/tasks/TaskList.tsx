'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { Task } from '@/types'
import { TaskForm } from './TaskForm'
import { TaskItem } from './TaskItem'
import { Toast } from '@/components/ui/Toast'

type FilterStatus = 'all' | 'active' | 'completed'
type FilterPriority = 'all' | 'high' | 'medium' | 'low'

interface TaskFormData {
  title: string
  priority: 'high' | 'medium' | 'low'
  dueDate: string | null
  category: string | null
}

interface TaskListProps {
  initial: Task[]
  userId: string
}

function mapRow(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    description: row.description as string | null,
    priority: row.priority as Task['priority'],
    dueDate: row.due_date as string | null,
    category: row.category as string | null,
    completed: row.completed as boolean,
    completedAt: row.completed_at as string | null,
    notionId: row.notion_id as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

const STATUS_LABELS: Record<FilterStatus, string> = { all: 'すべて', active: '未完了', completed: '完了済み' }
const PRIORITY_LABELS: Record<FilterPriority, string> = { all: '全優先度', high: '高', medium: '中', low: '低' }

export function TaskList({ initial, userId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()
  const showError = (msg: string) => setToast({ message: msg, type: 'error' })

  const handleAdd = async (data: TaskFormData) => {
    setSubmitting(true)
    const tempId = `temp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: Task = {
      id: tempId,
      userId,
      title: data.title,
      description: null,
      priority: data.priority,
      dueDate: data.dueDate,
      category: data.category,
      completed: false,
      completedAt: null,
      notionId: null,
      createdAt: now,
      updatedAt: now,
    }
    setTasks(prev => [optimistic, ...prev])
    setShowForm(false)

    const { data: saved, error } = await supabase
      .from('tasks')
      .insert({ user_id: userId, title: data.title, priority: data.priority, due_date: data.dueDate, category: data.category })
      .select()
      .single()

    if (error || !saved) {
      setTasks(prev => prev.filter(t => t.id !== tempId))
      showError('タスクの保存に失敗しました')
    } else {
      setTasks(prev => prev.map(t => t.id === tempId ? mapRow(saved) : t))
    }
    setSubmitting(false)
  }

  const handleToggle = async (task: Task) => {
    const newCompleted = !task.completed
    const completedAt = newCompleted ? new Date().toISOString() : null
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newCompleted, completedAt } : t))

    const { error } = await supabase
      .from('tasks')
      .update({ completed: newCompleted, completed_at: completedAt })
      .eq('id', task.id)

    if (error) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed, completedAt: task.completedAt } : t))
      showError('更新に失敗しました')
    }
  }

  const handleEdit = async (id: string, data: TaskFormData) => {
    setSubmitting(true)
    const prev = tasks.find(t => t.id === id)!
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t))
    setEditingId(null)

    const { error } = await supabase
      .from('tasks')
      .update({ title: data.title, priority: data.priority, due_date: data.dueDate, category: data.category })
      .eq('id', id)

    if (error) {
      setTasks(tasks => tasks.map(t => t.id === id ? prev : t))
      showError('更新に失敗しました')
    }
    setSubmitting(false)
  }

  const handleDelete = async (task: Task) => {
    if (!confirm(`「${task.title}」を削除しますか？`)) return
    setTasks(prev => prev.filter(t => t.id !== task.id))

    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    if (error) {
      setTasks(prev => [...prev, task].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      showError('削除に失敗しました')
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const filtered = tasks
    .filter(t => filterStatus === 'all' || (filterStatus === 'active' ? !t.completed : t.completed))
    .filter(t => filterPriority === 'all' || t.priority === filterPriority)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      const aOver = !a.completed && !!a.dueDate && a.dueDate < today
      const bOver = !b.completed && !!b.dueDate && b.dueDate < today
      if (aOver !== bOver) return aOver ? -1 : 1
      const order = { high: 0, medium: 1, low: 2 }
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return order[a.priority] - order[b.priority]
    })

  const activeCount = tasks.filter(t => !t.completed).length

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-heading text-navy">タスク管理</h1>
          <p className="text-sm text-muted mt-1">{activeCount} 件未完了</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-mc-blue text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          タスクを追加
        </button>
      </div>

      {/* 追加フォーム */}
      {showForm && (
        <div className="card p-4">
          <TaskForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} loading={submitting} />
        </div>
      )}

      {/* フィルター */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(STATUS_LABELS) as FilterStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              filterStatus === s ? 'bg-navy text-white border-navy' : 'border-line text-muted hover:border-navy hover:text-navy'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
        <div className="w-px bg-line mx-1" />
        {(Object.keys(PRIORITY_LABELS) as FilterPriority[]).map(p => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              filterPriority === p ? 'bg-navy text-white border-navy' : 'border-line text-muted hover:border-navy hover:text-navy'
            }`}
          >
            {PRIORITY_LABELS[p]}
          </button>
        ))}
      </div>

      {/* タスク一覧 */}
      <div className="card divide-y divide-line">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">
            {filterStatus === 'all' && filterPriority === 'all'
              ? '「タスクを追加」からタスクを作成してください'
              : 'この条件に一致するタスクがありません'}
          </div>
        ) : (
          filtered.map(task =>
            editingId === task.id ? (
              <div key={task.id} className="p-4">
                <TaskForm
                  initial={task}
                  onSubmit={data => handleEdit(task.id, data)}
                  onCancel={() => setEditingId(null)}
                  loading={submitting}
                />
              </div>
            ) : (
              <TaskItem
                key={task.id}
                task={task}
                today={today}
                onToggle={handleToggle}
                onEdit={() => { setEditingId(task.id); setShowForm(false) }}
                onDelete={handleDelete}
              />
            )
          )
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
