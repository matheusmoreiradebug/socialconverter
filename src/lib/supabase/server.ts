<<<<<<< HEAD
import { createServerClient } from '@supabase/ssr'
=======
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
>>>>>>> 308e82d94aca695de387c8273b913fa0d39d99dc
import { cookies } from 'next/headers'

export function createServerSupabase() {
  const cookieStore = cookies()
<<<<<<< HEAD

=======
>>>>>>> 308e82d94aca695de387c8273b913fa0d39d99dc
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
<<<<<<< HEAD
        setAll(toSet: any[]) {
          try {
            toSet.forEach((cookie) => {
              cookieStore.set(cookie.name, cookie.value, cookie.options)
            })
          } catch {
            // Called from Server Component — safe to ignore
=======
        setAll(toSet: Parameters<CookieMethodsServer['setAll']>[0]) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — ignorar erro de set
>>>>>>> 308e82d94aca695de387c8273b913fa0d39d99dc
          }
        },
      },
    }
  )
}
