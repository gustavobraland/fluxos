import type { NavSection, CmdAction, Platform, TaskStatus, IntegrationCategory } from '@/types'

export const NAV_ITEMS: NavSection[] = [
  { section: 'Principal', items: [
    { id: 'dashboard',    label: 'Dashboard',   icon: 'LayoutDashboard', kbd: 'G D' },
    { id: 'timeline',     label: 'Timeline',    icon: 'Activity',        kbd: 'G T' },
    { id: 'warroom',      label: 'War Room',    icon: 'Zap',             kbd: 'G W', badge: 'LIVE' },
  ]},
  { section: 'Produção', items: [
    { id: 'pipeline',     label: 'Pipeline',    icon: 'KanbanSquare',    kbd: 'G P' },
    { id: 'calendar',     label: 'Calendar',    icon: 'CalendarDays',    kbd: 'G C' },
    { id: 'multipost',    label: 'Multipost',   icon: 'Send',            kbd: 'G M' },
    { id: 'prompts',      label: 'Prompts',     icon: 'Sparkles',        kbd: 'G O' },
    { id: 'assets',       label: 'Assets',      icon: 'FolderOpen',      kbd: 'G A' },
    { id: 'approvals',    label: 'Aprovações',  icon: 'CheckSquare' },
  ]},
  { section: 'Inteligência', items: [
    { id: 'analytics',    label: 'Analytics',   icon: 'BarChart3' },
    { id: 'integrations', label: 'Integrações', icon: 'Plug' },
  ]},
  { section: 'Operações', items: [
    { id: 'reports',      label: 'Daily Reports', icon: 'ClipboardList' },
  ]},
]

export const PIPELINE_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'backlog',    label: 'Backlog',    color: '#5B5B7A' },
  { id: 'production', label: 'Produção',   color: '#5BB8E8' },
  { id: 'review',     label: 'Revisão',    color: '#F5A040' },
  { id: 'ready',      label: 'Pronto',     color: '#3ECF8E' },
  { id: 'published',  label: 'Publicado',  color: '#A78BFA' },
]

export const PLATFORMS: Platform[] = [
  { id: 'instagram', name: 'Instagram',   icon: '📸', color: '#E1306C', handle: '', connected: false, selected: false },
  { id: 'twitter',   name: 'X / Twitter', icon: '𝕏',  color: '#000000', handle: '', connected: false, selected: false },
  { id: 'tiktok',    name: 'TikTok',      icon: '🎵', color: '#010101', handle: '', connected: false, selected: false },
  { id: 'linkedin',  name: 'LinkedIn',    icon: '💼', color: '#0077B5', handle: '', connected: false, selected: false },
  { id: 'facebook',  name: 'Facebook',    icon: '📘', color: '#1877F2', handle: '', connected: false, selected: false },
  { id: 'telegram',  name: 'Telegram',    icon: '✈️', color: '#229ED9', handle: '', connected: false, selected: false },
  { id: 'youtube',   name: 'YouTube',     icon: '▶️', color: '#FF0000', handle: '', connected: false, selected: false },
]

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  'Social Media', 'AI & LLM', 'Sports Data',
  'Storage & Files', 'Analytics', 'Productivity', 'Webhooks & Dev',
]

export const INTEGRATIONS = [
  // Social Media
  { id: 'instagram',   name: 'Instagram',          category: 'Social Media',    icon: '', bg: '#E1306C22', connected: false, handle: '', desc: 'Publique e agende posts, Stories e Reels' },
  { id: 'twitter',     name: 'X / Twitter',         category: 'Social Media',    icon: '', bg: '#00000022', connected: false, handle: '', desc: 'Agende tweets e monitore menções' },
  { id: 'tiktok',      name: 'TikTok',              category: 'Social Media',    icon: '', bg: '#01010122', connected: false, handle: '', desc: 'Publique vídeos e analise performance' },
  { id: 'linkedin',    name: 'LinkedIn',            category: 'Social Media',    icon: '', bg: '#0077B522', connected: false, handle: '', desc: 'Conteúdo profissional e B2B' },
  { id: 'facebook',    name: 'Facebook',            category: 'Social Media',    icon: '', bg: '#1877F222', connected: false, handle: '', desc: 'Páginas, grupos e anúncios' },
  { id: 'youtube',     name: 'YouTube',             category: 'Social Media',    icon: '', bg: '#FF000022', connected: false, handle: '', desc: 'Vídeos, Shorts e comunidade' },
  { id: 'telegram',    name: 'Telegram',            category: 'Social Media',    icon: '', bg: '#229ED922', connected: false, handle: '', desc: 'Canais e grupos de broadcast' },

  // AI & LLM
  { id: 'openai',      name: 'OpenAI',              category: 'AI & LLM',        icon: '', bg: '#10A37F22', connected: false, handle: '', desc: 'GPT-4o para geração de copies e análise' },
  { id: 'claude',      name: 'Claude (Anthropic)',  category: 'AI & LLM',        icon: '', bg: '#D97F4B22', connected: false, handle: '', desc: 'IA avançada para raciocínio e criação' },

  // Sports Data
  { id: 'apifootball', name: 'API-Football',         category: 'Sports Data',     icon: '', bg: '#3ECF8E22', connected: false, handle: '', desc: 'Fixtures, ligas e estatísticas globais' },

  // Storage & Files
  { id: 'gdrive',      name: 'Google Drive',        category: 'Storage & Files', icon: '', bg: '#4285F422', connected: false, handle: '', desc: 'Armazenamento e compartilhamento na nuvem' },
  { id: 'dropbox',     name: 'Dropbox',             category: 'Storage & Files', icon: '', bg: '#0061FF22', connected: false, handle: '', desc: 'Sync de arquivos e pastas compartilhadas' },
  { id: 's3',          name: 'Amazon S3',           category: 'Storage & Files', icon: '', bg: '#FF990022', connected: false, handle: '', desc: 'Object storage escalável para assets' },

  // Analytics
  { id: 'ga4',         name: 'Google Analytics 4',  category: 'Analytics',       icon: '', bg: '#E8710022', connected: false, handle: '', desc: 'Métricas de web e comportamento' },
  { id: 'metaads',     name: 'Meta Ads',            category: 'Analytics',       icon: '', bg: '#0866FF22', connected: false, handle: '', desc: 'Performance de anúncios no Meta' },

  // Productivity
  { id: 'gcal',        name: 'Google Calendar',     category: 'Productivity',    icon: '', bg: '#4285F422', connected: false, handle: '', desc: 'Sincronizar calendário de conteúdo' },
  { id: 'slack',       name: 'Slack',               category: 'Productivity',    icon: '', bg: '#4A154B22', connected: false, handle: '', desc: 'Notificações e aprovações pelo Slack' },
  { id: 'notion',      name: 'Notion',              category: 'Productivity',    icon: '', bg: '#00000022', connected: false, handle: '', desc: 'Sync de tasks e documentos' },

  // Webhooks & Dev
  { id: 'zapier',      name: 'Zapier',              category: 'Webhooks & Dev',  icon: '', bg: '#FF4A0022', connected: false, handle: '', desc: 'Automações com +5000 apps' },
  { id: 'webhooks',    name: 'Webhooks',            category: 'Webhooks & Dev',  icon: '', bg: '#3ECF8E22', connected: false, handle: '', desc: 'HTTP endpoints para eventos customizados' },
] as const

export const CMD_ACTIONS: CmdAction[] = [
  // Navegação
  { section: 'Navegar', icon: 'LayoutDashboard', name: 'Dashboard',           view: 'dashboard',    kbd: 'G D' },
  { section: 'Navegar', icon: 'Activity',        name: 'Timeline',            view: 'timeline',     kbd: 'G T' },
  { section: 'Navegar', icon: 'Zap',             name: 'War Room',            view: 'warroom',      kbd: 'G W' },
  { section: 'Navegar', icon: 'KanbanSquare',    name: 'Pipeline',            view: 'pipeline',     kbd: 'G P' },
  { section: 'Navegar', icon: 'CalendarDays',    name: 'Calendar',            view: 'calendar',     kbd: 'G C' },
  { section: 'Navegar', icon: 'Send',            name: 'Multipost',           view: 'multipost',    kbd: 'G M' },
  { section: 'Navegar', icon: 'Sparkles',        name: 'Prompts',             view: 'prompts',      kbd: 'G O' },
  { section: 'Navegar', icon: 'FolderOpen',      name: 'Assets',              view: 'assets',       kbd: 'G A' },
  { section: 'Navegar', icon: 'CheckSquare',     name: 'Aprovações',          view: 'approvals',    kbd: '' },
  { section: 'Navegar', icon: 'BarChart3',       name: 'Analytics',           view: 'analytics',    kbd: '' },
  { section: 'Navegar', icon: 'Plug',            name: 'Integrações',         view: 'integrations', kbd: '' },
  // Ações
  { section: 'Ações',   icon: 'Plus',            name: 'Nova Task',           action: 'newTask',    kbd: 'N T' },
  { section: 'Ações',   icon: 'CalendarPlus',    name: 'Agendar Post',        action: 'newPost',    kbd: 'N P' },
  { section: 'Ações',   icon: 'Sparkles',        name: '✦ IA — Gerar caption', action: 'aiCaption', kbd: '⌘I' },
  { section: 'Ações',   icon: 'Clock',           name: '✦ IA — Sugerir horário', action: 'aiSchedule', kbd: '' },
  // Sistema
  { section: 'Sistema', icon: 'Sun',             name: 'Alternar tema',       action: 'toggleTheme', kbd: '⌘⇧T' },
]

export const SHORTCUT_HINTS = [
  { keys: '⌘K', desc: 'Abrir Command Palette' },
  { keys: '⌘I', desc: 'Abrir AI Bar' },
  { keys: 'ESC', desc: 'Fechar overlay' },
  { keys: 'G D', desc: 'Dashboard' },
  { keys: 'G T', desc: 'Timeline' },
  { keys: 'G W', desc: 'War Room' },
  { keys: 'G P', desc: 'Pipeline' },
  { keys: 'G C', desc: 'Calendar' },
  { keys: 'G M', desc: 'Multipost' },
  { keys: 'G A', desc: 'Assets' },
  { keys: 'N T', desc: 'Nova Task' },
  { keys: 'N P', desc: 'Novo Post' },
  { keys: '?', desc: 'Mostrar atalhos' },
]
