import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// web-push の初期化（VAPID未設定時はPush送信をスキップ）
async function getWebPush() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidEmail = process.env.VAPID_EMAIL ?? 'ryoma.kojima.0319@gmail.com'

  if (!vapidPublicKey || !vapidPrivateKey) {
    return null
  }

  const webpush = (await import('web-push')).default
  webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey)
  return webpush
}

// POST: 通知を送信
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { userId: string; title: string; body?: string }
    const { userId, title, body: notifBody = '' } = body

    if (!userId || !title) {
      return NextResponse.json({ success: false, error: 'userId と title は必須です' }, { status: 400 })
    }

    const supabase = await createClient()

    // notifications テーブルに挿入
    const { error: insertError } = await supabase
      .from('notifications')
      .insert({ user_id: userId, title, body: notifBody })

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }

    // Push subscriptions を取得して送信
    const webpush = await getWebPush()
    if (webpush) {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId)

      if (subscriptions && subscriptions.length > 0) {
        const payload = JSON.stringify({ title, body: notifBody })
        await Promise.allSettled(
          subscriptions.map((sub) =>
            webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            )
          )
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// GET: 未読通知一覧
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
