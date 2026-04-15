import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin }        from '@/lib/supabase/admin'
import { decrypt }              from '@/lib/crypto'

// Next.js 14: params is a plain object (NOT a Promise)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const leadId = params.id
  const body   = await request.json()
  const text   = (body.message ?? '').trim()

  if (!text) return NextResponse.json({ error: 'Message required' }, { status: 422 })
  if (text.length > 2000) return NextResponse.json({ error: 'Too long' }, { status: 422 })

  // Get lead + integration
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('*, integration:integrations(id, access_token_enc, plataforma, external_account_id)')
    .eq('id', leadId)
    .eq('user_id', user.id)
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  // Save message to DB
  await supabaseAdmin.from('messages').insert({
    lead_id:      leadId,
    mensagem:     text,
    is_from_user: true,
  })

  // Update lead status
  await supabaseAdmin.from('leads').update({ status: 'respondido' }).eq('id', leadId)

  // Try to send via Meta Graph API
  if (lead.integration?.access_token_enc && lead.external_lead_id) {
    try {
      const token   = decrypt(lead.integration.access_token_enc)
      const igAccId = lead.integration.external_account_id

      if (lead.origem === 'dm') {
        await fetch(`https://graph.facebook.com/v21.0/${igAccId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient:     { id: lead.external_lead_id },
            message:       { text },
            messaging_type: 'RESPONSE',
            access_token:  token,
          }),
        })
      } else if (lead.origem === 'comentario') {
        await fetch(`https://graph.facebook.com/v21.0/${lead.external_lead_id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, access_token: token }),
        })
      }
    } catch (err) {
      console.error('Meta send error:', err)
      // Don't fail — message was saved locally
    }
  }

  return NextResponse.json({ success: true })
}
