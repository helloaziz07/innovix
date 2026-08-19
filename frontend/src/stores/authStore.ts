/**
 * Innovix — Auth Store (Zustand)
 *
 * Full production-level authentication:
 * - Email/password sign-up with email verification
 * - Email/password sign-in
 * - OAuth (Google + GitHub)
 * - Password reset flow
 * - CAPTCHA token support (Cloudflare Turnstile)
 */

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  credits: number
  referralCode: string | null

  // Actions
  initialize: () => Promise<void>
  fetchProfile: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithGithub: () => Promise<void>
  signInWithEmail: (email: string, password: string, captchaToken?: string) => Promise<{ error?: string }>
  signUpWithEmail: (email: string, password: string, fullName: string, captchaToken?: string) => Promise<{ error?: string; needsVerification?: boolean }>
  resetPassword: (email: string, captchaToken?: string) => Promise<{ error?: string }>
  updatePassword: (newPassword: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  credits: 1,
  referralCode: null,

  fetchProfile: async () => {
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        // We use fetch since api.ts might have circular dependency or just use supabase
        // Actually, let's just fetch it using API
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`
          }
        })
        if (response.ok) {
          const profile = await response.json()
          set({ credits: profile.credits || 0, referralCode: profile.referral_code })
        }
      }
    } catch (e) {
      console.error("Failed to fetch profile", e)
    }
  },

  initialize: async () => {
    try {
      // Get existing session
      const { data: { session } } = await supabase.auth.getSession()
      set({
        user: session?.user ?? null,
        session,
        isAuthenticated: !!session,
        isLoading: false,
      })
      if (session) {
        get().fetchProfile()
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          user: session?.user ?? null,
          session,
          isAuthenticated: !!session,
          isLoading: false,
        })
        if (session) {
          get().fetchProfile()
        }
      })
    } catch {
      set({ isLoading: false })
    }
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
  },

  signInWithGithub: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
  },

  signInWithEmail: async (email: string, password: string, captchaToken?: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. Please check and try again.' }
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Please verify your email before signing in. Check your inbox.' }
      }
      return { error: error.message }
    }

    return {}
  },

  signUpWithEmail: async (email: string, password: string, fullName: string, captchaToken?: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        captchaToken,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'This email is already registered. Try signing in instead.' }
      }
      if (error.message.includes('password')) {
        return { error: 'Password must be at least 6 characters long.' }
      }
      return { error: error.message }
    }

    // If email confirmation is enabled, user.identities will be empty until confirmed
    const needsVerification = !data.session
    if (needsVerification) {
      return { needsVerification: true }
    }

    // If Supabase has email confirmation disabled, session is returned immediately
    return {}
  },

  resetPassword: async (email: string, captchaToken?: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken,
    })

    if (error) {
      return { error: error.message }
    }

    return {}
  },

  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { error: error.message }
    }

    return {}
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, isAuthenticated: false })
  },
}))
