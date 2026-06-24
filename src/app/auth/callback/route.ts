import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    // provider_token はここでしか取れないため DB に保存する
    if (session?.provider_token && session.user) {
      await supabase.from('user_settings').upsert(
        {
          user_id: session.user.id,
          google_provider_token: session.provider_token,
          google_provider_refresh_token: session.provider_refresh_token ?? null,
          google_token_updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
