export type PromptCategory =
  | 'gol'
  | 'resultado'
  | 'pre-jogo'
  | 'igaming'
  | 'institucional'
  | 'engajamento'
  | 'custom'

export interface Prompt {
  id: string
  title: string
  category: PromptCategory
  tone: string
  template: string
  platforms: string[]
  tags: string[]
  usageCount: number
  createdAt: string
  createdBy: string
}

export const PROMPT_CATEGORIES: { id: PromptCategory; label: string }[] = [
  { id: 'gol', label: 'Gol' },
  { id: 'resultado', label: 'Resultado' },
  { id: 'pre-jogo', label: 'Pré-jogo' },
  { id: 'igaming', label: 'iGaming' },
  { id: 'institucional', label: 'Institucional' },
  { id: 'engajamento', label: 'Engajamento' },
  { id: 'custom', label: 'Custom' },
]

export const CATEGORY_COLOR: Record<PromptCategory, string> = {
  gol: 'var(--green)',
  resultado: 'var(--blue)',
  'pre-jogo': 'var(--yellow)',
  igaming: 'var(--red)',
  institucional: 'var(--txt2)',
  engajamento: 'var(--blue)',
  custom: 'var(--txt3)',
}
