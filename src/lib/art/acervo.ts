// ─── Acervo de fotos de jogadores (Supabase Storage) ──────────────────────────
// Casa o nome do jogador (vindo da API) com um arquivo na pasta
// `media/Players Photos 4K`, comparando por nome NORMALIZADO (sem acento).
// Usado pela arte de gol: se houver foto do jogador no acervo, usa ela;
// senão, cai no DALL-E. Listagem feita com a anon key (bucket é public read).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const FOLDER = 'Players Photos 4K'

// lowercase, remove acentos, mantém só [a-z0-9] separados por espaço.
export function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Tokens distintivos (≥4 letras) — descarta iniciais (L., M.), "jr", "son" curto,
// e evita casar por palavras comuns curtas.
function tokens(s: string): string[] {
  return normName(s).split(' ').filter(w => w.length >= 4)
}

interface AcervoItem { key: string; base: string }

// Cache de módulo (10 min) — não relista o bucket a cada gol.
let cache: { at: number; items: AcervoItem[] } | null = null
const TTL = 10 * 60_000

async function listAcervo(): Promise<AcervoItem[]> {
  if (!SUPABASE_URL || !ANON) return []
  if (cache && Date.now() - cache.at < TTL) return cache.items
  const items: AcervoItem[] = []
  let offset = 0
  const PAGE = 1000
  try {
    for (;;) {
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/media`, {
        method: 'POST',
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: `${FOLDER}/`, limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' } }),
        cache: 'no-store',
      })
      if (!res.ok) break
      const data = (await res.json()) as { name?: string; id?: string | null }[]
      const files = (data || []).filter(f => f.id && f.name)
      for (const f of files) items.push({ key: f.name!, base: normName(f.name!.replace(/\.[^.]+$/, '')) })
      if (files.length < PAGE) break
      offset += PAGE
    }
  } catch (e) {
    console.warn('[acervo] list falhou:', e)
  }
  cache = { at: Date.now(), items }
  return items
}

function publicUrl(key: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/media/${encodeURIComponent(FOLDER)}/${encodeURIComponent(key)}`
}

/** URL pública da foto do jogador no acervo (ou null se não houver match). */
export async function findPlayerPhotoUrl(scorerName: string | null | undefined): Promise<string | null> {
  if (!scorerName) return null
  const items = await listAcervo()
  if (!items.length) return null

  const full = normName(scorerName)
  const toks = tokens(scorerName)
  if (!toks.length) return null
  // Candidatos distintivos: o último token (sobrenome) e o mais longo. Únicos.
  const last = toks[toks.length - 1]
  const longest = toks.reduce((a, b) => (b.length > a.length ? b : a))
  const cands = [...new Set([last, longest])]

  // Prioridade: nome exato > sobrenome exato (foto limpa "Messi.png") >
  // sobrenome como PALAVRA no nome do arquivo ("NOTICIA MESSI 2.png").
  // (Sem fallback de "qualquer token" — evita casar por palavras comuns.)
  const hit =
    items.find(i => i.base === full) ||
    items.find(i => cands.includes(i.base)) ||
    items.find(i => { const w = i.base.split(' '); return cands.some(c => w.includes(c)) })

  return hit ? publicUrl(hit.key) : null
}

/** Foto do jogador como data URI (baixa a imagem) ou null. Robusto p/ o Satori. */
export async function findPlayerPhotoDataUri(scorerName: string | null | undefined): Promise<string | null> {
  const url = await findPlayerPhotoUrl(scorerName)
  if (!url) return null
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || 'image/png'
    const buf = await res.arrayBuffer()
    return `data:${ct};base64,${Buffer.from(buf).toString('base64')}`
  } catch (e) {
    console.warn('[acervo] download falhou:', e)
    return null
  }
}
