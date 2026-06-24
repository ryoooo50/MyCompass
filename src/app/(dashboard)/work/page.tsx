import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkList } from '@/components/features/work/WorkList'
import type { WorkShift } from '@/types'

export default async function WorkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

  const { data } = await supabase
    .from('work_shifts')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', firstDay)
    .lte('date', lastDay)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  const shifts: WorkShift[] = (data ?? []).map(row => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    hourlyRate: row.hourly_rate,
    transportFee: row.transport_fee,
    confirmed: row.confirmed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  return (
    <WorkList
      initial={shifts}
      userId={user.id}
      initialYear={year}
      initialMonth={month}
    />
  )
}
