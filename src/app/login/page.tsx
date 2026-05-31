'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { FluxLogo } from '@/components/layout/FluxLogo'

function GoogleIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

const ALLOWED_DOMAINS = ['braland.com', 'braland.com.br', 'agency.com']

export default function LoginPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [mode, setMode] = useState<'domain' | 'email'>('domain')
  const [domain, setDomain] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'input' | 'verify' | 'done'>('input')

  const handleDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const clean = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
    if (!clean) { setError(t('login.errors.enterDomain')); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    // Simulate domain check — in prod, call API
    setStep('verify')
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) { setError(t('login.errors.emailRequired')); return }
    if (!password) { setError(t('login.errors.passwordRequired')); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setStep('done')
    await new Promise(r => setTimeout(r, 600))
    router.push('/pipeline')
  }

  const handleGoogle = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    router.push('/pipeline')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg)' }}
    >
      {/* Background brand blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #E0201A 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #E0201A 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-[400px]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-3">
            <FluxLogo size="lg" />
          </div>
          <div className="flex items-baseline gap-2">
            <span style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", fontWeight: 800, fontSize: 30, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--txt)' }}>FLUX</span>
            <span style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '0.04em', color: '#E0201A' }}>os</span>
          </div>
          <p className="text-[13px] mt-2" style={{ color: 'var(--txt2)' }}>{t('login.subtitle')}</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--s1)', border: '1px solid var(--border-mid)', boxShadow: '0 24px 64px rgba(0,0,0,.4)' }}
        >
          <AnimatePresence mode="wait">

            {/* Step: domain or email input */}
            {step === 'input' && (
              <motion.div key="input" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                {/* Mode tabs */}
                <div className="flex rounded-xl p-1 mb-5" style={{ background: 'var(--s2)' }}>
                  {(['domain', 'email'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => { setMode(m); setError('') }}
                      className="flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                      style={{
                        background: mode === m ? 'var(--s3)' : 'transparent',
                        color: mode === m ? 'var(--txt)' : 'var(--txt2)',
                      }}
                    >
                      {m === 'domain' ? t('login.tabDomain') : t('login.tabEmail')}
                    </button>
                  ))}
                </div>

                {mode === 'domain' ? (
                  <form onSubmit={handleDomainSubmit} className="space-y-4">
                    <div>
                      <label className="text-[11px] font-medium mb-1.5 block" style={{ color: 'var(--txt2)' }}>
                        {t('login.domainLabel')}
                      </label>
                      <div className="relative">
                        <input
                          value={domain}
                          onChange={e => setDomain(e.target.value)}
                          placeholder={t('login.domainPlaceholder')}
                          autoFocus
                          className="w-full h-10 px-3 rounded-xl text-[13px] outline-none"
                          style={{ background: 'var(--s2)', border: '1px solid var(--border-subtle)', color: 'var(--txt)' }}
                        />
                      </div>
                      <p className="text-[11px] mt-1.5" style={{ color: 'var(--txt3)' }}>
                        {t('login.domainHint')}
                      </p>
                    </div>

                    {error && <p className="text-[12px]" style={{ color: 'var(--red)' }}>{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2"
                      style={{ background: 'var(--grad)' }}
                    >
                      {loading ? <Loader2 size={15} className="animate-spin" /> : <><span>{t('login.continueBtn')}</span><ArrowRight size={15} /></>}
                    </button>

                    <div className="relative flex items-center gap-3">
                      <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                      <span className="text-[11px]" style={{ color: 'var(--txt3)' }}>{t('common.or')}</span>
                      <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogle}
                      disabled={loading}
                      className="w-full h-10 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-colors hover:bg-[var(--s3)]"
                      style={{ background: 'var(--s2)', color: 'var(--txt)', border: '1px solid var(--border-subtle)' }}
                    >
                      {loading ? <Loader2 size={15} className="animate-spin" /> : <><GoogleIcon size={15} /><span>{t('login.signInGoogle')}</span></>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleEmailLogin} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium mb-1.5 block" style={{ color: 'var(--txt2)' }}>{t('login.emailLabel')}</label>
                      <div className="relative">
                        <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--txt3)' }} />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder={t('login.emailPlaceholder')}
                          autoFocus
                          className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] outline-none"
                          style={{ background: 'var(--s2)', border: '1px solid var(--border-subtle)', color: 'var(--txt)' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium mb-1.5 block" style={{ color: 'var(--txt2)' }}>{t('login.passwordLabel')}</label>
                      <div className="relative">
                        <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--txt3)' }} />
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-10 pl-9 pr-10 rounded-xl text-[13px] outline-none"
                          style={{ background: 'var(--s2)', border: '1px solid var(--border-subtle)', color: 'var(--txt)' }}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--txt3)' }}>
                          {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" className="text-[11px]" style={{ color: 'var(--blue)' }}>{t('login.forgotPassword')}</button>
                    </div>

                    {error && <p className="text-[12px]" style={{ color: 'var(--red)' }}>{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 mt-1"
                      style={{ background: 'var(--grad)' }}
                    >
                      {loading ? <Loader2 size={15} className="animate-spin" /> : t('login.signInBtn')}
                    </button>

                    <div className="relative flex items-center gap-3">
                      <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                      <span className="text-[11px]" style={{ color: 'var(--txt3)' }}>{t('common.or')}</span>
                      <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogle}
                      disabled={loading}
                      className="w-full h-10 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-colors hover:bg-[var(--s3)]"
                      style={{ background: 'var(--s2)', color: 'var(--txt)', border: '1px solid var(--border-subtle)' }}
                    >
                      <GoogleIcon size={15} />
                      {t('login.signInGoogle')}
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {/* Step: domain verify / SSO redirect */}
            {step === 'verify' && (
              <motion.div key="verify" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="text-center py-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl" style={{ background: 'var(--s2)' }}>🏢</div>
                <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--txt)' }}>{t('login.domainFound')}</h3>
                <p className="text-[13px] mb-2" style={{ color: 'var(--txt2)' }}>
                  <strong style={{ color: 'var(--blue)' }}>{domain}</strong>
                </p>
                <p className="text-[12px] mb-5" style={{ color: 'var(--txt3)' }}>
                  {t('login.domainRedirecting')}
                </p>
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full h-10 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: 'var(--grad)' }}
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <><GoogleIcon size={15} /><span>{t('login.continueSso')}</span></>}
                </button>
                <button onClick={() => setStep('input')} className="mt-3 text-[12px]" style={{ color: 'var(--txt3)' }}>{t('common.back')}</button>
              </motion.div>
            )}

            {/* Step: success */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#3ECF8E22' }}>
                  <CheckCircle2 size={28} style={{ color: 'var(--green)' }} />
                </motion.div>
                <p className="text-[14px] font-medium" style={{ color: 'var(--txt)' }}>{t('login.signingIn')}</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-[11px]" style={{ color: 'var(--txt3)' }}>
            {t('login.noAccount')} <button className="font-medium" style={{ color: 'var(--blue)' }}>{t('login.contactTeam')}</button>
          </p>
          <LanguageSelector />
        </div>
      </motion.div>
    </div>
  )
}
