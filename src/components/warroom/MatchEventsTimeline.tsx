'use client'
// ─── Linha do tempo de eventos do jogo ────────────────────────────────────────
// Cada lance da partida (alimentado direto da API + transições de status) aparece
// como um item. Um clique em "Deploy" gera o conteúdo (copy + arte DALL-E 3)
// daquele lance e envia para a fila de postagem manual logo abaixo.

import { Rocket, CheckCircle2, Radio } from 'lucide-react'
import { toast } from 'sonner'
import { useWarRoomStore, type MatchEvent, type MatchEventKind } from '@/store/useWarRoomStore'
import {
  triggerGoalContent,
  triggerHalftimeContent,
  triggerMatchEndContent,
  triggerCardContent,
  triggerSubContent,
  triggerVarContent,
  triggerPhaseContent,
} from '@/services/warroom-content'

const KIND_META: Record<MatchEventKind, { emoji: string; label: string; color: string }> = {
  goal:      { emoji: '⚽', label: 'Gol',                     color: 'var(--green)' },
  yellow:    { emoji: '🟨', label: 'Cartão amarelo',          color: 'var(--yellow)' },
  red:       { emoji: '🟥', label: 'Cartão vermelho',         color: 'var(--red)' },
  subst:     { emoji: '🔄', label: 'Substituição',            color: 'var(--blue)' },
  var:       { emoji: '📺', label: 'VAR',                     color: '#A78BFA' },
  halftime:  { emoji: '⏸️', label: 'Intervalo',               color: 'var(--txt2)' },
  fulltime:  { emoji: '🏁', label: 'Fim de jogo',             color: 'var(--txt)' },
  extratime: { emoji: '⏱️', label: 'Prorrogação',             color: 'var(--orange)' },
  penalties: { emoji: '🥅', label: 'Pênaltis',                color: 'var(--red)' },
  break:     { emoji: '⏸️', label: 'Intervalo da prorrogação', color: 'var(--txt2)' },
}

export function MatchEventsTimeline() {
  const events = useWarRoomStore(s => s.events)

  // Dispara a geração de conteúdo (copy + arte) para o lance escolhido.
  const deploy = (ev: MatchEvent) => {
    const fx = useWarRoomStore.getState().activeFixture
    if (!fx) return
    const goals = ev.score
    const side = ev.side ?? 'home'
    switch (ev.kind) {
      case 'goal':
        triggerGoalContent(side, fx, goals, ev.player, ev.minute); break
      case 'yellow':
      case 'red':
        triggerCardContent(fx, goals, { side, player: ev.player, cardType: ev.kind === 'red' ? 'red' : 'yellow', minute: ev.minute }); break
      case 'subst':
        triggerSubContent(fx, goals, { side, playerIn: ev.player, playerOut: ev.assist, minute: ev.minute }); break
      case 'var':
        triggerVarContent(fx, goals, ev.detail); break
      case 'halftime':
        triggerHalftimeContent(fx, goals); break
      case 'fulltime':
        triggerMatchEndContent(fx, goals); break
      case 'extratime':
        triggerPhaseContent(fx, goals, 'extratime'); break
      case 'penalties':
        triggerPhaseContent(fx, goals, 'penalties'); break
      case 'break':
        triggerPhaseContent(fx, goals, 'break'); break
    }
    useWarRoomStore.getState().markEventDeployed(ev.id)
    toast.success('Conteúdo gerado — veja na fila de postagem abaixo ↓')
  }

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--border-subtle)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <Radio size={13} style={{ color: 'var(--green)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>Linha do tempo do jogo</span>
        {events.length > 0 && (
          <span style={{
            marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
            color: 'var(--green)', background: 'rgba(62,207,142,0.1)',
            border: '1px solid rgba(62,207,142,0.2)', borderRadius: 99, padding: '1px 8px',
          }}>
            {events.length}
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
            Aguardando o primeiro lance… ⚽
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>
            Gols, cartões, substituições, VAR, intervalo, prorrogação e fim de jogo aparecem aqui.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {events.map(ev => {
            const meta = KIND_META[ev.kind]
            const subtitle = [
              ev.player,
              ev.kind === 'subst' && ev.assist ? `↔ ${ev.assist}` : null,
              ev.teamName,
            ].filter(Boolean).join(' · ')

            return (
              <div key={ev.id} style={{
                borderBottom: '1px solid var(--border-subtle)',
                padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                {/* Minuto */}
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                  color: 'var(--txt3)', minWidth: 30, textAlign: 'right', flexShrink: 0,
                }}>
                  {ev.minute != null ? `${ev.minute}'` : '—'}
                </span>

                {/* Ícone + descrição */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{meta.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--txt3)',
                    }}>
                      {ev.score.home}-{ev.score.away}
                    </span>
                  </div>
                  {subtitle && (
                    <div style={{
                      fontSize: 11, color: 'var(--txt2)', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {subtitle}
                    </div>
                  )}
                </div>

                {/* Deploy */}
                {ev.deployed ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
                    fontSize: 11, fontWeight: 700, color: 'var(--green)',
                    background: 'rgba(62,207,142,0.1)', border: '1px solid rgba(62,207,142,0.25)',
                    borderRadius: 8, padding: '5px 10px',
                  }}>
                    <CheckCircle2 size={12} /> Gerado
                  </span>
                ) : (
                  <button
                    onClick={() => deploy(ev)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
                      height: 30, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
                      background: 'var(--grad)', border: 'none', color: '#fff',
                      fontSize: 12, fontWeight: 700,
                    }}
                  >
                    <Rocket size={12} /> Deploy
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
