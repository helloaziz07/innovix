/**
 * Innovix — Auth Page (Login + Sign Up + Forgot Password)
 *
 * Production-level auth with:
 * - Email/password sign-in & sign-up
 * - OAuth (Google + GitHub)
 * - Cloudflare Turnstile CAPTCHA
 * - Email verification flow
 * - Password reset flow
 * - Form validation
 * - Premium glassmorphic design
 */

import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { Sparkles, Mail, Lock, User, ArrowLeft, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

type AuthMode = 'signin' | 'signup' | 'forgot'

// ─── Turnstile CAPTCHA Widget ────────────────────────────────
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string
        callback: (token: string) => void
        'expired-callback'?: () => void
        'error-callback'?: () => void
        theme?: 'light' | 'dark' | 'auto'
        size?: 'normal' | 'compact'
      }) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

function TurnstileWidget({
  onVerify,
  onExpire,
}: {
  onVerify: (token: string) => void
  onExpire: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string

  useEffect(() => {
    if (!siteKey || !containerRef.current) return

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current) return

      // Clear any existing widget
      if (widgetIdRef.current) {
        try { window.turnstile.remove(widgetIdRef.current) } catch {}
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        'expired-callback': onExpire,
        'error-callback': onExpire,
        theme: 'dark',
        size: 'normal',
      })
    }

    // If turnstile script is already loaded
    if (window.turnstile) {
      renderWidget()
    } else {
      // Wait for script to load
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval)
          renderWidget()
        }
      }, 100)

      return () => clearInterval(interval)
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current) } catch {}
      }
    }
  }, [siteKey, onVerify, onExpire])

  if (!siteKey) return null

  return <div ref={containerRef} className="flex justify-center my-3" />
}

// ─── Password Strength Indicator ────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
  ]
  const score = checks.filter((c) => c.met).length

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= score
                ? score <= 1
                  ? 'bg-red-500'
                  : score <= 2
                  ? 'bg-orange-500'
                  : score <= 3
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((check) => (
          <span
            key={check.label}
            className={`text-[10px] ${check.met ? 'text-green-400' : 'text-muted-foreground'}`}
          >
            {check.met ? '✓' : '○'} {check.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Main Auth Page ────────────────────────────────
export default function Login() {
  const navigate = useNavigate()
  const { isAuthenticated, signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail, resetPassword } = useAuthStore()

  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // Reset form when switching modes
  useEffect(() => {
    setError('')
    setSuccessMessage('')
    setPassword('')
    setConfirmPassword('')
    setCaptchaToken(undefined)
  }, [mode])

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token)
  }, [])

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(undefined)
  }, [])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setIsSubmitting(true)
    setError('')

    const result = await signInWithEmail(email, password, captchaToken)
    if (result.error) {
      setError(result.error)
    }
    setIsSubmitting(false)
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    setError('')

    const result = await signUpWithEmail(email, password, fullName, captchaToken)
    if (result.error) {
      setError(result.error)
    } else {
      // Account created and auto signed-in — redirect will happen via isAuthenticated effect
    }
    setIsSubmitting(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setIsSubmitting(true)
    setError('')

    const result = await resetPassword(email, captchaToken)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccessMessage('Password reset link sent! Check your email inbox.')
    }
    setIsSubmitting(false)
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('')
    if (provider === 'google') {
      await signInWithGoogle()
    } else {
      await signInWithGithub()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card border-white/10 glow-purple">
          <CardHeader className="text-center space-y-4">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-8 h-8 text-violet-400" />
              <span className="text-2xl font-bold gradient-text">Innovix</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <CardTitle className="text-2xl">
                  {mode === 'signin' && 'Welcome back'}
                  {mode === 'signup' && 'Create your account'}
                  {mode === 'forgot' && 'Reset password'}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {mode === 'signin' && 'Sign in to continue your research journey'}
                  {mode === 'signup' && 'Start building innovative projects today'}
                  {mode === 'forgot' && "We'll send you a reset link to your email"}
                </CardDescription>
              </motion.div>
            </AnimatePresence>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
                >
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── SIGN IN MODE ─── */}
            {mode === 'signin' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* OAuth Buttons */}
                <div className="space-y-3 mb-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12 text-base gap-3 hover:bg-white/5"
                    onClick={() => handleOAuth('google')}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12 text-base gap-3 hover:bg-white/5"
                    onClick={() => handleOAuth('github')}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    Continue with GitHub
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
                  </div>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-white/5 border-white/10 focus:border-violet-500/50"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-white/5 border-white/10 focus:border-violet-500/50"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* CAPTCHA */}
                  <TurnstileWidget onVerify={handleCaptchaVerify} onExpire={handleCaptchaExpire} />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing in...</>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                {/* Switch to Sign Up */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    Create one
                  </button>
                </p>
              </motion.div>
            )}

            {/* ─── SIGN UP MODE ─── */}
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleEmailSignUp} className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-12 bg-white/5 border-white/10 focus:border-violet-500/50"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-white/5 border-white/10 focus:border-violet-500/50"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password (8+ characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-white/5 border-white/10 focus:border-violet-500/50"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <PasswordStrength password={password} />

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 h-12 bg-white/5 border-white/10 focus:border-violet-500/50 ${
                        confirmPassword && confirmPassword !== password ? 'border-red-500/50' : ''
                      }`}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}

                  {/* CAPTCHA */}
                  <TurnstileWidget onVerify={handleCaptchaVerify} onExpire={handleCaptchaExpire} />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0"
                    disabled={isSubmitting || (!!confirmPassword && confirmPassword !== password)}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating account...</>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>

                {/* OAuth alt */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-muted-foreground">or sign up with</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 gap-2 hover:bg-white/5"
                    onClick={() => handleOAuth('google')}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-11 gap-2 hover:bg-white/5"
                    onClick={() => handleOAuth('github')}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </Button>
                </div>

                {/* Switch to Sign In */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}

            {/* ─── FORGOT PASSWORD MODE ─── */}
            {mode === 'forgot' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-white/5 border-white/10 focus:border-violet-500/50"
                      autoComplete="email"
                      required
                    />
                  </div>

                  {/* CAPTCHA */}
                  <TurnstileWidget onVerify={handleCaptchaVerify} onExpire={handleCaptchaExpire} />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>

                <button
                  onClick={() => setMode('signin')}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </button>
              </motion.div>
            )}

            {/* Back to home */}
            <Button
              variant="ghost"
              className="w-full text-muted-foreground mt-2"
              onClick={() => navigate('/')}
            >
              ← Back to home
            </Button>
          </CardContent>
        </Card>

        {/* Security note */}
        <p className="text-center text-[11px] text-muted-foreground/50 mt-4">
          Protected by Cloudflare Turnstile · Your data is encrypted end-to-end
        </p>
      </motion.div>
    </div>
  )
}
