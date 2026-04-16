<<<<<<< HEAD
import { createServerClient } from '@supabase/ssr'
=======
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
>>>>>>> 308e82d94aca695de387c8273b913fa0d39d99dc
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
<<<<<<< HEAD
        setAll(toSet: any[]) {
          toSet.forEach((cookie) => {
            request.cookies.set(cookie.name, cookie.value)
          })
          response = NextResponse.next({ request: { headers: request.headers } })
          toSet.forEach((cookie) => {
            response.cookies.set(cookie.name, cookie.value, cookie.options)
          })
=======
        setAll(toSet: Parameters<CookieMethodsServer['setAll']>[0]) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
>>>>>>> 308e82d94aca695de387c8273b913fa0d39d99dc
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const isPublic =
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/api/webhook') ||
    path.startsWith('/api/auth')

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (user && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/dashboard/leads', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
}
