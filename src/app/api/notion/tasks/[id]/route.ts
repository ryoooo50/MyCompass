import { Client } from '@notionhq/client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface PatchBody {
  done: boolean
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

  const { id: notionPageId } = await params

  let body: PatchBody
  try {
    body = (await request.json()) as PatchBody
  } catch {
    return NextResponse.json(
      { code: 'INVALID_BODY', message: 'リクエストボディが不正です' },
      { status: 400 }
    )
  }

  const { done } = body

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

  // Notionページの Done プロパティを更新
  const notion = new Client({ auth: notionToken })
  try {
    await notion.pages.update({
      page_id: notionPageId,
      properties: {
        Done: { checkbox: done },
      },
    })
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Notionページの更新に失敗しました'
    return NextResponse.json(
      { code: 'NOTION_UPDATE_FAILED', message },
      { status: 502 }
    )
  }

  // Supabase の tasks テーブルも更新
  const { error: dbError } = await supabase
    .from('tasks')
    .update({
      completed: done,
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq('user_id', user.id)
    .eq('notion_id', notionPageId)

  if (dbError) {
    return NextResponse.json(
      { code: 'DB_UPDATE_FAILED', message: 'ローカルタスクの更新に失敗しました' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
