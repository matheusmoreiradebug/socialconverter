'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import type { Integration } from '@/types'

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading,      setLoading]      = useState(true)
  const params   = useSearchParams()
  const supabase = createClient()

  useEffect(() => { loadIntegrations() }, [])

  async function loadIntegrations() {
    const { data } = await supabase
      .from('integrations')
      .select('id, user_id, plataforma, external_account_id, nome_conta, is_active, created_at')
      .order('created_at', { ascending: false })
    setIntegrations((data as Integration[]) ?? [])
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('integrations').update({ is_active: !current }).eq('id', id)
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, is_active: !current } : i))
  }

  async function removeIntegration(id: string) {
    if (!confirm('Remover esta integração? Todos os leads vinculados serão mantidos.')) return
    await supabase.from('integrations').delete().eq('id', id)
    setIntegrations(prev => prev.filter(i => i.id !== id))
  }

  const success = params.get('success')
  const error   = params.get('error')

  return (
    <div className="h-full bg-[#070709] overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Integrações</h1>
          <p className="text-sm text-white/40">Conecte suas contas para capturar leads automaticamente.</p>
        </div>

        {success && (
          <div className="mb-5 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400">
            ✓ Conta conectada com sucesso! Seus leads já estão sendo capturados.
          </div>
        )}
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error === 'denied' ? 'Permissão negada. Tente novamente e autorize todos os acessos.' : 'Erro na autenticação. Verifique as configurações.'}
          </div>
        )}

        {/* Connect button */}
        <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex gap-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E1306C] to-[#F77737] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="1.5"/>
                  <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.5"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="white"/>
                </svg>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1877F2] to-[#60a5fa] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Instagram &amp; Facebook</p>
              <p className="text-xs text-white/40 mt-0.5">Captura comentários e DMs via Meta Graph API</p>
            </div>
            <button onClick={() => { window.location.href = '/api/auth/meta' }}
              className="px-4 py-2 rounded-lg bg-gradient-to-br from-[#5B1FBD] to-[#7B2FF7] text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-900/40 active:scale-[.98] transition-all whitespace-nowrap flex-shrink-0">
              + Conectar conta
            </button>
          </div>
        </div>

        {/* Connected accounts */}
        <div>
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-3">
            Contas conectadas
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-16 bg-[#0e0e12] rounded-xl animate-pulse"/>)}
            </div>
          ) : integrations.length === 0 ? (
            <div className="bg-[#0e0e12] border border-white/[0.06] rounded-xl p-8 text-center">
              <p className="text-sm text-white/25">Nenhuma conta conectada ainda.</p>
              <p className="text-xs text-white/20 mt-1">Clique em &quot;Conectar conta&quot; para começar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.map(integration => (
                <div key={integration.id} className="bg-[#0e0e12] border border-white/[0.08] rounded-xl p-4 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    integration.plataforma === 'instagram'
                      ? 'bg-gradient-to-br from-[#E1306C] to-[#F77737]'
                      : 'bg-gradient-to-br from-[#1877F2] to-[#60a5fa]'
                  }`}>
                    {integration.plataforma === 'instagram' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="1.5"/>
                        <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.5"/>
                        <circle cx="17.5" cy="6.5" r="1" fill="white"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {integration.nome_conta ?? integration.external_account_id}
                    </p>
                    <p className="text-xs text-white/35 capitalize mt-0.5">
                      {integration.plataforma} · ID: {integration.external_account_id.slice(0,12)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      integration.is_active
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-white/[0.06] text-white/30'
                    }`}>
                      {integration.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                    <button onClick={() => toggleActive(integration.id, integration.is_active)}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1">
                      {integration.is_active ? 'Pausar' : 'Ativar'}
                    </button>
                    <button onClick={() => removeIntegration(integration.id)}
                      className="text-xs text-red-400/50 hover:text-red-400 transition-colors px-2 py-1">
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Setup guide */}
        <div className="mt-8 bg-[#0e0e12] border border-[#7B2FF7]/15 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Como configurar</h3>
          <div className="space-y-3">
            {[
              'Conta Instagram deve ser Business ou Creator',
              'Instagram vinculado a uma Página do Facebook',
              'Você deve ser administrador da Página',
              'Configure o webhook no painel Meta Developers',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#7B2FF7]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[9px] text-[#9F5AFD] font-bold">{i+1}</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
