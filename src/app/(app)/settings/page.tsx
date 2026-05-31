'use client'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { User, Shield, Sliders, Building2, Camera, Sun, Moon, Check, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useWorkspaceStore, type BrandVoice } from '@/store/useWorkspaceStore'
import { useI18nStore, SUPPORTED_LOCALES } from '@/store/useI18nStore'
import { useTranslation } from '@/hooks/useTranslation'

type Tab = 'profile' | 'security' | 'preferences' | 'workspace' | 'brandvoice'

const TABS: { id: Tab; icon: React.ElementType }[] = [
  { id: 'profile',     icon: User },
  { id: 'security',    icon: Shield },
  { id: 'preferences', icon: Sliders },
  { id: 'brandvoice',  icon: Sparkles },
  { id: 'workspace',   icon: Building2 },
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
  const { t } = useTranslation()
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
      {saved ? t('settings.saved') : t('settings.saveChanges')}
    </button>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function ProfileTab() {
  const { t } = useTranslation()
  const [name, setName]   = useState('Admin')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSave() {
    if (!name.trim()) { toast.error(t('settings.profileTab.nameRequired')); return }
    setSaved(true)
    toast.success(t('settings.profileTab.profileUpdated'))
    setTimeout(() => setSaved(false), 3000)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error(t('settings.profileTab.imageTooLarge')); return }
    const url = URL.createObjectURL(file)
    setAvatar(url)
    toast.success(t('settings.profileTab.photoUpdated'))
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
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{t('settings.profileTab.avatarTitle')}</div>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 8 }}>{t('settings.profileTab.avatarHint')}</div>
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
            {t('settings.profileTab.changePhoto')}
          </button>
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label={t('settings.profileTab.fullName')} value={name} onChange={setName} placeholder={t('settings.profileTab.namePlaceholder')} />
        </div>
        <Field label={t('settings.profileTab.email')} value={email} onChange={setEmail} type="email" placeholder={t('settings.profileTab.emailPlaceholder')} />
        <Field label={t('settings.profileTab.phone')} value={phone} onChange={setPhone} placeholder={t('settings.profileTab.phonePlaceholder')} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  )
}

function SecurityTab() {
  const { t } = useTranslation()
  const [current, setCurrent] = useState('')
  const [next, setNext]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [saved, setSaved]     = useState(false)
  const [twoFA, setTwoFA]     = useState(false)

  function handleSave() {
    if (!current) { toast.error(t('settings.securityTab.currentRequired')); return }
    if (next.length < 8) { toast.error(t('settings.securityTab.minLength')); return }
    if (next !== confirm) { toast.error(t('settings.securityTab.noMatch')); return }
    setSaved(true)
    toast.success(t('settings.securityTab.passwordUpdated'))
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
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{t('settings.securityTab.changePassword')}</div>
        <Field label={t('settings.securityTab.currentPassword')} value={current} onChange={setCurrent} type="password" placeholder="••••••••" />
        <Field label={t('settings.securityTab.newPassword')} value={next} onChange={setNext} type="password" placeholder="••••••••" hint={t('settings.securityTab.newPasswordHint')} />
        <Field label={t('settings.securityTab.confirmPassword')} value={confirm} onChange={setConfirm} type="password" placeholder="••••••••" />
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
            {t('settings.securityTab.twoFactor')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
            {t('settings.securityTab.twoFactorDesc')}
          </div>
        </div>
        <button
          onClick={() => { setTwoFA(v => !v); toast(twoFA ? t('settings.securityTab.twoFAOff') : t('settings.securityTab.twoFAOn')) }}
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
  const { t } = useTranslation()
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
    toast.success(t('settings.prefsTab.saved'))
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
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 14 }}>{t('settings.theme')}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['dark', 'light'] as const).map(themeOpt => (
            <button
              key={themeOpt}
              onClick={() => setTheme(themeOpt)}
              style={{
                flex: 1,
                height: 64,
                borderRadius: 10,
                border: theme === themeOpt ? '2px solid var(--blue)' : '1px solid var(--border-subtle)',
                background: themeOpt === 'dark' ? '#0e0e14' : '#f5f5f7',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'border 0.15s',
              }}
            >
              {themeOpt === 'dark'
                ? <Moon size={18} style={{ color: '#A78BFA' }} />
                : <Sun size={18} style={{ color: '#D97706' }} />
              }
              <span style={{ fontSize: 11, fontWeight: 600, color: themeOpt === 'dark' ? '#fff' : '#111' }}>
                {themeOpt === 'dark' ? t('settings.dark') : t('settings.light')}
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
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 14 }}>{t('settings.language')}</div>
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
          {t('settings.prefsTab.languageHint')}
        </p>
      </div>

      {/* Notifications */}
      <div style={{
        padding: '8px 20px 16px', background: 'var(--s2)', borderRadius: 12,
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
          {t('settings.prefsTab.notifications')}
        </div>
        <ToggleRow label={t('settings.prefsTab.email')} sub={t('settings.prefsTab.emailSub')} value={notifEmail} onChange={setNotifEmail} />
        <ToggleRow label={t('settings.prefsTab.push')} sub={t('settings.prefsTab.pushSub')} value={notifPush} onChange={setNotifPush} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  )
}

function WorkspaceTab() {
  const { t } = useTranslation()
  const [wsName, setWsName] = useState(process.env.NEXT_PUBLIC_WORKSPACE_NAME || '')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    if (!wsName.trim()) { toast.error(t('settings.workspaceTab.nameRequired')); return }
    setSaved(true)
    toast.success(t('settings.workspaceTab.updated'))
    setTimeout(() => setSaved(false), 3000)
  }

  const initials = wsName.trim().slice(0, 2).toUpperCase() || 'FX'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{
        padding: 20, background: 'var(--s2)', borderRadius: 12,
        border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{t('settings.workspaceTab.identity')}</div>

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
            <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{t('settings.workspaceTab.plan')}</div>
          </div>
        </div>

        <Field
          label={t('settings.workspaceTab.name')}
          value={wsName}
          onChange={setWsName}
          placeholder={t('settings.workspaceTab.namePlaceholder')}
          hint={t('settings.workspaceTab.nameHint')}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton onClick={handleSave} saved={saved} />
        </div>
      </div>
    </div>
  )
}

function BrandVoiceTab() {
  const { t } = useTranslation()
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
    toast.success(t('settings.brandVoiceTab.saved'))
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
            {t('settings.brandVoiceTab.title')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
            {t('settings.brandVoiceTab.desc')}
          </div>
        </div>

        <Field
          label={t('settings.brandVoiceTab.tone')}
          value={brandVoice.tone}
          onChange={(v) => setBrandVoice({ tone: v })}
          placeholder={t('settings.brandVoiceTab.tonePlaceholder')}
        />
        <Field
          label={t('settings.brandVoiceTab.avoid')}
          value={brandVoice.avoid}
          onChange={(v) => setBrandVoice({ avoid: v })}
          placeholder={t('settings.brandVoiceTab.avoidPlaceholder')}
        />
        <Field
          label={t('settings.brandVoiceTab.hashtags')}
          value={hashtagsText}
          onChange={setHashtagsText}
          placeholder={t('settings.brandVoiceTab.hashtagsPlaceholder')}
          hint={t('settings.brandVoiceTab.hashtagsHint')}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)' }}>{t('settings.brandVoiceTab.language')}</label>
          <select
            value={brandVoice.language}
            onChange={(e) => setBrandVoice({ language: e.target.value as BrandVoice['language'] })}
            style={{
              width: '100%', height: 38, padding: '0 12px', borderRadius: 8,
              fontSize: 13, background: 'var(--s3)', border: '1px solid var(--border-subtle)',
              color: 'var(--txt)', fontFamily: 'Sora, sans-serif', outline: 'none',
            }}
          >
            <option value="pt-BR">{t('settings.brandVoiceTab.langPtBR')}</option>
            <option value="en">{t('settings.brandVoiceTab.langEn')}</option>
            <option value="es">{t('settings.brandVoiceTab.langEs')}</option>
            <option value="hybrid">{t('settings.brandVoiceTab.langHybrid')}</option>
          </select>
        </div>

        <ToggleRow
          label={t('settings.brandVoiceTab.emojis')}
          sub={t('settings.brandVoiceTab.emojisSub')}
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
  const { t } = useTranslation()
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
          {t('settings.title')}
        </div>
        {TABS.map(item => {
          const Icon = item.icon
          const active = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
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
              {t(`settings.tabs.${item.id}`)}
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
