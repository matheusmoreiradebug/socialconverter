export type Platform = 'instagram' | 'facebook'
export type LeadStatus = 'novo' | 'respondido' | 'arquivado'
export type LeadOrigin = 'comentario' | 'dm'

export interface Integration {
  id: string
  user_id: string
  plataforma: Platform
  external_account_id: string
  nome_conta: string | null
  is_active: boolean
  created_at: string
}

export interface Lead {
  id: string
  user_id: string
  integration_id: string | null
  nome: string | null
  username: string | null
  mensagem: string
  origem: LeadOrigin
  status: LeadStatus
  plataforma: Platform | null
  external_lead_id: string | null
  created_at: string
  integration?: Integration
}

export interface Message {
  id: string
  lead_id: string
  mensagem: string
  is_from_user: boolean
  created_at: string
}

export interface ApiResponse<T = void> {
  data?: T
  error?: string
}
