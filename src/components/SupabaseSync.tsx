'use client'
import { useEffect } from 'react'
import { initSupabaseSync } from '@/lib/supabaseSync'

// Mounts once at the app root. Pulls cloud state and starts push-on-change sync.
// Renders nothing. No-ops when Supabase env isn't configured.
export function SupabaseSync() {
  useEffect(() => { void initSupabaseSync() }, [])
  return null
}
