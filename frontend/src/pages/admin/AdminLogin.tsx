import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import {
  Lock, Mail, AlertCircle, Eye, EyeOff,
  Loader2, KeyRound, CheckCircle2, ArrowLeft, Clock,
} from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

type Step = 'login' | 'forgot-email' | 'forgot-sent' | 'reset-password' | 'reset-done'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, loading: authLoading, isLoggedIn } = useAdminAuth()
  const { t } = useLanguage()
  const admin = t.admin

  // ── Detect reset token in URL (?resetToken=xxx) ────────────────────────────
  const urlToken = searchParams.get('resetToken') || ''

  // ── Step state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(() => urlToken ? 'reset-password' : 'login')

  // ── Login state ────────────────────────────────────────────────────────────
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  // Lockout
  const [lockedUntil, setLockedUntil]   = useState<Date | null>(null)
  const [countdown, setCountdown]       = useState(0)

  // ── Forgot password state ──────────────────────────────────────────────────
  const [fpEmail, setFpEmail]           = useState('')
  const [fpLoading, setFpLoading]       = useState(false)
  const [fpError, setFpError]           = useState('')

  // ── Reset password state ───────────────────────────────────────────────────
  const [rpToken, setRpToken]           = useState(urlToken)
  const [rpNewPw, setRpNewPw]           = useState('')
  const [rpShowPw, setRpShowPw]         = useState(false)
  const [rpLoading, setRpLoading]       = useState(false)
  const [rpError, setRpError]           = useState('')

  // ── Countdown timer for lockout ────────────────────────────────────────────
  useEffect(() => {
    if (!lockedUntil) return
    const tick = () => {
      const remaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockedUntil(null)
        setCountdown(0)
        setError('')
      } else {
        setCountdown(remaining)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lockedUntil])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-brand-green" />
          <p className="text-sm text-slate-300">{admin.checkingSession}</p>
        </div>
      </div>
    )
  }

  // Already authenticated — redirect to dashboard
  if (isLoggedIn) {
    return <Navigate to="/Admin/dashboard" replace />
  }

  // ── Login submit ───────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lockedUntil) return
    if (!email || !password) { setError(admin.enterEmailPassword); return }
    setError(''); setLoading(true)
    try {
      await login(email, password)
      navigate('/Admin/dashboard', { replace: true })
    } catch (err: any) {
      const msg = err?.message || 'Login failed'
      // Parse lockout response
      if (msg.toLowerCase().includes('locked')) {
        // Try to extract lockedUntil from the error if the API sends it
        setLockedUntil(new Date(Date.now() + 10 * 60 * 1000))
        setError(msg)
      } else {
        setError(msg)
      }
    } finally { setLoading(false) }
  }

  // ── Forgot password: send reset email ─────────────────────────────────────
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fpEmail) { setFpError('Enter your registered email address'); return }
    setFpError(''); setFpLoading(true)
    try {
      const res = await fetch(`${BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Request failed')
      setStep('forgot-sent')
    } catch (err: any) {
      setFpError(err.message || 'Request failed. Please try again.')
    } finally { setFpLoading(false) }
  }

  // ── Reset password: submit new password ───────────────────────────────────
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rpToken) { setRpError('Reset token is missing. Please use the link from your email.'); return }
    if (!rpNewPw || rpNewPw.length < 6) { setRpError('Password must be at least 6 characters'); return }
    setRpError(''); setRpLoading(true)
    try {
      const res = await fetch(`${BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rpToken, newPassword: rpNewPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Reset failed')
      setStep('reset-done')
      // Clean the URL
      window.history.replaceState({}, '', '/Admin')
    } catch (err: any) {
      setRpError(err.message || 'Reset failed. The link may have expired.')
    } finally { setRpLoading(false) }
  }

  const fmtCountdown = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <AnimatePresence mode="wait">

            {/* ────────────────── LOGIN ────────────────── */}
            {step === 'login' && (
              <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-green/10 dark:bg-brand-green/20 mb-4">
                    <Lock className="h-8 w-8 text-brand-green" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{admin.adminLogin}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">MESOB Sululta Branch Management</p>
                </div>

                {/* Lockout banner */}
                <AnimatePresence>
                  {lockedUntil && countdown > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <Clock className="h-5 w-5 text-red-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-400">Account temporarily locked</p>
                        <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                          Too many failed attempts. Try again in{' '}
                          <span className="font-bold font-mono text-red-700 dark:text-red-300">{fmtCountdown(countdown)}</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && !lockedUntil && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.common.emailLabel}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="admin@example.com" autoComplete="email" disabled={!!lockedUntil}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{admin.passwordLabel}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type={showPassword ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)} placeholder={admin.enterPassword}
                        autoComplete="current-password" disabled={!!lockedUntil}
                        className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <button type="button" onClick={() => { setStep('forgot-email'); setError('') }}
                      className="text-xs text-brand-green hover:underline font-medium">
                      {admin.forgotPassword}?
                    </button>
                  </div>

                  <motion.button type="submit" disabled={loading || !!lockedUntil}
                    whileHover={!lockedUntil ? { scale: 1.01 } : {}} whileTap={!lockedUntil ? { scale: 0.99 } : {}}
                    className={cn('w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-brand-green hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-brand-green', (loading || !!lockedUntil) && 'opacity-60 cursor-not-allowed')}>
                    {loading
                      ? <><Loader2 className="h-4 w-4 animate-spin" />{admin.signingIn}</>
                      : <><Lock className="h-4 w-4" />{admin.signIn}</>}
                  </motion.button>
                </form>

                <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
                  Authorized personnel only · Unauthorized access is prohibited
                </p>
              </motion.div>
            )}

            {/* ────────────────── FORGOT — ENTER EMAIL ────────────────── */}
            {step === 'forgot-email' && (
              <motion.div key="forgot-email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/20 mb-4">
                    <KeyRound className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{admin.forgotPassword}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Enter your admin email. We'll send a reset link to that address.
                  </p>
                </div>

                {fpError && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />{fpError}
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.common.emailAddress}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                        placeholder="admin@example.com" autoFocus
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                  </div>

                  <button type="submit" disabled={fpLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60">
                    {fpLoading
                      ? <><Loader2 className="h-4 w-4 animate-spin" />{admin.sending}</>
                      : <><Mail className="h-4 w-4" />{admin.sendResetLink}</>}
                  </button>

                  <button type="button" onClick={() => { setStep('login'); setFpError(''); setFpEmail('') }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <ArrowLeft className="h-4 w-4" /> {admin.backToLogin}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ────────────────── FORGOT — EMAIL SENT ────────────────── */}
            {step === 'forgot-sent' && (
              <motion.div key="forgot-sent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                  <Mail className="h-8 w-8 text-brand-green" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{admin.checkEmail}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                  If <span className="font-medium text-gray-700 dark:text-gray-300">{fpEmail}</span> is registered,
                  a password reset link has been sent to that address.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                  The link expires in 1 hour. Check your spam folder if you don't see it.
                </p>

                <button onClick={() => { setStep('login'); setFpEmail('') }}
                  className="flex items-center justify-center gap-2 mx-auto px-6 py-2.5 rounded-lg font-semibold text-white bg-brand-green hover:bg-brand-green-dark">
                  <ArrowLeft className="h-4 w-4" /> {admin.backToLogin}
                </button>
              </motion.div>
            )}

            {/* ────────────────── RESET PASSWORD (from email link) ────────────────── */}
            {step === 'reset-password' && (
              <motion.div key="reset-password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/20 mb-4">
                    <KeyRound className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{admin.setNewPassword}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter your new password below.</p>
                </div>

                {rpError && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />{rpError}
                  </div>
                )}

                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{admin.newPasswordLabel}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type={rpShowPw ? 'text' : 'password'} value={rpNewPw}
                        onChange={e => setRpNewPw(e.target.value)} placeholder={admin.minPassword} autoFocus
                        className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                      <button type="button" onClick={() => setRpShowPw(!rpShowPw)} tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {rpShowPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={rpLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60">
                    {rpLoading
                      ? <><Loader2 className="h-4 w-4 animate-spin" />{admin.resetting}</>
                      : admin.resetPassword}
                  </button>

                  <button type="button" onClick={() => { setStep('login'); window.history.replaceState({}, '', '/Admin') }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <ArrowLeft className="h-4 w-4" /> {admin.backToLogin}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ────────────────── RESET DONE ────────────────── */}
            {step === 'reset-done' && (
              <motion.div key="reset-done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-brand-green" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{admin.passwordUpdated}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Your password has been reset successfully. You can now log in.
                </p>
                <button onClick={() => setStep('login')}
                  className="flex items-center justify-center gap-2 mx-auto px-6 py-2.5 rounded-lg font-semibold text-white bg-brand-green hover:bg-brand-green-dark">
                  <Lock className="h-4 w-4" /> {admin.goToLogin}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
