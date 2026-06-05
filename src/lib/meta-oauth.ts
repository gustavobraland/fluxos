// Meta (Facebook Login) OAuth helpers — usados pelas rotas de /api/auth/instagram.
// O fluxo do Instagram de publicação usa o Facebook Login (não instagram.com):
// requer uma Página do Facebook ligada a uma conta Instagram Business/Creator.

export const GRAPH_VERSION = 'v21.0'
export const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`
export const FB_DIALOG = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`

export const META_SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'pages_show_list',
  'pages_read_engagement',
].join(',')

// Origem pública do app (Vercel define NEXT_PUBLIC_APP_URL; fallback = origem da request).
export function appOrigin(request: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL
  if (env) return env.replace(/\/+$/, '')
  return new URL(request.url).origin
}

export function redirectUri(request: Request): string {
  return `${appOrigin(request)}/api/auth/instagram/callback`
}
