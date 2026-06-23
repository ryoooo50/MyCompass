import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TaskList } from '@/components/features/tasks/TaskList'
import type { Task } from '@/types'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  const tasks: Task[] = (data ?? []).map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    dueDate: row.due_date,
    category: row.category,
    completed: row.completed,
    completedAt: row.completed_at,
    notionId: row.notion_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  return <TaskList initial={tasks} userId={user.id} />
}
