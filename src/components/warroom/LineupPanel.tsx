'use client'
import { Users, Sparkles } from 'lucide-react'
import { useWarRoomStore, type TeamLineup } from '@/store/useWarRoomStore'

function TeamColumn({ side }: { side: TeamLineup | null }) {
  if (!side || side.players.length === 0) {
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--txt3)', padding: '8px 0' }}>
          Escalação não disponível
        </div>
      </div>
    )
  }
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: 'var(--txt)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {side.teamName}
        </span>
        {side.formation && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--blue)' }}>
            {side.formation}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {side.players.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--txt3)',
              width: 18, textAlign: 'right', flexShrink: 0,
            }}>
              {p.number ?? '–'}
            </span>
            <span style={{
              color: 'var(--txt2)', flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {p.name}
            </span>
            {p.pos && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: 'var(--txt3)',
                background: 'var(--s3)', borderRadius: 4, padding: '0 4px', flexShrink: 0,
              }}>
                {p.pos}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Official / probable lineups for both sides. Fetched once and cached in the
// store. When the official XI isn't published yet, shows the "Provável" badge.
export function LineupPanel() {
  const lineup = useWarRoomStore(s => s.lineup)

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--border-subtle)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <Users size={13} style={{ color: 'var(--txt2)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>Escalação</span>
        <span style={{
          marginLeft: 'auto', fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.04em', borderRadius: 99, padding: '2px 8px',
          color: lineup?.available ? 'var(--green)' : 'var(--yellow)',
          background: lineup?.available ? 'rgba(62,207,142,0.12)' : 'rgba(245,200,66,0.12)',
          border: `1px solid ${lineup?.available ? 'rgba(62,207,142,0.25)' : 'rgba(245,200,66,0.25)'}`,
        }}>
          {lineup?.available ? 'Oficial' : 'Provável'}
        </span>
      </div>

      <div style={{ padding: 14 }}>
        {!lineup ? (
          <div style={{ fontSize: 11, color: 'var(--txt3)', textAlign: 'center', padding: '12px 0' }}>
            Carregando escalação…
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16 }}>
            <TeamColumn side={lineup.home} />
            <div style={{ width: 1, background: 'var(--border-subtle)', flexShrink: 0 }} />
            <TeamColumn side={lineup.away} />
          </div>
        )}
      </div>

      {lineup && !lineup.available && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(167,139,250,0.06)',
        }}>
          <Sparkles size={11} style={{ color: '#A78BFA', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: 'var(--txt3)' }}>
            Escalação oficial sai ~1h antes do apito — atualiza automaticamente.
          </span>
        </div>
      )}
    </div>
  )
}
