import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { DailyReport } from '@/types'
import { ReportsView } from '@/components/features/reports/ReportsView'

function getTodayDateJST(): string {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })
  )
    .toISOString()
    .slice(0, 10)
}

function mapRow(row: Record<string, unknown>): DailyReport {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    reportDate: row.report_date as string,
    doneToday: row.done_today as string | null,
    insights: row.insights as string | null,
    tomorrowPlan: row.tomorrow_plan as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayDate = getTodayDateJST()

  const { data: allRows } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('report_date', { ascending: false })
    .limit(30)

  const allReports: DailyReport[] = (allRows ?? []).map(mapRow)

  const todayReport = allReports.find((r) => r.reportDate === todayDate) ?? null
  const pastReports = allReports.filter((r) => r.reportDate !== todayDate)

  return (
    <ReportsView
      todayDate={todayDate}
      todayReport={todayReport}
      pastReports={pastReports}
      userId={user.id}
    />
  )
}
