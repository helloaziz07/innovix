import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
import { useAuthStore } from '@/stores/authStore'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { isDisposableEmail } from '@/lib/email-validator'

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
                : 'bg-white dark:bg-[#111827]/10'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((check) => (
          <span
            key={check.label}
            className={`text-[10px] ${check.met ? 'text-green-400' : 'text-slate-400'}`}
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
    
    // Prevent disposable emails
    if (isDisposableEmail(email)) {
      setError('Please use a legitimate email address. Disposable emails are not allowed.')
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
    } else if (result.needsVerification) {
      // Show success message and switch to signin mode
      setSuccessMessage('Verification email sent! Please check your inbox and verify your email to log in.')
      setMode('signin')
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
    <div className="min-h-screen flex selection:bg-blue-200 selection:text-blue-900 font-sans">
      
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden flex-col justify-between p-12">
        {/* Deep blue gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 z-0"></div>
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 z-0"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 z-0"></div>
        
        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/logo.jpg" alt="Innovix Logo" className="w-8 h-8 rounded shrink-0 object-contain" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Innovix</h1>
        </div>
        
        {/* Center Content */}
        <div className="relative z-10 max-w-lg mb-24">
          <h2 className="text-4xl md:text-5xl leading-[1.1] font-bold text-white mb-6">
            Architect your next <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">big breakthrough.</span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed max-w-md">
            The intelligent workspace for creators to map dependencies, analyze markets, and structure projects instantly.
          </p>
        </div>
        
        {/* Bottom Footer or Detail */}
        <div className="relative z-10">
          <p className="text-sm text-slate-500">© 2026 Innovix Inc. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 bg-slate-50 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo (Only visible on small screens) */}
          <div className="lg:hidden flex justify-center items-center gap-3 mb-8 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.jpg" alt="Innovix Logo" className="w-8 h-8 rounded shrink-0 object-contain" />
            <h1 className="text-2xl font-bold text-blue-600 tracking-tight">Innovix</h1>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
            
            {/* Form Header */}
            <div className="mb-8 text-center">
              <h3 className="text-[24px] font-bold text-slate-900 mb-2">
                {mode === 'signin' && 'Welcome Back'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h3>
              <p className="text-sm text-slate-600">
                {mode === 'signin' && 'Sign in to continue your flow.'}
                {mode === 'signup' && 'Start building innovative projects today.'}
                {mode === 'forgot' && "We'll send you a reset link."}
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100"
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
                  className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-50 text-green-600 text-sm border border-green-100"
                >
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* OAuth Buttons (Only show on sign in/up) */}
            {mode !== 'forgot' && (
              <>
                <div className="flex gap-3 mb-6">
                  <button 
                    onClick={() => handleOAuth('google')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all duration-300 text-sm text-slate-900 font-medium"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                    </svg>
                    Google
                  </button>
                  <button 
                    onClick={() => handleOAuth('github')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all duration-300 text-sm text-slate-900 font-medium"
                  >
                    <svg className="w-5 h-5 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
                    </svg>
                    GitHub
                  </button>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">or email</span>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>
              </>
            )}

            {/* Form */}
            <form 
              className="space-y-4" 
              onSubmit={
                mode === 'signin' ? handleEmailSignIn : 
                mode === 'signup' ? handleEmailSignUp : 
                handleForgotPassword
              }
            >
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600 block ml-1">Full Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none" 
                      placeholder="Alex Alchemist" 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600 block ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none" 
                    placeholder="alchemist@innovix.ai" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] uppercase font-bold text-slate-600 block">Password</label>
                    {mode === 'signin' && (
                      <button type="button" onClick={() => setMode('forgot')} className="text-[12px] text-blue-600 hover:text-blue-700 transition-colors">
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none" 
                      placeholder="••••••••" 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={mode === 'signup' ? 8 : undefined}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors focus:outline-none"
                    >
                      {showPassword ? <Eye className="w-5 h-5 text-slate-400" /> : <EyeOff className="w-5 h-5 text-slate-400" />}
                    </button>
                  </div>
                  {mode === 'signup' && <PasswordStrength password={password} />}
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600 block ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      className={`w-full bg-white border rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none ${
                        confirmPassword && confirmPassword !== password ? 'border-red-500' : 'border-slate-200'
                      }`}
                      placeholder="••••••••" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* CAPTCHA */}
              <TurnstileWidget onVerify={handleCaptchaVerify} onExpire={handleCaptchaExpire} />

              <button 
                type="submit" 
                disabled={isSubmitting || (mode === 'signup' && !!confirmPassword && confirmPassword !== password)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-3 rounded-xl transition-all duration-300 mt-4 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                </span>
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              {mode === 'signin' ? "Don't have an account? " : mode === 'signup' ? "Already have an account? " : "Remembered your password? "}
              <button 
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {mode === 'signin' ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
