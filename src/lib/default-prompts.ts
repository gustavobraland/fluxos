import type { Prompt } from '@/types/prompts'

const CREATED_AT = '2026-01-01T00:00:00.000Z'

export const DEFAULT_PROMPTS: Prompt[] = [
  {
    id: 'gol-dramatico',
    title: 'Gol dramático nos acréscimos',
    category: 'gol',
    tone: 'Eufórico',
    template: `GOOOOOL NOS ACRÉSCIMOS! ⚽🔥

{{time}} marca no finalzinho e arranca a vitória de virada! Que jogo, minha gente!

{{placar}}

#{{time}} #Futebol #Brasileirao`,
    platforms: ['instagram', 'twitter', 'facebook'],
    tags: ['gol', 'acréscimos', 'virada'],
    usageCount: 0,
    createdAt: CREATED_AT,
    createdBy: 'Sistema',
  },
  {
    id: 'vitoria-goleada',
    title: 'Vitória por goleada',
    category: 'resultado',
    tone: 'Eufórico',
    template: `QUE GOLEADA! 🏆💥

{{time}} não teve piedade! {{placar}} e mais três pontos no bolso!

Quem foi o melhor em campo? Comenta aqui! 👇

#{{time}} #Goleada #Futebol`,
    platforms: ['instagram', 'facebook', 'twitter'],
    tags: ['goleada', 'vitória', 'resultado'],
    usageCount: 0,
    createdAt: CREATED_AT,
    createdBy: 'Sistema',
  },
  {
    id: 'derrota-respeitosa',
    title: 'Derrota — tom respeitoso',
    category: 'resultado',
    tone: 'Respeitoso',
    template: `Não foi dessa vez. 💪

{{placar}}

Cabeça erguida e foco no próximo jogo. A torcida nunca abandona!

#{{time}} #Futebol`,
    platforms: ['instagram', 'facebook'],
    tags: ['derrota', 'respeito', 'torcida'],
    usageCount: 0,
    createdAt: CREATED_AT,
    createdBy: 'Sistema',
  },
  {
    id: 'hype-pre-jogo',
    title: 'Hype pré-jogo',
    category: 'pre-jogo',
    tone: 'Animado',
    template: `É HOJE! ⚡

{{time_casa}} x {{time_fora}}
{{horario}} | {{competicao}}

Quem você acha que vence? 🔥

#{{time_casa}} #{{time_fora}} #Futebol`,
    platforms: ['instagram', 'twitter', 'telegram', 'facebook'],
    tags: ['pré-jogo', 'hype', 'confronto'],
    usageCount: 0,
    createdAt: CREATED_AT,
    createdBy: 'Sistema',
  },
  {
    id: 'odds-semana',
    title: 'Odds da semana — iGaming',
    category: 'igaming',
    tone: 'Informativo',
    template: `🎯 AS MELHORES ODDS DA SEMANA!

{{jogo_1}} → {{odd_1}}
{{jogo_2}} → {{odd_2}}
{{jogo_3}} → {{odd_3}}

Aposte com responsabilidade. +18 🔞

#BraBet #Apostas #Odds`,
    platforms: ['telegram', 'instagram', 'facebook'],
    tags: ['odds', 'apostas', 'igaming'],
    usageCount: 0,
    createdAt: CREATED_AT,
    createdBy: 'Sistema',
  },
  {
    id: 'enquete-engajamento',
    title: 'Enquete de engajamento',
    category: 'engajamento',
    tone: 'Descontraído',
    template: `Hora da enquete! 🗳️

{{pergunta}}

A) {{opcao_a}}
B) {{opcao_b}}

Comenta aqui embaixo! 👇

#Futebol #Enquete`,
    platforms: ['instagram', 'facebook', 'telegram'],
    tags: ['enquete', 'engajamento', 'interação'],
    usageCount: 0,
    createdAt: CREATED_AT,
    createdBy: 'Sistema',
  },
  {
    id: 'pre-jogo-igaming',
    title: 'Hype pré-jogo com odds — iGaming',
    category: 'igaming',
    tone: 'Animado',
    template: `⚡ {{time_casa}} x {{time_fora}} — É HOJE!

As odds estão imperdíveis:
🏆 Vitória {{time_casa}}: {{odd_casa}}
🤝 Empate: {{odd_empate}}
⚽ Vitória {{time_fora}}: {{odd_fora}}

Aposte agora na BraBet! Link na bio 🔗

+18 | Jogue com responsabilidade

#BraBet #{{time_casa}} #{{time_fora}}`,
    platforms: ['telegram', 'instagram'],
    tags: ['pré-jogo', 'odds', 'igaming'],
    usageCount: 0,
    createdAt: CREATED_AT,
    createdBy: 'Sistema',
  },
  {
    id: 'gol-guerra',
    title: 'Gol no War Room — formato rápido',
    category: 'gol',
    tone: 'Urgente',
    template: `⚽ {{minuto}}' — GOOOOOL DE {{jogador}}!

{{time_casa}} {{gols_casa}} x {{gols_fora}} {{time_fora}}

#{{time_casa}} #AoVivo #Futebol`,
    platforms: ['twitter', 'telegram'],
    tags: ['gol', 'war room', 'ao vivo'],
    usageCount: 0,
    createdAt: CREATED_AT,
    createdBy: 'Sistema',
  },
]
