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

// ─── Generic table CRUD (PostgREST, anon key — RLS must allow `anon`) ─────────

/**
 * SELECT * FROM `table` with optional equality filters and ordering.
 * Returns [] on error or when Supabase is not configured.
 */
export async function sbSelect<T>(
  table: string,
  opts?: {
    /** Equality filters: { workspace_id: 'braland' } → ?workspace_id=eq.braland */
    filters?: Record<string, string>
    /** Order param e.g. 'created_at.asc' */
    order?: string
  },
): Promise<T[]> {
  if (!URL || !KEY) return []
  try {
    const params = new URLSearchParams({ select: '*' })
    if (opts?.filters) {
      for (const [k, v] of Object.entries(opts.filters)) {
        params.set(k, `eq.${v}`)
      }
    }
    if (opts?.order) params.set('order', opts.order)
    const res = await fetch(`${URL}/rest/v1/${table}?${params.toString()}`, {
      headers: headers(),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error(`[sb] SELECT ${table}: HTTP ${res.status}`, await res.text().catch(() => ''))
      return []
    }
    return (await res.json()) as T[]
  } catch (e) {
    console.error(`[sb] SELECT ${table}:`, e)
    return []
  }
}

/**
 * INSERT one row into `table`.
 * Returns null on success, or an error string on failure.
 */
export async function sbInsert(
  table: string,
  row: Record<string, unknown>,
): Promise<string | null> {
  if (!URL || !KEY) return 'supabase_disabled'
  try {
    const res = await fetch(`${URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify(row),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => `HTTP ${res.status}`)
      console.error(`[sb] INSERT ${table}:`, txt)
      return txt
    }
    return null
  } catch (e) {
    console.error(`[sb] INSERT ${table}:`, e)
    return String(e)
  }
}

/**
 * PATCH a single row identified by `id` in `table`.
 * Returns null on success, or an error string on failure.
 */
export async function sbPatch(
  table: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<string | null> {
  if (!URL || !KEY) return 'supabase_disabled'
  try {
    const res = await fetch(
      `${URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: headers({ Prefer: 'return=minimal' }),
        body: JSON.stringify(patch),
      },
    )
    if (!res.ok) {
      const txt = await res.text().catch(() => `HTTP ${res.status}`)
      console.error(`[sb] PATCH ${table}[${id}]:`, txt)
      return txt
    }
    return null
  } catch (e) {
    console.error(`[sb] PATCH ${table}[${id}]:`, e)
    return String(e)
  }
}

/**
 * DELETE a single row identified by `id` in `table`.
 * Returns null on success, or an error string on failure.
 */
export async function sbDelete(
  table: string,
  id: string,
): Promise<string | null> {
  if (!URL || !KEY) return 'supabase_disabled'
  try {
    const res = await fetch(
      `${URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
      { method: 'DELETE', headers: headers() },
    )
    if (!res.ok) {
      const txt = await res.text().catch(() => `HTTP ${res.status}`)
      console.error(`[sb] DELETE ${table}[${id}]:`, txt)
      return txt
    }
    return null
  } catch (e) {
    console.error(`[sb] DELETE ${table}[${id}]:`, e)
    return String(e)
  }
}

/**
 * UPSERT (INSERT OR UPDATE) one row, resolving conflicts on `onConflict` columns.
 * Returns null on success, or an error string on failure.
 */
export async function sbUpsert(
  table: string,
  row: Record<string, unknown>,
  onConflict: string,
): Promise<string | null> {
  if (!URL || !KEY) return 'supabase_disabled'
  try {
    const res = await fetch(
      `${URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
      {
        method: 'POST',
        headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
        body: JSON.stringify(row),
      },
    )
    if (!res.ok) {
      const txt = await res.text().catch(() => `HTTP ${res.status}`)
      console.error(`[sb] UPSERT ${table}:`, txt)
      return txt
    }
    return null
  } catch (e) {
    console.error(`[sb] UPSERT ${table}:`, e)
    return String(e)
  }
}
