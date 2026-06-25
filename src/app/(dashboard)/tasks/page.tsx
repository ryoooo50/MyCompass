import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TaskList } from '@/components/features/tasks/TaskList'
import type { Task } from '@/types'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: taskRows }, { data: settings }] = await Promise.all([
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('user_settings').select('task_categories').eq('user_id', user.id).single(),
  ])

  const tasks: Task[] = (taskRows ?? []).map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    dueDate: row.due_date,
    categories: (row.categories as string[] | null) ?? [],
    completed: row.completed,
    completedAt: row.completed_at,
    notionId: row.notion_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  const initialCategories: string[] = (settings?.task_categories as string[] | null) ?? []

  return <TaskList initial={tasks} userId={user.id} initialCategories={initialCategories} />
}
