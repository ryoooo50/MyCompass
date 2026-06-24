import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FinanceList } from '@/components/features/finance/FinanceList'
import type { FinanceRecord, MonthlyBudget } from '@/types'

function mapRecord(row: Record<string, unknown>): FinanceRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    amount: row.amount as number,
    type: row.type as 'income' | 'expense',
    category: row.category as string,
    date: row.date as string,
    memo: row.memo as string | null,
    createdAt: row.created_at as string,
  }
}

function mapBudget(row: Record<string, unknown>): MonthlyBudget {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    yearMonth: row.year_month as string,
    budgetAmount: row.budget_amount as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`
  const firstDay = `${yearMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const lastDayStr = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

  const [recordsResult, budgetResult] = await Promise.all([
    supabase
      .from('finance_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', firstDay)
      .lte('date', lastDayStr)
      .order('date', { ascending: false }),
    supabase
      .from('monthly_budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth)
      .maybeSingle(),
  ])

  const records = (recordsResult.data ?? []).map(r => mapRecord(r as Record<string, unknown>))
  const budget = budgetResult.data ? mapBudget(budgetResult.data as Record<string, unknown>) : null

  return (
    <FinanceList
      initial={records}
      initialBudget={budget}
      userId={user.id}
    />
  )
}
