// ─── Clipador (UI demo) ───────────────────────────────────────────────────────
// Frontend-only module: simulates the "long video → best clips" pipeline so the
// flow can be demonstrated without Whisper/Claude/ffmpeg/yt-dlp (none configured).
// SRT + export bundles are generated for real on the client from the demo data.

export type ClipType = 'hook' | 'value' | 'viral' | 'cta'
export type ClipStatus = 'suggested' | 'approved' | 'discarded'
export type ClipPlatform = 'reels' | 'tiktok' | 'shorts'

export interface Clip {
  id: string
  title: string
  start_ms: number
  end_ms: number
  duration_seconds: number
  clip_type: ClipType
  score: number
  score_reason: string
  transcript_text: string
  status: ClipStatus
}

export const CLIP_TYPE_COLOR: Record<ClipType, string> = {
  hook:  '#E0201A',     // brand red
  value: 'var(--blue)',
  viral: 'var(--green)',
  cta:   'var(--yellow)',
}

// Demo clips (clearly sample data — the real pipeline plugs in when keys exist).
export function generateDemoClips(): Clip[] {
  const raw: Omit<Clip, 'id' | 'duration_seconds' | 'status'>[] = [
    {
      title: 'O erro que todo time comete no fim de jogo',
      start_ms: 258000, end_ms: 322000, clip_type: 'hook', score: 94,
      score_reason: 'abre com pergunta provocadora e entrega dado concreto em 3s',
      transcript_text: 'Você já reparou que a maioria dos times perde pontos exatamente nos últimos dez minutos? Não é falta de preparo físico, é decisão. A diferença entre vencer e empatar está na cabeça.',
    },
    {
      title: 'A estatística que mudou a forma de analisar zagueiros',
      start_ms: 540000, end_ms: 642000, clip_type: 'value', score: 89,
      score_reason: 'entrega o ensinamento principal com começo e fim limpos',
      transcript_text: 'O número que importa não é desarme, é a quantidade de passes que o zagueiro força o adversário a errar. Isso muda completamente como a gente avalia uma defesa moderna.',
    },
    {
      title: 'O lance que ninguém viu na transmissão',
      start_ms: 905000, end_ms: 958000, clip_type: 'viral', score: 91,
      score_reason: 'revelação surpreendente com forte gancho de reação',
      transcript_text: 'Repara nesse detalhe: enquanto a bola estava no outro lado, o camisa dez já tinha desenhado a jogada inteira com o dedo. Isso é leitura de jogo em outro nível.',
    },
    {
      title: 'Por que apostar no favorito quase nunca compensa',
      start_ms: 1210000, end_ms: 1268000, clip_type: 'value', score: 84,
      score_reason: 'conteúdo válido e prático, abertura poderia ser mais forte',
      transcript_text: 'A odd do favorito já embute toda a expectativa do mercado. O valor de verdade está em encontrar o jogo onde a probabilidade real é maior do que a cotação sugere.',
    },
    {
      title: 'Salva esse vídeo antes do próximo jogo',
      start_ms: 1500000, end_ms: 1532000, clip_type: 'cta', score: 78,
      score_reason: 'chamada para ação clara, encerramento direto',
      transcript_text: 'Salva esse vídeo, manda pro grupo da galera e me conta nos comentários qual time você acha que aplica isso melhor. Próximo episódio sai quinta.',
    },
  ]
  return raw.map((c, i) => ({
    ...c,
    id: `clip-${i + 1}`,
    duration_seconds: Math.round((c.end_ms - c.start_ms) / 1000),
    status: 'suggested' as ClipStatus,
  }))
}

const msToSRT = (ms: number) => {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const ms2 = Math.floor(ms % 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms2).padStart(3, '0')}`
}

export const fmtClock = (ms: number) => {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${String(s).padStart(2, '0')}`
}

// Build a real, synced .srt for a clip by spreading its words across its duration
// (demo: word-level timestamps come from Whisper in the real pipeline).
export function buildSrt(clip: Clip): string {
  const words = clip.transcript_text.trim().split(/\s+/)
  const dur = clip.end_ms - clip.start_ms
  const per = dur / Math.max(words.length, 1)
  const timed = words.map((w, i) => ({ word: w, start: Math.round(i * per), end: Math.round((i + 1) * per) }))

  const lines: { text: string; start: number; end: number }[] = []
  let group: typeof timed = []
  timed.forEach((w, i) => {
    group.push(w)
    if (group.length === 5 || i === timed.length - 1) {
      lines.push({ text: group.map(g => g.word).join(' '), start: group[0].start, end: group[group.length - 1].end })
      group = []
    }
  })
  return lines.map((l, i) => `${i + 1}\n${msToSRT(l.start)} --> ${msToSRT(l.end)}\n${l.text}\n`).join('\n')
}

// Bundle the approved clips into one downloadable text export (CapCut-ready).
export function buildExportBundle(clips: Clip[], platforms: ClipPlatform[]): string {
  const PLATFORM_LABEL: Record<ClipPlatform, string> = { reels: 'Instagram Reels', tiktok: 'TikTok', shorts: 'YouTube Shorts' }
  const blocks = clips.map((c, idx) => {
    const caption = `${c.title}\n\n${c.transcript_text}`
    const hashtags = '#futebol #clip #viral #esporte #braland'
    const capParts = platforms.map(p => `— ${PLATFORM_LABEL[p]} —\n${caption}\n${hashtags}`).join('\n\n')
    return [
      `══════════════════════════════════════`,
      `CLIP ${idx + 1} · ${c.title}`,
      `Tipo: ${c.clip_type.toUpperCase()} · Score: ${c.score}`,
      `CapCut → cortar de ${fmtClock(c.start_ms)} a ${fmtClock(c.end_ms)} (${c.duration_seconds}s)`,
      ``,
      `--- LEGENDAS (.srt) ---`,
      buildSrt(c),
      `--- CAPTIONS ---`,
      capParts,
      ``,
    ].join('\n')
  })
  return [`FLUX OS · CLIPADOR — EXPORT`, `Plataformas: ${platforms.map(p => PLATFORM_LABEL[p]).join(', ')}`, ``, ...blocks].join('\n')
}
