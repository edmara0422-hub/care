import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:care@app.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? 'BG8PY7g7YJX1Ca_S7PINbzdyjLLIsrsICI191zbsfWogJMsHDQD-NIt7QV7jIt-LeFbyPnrlZwvp7OZPJN2odrk',
  process.env.VAPID_PRIVATE_KEY ?? '2U1Pg--RttU0QWQzds7h774FN600Ukm4sDW8w6_YCe0'
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, url } = await req.json()

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)

    if (!subs?.length) return NextResponse.json({ sent: 0 })

    const payload = JSON.stringify({ title, body, url: url ?? '/checkin' })
    let sent = 0

    for (const row of subs) {
      try {
        await webpush.sendNotification(row.subscription, payload)
        sent++
      } catch (err: unknown) {
        // Subscription expirada — remove
        if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('user_id', userId)
        }
      }
    }

    return NextResponse.json({ sent })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
