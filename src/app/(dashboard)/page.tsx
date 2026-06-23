import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <h1 className="page-heading text-navy">ホーム</h1>

      {/* メトリクスカード × 4 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="未完了タスク" value="—" unit="件" />
        <MetricCard label="今月支出" value="—" unit="円" />
        <MetricCard label="研究進捗" value="—" unit="%" />
        <MetricCard label="今月シフト" value="—" unit="時間" />
      </div>

      {/* 中段 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="card p-5 lg:col-span-5">
          <p className="card-title text-muted mb-4">今日やること</p>
          <p className="text-sm text-muted">データを読み込んでいます…</p>
        </div>
        <div className="card p-5 lg:col-span-7">
          <p className="card-title text-muted mb-4">研究プロジェクト</p>
          <p className="text-sm text-muted">データを読み込んでいます…</p>
        </div>
      </div>

      {/* 下段 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="card p-5 lg:col-span-5">
          <p className="card-title text-muted mb-4">バイト状況</p>
          <p className="text-sm text-muted">データを読み込んでいます…</p>
        </div>
        <div className="card p-5 lg:col-span-7">
          <p className="card-title text-muted mb-4">アプリランチャー</p>
          <p className="text-sm text-muted">データを読み込んでいます…</p>
        </div>
      </div>

      {/* 今週の予定 */}
      <div className="card p-5">
        <p className="card-title text-muted mb-4">今週の予定</p>
        <p className="text-sm text-muted">Google Calendar 連携後に表示されます</p>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit: string
}) {
  return (
    <div className="card p-4">
      <p className="label-eyebrow text-muted mb-2">{label}</p>
      <div className="flex items-end gap-1">
        <span className="metric-value text-navy">{value}</span>
        <span className="text-xs text-muted mb-1">{unit}</span>
      </div>
    </div>
  )
}
