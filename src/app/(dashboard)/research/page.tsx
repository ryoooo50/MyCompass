import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ResearchPhase, ResearchMilestone } from '@/types'
import { ResearchPage } from '@/components/features/research/ResearchPage'

const DEFAULT_PHASES = [
  { phase_key: 'literature_review', phase_name: '文献レビュー', sort_order: 0 },
  { phase_key: 'data_collection', phase_name: 'データ収集', sort_order: 1 },
  { phase_key: 'analysis', phase_name: '分析', sort_order: 2 },
  { phase_key: 'writing', phase_name: '論文執筆', sort_order: 3 },
]

function mapPhaseRow(row: Record<string, unknown>): ResearchPhase {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    phaseKey: row.phase_key as string,
    phaseName: row.phase_name as string,
    progress: row.progress as number,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapMilestoneRow(row: Record<string, unknown>): ResearchMilestone {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    dueDate: row.due_date as string | null,
    achieved: row.achieved as boolean,
    achievedAt: row.achieved_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export default async function ResearchServerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: phaseRows } = await supabase
    .from('research_phases')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  if (!phaseRows || phaseRows.length === 0) {
    await supabase.from('research_phases').upsert(
      DEFAULT_PHASES.map(p => ({
        user_id: user.id,
        phase_key: p.phase_key,
        phase_name: p.phase_name,
        progress: 0,
        sort_order: p.sort_order,
      })),
      { onConflict: 'user_id,phase_key' }
    )
    const { data: seeded } = await supabase
      .from('research_phases')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
    phaseRows = seeded
  }

  const phases: ResearchPhase[] = (phaseRows ?? []).map(mapPhaseRow)

  const { data: milestoneRows } = await supabase
    .from('research_milestones')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  const milestones: ResearchMilestone[] = (milestoneRows ?? []).map(mapMilestoneRow)

  const { data: settingsRow } = await supabase
    .from('user_settings')
    .select('obsidian_vault_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const obsidianVaultName = (settingsRow?.obsidian_vault_name as string | null | undefined) ?? null

  return (
    <ResearchPage
      phases={phases}
      milestones={milestones}
      userId={user.id}
      obsidianVaultName={obsidianVaultName}
    />
  )
}
