export type Theme = 'dark' | 'light'

export type ViewId =
  | 'dashboard' | 'timeline' | 'warroom' | 'pipeline'
  | 'calendar'  | 'multipost'| 'assets'  | 'approvals'
  | 'analytics' | 'integrations' | 'reports' | 'prompts' | 'clipador'

export type PlatformId =
  | 'instagram' | 'twitter' | 'tiktok' | 'linkedin'
  | 'facebook'  | 'youtube' | 'telegram'

export type TaskStatus =
  | 'backlog' | 'production' | 'review' | 'ready' | 'published'

export type TaskType =
  | 'Copy' | 'Design' | 'Motion' | 'Copy + Design' | 'Estratégia'

export type IntegrationCategory =
  | 'Social Media' | 'AI & LLM' | 'Sports Data'
  | 'Storage & Files' | 'Analytics' | 'Productivity' | 'Webhooks & Dev'

export interface Task {
  id: string
  title: string
  description?: string
  type: TaskType
  status: TaskStatus
  platforms: PlatformId[]
  dueDate?: string
  priority?: boolean
  priorityLevel?: 'low' | 'medium' | 'high'
  assignees?: string[]
  tags?: string[]
  referenceUrl?: string  // Link de referência (Drive, Figma, etc.)
  createdAt: string
}

export interface DailyReport {
  id: string
  date: string       // YYYY-MM-DD
  content: string
  author: string
  userEmail?: string  // email do autor (para filtro por papel)
  userRole?: string   // papel no momento do registro
  createdAt: string
}

export interface Platform {
  id: PlatformId
  name: string
  icon: string
  color: string
  handle: string
  connected: boolean
  selected: boolean
}

export interface Integration {
  id: string
  name: string
  category: IntegrationCategory
  icon: string
  bg: string
  connected: boolean
  handle: string
  desc: string
}

export interface CalendarEvent {
  id: string
  day: number
  month: number
  time: string
  type: 'match' | 'content' | 'deadline' | 'trending' | 'campaign'
  title: string
  platforms?: PlatformId[]
}

export interface Asset {
  id: string
  name: string
  type: 'image' | 'video' | 'template' | 'lut' | 'font'
  size?: string
  dimensions?: string
  tags: string[]
  folder: string
  emoji: string
  color: string
  createdAt: string
  // Operational index fields
  externalRef?: string            // Google Drive / Dropbox / NAS URL
  storageTier?: 'hot' | 'cold' | 'external'
  creator?: string                // initials e.g. "MR"
  mimeType?: string
  project?: string
}

export interface ApprovalItem {
  id: string
  name: string
  subtitle: string
  emoji: string
  type: 'image' | 'video'
  status: 'pending' | 'approved' | 'rejected' | 'changes' | 'published'
  mediaUrl?: string
  comments: Comment[]
  taskId?: string       // referência à pipeline_task de origem
  publishedAt?: string  // ISO timestamp de publicação
  decidedBy?: string    // quem aprovou/rejeitou/pediu ajuste (nome do usuário)
  decidedAt?: string    // ISO timestamp da decisão
}

// Trilha de auditoria: registra cada ação de aprovação/rejeição/exclusão para
// que a equipe possa voltar e saber quem clicou em cada card.
export type ApprovalAction = 'approved' | 'rejected' | 'changes' | 'published' | 'deleted'

export interface ApprovalLogEntry {
  id: string
  itemId: string
  itemName: string
  action: ApprovalAction
  by: string        // nome do usuário que executou a ação
  at: string        // ISO timestamp
  note?: string     // motivo (rejeição / ajuste)
}

export interface Comment {
  id: string
  author: string
  avatar: string
  color: string
  text: string
  pin?: { x: number; y: number }
  resolved: boolean
  createdAt: string
}

export interface MatchEvent {
  id: string
  minute: number
  type: 'goal' | 'yellow' | 'red' | 'sub' | 'var' | 'corner' | 'offside'
  team: 'home' | 'away'
  player?: string
}

export interface NavItem {
  id: ViewId
  label: string
  icon: string
  kbd?: string
  badge?: string
  /** Permissão exigida para ver o item. `null`/ausente = visível a todos. */
  permission?: import('@/lib/permissions').Permission | null
}

export interface NavSection {
  section: string
  items: NavItem[]
}

export interface CmdAction {
  section: string
  icon: string
  name: string
  view?: ViewId
  action?: string
  kbd?: string
}
