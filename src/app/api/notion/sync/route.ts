import { Client } from '@notionhq/client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Priority } from '@/types'

interface SyncResult {
  added: number
  updated: number
}

function mapPriority(raw: string | null | undefined): Priority {
  const normalized = (raw ?? '').toLowerCase()
  if (normalized === 'high') return 'high'
  if (normalized === 'low') return 'low'
  return 'medium'
}

export async function POST(): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '認証が必要です' },
      { status: 401 }
    )
  }

  const notionToken = process.env.NOTION_INTEGRATION_TOKEN
  if (!notionToken) {
    return NextResponse.json(
      {
        code: 'NOTION_TOKEN_NOT_CONFIGURED',
        message:
          'Notion連携を設定するにはVercel環境変数にNOTION_INTEGRATION_TOKENを設定してください',
      },
      { status: 503 }
    )
  }

  const dataSourceId = process.env.NOTION_DATABASE_ID
  if (!dataSourceId) {
    return NextResponse.json(
      {
        code: 'NOTION_DATABASE_NOT_CONFIGURED',
        message:
          'Notion連携を設定するにはVercel環境変数にNOTION_DATABASE_IDを設定してください',
      },
      { status: 503 }
    )
  }

  const notion = new Client({ auth: notionToken })

  // @notionhq/client v5 では databases.query が廃止され dataSources.query に変更
  let pages: Awaited<ReturnType<typeof notion.dataSources.query>>['results']
  try {
    const response = await notion.dataSources.query({ data_source_id: dataSourceId })
    pages = response.results
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Notionデータベースの取得に失敗しました'
    return NextResponse.json(
      { code: 'NOTION_FETCH_FAILED', message },
      { status: 502 }
    )
  }

  const result: SyncResult = { added: 0, updated: 0 }

  for (const page of pages) {
    // page または data_source のみ処理する
    if (page.object !== 'page') continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = (page as any).properties as Record<string, unknown>

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const title: string = (props.Name as any)?.title?.[0]?.plain_text ?? 'Untitled'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const done: boolean = (props.Done as any)?.checkbox ?? false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const due: string | null = (props.Due as any)?.date?.start ?? null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const priorityRaw: string | null = (props.Priority as any)?.select?.name ?? null
    const priority = mapPriority(priorityRaw)

    // notion_id カラムがない場合、category に 'notion_<pageId>' 形式でも保存する
    const notionPageId = page.id.replace(/-/g, '')
    const category = `notion_${notionPageId}`

    // 既存レコードを notion_id または category で照合
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', user.id)
      .or(`notion_id.eq.${page.id},category.eq.${category}`)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('tasks')
        .update({
          title,
          priority,
          due_date: due,
          category,
          notion_id: page.id,
          completed_at: done ? new Date().toISOString() : null,
        })
        .eq('id', existing.id)
      if (!error) result.updated++
    } else {
      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title,
        description: null,
        priority,
        due_date: due,
        category,
        notion_id: page.id,
        completed: done,
        completed_at: done ? new Date().toISOString() : null,
      })
      if (!error) result.added++
    }
  }

  return NextResponse.json(result)
}
