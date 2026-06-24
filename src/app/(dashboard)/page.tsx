import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ScheduleWidget } from '@/components/features/schedule/ScheduleWidget'
import { TodayTasksWidget } from '@/components/features/home/TodayTasksWidget'
import type { Task } from '@/types'

// 分単位のシフト時間を計算
function shiftMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 現在月・今日の日付を計算
  const now = new Date()
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  // JSTを考慮: UTC+9
  const jstOffset = 9 * 60 * 60 * 1000
  const todayJst = new Date(now.getTime() + jstOffset).toISOString().slice(0, 10)

  // 並列データ取得
  const [
    tasksCountResult,
    financeResult,
    researchResult,
    shiftsResult,
    todayTasksResult,
    reportResult,
    budgetResult,
  ] = await Promise.all([
    // 1. 未完了タスク数
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', false),

    // 2. 今月支出合計
    supabase
      .from('finance_records')
      .select('amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .like('date', `${yearMonth}-%`),

    // 3. 研究進捗平均
    supabase
      .from('research_phases')
      .select('progress')
      .eq('user_id', user.id),

    // 4. 今月確定シフト
    supabase
      .from('work_shifts')
      .select('start_time, end_time')
      .eq('user_id', user.id)
      .eq('confirmed', true)
      .like('date', `${yearMonth}-%`),

    // 5. 今日のタスク（最大6件）
    supabase
      .from('tasks')
      .select('id, user_id, title, priority, due_date, category, completed, completed_at, created_at, updated_at, description, notion_id')
      .eq('user_id', user.id)
      .eq('completed', false)
      .or(`due_date.eq.${todayJst},priority.eq.high`)
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(6),

    // 6. 今日の日報有無
    supabase
      .from('daily_reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('report_date', todayJst),

    // 7. 今月の予算
    supabase
      .from('monthly_budgets')
      .select('budget_amount')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth)
      .maybeSingle(),
  ])

  // 指標値の計算
  const incompleteTaskCount = tasksCountResult.count ?? 0

  const totalExpense = (financeResult.data ?? []).reduce(
    (sum, r) => sum + (r.amount as number),
    0
  )

  const phases = researchResult.data ?? []
  const avgProgress =
    phases.length > 0
      ? Math.round(phases.reduce((s, p) => s + (p.progress as number), 0) / phases.length)
      : 0

  const shifts = shiftsResult.data ?? []
  const totalShiftMinutes = shifts.reduce(
    (sum, s) => sum + shiftMinutes(s.start_time as string, s.end_time as string),
    0
  )
  const totalShiftHours = (totalShiftMinutes / 60).toFixed(1)

  const hasReportToday = (reportResult.count ?? 0) > 0

  const budgetAmount = (budgetResult.data as { budget_amount?: number } | null)?.budget_amount ?? null
  const isOverBudget = budgetAmount !== null && totalExpense > budgetAmount

  // 今日のタスク: DB行 → Task型へマッピング
  const todayTasks: Task[] = (todayTasksResult.data ?? []).map(row => ({
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
  }))

  return (
    <div className="space-y-6">
      <h1 className="page-heading text-navy">ホーム</h1>

      {/* メトリクスカード × 4 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="未完了タスク"
          value={String(incompleteTaskCount)}
          unit="件"
          href="/tasks"
        />
        <MetricCard
          label="今月支出"
          value={totalExpense.toLocaleString('ja-JP')}
          unit="円"
          href="/finance"
          warn={isOverBudget}
        />
        <MetricCard
          label="研究進捗"
          value={String(avgProgress)}
          unit="%"
          href="/research"
        />
        <MetricCard
          label="今月シフト"
          value={totalShiftHours}
          unit="時間"
          href="/work"
        />
      </div>

      {/* 日報未記入バナー */}
      {!hasReportToday && (
        <Link
          href="/reports"
          className="flex items-center gap-3 px-4 py-3 rounded-card border border-accent/40 bg-accent/5 hover:bg-accent/10 transition-colors text-sm text-ink"
        >
          <span className="text-base">📝</span>
          <span>今日の日報がまだ記入されていません</span>
          <span className="ml-auto text-accent font-semibold text-xs">記入する →</span>
        </Link>
      )}

      {/* 中段: 今日やること + 研究プロジェクト */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="card p-5 lg:col-span-5">
          <TodayTasksWidget initial={todayTasks} />
        </div>
        <div className="card p-5 lg:col-span-7">
          <p className="label-eyebrow text-muted mb-4">研究プロジェクト</p>
          <Link
            href="/research"
            className="flex items-center justify-center py-6 text-sm text-muted hover:text-navy transition-colors"
          >
            研究ページで確認する →
          </Link>
        </div>
      </div>

      {/* 下段: バイト状況 + アプリランチャー */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="card p-5 lg:col-span-5">
          <p className="label-eyebrow text-muted mb-4">バイト状況</p>
          <Link
            href="/work"
            className="flex items-center justify-center py-6 text-sm text-muted hover:text-navy transition-colors"
          >
            シフト管理ページで確認する →
          </Link>
        </div>
        <div className="card p-5 lg:col-span-7">
          <p className="label-eyebrow text-muted mb-4">アプリランチャー</p>
          <Link
            href="/apps"
            className="flex items-center justify-center py-6 text-sm text-muted hover:text-navy transition-colors"
          >
            アプリ一覧を見る →
          </Link>
        </div>
      </div>

      {/* 今週の予定 */}
      <div className="card p-5">
        <p className="card-title text-muted mb-4">今週の予定</p>
        <ScheduleWidget days={7} compact />
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  unit: string
  href: string
  warn?: boolean
}

function MetricCard({ label, value, unit, href, warn = false }: MetricCardProps) {
  return (
    <Link href={href} className="card p-4 block hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <p className="label-eyebrow text-muted">{label}</p>
        {warn && (
          <span className="text-xs font-bold text-mc-red bg-red-50 border border-mc-red/20 rounded px-1 py-0.5">
            ⚠
          </span>
        )}
      </div>
      <div className="flex items-end gap-1">
        <span className="metric-value text-navy">{value}</span>
        <span className="text-xs text-muted mb-1">{unit}</span>
      </div>
    </Link>
  )
}
