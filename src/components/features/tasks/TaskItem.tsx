import type { Task } from '@/types'

const PRIORITY_LABEL = { high: '高', medium: '中', low: '低' } as const
const PRIORITY_COLOR = {
  high: 'text-mc-red bg-red-50 border-mc-red/20',
  medium: 'text-accent bg-orange-50 border-accent/20',
  low: 'text-muted bg-gray-50 border-line',
} as const

interface TaskItemProps {
  task: Task
  today: string
  onToggle: (task: Task) => void
  onEdit: () => void
  onDelete: (task: Task) => void
}

export function TaskItem({ task, today, onToggle, onEdit, onDelete }: TaskItemProps) {
  const isOverdue = !task.completed && !!task.dueDate && task.dueDate < today

  return (
    <div className={`flex items-start gap-3 p-4 group transition-opacity ${task.completed ? 'opacity-50' : ''}`}>
      {/* チェックボックス */}
      <button
        onClick={() => onToggle(task)}
        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          task.completed
            ? 'bg-mc-green border-mc-green'
            : 'border-line hover:border-mc-green'
        }`}
        aria-label={task.completed ? '未完了に戻す' : '完了にする'}
      >
        {task.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* タスク内容 */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted' : 'text-ink'}`}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <span className={`label-eyebrow px-1.5 py-0.5 rounded border ${PRIORITY_COLOR[task.priority]}`}>
            {PRIORITY_LABEL[task.priority]}
          </span>
          {task.dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-mc-red font-semibold' : 'text-muted'}`}>
              {isOverdue ? '⚠ 期限切れ · ' : ''}{task.dueDate}
            </span>
          )}
          {task.categories.map(cat => (
            <span key={cat} className="text-xs text-muted bg-bg px-2 py-0.5 rounded-full border border-line">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* 操作ボタン（hover で表示） */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded hover:bg-bg text-muted hover:text-ink transition-colors"
          aria-label="編集"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M10 2L12 4L5 11H3V9L10 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(task)}
          className="p-1.5 rounded hover:bg-red-50 text-muted hover:text-mc-red transition-colors"
          aria-label="削除"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 4h10M5 4V2h4v2M6 7v4M8 7v4M3 4l1 8h6l1-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
