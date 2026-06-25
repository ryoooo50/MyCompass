import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getJstDateString(offsetDays: number): string {
  const jstOffset = 9 * 60 * 60 * 1000
  const date = new Date(Date.now() + jstOffset + offsetDays * 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 10)
}

async function getWebPush() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidEmail = process.env.VAPID_EMAIL ?? 'ryoma.kojima.0319@gmail.com'

  if (!vapidPublicKey || !vapidPrivateKey) return null

  const webpush = (await import('web-push')).default
  webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey)
  return webpush
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
  }

  const todayJst = getJstDateString(0)
  const tomorrowJst = getJstDateString(1)

  const supabase = await createClient()

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, user_id, title, due_date, notified_dates')
    .eq('completed', false)
    .in('due_date', [todayJst, tomorrowJst])

  if (tasksError) {
    return NextResponse.json({ success: false, error: tasksError.message }, { status: 500 })
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ success: true, notified: 0 })
  }

  const webpush = await getWebPush()
  let notifiedCount = 0

  for (const task of tasks) {
    const notifiedDates = (task.notified_dates as string[] | null) ?? []
    if (notifiedDates.includes(todayJst)) continue

    const isToday = task.due_date === todayJst
    const notifTitle = isToday
      ? `「${task.title}」の期限は今日です`
      : `「${task.title}」の期限は明日です`

    const { error: insertError } = await supabase
      .from('notifications')
      .insert({ user_id: task.user_id, title: notifTitle, body: '' })

    if (insertError) continue

    if (webpush) {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', task.user_id)

      if (subscriptions && subscriptions.length > 0) {
        const payload = JSON.stringify({ title: notifTitle, body: '' })
        await Promise.allSettled(
          subscriptions.map(sub =>
            webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            )
          )
        )
      }
    }

    await supabase
      .from('tasks')
      .update({ notified_dates: [...notifiedDates, todayJst] })
      .eq('id', task.id)

    notifiedCount++
  }

  return NextResponse.json({ success: true, notified: notifiedCount })
}
