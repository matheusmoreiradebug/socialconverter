import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

const SCOPES = [
  'pages_manage_metadata',
  'pages_read_engagement',
  'pages_manage_engagement',
  'pages_messaging',
  'instagram_basic',
  'instagram_manage_messages',
  'instagram_manage_comments',
].join(',')

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const state  = Buffer.from(JSON.stringify({ userId: user.id, nonce: Date.now() })).toString('base64url')
  const params = new URLSearchParams({
    client_id:     process.env.META_APP_ID!,
    redirect_uri:  process.env.META_REDIRECT_URI!,
    scope:         SCOPES,
    response_type: 'code',
    state,
  })

  return NextResponse.redirect(`https://www.facebook.com/dialog/oauth?${params}`)
}
