'use client'

// Presence is a real-time collaboration feature.
// Until a proper auth + presence backend is connected,
// this shows only the current session indicator — no fake users.

export function PresenceAvatars() {
  return (
    <div className="flex items-center gap-2">
      {/* Current user online indicator */}
      <div
        className="relative w-[22px] h-[22px] rounded-full flex items-center justify-center select-none"
        style={{
          background: 'linear-gradient(135deg,#2563EB,#A78BFA)',
          fontSize: '7.5px',
          fontWeight: 700,
          color: '#fff',
          boxShadow: '0 0 0 1.5px var(--s1)',
        }}
        title="Você — sessão ativa"
      >
        Eu
        <span
          className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
          style={{ background: '#3ECF8E', boxShadow: '0 0 0 1px var(--s1)' }}
        />
      </div>
      <span className="text-[10px]" style={{ color: 'var(--txt3)' }}>
        1 ativo
      </span>
    </div>
  )
}
