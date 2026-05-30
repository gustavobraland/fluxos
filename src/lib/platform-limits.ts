// ─── Platform character limits & display meta ─────────────────────────────────
// Single source of truth for per-platform copy constraints used by the
// Multipost flow (AI refine, char counters, previews).

export interface PlatformLimit {
  caption: number
  recommended: number
  note: string
  hashtags?: number
  description?: number
}

export const PLATFORM_LIMITS = {
  instagram: {
    caption: 2200,
    hashtags: 30,
    recommended: 150,
    note: 'Primeiros 125 chars aparecem sem "mais"',
  },
  youtube_shorts: {
    caption: 100,
    description: 5000,
    recommended: 70,
    note: 'Título curto e direto — aparece sobre o vídeo',
  },
  tiktok: {
    caption: 2200,
    hashtags: 100,
    recommended: 150,
    note: 'Hashtags pesam muito no alcance',
  },
  facebook: {
    caption: 63206,
    recommended: 80,
    note: 'Menos de 80 chars têm 66% mais engajamento',
  },
  twitter: {
    caption: 280,
    recommended: 200,
    note: 'Posts com mídia: 280 chars incluindo link',
  },
} satisfies Record<string, PlatformLimit>

export type PlatformId = keyof typeof PLATFORM_LIMITS

export const PLATFORM_ORDER: PlatformId[] = [
  'instagram',
  'youtube_shorts',
  'tiktok',
  'facebook',
  'twitter',
]

export const PLATFORM_META: Record<PlatformId, { label: string; short: string }> = {
  instagram:      { label: 'Instagram',      short: 'IG' },
  youtube_shorts: { label: 'YouTube Shorts', short: 'Shorts' },
  tiktok:         { label: 'TikTok',         short: 'TT' },
  facebook:       { label: 'Facebook',       short: 'FB' },
  twitter:        { label: 'X / Twitter',    short: 'X' },
}
