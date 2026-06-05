import { createClient } from '@/lib/supabase/client'

export interface SocialConnection {
  id: string
  user_email: string
  platform: string
  account_id: string | null
  account_name: string | null
  avatar_url: string | null
  expires_at: string | null
}

// Conexões sociais do usuário logado. Não traz o access_token ao cliente
// (publicação acontece no servidor). Retorna [] se sem login/tabela ausente.
export async function fetchSocialConnections(): Promise<SocialConnection[]> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const email = auth.user?.email
  if (!email) return []
  const { data, error } = await supabase
    .from('social_connections')
    .select('id,user_email,platform,account_id,account_name,avatar_url,expires_at')
    .eq('user_email', email)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as SocialConnection[]
}

export async function deleteSocialConnection(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('social_connections').delete().eq('id', id)
  return !error
}
