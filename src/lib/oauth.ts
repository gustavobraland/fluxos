import { NextResponse } from 'next/server'
import { appOrigin } from './meta-oauth'

export { appOrigin }

// URI de callback de um provedor: <origin>/api/auth/<provider>/callback
export function callbackUri(request: Request, provider: string): string {
  return `${appOrigin(request)}/api/auth/${provider}/callback`
}

// Página servida ao fim do OAuth: avisa a janela que abriu (Integrações escuta
// `flux:social`) e fecha o popup; fallback = redireciona para /integrations.
export function oauthPopupResponse(status: string, origin: string): NextResponse {
  const s = JSON.stringify(status)
  const o = JSON.stringify(origin)
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Flux OS</title></head>
<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#131312;color:#aaa;font-family:system-ui">
<p>${status === 'connected' ? '✓ Conta conectada. Pode fechar esta janela.' : 'Falha ao conectar (' + status + ').'}</p>
<script>
  try { if (window.opener) { window.opener.postMessage({ type: 'flux:social', status: ${s} }, ${o}); window.close(); } } catch (e) {}
  setTimeout(function(){ try { location.href = ${o} + '/integrations?connected=' + ${s}; } catch(e){} }, 900);
</script></body></html>`
  return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
