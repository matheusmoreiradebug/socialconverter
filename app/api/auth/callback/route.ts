<<<<<<< HEAD
import { createServerClient } from '@supabase/ssr'
=======
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
>>>>>>> 308e82d94aca695de387c8273b913fa0d39d99dc
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
<<<<<<< HEAD

=======
>>>>>>> 308e82d94aca695de387c8273b913fa0d39d99dc
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
<<<<<<< HEAD
          setAll(toSet: any[]) {
            toSet.forEach((cookie) => {
              cookieStore.set(cookie.name, cookie.value, cookie.options)
            })
=======
          setAll(toSet: Parameters<CookieMethodsServer['setAll']>[0]) {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
>>>>>>> 308e82d94aca695de387c8273b913fa0d39d99dc
          },
        },
      }
    )
<<<<<<< HEAD

=======
>>>>>>> 308e82d94aca695de387c8273b913fa0d39d99dc
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/dashboard/leads`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
