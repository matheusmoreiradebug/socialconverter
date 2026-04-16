import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabase() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(toSet: any[]) {
          try {
            toSet.forEach((cookie) => {
              cookieStore.set(cookie.name, cookie.value, cookie.options)
            })
          } catch {
            // Called from Server Component — safe to ignore
          }
        },
      },
    }
  )
}
