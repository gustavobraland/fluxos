import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { appOrigin } from './meta-oauth'

export { appOrigin }

// URI de callback de um provedor: <origin>/api/auth/<provider>/callback
export function callbackUri(request: Request, provider: string): string {
  return `${appOrigin(request)}/api/auth/${provider}/callback`
}

// Página servida ao fim do OAuth: avisa a janela que abriu (Integrações escuta
// `flux:social`) e fecha o popup; fallback = redireciona para /integrations.
// `detail` carrega a causa real do erro para a UI/popup mostrar.
export function oauthPopupResponse(status: string, origin: string, detail?: string): NextResponse {
  const s = JSON.stringify(status)
  const o = JSON.stringify(origin)
  const d = JSON.stringify(String(detail ?? '').slice(0, 400))
  const safe = String(detail ?? '').replace(/[<>&]/g, ' ').slice(0, 400)
  const ok = status === 'connected'
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Flux OS</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;background:#131312;color:#aaa;font-family:system-ui;text-align:center;padding:24px">
<p>${ok ? '✓ Conta conectada. Pode fechar esta janela.' : 'Falha ao conectar (' + status + ').'}</p>
${!ok && safe ? `<p style="font-size:12px;color:#888;max-width:560px;word-break:break-word">${safe}</p>` : ''}
<script>
  try { if (window.opener) { window.opener.postMessage({ type: 'flux:social', status: ${s}, detail: ${d} }, ${o}); if (${ok ? 'true' : 'false'}) window.close(); } } catch (e) {}
  setTimeout(function(){ try { location.href = ${o} + '/integrations?connected=' + ${s}; } catch(e){} }, ${ok ? 900 : 2500});
</script></body></html>`
  return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}

export interface ConnectionBase {
  user_email: string
  platform: string
  access_token: string
  refresh_token?: string | null
  account_id?: string | null
  account_name?: string | null
  expires_at?: string | null
}

/**
 * Salva a conexão de forma resiliente a variações do schema da tabela
 * `social_connections`:
 *  - usa delete+insert (não depende de UNIQUE/onConflict),
 *  - tenta gravar o avatar como `avatar_url`, depois `account_avatar`,
 *    e por fim sem avatar — para tolerar as duas convenções de coluna.
 * Retorna a mensagem de erro real (ou null em sucesso) para a UI mostrar.
 */
export async function saveSocialConnection(
  supabase: SupabaseClient,
  base: ConnectionBase,
  avatarUrl: string | null,
): Promise<{ error: string | null }> {
  await supabase
    .from('social_connections')
    .delete()
    .eq('user_email', base.user_email)
    .eq('platform', base.platform)

  const attempts: Record<string, unknown>[] = [
    { ...base, avatar_url: avatarUrl },
    { ...base, account_avatar: avatarUrl },
    { ...base },
  ]
  let lastErr: string | null = null
  for (const row of attempts) {
    const { error } = await supabase.from('social_connections').insert(row)
    if (!error) return { error: null }
    lastErr = error.message
    // Só tenta a próxima variação se o erro for de coluna inexistente.
    if (!/column|schema cache|could not find/i.test(error.message)) break
  }
  return { error: lastErr }
}
