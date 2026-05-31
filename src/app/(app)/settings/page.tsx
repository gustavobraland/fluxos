'use client'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { User, Shield, Sliders, Building2, Camera, Sun, Moon, Check, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useWorkspaceStore, type BrandVoice } from '@/store/useWorkspaceStore'
import { useI18nStore, SUPPORTED_LOCALES } from '@/store/useI18nStore'

type Tab = 'profile' | 'security' | 'preferences' | 'workspace' | 'brandvoice'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',     label: 'Perfil',        icon: User },
  { id: 'security',   label: 'Segurança',     icon: Shield },
  { id: 'preferences',label: 'Preferências',  icon: Sliders },
  { id: 'brandvoice', label: 'Brand Voice',   icon: Sparkles },
  { id: 'workspace',  label: 'Workspace',     icon: Building2 },
]

// ─── Field components ─────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = 'text', placeholder, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  hint?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPassword && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: 38,
            padding: isPassword ? '0 40px 0 12px' : '0 12px',
            borderRadius: 8,
            fontSize: 13,
            background: 'var(--s2)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--txt)',
            fontFamily: 'Sora, sans-serif',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,.4)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--txt3)',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {hint && <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{hint}</span>}
    </div>
  )
}

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 36,
        padding: '0 20px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        background: saved ? 'var(--green)' : 'var(--grad)',
        color: saved ? '#000' : '#fff',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.2s',
      }}
    >
      {saved && <Check size={14} />}
      {saved ? 'Salvo!' : 'Salvar alterações'}
    </button>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function ProfileTab() {
  const [name, setName]   = useState('Admin')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSave() {
    if (!name.trim()) { toast.error('Nome é obrigatório'); return }
    setSaved(true)
    toast.success('Perfil atualizado com sucesso')
    setTimeout(() => setSaved(false), 3000)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (máx 5MB)'); return }
    const url = URL.createObjectURL(file)
    setAvatar(url)
    toast.success('Foto atualizada')
  }

  const initials = name.trim().slice(0, 2).toUpperCase() || 'AD'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Avatar section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: 20,
        background: 'var(--s2)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatar ? (
            <img
              src={avatar}
              alt="avatar"
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#2563EB,#A78BFA)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              color: '#fff',
            }}>
              {initials}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--blue)',
              border: '2px solid var(--s2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#000',
            }}
          >
            <Camera size={11} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>Foto de perfil</div>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 8 }}>JPG, PNG ou WebP · Máx 5MB</div>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              height: 28,
              padding: '0 12px',
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 600,
              background: 'transparent',
              color: 'var(--txt2)',
              border: '1px solid var(--border-mid)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Alterar foto
          </button>
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Nome completo" value={name} onChange={setName} placeholder="Seu nome" />
        </div>
        <Field label="E-mail" value={email} onChange={setEmail} type="email" placeholder="seu@email.com" />
        <Field label="Telefone" value={phone} onChange={setPhone} placeholder="+55 11 99999-9999" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  )
}

function SecurityTab() {
  const [current, setCurrent] = useState('')
  const [next, setNext]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [saved, setSaved]     = useState(false)
  const [twoFA, setTwoFA]     = useState(false)

  function handleSave() {
    if (!current) { toast.error('Digite sua senha atual'); return }
    if (next.length < 8) { toast.error('Nova senha deve ter ao menos 8 caracteres'); return }
    if (next !== confirm) { toast.error('As senhas não coincidem'); return }
    setSaved(true)
    toast.success('Senha atualizada com sucesso')
    setCurrent(''); setNext(''); setConfirm('')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Password change */}
      <div style={{
        padding: 20,
        background: 'var(--s2)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>Alterar senha</div>
        <Field label="Senha atual" value={current} onChange={setCurrent} type="password" placeholder="••••••••" />
        <Field label="Nova senha" value={next} onChange={setNext} type="password" placeholder="••••••••" hint="Mínimo 8 caracteres" />
        <Field label="Confirmar nova senha" value={confirm} onChange={setConfirm} type="password" placeholder="••••••••" />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton onClick={handleSave} saved={saved} />
        </div>
      </div>

      {/* 2FA toggle */}
      <div style={{
        padding: 20,
        background: 'var(--s2)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>
            Autenticação de dois fatores
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
            Adiciona uma camada extra de segurança ao seu login.
          </div>
        </div>
        <button
          onClick={() => { setTwoFA(v => !v); toast(twoFA ? '2FA desativado' : '2FA ativado') }}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: twoFA ? 'var(--green)' : 'var(--s3)',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 3,
            left: twoFA ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,.3)',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>
    </div>
  )
}

function PreferencesTab() {
  const { theme, setTheme } = useAppStore()
  const { locale, setLocale } = useI18nStore()
  const [notifEmail, setNotifEmail] = useState(() => (typeof localStorage !== 'undefined' ? localStorage.getItem('flux-notif-email') !== '0' : true))
  const [notifPush, setNotifPush]   = useState(() => (typeof localStorage !== 'undefined' ? localStorage.getItem('flux-notif-push') === '1' : false))
  const [saved, setSaved] = useState(false)

  function handleSave() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('flux-notif-email', notifEmail ? '1' : '0')
      localStorage.setItem('flux-notif-push', notifPush ? '1' : '0')
    }
    setSaved(true)
    toast.success('Preferências salvas')
    setTimeout(() => setSaved(false), 3000)
  }

  function ToggleRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{sub}</div>}
        </div>
        <button
          onClick={() => onChange(!value)}
          style={{
            width: 44, height: 24, borderRadius: 12,
            background: value ? 'var(--green)' : 'var(--s3)',
            border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute', top: 3,
            left: value ? 23 : 3,
            width: 18, height: 18, borderRadius: '50%', background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,.3)', transition: 'left 0.2s',
          }} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Theme */}
      <div style={{
        padding: 20, background: 'var(--s2)', borderRadius: 12,
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 14 }}>Tema</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['dark', 'light'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              style={{
                flex: 1,
                height: 64,
                borderRadius: 10,
                border: theme === t ? '2px solid var(--blue)' : '1px solid var(--border-subtle)',
                background: t === 'dark' ? '#0e0e14' : '#f5f5f7',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'border 0.15s',
              }}
            >
              {t === 'dark'
                ? <Moon size={18} style={{ color: '#A78BFA' }} />
                : <Sun size={18} style={{ color: '#D97706' }} />
              }
              <span style={{ fontSize: 11, fontWeight: 600, color: t === 'dark' ? '#fff' : '#111' }}>
                {t === 'dark' ? 'Escuro' : 'Claro'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div style={{
        padding: 20, background: 'var(--s2)', borderRadius: 12,
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 14 }}>Idioma</div>
        <select
          value={locale}
          onChange={e => setLocale(e.target.value as typeof locale)}
          style={{
            width: '100%', height: 38, padding: '0 12px', borderRadius: 8,
            fontSize: 13, background: 'var(--s3)', border: '1px solid var(--border-subtle)',
            color: 'var(--txt)', fontFamily: 'inherit', outline: 'none',
          }}
        >
          {SUPPORTED_LOCALES.map(l => (
            <option key={l.id} value={l.id}>{l.flag} {l.nativeLabel}</option>
          ))}
        </select>
        <p style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 8 }}>
          Muda o idioma do sistema na hora (igual ao seletor da barra superior).
        </p>
      </div>

      {/* Notifications */}
      <div style={{
        padding: '8px 20px 16px', background: 'var(--s2)', borderRadius: 12,
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
          Notificações
        </div>
        <ToggleRow label="E-mail" sub="Receba alertas no seu e-mail" value={notifEmail} onChange={setNotifEmail} />
        <ToggleRow label="Push" sub="Notificações no navegador" value={notifPush} onChange={setNotifPush} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  )
}

function WorkspaceTab() {
  const [wsName, setWsName] = useState(process.env.NEXT_PUBLIC_WORKSPACE_NAME || '')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    if (!wsName.trim()) { toast.error('Nome do workspace é obrigatório'); return }
    setSaved(true)
    toast.success('Workspace atualizado. Recarregue a página para aplicar.')
    setTimeout(() => setSaved(false), 3000)
  }

  const initials = wsName.trim().slice(0, 2).toUpperCase() || 'FX'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{
        padding: 20, background: 'var(--s2)', borderRadius: 12,
        border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>Identidade do Workspace</div>

        {/* Logo preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'var(--grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#fff',
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{wsName || 'Flux OS'}</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)' }}>Plano Pro</div>
          </div>
        </div>

        <Field
          label="Nome do workspace"
          value={wsName}
          onChange={setWsName}
          placeholder="Nome do seu workspace"
          hint="Defina NEXT_PUBLIC_WORKSPACE_NAME no .env.local para persistir entre deploys."
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton onClick={handleSave} saved={saved} />
        </div>
      </div>
    </div>
  )
}

function BrandVoiceTab() {
  const { brandVoice, setBrandVoice } = useWorkspaceStore()
  const [hashtagsText, setHashtagsText] = useState(brandVoice.hashtags.join(', '))
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const hashtags = hashtagsText
      .split(',')
      .map(h => h.trim().replace(/^#/, ''))
      .filter(Boolean)
    setBrandVoice({ hashtags })
    setSaved(true)
    toast.success('Brand voice salva')
    setTimeout(() => setSaved(false), 3000)
  }

  function ToggleRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{sub}</div>}
        </div>
        <button
          onClick={() => onChange(!value)}
          style={{
            width: 44, height: 24, borderRadius: 12,
            background: value ? 'var(--green)' : 'var(--s3)',
            border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute', top: 3,
            left: value ? 23 : 3,
            width: 18, height: 18, borderRadius: '50%', background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,.3)', transition: 'left 0.2s',
          }} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{
        padding: 20, background: 'var(--s2)', borderRadius: 12,
        border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>
            Voz da marca
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
            Usada pela IA ao refinar as copies no Multipost.
          </div>
        </div>

        <Field
          label="Tom de voz"
          value={brandVoice.tone}
          onChange={(v) => setBrandVoice({ tone: v })}
          placeholder="Ex: Energético, direto, apaixonado por esporte"
        />
        <Field
          label="Evitar"
          value={brandVoice.avoid}
          onChange={(v) => setBrandVoice({ avoid: v })}
          placeholder="Ex: Linguagem corporativa, clichês"
        />
        <Field
          label="Hashtags padrão"
          value={hashtagsText}
          onChange={setHashtagsText}
          placeholder="Ex: braland, futebol, brasileirao"
          hint="Separe por vírgulas. O # é opcional."
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)' }}>Idioma</label>
          <select
            value={brandVoice.language}
            onChange={(e) => setBrandVoice({ language: e.target.value as BrandVoice['language'] })}
            style={{
              width: '100%', height: 38, padding: '0 12px', borderRadius: 8,
              fontSize: 13, background: 'var(--s3)', border: '1px solid var(--border-subtle)',
              color: 'var(--txt)', fontFamily: 'Sora, sans-serif', outline: 'none',
            }}
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en">Inglês</option>
            <option value="es">Espanhol</option>
            <option value="hybrid">Híbrido (PT + EN)</option>
          </select>
        </div>

        <ToggleRow
          label="Emojis"
          sub="Permitir que a IA use emojis nas copies"
          value={brandVoice.emojis}
          onChange={(v) => setBrandVoice({ emojis: v })}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton onClick={handleSave} saved={saved} />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')
  const ActiveTab = {
    profile:     <ProfileTab />,
    security:    <SecurityTab />,
    preferences: <PreferencesTab />,
    brandvoice:  <BrandVoiceTab />,
    workspace:   <WorkspaceTab />,
  }[tab]

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{
        width: 200, flexShrink: 0, borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', padding: '16px 8px', gap: 2,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', padding: '4px 12px 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Configurações
        </div>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 8,
                border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                background: active ? 'var(--s2)' : 'transparent',
                color: active ? 'var(--txt)' : 'var(--txt2)',
                display: 'flex', alignItems: 'center', gap: 9,
                fontSize: 13, fontWeight: active ? 600 : 400,
                transition: 'background 0.15s',
                borderLeft: active ? '2px solid var(--blue)' : '2px solid transparent',
              }}
            >
              <Icon size={14} style={{ color: active ? 'var(--blue)' : 'var(--txt3)', flexShrink: 0 }} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div style={{ maxWidth: 560 }}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {ActiveTab}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
