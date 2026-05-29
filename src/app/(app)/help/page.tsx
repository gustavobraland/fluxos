'use client'

import { HelpCircle, BookOpen, MessageCircle, FileText, ExternalLink } from 'lucide-react'

const SECTIONS = [
  {
    icon: BookOpen,
    title: 'Documentação',
    desc: 'Guias de uso, tutoriais e referência completa da plataforma.',
    status: 'Em breve',
  },
  {
    icon: MessageCircle,
    title: 'Chat com Suporte',
    desc: 'Fale com nossa equipe em tempo real para resolver dúvidas.',
    status: 'Em breve',
  },
  {
    icon: FileText,
    title: 'Base de Conhecimento',
    desc: 'Artigos, FAQs e respostas para as perguntas mais comuns.',
    status: 'Em breve',
  },
]

export default function HelpPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
        background: 'var(--s1)',
      }}>
        <HelpCircle size={16} style={{ color: 'var(--txt2)' }} />
        <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>
          Ajuda & Suporte
        </h1>
      </div>

      {/* Body */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        gap: 40,
      }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'var(--s2)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <HelpCircle size={28} style={{ color: 'var(--txt3)' }} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt)', margin: '0 0 10px' }}>
            Central de Ajuda
          </h2>
          <p style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.7, margin: 0 }}>
            Nossa central de suporte está em desenvolvimento.
            Em breve você terá acesso a documentação completa, tutoriais e suporte ao vivo.
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 200px)',
          gap: 14,
        }}>
          {SECTIONS.map(section => {
            const Icon = section.icon
            return (
              <div
                key={section.title}
                style={{
                  background: 'var(--s1)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  padding: '20px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  opacity: 0.7,
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--s2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon size={18} style={{ color: 'var(--txt2)' }} />
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>
                    {section.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', lineHeight: 1.5 }}>
                    {section.desc}
                  </div>
                </div>

                <span style={{
                  alignSelf: 'flex-start',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--txt3)',
                  background: 'var(--s3)',
                  padding: '2px 8px',
                  borderRadius: 99,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {section.status}
                </span>
              </div>
            )
          })}
        </div>

        {/* Contact prompt */}
        <div style={{
          padding: '16px 24px',
          background: 'var(--s2)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          maxWidth: 460,
          width: '100%',
        }}>
          <MessageCircle size={20} style={{ color: 'var(--blue)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 2 }}>
              Precisa de ajuda agora?
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
              Entre em contato diretamente com nossa equipe.
            </div>
          </div>
          <a
            href="mailto:suporte@fluxos.app"
            style={{
              height: 32,
              padding: '0 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              background: 'var(--blue)',
              color: '#000',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <ExternalLink size={11} />
            Contato
          </a>
        </div>
      </div>
    </div>
  )
}
