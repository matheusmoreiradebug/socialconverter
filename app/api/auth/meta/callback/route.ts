import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin }        from '@/lib/supabase/admin'
import { encrypt }              from '@/lib/crypto'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const base  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (error) return NextResponse.redirect(`${base}/dashboard/integrations?error=denied`)
  if (!code || !state) return NextResponse.redirect(`${base}/dashboard/integrations?error=invalid`)

  try {
    const { userId } = JSON.parse(Buffer.from(state, 'base64url').toString())

    // Exchange code for short-lived token
    const tokenParams = new URLSearchParams({
      client_id:     process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      redirect_uri:  process.env.META_REDIRECT_URI!,
      code,
    })
    const tokenRes = await fetch(`https://graph.facebook.com/oauth/access_token?${tokenParams}`)
    if (!tokenRes.ok) throw new Error('token_exchange_failed')
    const { access_token: shortToken } = await tokenRes.json()

    // Exchange for long-lived token (60 days)
    const longParams = new URLSearchParams({
      grant_type:        'fb_exchange_token',
      client_id:         process.env.META_APP_ID!,
      client_secret:     process.env.META_APP_SECRET!,
      fb_exchange_token: shortToken,
    })
    const longRes = await fetch(`https://graph.facebook.com/oauth/access_token?${longParams}`)
    if (!longRes.ok) throw new Error('long_token_failed')
    const { access_token: longToken } = await longRes.json()

    // Get managed pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longToken}`
    )
    const { data: pages } = await pagesRes.json()
    const webhookSecret = process.env.META_WEBHOOK_VERIFY_TOKEN ?? 'default'

    for (const page of (pages ?? [])) {
      const pageTokenEnc = encrypt(page.access_token)

      await supabaseAdmin.from('integrations').upsert({
        user_id:             userId,
        plataforma:          'facebook',
        external_account_id: page.id,
        nome_conta:          page.name,
        access_token_enc:    pageTokenEnc,
        webhook_secret:      webhookSecret,
        is_active:           true,
      }, { onConflict: 'user_id,plataforma,external_account_id' })

      if (page.instagram_business_account?.id) {
        await supabaseAdmin.from('integrations').upsert({
          user_id:             userId,
          plataforma:          'instagram',
          external_account_id: page.instagram_business_account.id,
          nome_conta:          `${page.name} (Instagram)`,
          access_token_enc:    pageTokenEnc,
          webhook_secret:      webhookSecret,
          is_active:           true,
        }, { onConflict: 'user_id,plataforma,external_account_id' })
      }
    }

    return NextResponse.redirect(`${base}/dashboard/integrations?success=true`)
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(`${base}/dashboard/integrations?error=server`)
  }
}
