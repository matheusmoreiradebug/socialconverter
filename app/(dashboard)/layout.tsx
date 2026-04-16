import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/ui/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-[#070709] overflow-hidden">
      <DashboardSidebar userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
