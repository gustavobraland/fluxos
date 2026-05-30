// ─── Supabase REST (PostgREST) client ─────────────────────────────────────────
// No SDK dependency — just fetch against PostgREST with the publishable key.
// State is stored as one row per domain in a `flux_state(key, value jsonb)` table.
// The publishable key is public by design; access is governed by RLS.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function supabaseEnabled(): boolean {
  return !!URL && !!KEY
}

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: KEY as string,
    Authorization: `Bearer ${KEY}`,
    'content-type': 'application/json',
    ...extra,
  }
}

/** Read one domain blob. Returns null if missing, errored, or not configured. */
export async function sbLoad<T>(key: string): Promise<T | null> {
  if (!supabaseEnabled()) return null
  try {
    const res = await fetch(
      `${URL}/rest/v1/flux_state?key=eq.${encodeURIComponent(key)}&select=value`,
      { headers: headers(), cache: 'no-store' }
    )
    if (!res.ok) return null
    const rows = (await res.json()) as { value: T }[]
    return rows[0]?.value ?? null
  } catch {
    return null
  }
}

/** Upsert one domain blob (insert or merge on the `key` primary key). */
export async function sbSave(key: string, value: unknown): Promise<boolean> {
  if (!supabaseEnabled()) return false
  try {
    const res = await fetch(`${URL}/rest/v1/flux_state`, {
      method: 'POST',
      headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
    })
    return res.ok
  } catch {
    return false
  }
}
