'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  {
    href: '/dashboard/leads',
    label: 'Inbox',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/integrations',
    label: 'Integrações',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

interface Props { userEmail: string }

export function DashboardSidebar({ userEmail }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const initials = userEmail.slice(0, 2).toUpperCase()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-14 flex flex-col items-center py-4 gap-1 bg-[#0a0a0e] border-r border-white/[0.06] flex-shrink-0">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B2FF7] to-[#9F5AFD] flex items-center justify-center mb-4 shadow-lg shadow-purple-900/40 flex-shrink-0">
        <svg width="14" height="14" fill="white" viewBox="0 0 16 16">
          <rect x="2" y="3" width="12" height="2" rx="1"/>
          <rect x="2" y="7" width="8" height="2" rx="1"/>
          <rect x="2" y="11" width="10" height="2" rx="1"/>
        </svg>
      </div>

      {NAV.map(item => (
        <Link key={item.href} href={item.href} title={item.label}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            pathname.startsWith(item.href)
              ? 'bg-[#7B2FF7]/20 text-[#9F5AFD]'
              : 'text-white/30 hover:text-white/70 hover:bg-white/[0.06]'
          }`}>
          {item.icon}
        </Link>
      ))}

      <div className="flex-1"/>

      <button onClick={logout} title="Sair"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white/25 hover:text-red-400/70 hover:bg-red-500/[0.06] transition-all">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B2FF7] to-[#9F5AFD] flex items-center justify-center text-xs font-bold text-white mt-1 flex-shrink-0">
        {initials}
      </div>
    </aside>
  )
}
