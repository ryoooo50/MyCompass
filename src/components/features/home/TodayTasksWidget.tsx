'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser'
import type { Task } from '@/types'

const PRIORITY_COLOR = {
  high: 'text-mc-red bg-red-50 border-mc-red/20',
  medium: 'text-accent bg-orange-50 border-accent/20',
  low: 'text-muted bg-gray-50 border-line',
} as const

interface TodayTasksWidgetProps {
  initial: Task[]
}

export function TodayTasksWidget({ initial }: TodayTasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>(initial)
  const supabase = createClient()

  const handleToggle = async (task: Task) => {
    const newCompleted = !task.completed
    const completedAt = newCompleted ? new Date().toISOString() : null

    // 楽観的更新
    setTasks(prev =>
      prev.map(t =>
        t.id === task.id ? { ...t, completed: newCompleted, completedAt } : t
      )
    )

    const { error } = await supabase
      .from('tasks')
      .update({ completed: newCompleted, completed_at: completedAt })
      .eq('id', task.id)

    if (error) {
      // ロールバック
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id
            ? { ...t, completed: task.completed, completedAt: task.completedAt }
            : t
        )
      )
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <p className="label-eyebrow text-muted mb-4">今日やること</p>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted">今日やることはありません</p>
        </div>
        <div className="mt-4 pt-3 border-t border-line">
          <Link
            href="/tasks"
            className="text-xs text-muted hover:text-navy transition-colors flex items-center gap-1"
          >
            全てのタスクを見る
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M4.5 2.5L7.5 6l-3 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <p className="label-eyebrow text-muted mb-4">今日やること</p>
      <ul className="flex-1 divide-y divide-line -mx-5">
        {tasks.map(task => (
          <li key={task.id} className="flex items-center gap-3 px-5 py-3">
            {/* チェックボックス */}
            <button
              onClick={() => handleToggle(task)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                task.completed
                  ? 'bg-mc-green border-mc-green'
                  : 'border-line hover:border-mc-green'
              }`}
              aria-label={task.completed ? '未完了に戻す' : '完了にする'}
            >
              {task.completed && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
                  <path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* タスクタイトル */}
            <span
              className={`flex-1 text-sm min-w-0 truncate transition-colors ${
                task.completed ? 'line-through text-muted' : 'text-ink'
              }`}
            >
              {task.title}
            </span>

            {/* 優先度バッジ（高のみ表示） */}
            {task.priority === 'high' && !task.completed && (
              <span className={`label-eyebrow px-1.5 py-0.5 rounded border shrink-0 ${PRIORITY_COLOR.high}`}>
                高
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4 pt-3 border-t border-line">
        <Link
          href="/tasks"
          className="text-xs text-muted hover:text-navy transition-colors flex items-center gap-1"
        >
          全てのタスクを見る
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M4.5 2.5L7.5 6l-3 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
