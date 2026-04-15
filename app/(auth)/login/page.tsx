'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard/leads')
  }

  return (
    <div className="min-h-screen bg-[#070709] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B2FF7] to-[#9F5AFD] flex items-center justify-center shadow-lg shadow-purple-900/40">
            <svg width="20" height="20" fill="white" viewBox="0 0 16 16">
              <rect x="2" y="3" width="12" height="2" rx="1"/>
              <rect x="2" y="7" width="8" height="2" rx="1"/>
              <rect x="2" y="11" width="10" height="2" rx="1"/>
            </svg>
          </div>
          <span className="text-xl font-semibold text-white">Social Converter</span>
        </div>

        <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-6">
          <h1 className="text-lg font-semibold text-white mb-1">Entrar</h1>
          <p className="text-sm text-white/40 mb-5">Acesse seu painel de leads</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#16161c] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#7B2FF7]/50 focus:ring-2 focus:ring-[#7B2FF7]/10 transition-all placeholder:text-white/20"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#16161c] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#7B2FF7]/50 focus:ring-2 focus:ring-[#7B2FF7]/10 transition-all placeholder:text-white/20"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-br from-[#5B1FBD] to-[#7B2FF7] text-white text-sm font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-purple-900/40 active:scale-[.98] transition-all"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-white/30 mt-4">
            Não tem conta?{' '}
            <Link href="/register" className="text-[#9F5AFD] hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
