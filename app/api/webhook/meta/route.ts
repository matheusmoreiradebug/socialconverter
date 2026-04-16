import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyHmac }   from '@/lib/crypto'
import { rateLimit }    from '@/lib/ratelimit'

// GET — webhook verification
export async function GET(request: NextRequest) {
  const sp        = request.nextUrl.searchParams
  const mode      = sp.get('hub.mode')
  const token     = sp.get('hub.verify_token')
  const challenge = sp.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — receive events
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (!rateLimit(ip, 300, 60_000)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const rawBody  = await request.text()
  const sigHeader = request.headers.get('x-hub-signature-256') ?? ''

  if (!verifyHmac(rawBody, sigHeader, process.env.META_APP_SECRET ?? '')) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Respond immediately — process async
  processWebhook(rawBody).catch(console.error)
  return NextResponse.json({ received: true })
}

async function processWebhook(rawBody: string) {
  const payload = JSON.parse(rawBody)
  if (!payload?.entry) return

  for (const entry of payload.entry) {
    const pageId = entry.id

    // Find integration for this page
    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('id, user_id, plataforma')
      .eq('external_account_id', pageId)
      .eq('is_active', true)
      .single()

    if (!integration) continue

    // Handle comments
    if (entry.changes) {
      for (const change of entry.changes) {
        if (!['comments', 'feed'].includes(change.field)) continue
        const v = change.value
        if (v?.verb !== 'add' || !v?.message) continue

        await supabaseAdmin.from('leads').insert({
          user_id:        integration.user_id,
          integration_id: integration.id,
          nome:           v.from?.name ?? null,
          username:       null,
          mensagem:       v.message,
          origem:         'comentario',
          status:         'novo',
          plataforma:     integration.plataforma,
          external_lead_id: v.comment_id ?? null,
        }).select().single()
      }
    }

    // Handle DMs
    if (entry.messaging) {
      for (const msg of entry.messaging) {
        if (!msg.message?.text || msg.message?.is_echo) continue

        await supabaseAdmin.from('leads').insert({
          user_id:        integration.user_id,
          integration_id: integration.id,
          nome:           null,
          username:       null,
          mensagem:       msg.message.text,
          origem:         'dm',
          status:         'novo',
          plataforma:     integration.plataforma,
          external_lead_id: msg.sender?.id ?? null,
        })
      }
    }
  }
}
