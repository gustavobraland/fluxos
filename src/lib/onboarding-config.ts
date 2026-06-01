// ─── Onboarding por papel (BraLand) ───────────────────────────────────────────
// Mapeia email → papel, e o conteúdo do onboarding por papel.

export type Role =
  | 'ceo' | 'admin' | 'project_manager' | 'redator' | 'produtor'
  | 'social_media' | 'designer_lider' | 'designer' | 'influencer' | 'rh'

export interface TeamMember { email: string; role: Role; name: string }

// Ordem de exibição dos papéis na seleção do onboarding.
export const ROLE_ORDER: Role[] = [
  'ceo', 'admin', 'project_manager', 'redator', 'produtor',
  'social_media', 'designer', 'designer_lider', 'influencer', 'rh',
]

// Rótulo curto do papel, exibido em badges (Topbar / Sidebar).
export const ROLE_LABELS: Record<Role, string> = {
  ceo: 'CEO',
  admin: 'Admin',
  project_manager: 'Gerente de Projetos',
  redator: 'Redator',
  produtor: 'Produtor',
  social_media: 'Social Media',
  designer_lider: 'Designer Líder',
  designer: 'Designer',
  influencer: 'Influencer',
  rh: 'RH',
}

export const TEAM: TeamMember[] = [
  { email: 'jaden@braland.com.br',    role: 'ceo',             name: 'Jaden' },
  { email: 'gustavo@braland.com.br',  role: 'admin',           name: 'Gustavo' },
  { email: 'larissa@braland.com.br',  role: 'project_manager', name: 'Larissa' },
  { email: 'joao@braland.com.br',     role: 'project_manager', name: 'João' },
  { email: 'wesley@braland.com.br',   role: 'redator',         name: 'Wesley' },
  { email: 'mirelli@braland.com.br',  role: 'produtor',        name: 'Mirelli' },
  { email: 'bruna@braland.com.br',    role: 'social_media',    name: 'Bruna' },
  { email: 'wesleyd@braland.com.br',  role: 'designer_lider',  name: 'Wesley D' },
  { email: 'juliano@braland.com.br',  role: 'designer',        name: 'Juliano' },
  { email: 'davi@braland.com.br',     role: 'designer',        name: 'Davi' },
  { email: 'nicolas@braland.com.br',  role: 'designer',        name: 'Nicolas' },
  { email: 'silvonei@braland.com.br', role: 'influencer',      name: 'Silvonei' },
  { email: 'julietta@braland.com.br', role: 'influencer',      name: 'Julietta' },
  { email: 'braga@braland.com.br',    role: 'influencer',      name: 'Braga' },
  { email: 'barba@braland.com.br',    role: 'influencer',      name: 'Barba' },
  { email: 'andressa@braland.com.br', role: 'rh',              name: 'Andressa' },
]

export interface OnboardingModule { icon: string; title: string; desc: string }
export interface OnboardingContent { greeting: string; subtitle: string; modules: OnboardingModule[] }

export const ONBOARDING_CONTENT: Record<Role, OnboardingContent> = {
  ceo: {
    greeting: 'Bem-vindo ao Flux OS, Jaden.',
    subtitle: 'Visão completa da operação da BraLand em tempo real.',
    modules: [
      { icon: '◎', title: 'Dashboard', desc: 'Métricas da operação, posts publicados, performance da equipe.' },
      { icon: '⚡', title: 'War Room', desc: 'Operação ao vivo durante jogos. Gol detectado, arte gerada, post publicado.' },
      { icon: '◎', title: 'Analytics', desc: 'Performance real das redes sociais. Insights por tipo de conteúdo e horário.' },
    ],
  },
  admin: {
    greeting: 'Bem-vindo, Gustavo.',
    subtitle: 'Você tem acesso total ao Flux OS.',
    modules: [
      { icon: '◫', title: 'Pipeline', desc: 'Gerencie todo o fluxo de produção da equipe em um kanban.' },
      { icon: '⚡', title: 'War Room', desc: 'Centro de operações ao vivo. Gerencie posts durante os jogos.' },
      { icon: '⬡', title: 'Integrações', desc: 'Configure as conexões com Instagram, TikTok, Telegram e mais.' },
    ],
  },
  project_manager: {
    greeting: 'Bem-vindo ao Flux OS!',
    subtitle: 'Você organiza o fluxo de produção da BraLand.',
    modules: [
      { icon: '📋', title: 'Briefing', desc: 'Crie briefings que viram tasks automaticamente para a equipe.' },
      { icon: '◫', title: 'Pipeline', desc: 'Acompanhe e aprove todo o conteúdo em produção.' },
      { icon: '📅', title: 'Calendar', desc: 'Visão completa do calendário editorial e jogos monitorados.' },
    ],
  },
  redator: {
    greeting: 'Bem-vindo ao Flux OS!',
    subtitle: 'Você cria e refina o conteúdo da BraLand.',
    modules: [
      { icon: '⚡', title: 'War Room', desc: 'Durante os jogos, você refina a copy gerada pela IA antes de publicar.' },
      { icon: '📤', title: 'Multipost', desc: 'Publique em Instagram, TikTok, Facebook e Telegram com copy adaptada por IA.' },
      { icon: '✦', title: 'Prompts', desc: 'Biblioteca de prompts prontos por categoria. Clique e use no Multipost.' },
    ],
  },
  produtor: {
    greeting: 'Bem-vinda ao Flux OS, Mirelli!',
    subtitle: 'Você garante a qualidade de tudo que sai da BraLand.',
    modules: [
      { icon: '✅', title: 'Aprovações', desc: 'Revise e aprove artes com comentários e pins diretamente na imagem.' },
      { icon: '◫', title: 'Pipeline', desc: 'Acompanhe o status de cada produção e mova cards entre etapas.' },
      { icon: '◎', title: 'Analytics', desc: 'Veja a performance dos posts publicados e insights por tipo de conteúdo.' },
    ],
  },
  social_media: {
    greeting: 'Bem-vinda ao Flux OS, Bruna!',
    subtitle: 'Você publica e distribui o conteúdo da BraLand.',
    modules: [
      { icon: '📤', title: 'Multipost', desc: 'Suba a arte, a IA adapta a copy para cada plataforma. Publique após aprovação.' },
      { icon: '⚡', title: 'War Room', desc: 'Durante os jogos, acompanhe a fila e publique conteúdo aprovado em segundos.' },
      { icon: '🗂', title: 'Assets', desc: 'Acesso rápido a emblemas dos 30 times e logos da marca BraLand.' },
    ],
  },
  designer_lider: {
    greeting: 'Bem-vindo ao Flux OS!',
    subtitle: 'Você lidera o design e aprova as artes da BraLand.',
    modules: [
      { icon: '✅', title: 'Aprovações', desc: 'Aprove artes com pins na imagem. Você é o único designer que aprova.' },
      { icon: '⚡', title: 'War Room', desc: 'Antes do jogo, prepare os pré-packs. Durante, ajuste artes geradas pela IA.' },
      { icon: '🗂', title: 'Assets', desc: 'Gerencie o acervo de fotos, emblemas e logos da marca.' },
    ],
  },
  designer: {
    greeting: 'Bem-vindo ao Flux OS!',
    subtitle: 'Você cria as artes da BraLand.',
    modules: [
      { icon: '📤', title: 'Multipost', desc: 'Suba sua arte e envie para aprovação. Publica automaticamente após aprovado.' },
      { icon: '✅', title: 'Aprovações', desc: 'Veja os comentários com pins na sua arte e suba a versão corrigida.' },
      { icon: '🗂', title: 'Assets', desc: 'Emblemas dos 30 times e logos da BraLand prontos para usar.' },
    ],
  },
  influencer: {
    greeting: 'Bem-vindo ao Flux OS!',
    subtitle: 'Publique seu conteúdo de forma rápida e organizada.',
    modules: [
      { icon: '📤', title: 'Multipost', desc: 'Suba seu vídeo ou foto, a IA gera a legenda. Publique direto sem aprovação.' },
      { icon: '✂', title: 'Clipador', desc: 'Cole o link do YouTube e a IA identifica os melhores trechos para clip.' },
      { icon: '✦', title: 'Prompts', desc: 'Use prompts prontos para legendas de gol, resultado e pré-jogo.' },
    ],
  },
  rh: {
    greeting: 'Bem-vinda ao Flux OS, Andressa!',
    subtitle: 'Gerencie as demandas internas da BraLand.',
    modules: [
      { icon: '📋', title: 'Briefing', desc: 'Receba e gerencie solicitações internas da equipe através do sistema.' },
      { icon: '◫', title: 'Pipeline', desc: 'Acompanhe as tasks atribuídas a você e o status de cada demanda.' },
      { icon: '⬡', title: 'Dashboard', desc: 'Visão geral das atividades e demandas em aberto.' },
    ],
  },
}

export function roleForEmail(email: string): Role {
  return TEAM.find(m => m.email.toLowerCase() === email.toLowerCase())?.role ?? 'admin'
}
