'use client'
import { useI18nStore } from '@/store/useI18nStore'
import type { Locale } from '@/store/useI18nStore'

// Static imports — no network calls, bundled at build time
import ptBR from '@/locales/pt-BR.json'
import zhCN from '@/locales/zh-CN.json'

type Messages = Record<string, unknown>

const LOCALE_MAP: Record<Locale, Messages> = {
  'pt-BR': ptBR as Messages,
  'zh-CN': zhCN as Messages,
}

/**
 * Traverse a nested object using a dot-delimited key path.
 * Returns undefined when the path doesn't resolve to a string.
 */
function lookup(obj: Messages, path: string): string | undefined {
  const parts = path.split('.')
  let node: unknown = obj
  for (const part of parts) {
    if (node && typeof node === 'object' && part in (node as Messages)) {
      node = (node as Messages)[part]
    } else {
      return undefined
    }
  }
  return typeof node === 'string' ? node : undefined
}

/**
 * Replace {{param}} placeholders in a translated string.
 */
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? `{{${key}}}`))
}

/**
 * useTranslation — returns a `t()` function for the current locale.
 *
 * Usage:
 *   const { t, locale } = useTranslation()
 *   t('common.save')                        → "Salvar" | "保存"
 *   t('reports.byAt', { author, time })     → "Por Admin às 14:30" | "Admin · 14:30"
 */
export function useTranslation() {
  const { resolvedLocale, locale, directorMode } = useI18nStore()
  const active = resolvedLocale()
  const messages = LOCALE_MAP[active] ?? LOCALE_MAP['pt-BR']

  function t(key: string, params?: Record<string, string | number>): string {
    // Try resolved locale first
    const val = lookup(messages, key)
    if (val !== undefined) return interpolate(val, params)

    // Fallback to pt-BR
    const fallback = lookup(LOCALE_MAP['pt-BR'], key)
    if (fallback !== undefined) return interpolate(fallback, params)

    // Last resort: return the key itself
    return key
  }

  return { t, locale: active, rawLocale: locale, directorMode }
}
