// src/lib/copy-engine/templates.ts
// Templates determinísticos (custo zero) e o construtor de prompt para a IA.
// Tudo a partir de FATOS REAIS — nunca inventa placar, nomes, datas ou resultados.

import type { CopyEvent, CopyFacts } from './types'

export function scoreLine(f: CopyFacts): string {
  return `${f.homeTeam} ${f.scoreHome} x ${f.scoreAway} ${f.awayTeam}`
}

const min = (f: CopyFacts) => (f.minute ? ` · ${f.minute}'` : '')

// Caption determinística para qualquer evento (usada direto nos eventos de
// template e como fallback/base factual dos eventos de IA).
export function buildTemplate({ type, facts: f }: CopyEvent): string {
  switch (type) {
    case 'goal':
      return `⚽ GOL${f.teamName ? ` DO ${f.teamName.toUpperCase()}` : ''}!`
        + (f.scorer ? ` ${f.scorer}` : '')
        + `\n${scoreLine(f)}${min(f)}`
    case 'card':
      return `${f.cardType === 'red' ? '🟥 CARTÃO VERMELHO' : '🟨 CARTÃO AMARELO'}`
        + (f.player ? ` · ${f.player}` : '')
        + (f.teamName ? ` (${f.teamName})` : '')
        + `\n${scoreLine(f)}${min(f)}`
    case 'substitution':
      return `🔄 SUBSTITUIÇÃO${f.teamName ? ` · ${f.teamName}` : ''}`
        + (f.playerOut ? `\n↩️ Sai ${f.playerOut}` : '')
        + (f.playerIn ? `   ↪️ Entra ${f.playerIn}` : '')
        + min(f)
    case 'var':
      return `📺 VAR${f.note ? ` · ${f.note}` : ''}\n${scoreLine(f)}${min(f)}`
    case 'halftime':
      return `⏸️ INTERVALO\n${scoreLine(f)}`
    case 'fulltime':
      return `🏁 FIM DE JOGO\n${scoreLine(f)}`
    case 'preview':
      return `📅 ${f.homeTeam} x ${f.awayTeam}${f.league ? ` · ${f.league}` : ''}`
        + (f.note ? `\n${f.note}` : '')
    case 'classification':
      return f.note?.trim() || `Classificação · ${f.league ?? ''}`.trim()
    case 'breaking':
      return `🚨 ${f.note?.trim() || `${f.homeTeam} x ${f.awayTeam}`}`
    default:
      return scoreLine(f)
  }
}

// Descrição factual do evento em PT, pra alimentar a IA (sem inventar nada).
function factsBlock(type: string, f: CopyFacts): string {
  const lines = [
    `Evento: ${type}`,
    `Partida: ${f.homeTeam} x ${f.awayTeam}`,
    `Placar atual: ${f.scoreHome} x ${f.scoreAway}`,
  ]
  if (f.minute != null) lines.push(`Minuto: ${f.minute}'`)
  if (f.league) lines.push(`Competição: ${f.league}`)
  if (f.teamName) lines.push(`Time do evento: ${f.teamName}`)
  if (f.scorer) lines.push(`Autor do gol: ${f.scorer}`)
  if (f.player) lines.push(`Jogador: ${f.player}`)
  if (f.cardType) lines.push(`Cartão: ${f.cardType === 'red' ? 'vermelho' : 'amarelo'}`)
  if (f.playerOut) lines.push(`Sai: ${f.playerOut}`)
  if (f.playerIn) lines.push(`Entra: ${f.playerIn}`)
  if (f.result) lines.push(`Resultado (nosso time): ${f.result === 'win' ? 'vitória' : f.result === 'loss' ? 'derrota' : 'empate'}`)
  if (f.note) lines.push(`Contexto: ${f.note}`)
  return lines.join('\n')
}

// Prompt de geração (1º estágio / direto).
export function buildAiPrompt(type: string, f: CopyFacts, brandVoice?: string): string {
  return `Você é um redator social de futebol. Escreva UMA legenda curta (1–3 linhas), em
português do Brasil, pronta para postar nas redes, sobre o evento abaixo.

REGRAS:
- Use APENAS os fatos fornecidos. NÃO invente placar, nomes, minutos, datas ou estatísticas.
- Tom empolgado e direto de torcida/clube; pode usar 1–2 emojis e até 2 hashtags relevantes.
- Não use markdown, aspas ao redor, nem rótulos. Devolva só o texto da legenda.
${brandVoice ? `- Voz da marca: ${brandVoice}\n` : ''}
FATOS:
${factsBlock(type, f)}`
}

// Prompt de refino (2º estágio — Sonnet melhora o rascunho do Gemini).
export function buildRefinePrompt(draft: string, type: string, f: CopyFacts, brandVoice?: string): string {
  return `Refine a legenda abaixo para uma publicação de futebol em português do Brasil.
Mantenha-se 100% fiel aos FATOS (não invente nada), deixe mais natural, impactante e
com bom ritmo. Devolva só o texto final (sem markdown, sem aspas, sem rótulos).
${brandVoice ? `Voz da marca: ${brandVoice}\n` : ''}
FATOS:
${factsBlock(type, f)}

RASCUNHO:
${draft}`
}
