// ─── Permissões por papel (RBAC) ──────────────────────────────────────────────
// O tipo Role vive em onboarding-config.ts (fonte única). Aqui mapeamos cada
// papel para o conjunto de permissões que ele tem no Flux OS.

import type { Role } from './onboarding-config'

export type { Role }

export type Permission =
  | 'briefing.create'
  | 'pipeline.view'
  | 'copy.edit'
  | 'art.create'
  | 'multipost.upload'
  | 'content.submit_approval'
  | 'content.approve'
  | 'content.publish'
  | 'content.publish_without_approval'
  | 'warroom.open'
  | 'analytics.view'
  | 'integrations.manage'
  | 'users.manage'
  | 'clipador.use'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ceo: [
    'briefing.create', 'pipeline.view', 'copy.edit', 'art.create',
    'multipost.upload', 'content.submit_approval', 'content.approve',
    'content.publish', 'warroom.open', 'analytics.view',
    'integrations.manage', 'users.manage', 'clipador.use',
  ],
  admin: [
    'briefing.create', 'pipeline.view', 'copy.edit', 'art.create',
    'multipost.upload', 'content.submit_approval', 'content.approve',
    'content.publish', 'warroom.open', 'analytics.view',
    'integrations.manage', 'users.manage', 'clipador.use',
  ],
  project_manager: [
    'briefing.create', 'pipeline.view', 'copy.edit', 'art.create',
    'multipost.upload', 'content.submit_approval', 'content.approve',
    'content.publish', 'warroom.open', 'analytics.view',
    'integrations.manage', 'users.manage', 'clipador.use',
  ],
  redator: [
    'briefing.create', 'pipeline.view', 'copy.edit', 'art.create',
    'multipost.upload', 'content.submit_approval', 'content.publish',
    'warroom.open', 'analytics.view', 'integrations.manage', 'clipador.use',
  ],
  produtor: [
    'briefing.create', 'pipeline.view', 'copy.edit', 'art.create',
    'multipost.upload', 'content.submit_approval', 'content.approve',
    'content.publish', 'warroom.open', 'analytics.view',
    'integrations.manage', 'clipador.use',
  ],
  social_media: [
    'briefing.create', 'pipeline.view', 'copy.edit', 'art.create',
    'multipost.upload', 'content.submit_approval', 'content.publish',
    'warroom.open', 'clipador.use',
  ],
  designer_lider: [
    'briefing.create', 'pipeline.view', 'copy.edit', 'art.create',
    'multipost.upload', 'content.submit_approval', 'content.approve',
    'content.publish', 'warroom.open', 'analytics.view',
    'integrations.manage', 'clipador.use',
  ],
  designer: [
    'briefing.create', 'pipeline.view', 'copy.edit', 'art.create',
    'multipost.upload', 'content.submit_approval', 'content.publish',
    'warroom.open', 'clipador.use',
  ],
  influencer: [
    'briefing.create', 'pipeline.view', 'multipost.upload',
    'content.submit_approval', 'content.publish_without_approval',
    'analytics.view', 'clipador.use',
  ],
  rh: [
    'briefing.create',
    'pipeline.view',
  ],
}

/** Checa uma permissão para um papel (uso fora de componentes React). */
export function roleCan(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
