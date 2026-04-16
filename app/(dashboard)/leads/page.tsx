'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Lead, Message } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  novo:       'bg-[#7B2FF7]/15 text-[#9F5AFD] border border-[#7B2FF7]/30',
  respondido: 'bg-green-500/10 text-green-400 border border-green-500/20',
  arquivado:  'bg-white/[0.06] text-white/40 border border-white/[0.1]',
}

const ORIGEM_ICONS: Record<string, React.ReactNode> = {
  comentario: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  dm: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke="currentColor" strokeWidth="1.5"/>
      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
}

export default function LeadsPage() {
  const [leads,        setLeads]        = useState<Lead[]>([])
  const [selected,     setSelected]     = useState<Lead | null>(null)
  const [messages,     setMessages]     = useState<Message[]>([])
  const [replyText,    setReplyText]    = useState('')
  const [filter,       setFilter]       = useState<'todos' | 'novo' | 'respondido'>('todos')
  const [loading,      setLoading]      = useState(true)
  const [sendLoading,  setSendLoading]  = useState(false)
  const [search,       setSearch]       = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase  = createClient()

  useEffect(() => {
    loadLeads()
    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => loadLeads())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
        if (selected && p.new.lead_id === selected.id) {
          setMessages(prev => [...prev, p.new as Message])
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadLeads() {
    const { data } = await supabase
      .from('leads')
      .select('*, integration:integrations(id,plataforma,nome_conta,external_account_id,is_active,created_at,user_id)')
      .order('created_at', { ascending: false })
    setLeads((data as Lead[]) ?? [])
    setLoading(false)
  }

  async function selectLead(lead: Lead) {
    setSelected(lead)
    setReplyText('')
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true })
    setMessages((data as Message[]) ?? [])

    if (lead.status === 'novo') {
      await supabase.from('leads').update({ status: 'respondido' }).eq('id', lead.id)
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'respondido' } : l))
    }
  }

  async function sendReply() {
    if (!selected || !replyText.trim() || sendLoading) return
    setSendLoading(true)
    try {
      const res = await fetch(`/api/leads/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() }),
      })
      if (res.ok) {
        setReplyText('')
        const { data } = await supabase
          .from('messages').select('*').eq('lead_id', selected.id).order('created_at', { ascending: true })
        setMessages((data as Message[]) ?? [])
      }
    } finally {
      setSendLoading(false)
    }
  }

  const filtered = leads.filter(l => {
    if (filter !== 'todos' && l.status !== filter) return false
    if (search && !(l.nome ?? l.username ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const initials = (name: string | null) => (name ?? '?').split(' ').slice(0,2).map(w => w[0]?.toUpperCase()).join('')
  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (mins < 1) return 'agora'
    if (mins < 60) return `${mins}m`
    if (mins < 1440) return `${Math.floor(mins/60)}h`
    return `${Math.floor(mins/1440)}d`
  }

  return (
    <div className="flex h-full bg-[#070709]">

      {/* Lead list */}
      <div className="w-[300px] flex flex-col bg-[#0e0e12] border-r border-white/[0.06] flex-shrink-0">
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-sm font-semibold text-white">Leads</h1>
            <span className="text-xs text-white/30">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#16161c] border border-white/[0.08] rounded-lg px-3 py-2 mb-3">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="#505068" strokeWidth="1.5"/>
              <path d="M10.5 10.5L14 14" stroke="#505068" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar lead..."
              className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-white/25"/>
          </div>
          <div className="flex gap-1">
            {(['todos','novo','respondido'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-1 text-xs py-1.5 rounded-md transition-all font-medium ${filter===f ? 'bg-[#7B2FF7]/15 text-[#9F5AFD]' : 'text-white/30 hover:text-white/60'}`}>
                {f === 'todos' ? 'Todos' : f === 'novo' ? 'Novos' : 'Respondidos'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
          {loading ? (
            Array.from({length:5}).map((_,i) => (
              <div key={i} className="flex gap-3 p-3 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-white/[0.06] flex-shrink-0"/>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/[0.06] rounded w-2/3"/>
                  <div className="h-2.5 bg-white/[0.04] rounded w-full"/>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-white/25 text-xs">Nenhum lead encontrado</div>
          ) : filtered.map(lead => (
            <div key={lead.id} onClick={() => selectLead(lead)}
              className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${
                selected?.id === lead.id
                  ? 'bg-[#7B2FF7]/12 shadow-[inset_1px_0_0_#7B2FF7]'
                  : 'hover:bg-white/[0.03]'
              }`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7B2FF7] to-[#9F5AFD] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {initials(lead.nome ?? lead.username)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white/90 truncate">
                    {lead.nome ?? lead.username ?? 'Lead'}
                  </span>
                  <span className="text-[10px] text-white/30 flex-shrink-0 ml-2">{timeAgo(lead.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/40">{ORIGEM_ICONS[lead.origem]}</span>
                  <span className="text-xs text-white/35 truncate">{lead.mensagem}</span>
                </div>
                <div className="mt-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
                    {lead.status === 'novo' ? 'Novo' : lead.status === 'respondido' ? 'Respondido' : 'Arquivado'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-[#0e0e12] flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B2FF7] to-[#9F5AFD] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials(selected.nome ?? selected.username)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{selected.nome ?? selected.username ?? 'Lead'}</p>
              <p className="text-xs text-white/35">
                {selected.plataforma ?? 'Social'} · {selected.origem} · {timeAgo(selected.created_at)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  supabase.from('leads').update({ status: 'arquivado' }).eq('id', selected.id).then(() => loadLeads())
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all">
                Arquivar
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 scrollbar-thin">
            {/* First message (lead's original) */}
            <div className="flex flex-col max-w-[70%]">
              <div className="bg-[#16161c] text-white/90 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed">
                {selected.mensagem}
              </div>
              <span className="text-[10px] text-white/25 mt-1 ml-1">{timeAgo(selected.created_at)}</span>
            </div>

            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col max-w-[70%] ${msg.is_from_user ? 'self-end' : 'self-start'}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.is_from_user
                    ? 'bg-gradient-to-br from-[#5B1FBD] to-[#7B2FF7] text-white rounded-br-sm shadow-lg shadow-purple-900/20'
                    : 'bg-[#16161c] text-white/90 rounded-bl-sm'
                }`}>
                  {msg.mensagem}
                </div>
                <span className={`text-[10px] text-white/25 mt-1 ${msg.is_from_user ? 'self-end mr-1' : 'ml-1'}`}>
                  {timeAgo(msg.created_at)}
                </span>
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>

          {/* AI suggestion placeholder */}
          <div className="px-5 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2 bg-[#7B2FF7]/08 border border-[#7B2FF7]/15 rounded-lg px-3 py-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="#9F5AFD"/>
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"
                  stroke="#9F5AFD" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-xs text-[#9F5AFD]/70 italic">IA: Sugestão de resposta disponível em breve...</span>
            </div>
          </div>

          {/* Reply input */}
          <div className="px-5 pb-5 flex-shrink-0">
            <div className="flex gap-3 bg-[#16161c] border border-white/[0.08] rounded-xl p-3 focus-within:border-[#7B2FF7]/40 focus-within:ring-2 focus-within:ring-[#7B2FF7]/10 transition-all">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }}}
                placeholder={`Responder para ${selected.nome ?? selected.username ?? 'lead'}...`}
                rows={2}
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/25 resize-none font-[inherit]"
              />
              <button onClick={sendReply} disabled={!replyText.trim() || sendLoading}
                className="self-end w-9 h-9 rounded-lg bg-gradient-to-br from-[#5B1FBD] to-[#7B2FF7] flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:shadow-lg hover:shadow-purple-900/40 active:scale-95 transition-all">
                {sendLoading
                  ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : <svg width="13" height="13" viewBox="0 0 16 16" fill="white" style={{marginLeft:'1px'}}>
                      <path d="M15.5 1L1 6.5l5.5 2.5L15.5 1zM6.5 9l2.5 5.5L15.5 1"/>
                    </svg>
                }
              </button>
            </div>
            <p className="text-xs text-white/20 mt-1.5">Enter para enviar · Shift+Enter nova linha</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/20">
          <div className="text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3 opacity-30">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <p className="text-sm">Selecione um lead para começar</p>
          </div>
        </div>
      )}
    </div>
  )
}
