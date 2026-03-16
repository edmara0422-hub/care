import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:care@app.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MESSAGES = {
  manha: { title: 'Bom dia! Como você está? ☀️', body: 'Hora do seu check-in matinal no CARE.' },
  tarde: { title: 'Boa tarde! Tudo bem por aí? 🌤', body: 'Faça seu check-in da tarde no CARE.' },
  noite: { title: 'Boa noite! Como foi seu dia? 🌙', body: 'Registre como você está antes de dormir.' },
} as const

type Period = keyof typeof MESSAGES

export async function GET(req: NextRequest) {
  // Vercel injeta Authorization: Bearer CRON_SECRET automaticamente
  // Em dev, CRON_SECRET pode estar vazio — permite chamada direta
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const raw = req.nextUrl.searchParams.get('period') ?? 'manha'
  const period: Period = raw in MESSAGES ? (raw as Period) : 'manha'

  // Busca todas as subscrições ativas
  const { data: subs, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('user_id, subscription')

  if (subsErr || !subs?.length) {
    return NextResponse.json({ sent: 0, period })
  }

  const userIds = subs.map(s => s.user_id as string)

  // Data de hoje no fuso Brasil
  const now = new Date()
  const brDate = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) // DD/MM/YYYY
  const [d, m, y] = brDate.split('/')
  const todayISO = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  const todayStart = new Date(`${todayISO}T00:00:00-03:00`).getTime()
  const todayEnd   = new Date(`${todayISO}T23:59:59-03:00`).getTime()

  // Quais usuários já fizeram check-in hoje?
  const { data: todayCI } = await supabase
    .from('check_ins')
    .select('user_id')
    .in('user_id', userIds)
    .gte('timestamp', todayStart)
    .lte('timestamp', todayEnd)

  const checkedIn = new Set((todayCI ?? []).map(r => r.user_id as string))

  // Preferências de horário e notificações de cada usuário
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, check_in_schedule, notifications_enabled')
    .in('id', userIds)

  const profileMap = new Map(
    (profiles ?? []).map(p => [p.id as string, p])
  )

  const msg = MESSAGES[period]
  const payload = JSON.stringify({ title: msg.title, body: msg.body, url: '/checkin' })

  let sent = 0

  for (const sub of subs) {
    const userId = sub.user_id as string
    const profile = profileMap.get(userId)

    // Pula se notificações desativadas
    if (profile?.notifications_enabled === false) continue

    // Pula se esse horário não está no schedule do usuário
    const schedule: string[] = profile?.check_in_schedule ?? ['manha', 'tarde', 'noite']
    if (!schedule.includes(period)) continue

    // Pula se já fez check-in hoje
    if (checkedIn.has(userId)) continue

    try {
      await webpush.sendNotification(sub.subscription, payload)
      sent++
    } catch (err: unknown) {
      // Subscription expirada — remove
      if (
        err &&
        typeof err === 'object' &&
        'statusCode' in err &&
        (err as { statusCode: number }).statusCode === 410
      ) {
        await supabase.from('push_subscriptions').delete().eq('user_id', userId)
      }
    }
  }

  return NextResponse.json({ sent, period, date: todayISO })
}
