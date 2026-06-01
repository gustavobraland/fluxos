'use client'
import { useUserStore } from '@/store/useUserStore'
import { ROLE_PERMISSIONS, type Permission } from '@/lib/permissions'

/** Retorna true se o papel do usuário logado tem a permissão pedida. */
export function usePermission(permission: Permission): boolean {
  const role = useUserStore((s) => s.role)
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
