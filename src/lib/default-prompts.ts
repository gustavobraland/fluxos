import type { Prompt } from '@/types/prompts'

const CREATED_AT = '2026-01-01T00:00:00.000Z'

// Biblioteca de prompts — mantida enxuta com um único modelo de relatório diário.
// Novos prompts podem ser criados pela equipe na própria tela de Prompts.
export const DEFAULT_PROMPTS: Prompt[] = [
  {
    id: 'relatorio-diario',
    title: 'Relatório diário',
    category: 'institucional',
    tone: 'Informativo',
    template: `Gere o relatório diário da operação BraLand para {{data}}.

Resuma de forma objetiva:
1. Conteúdos publicados hoje (plataforma, tema e desempenho inicial).
2. Jogos cobertos no War Room e principais lances aproveitados.
3. Tarefas concluídas no Pipeline e o que ficou pendente para amanhã.
4. Destaques de engajamento e oportunidades identificadas.

Tom profissional e direto. Finalize com 3 prioridades para o próximo dia.`,
    platforms: ['telegram'],
    tags: ['relatório', 'diário', 'operação'],
    usageCount: 0,
    createdAt: CREATED_AT,
    createdBy: 'Sistema',
  },
]
