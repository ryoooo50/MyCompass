import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppLauncher } from '@/components/features/apps/AppLauncher'
import type { UserSettings } from '@/types'

export default async function AppsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const settings: UserSettings | null = data
    ? {
        id: data.id as string,
        userId: data.user_id as string,
        obsidianVaultName: data.obsidian_vault_name as string | null,
        notionHomeUrl: data.notion_home_url as string | null,
        customApps: (data.custom_apps ?? []) as UserSettings['customApps'],
        calendarIds: (data.calendar_ids ?? []) as string[],
        taskCategories: (data.task_categories ?? []) as string[],
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
      }
    : null

  return <AppLauncher initialSettings={settings} userId={user.id} />
}
