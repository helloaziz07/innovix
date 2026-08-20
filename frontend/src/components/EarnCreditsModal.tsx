import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Copy, Check, Gift } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/lib/api'
import { getDeviceId } from '@/lib/fingerprint'
import { Button } from '@/components/ui/button'

export function EarnCreditsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { credits, referralCode, fetchProfile } = useAuthStore()
  const [redeemCode, setRedeemCode] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const getInviteLink = () => `${window.location.origin}/login?ref=${referralCode}`

  const handleCopy = () => {
    if (referralCode) {
      navigator.clipboard.writeText(getInviteLink())
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!redeemCode.trim()) return
    setIsLoading(true)
    setError('')
    setSuccess('')
    try {
      const deviceId = await getDeviceId()
      await authApi.redeemReferral(redeemCode, deviceId)
      setSuccess('Referral code applied successfully!')
      fetchProfile()
      setRedeemCode('')
    } catch (err: any) {
      console.error("Redeem error:", err)
      let apiError = 'Invalid referral code'
      if (err.response?.data) {
        const data = err.response.data
        apiError = typeof data === 'string' ? data : (data.detail || data.message || JSON.stringify(data))
      } else if (err.message) {
        apiError = err.message
      }
      setError(apiError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Earn Free Generations
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                You currently have <strong className="text-blue-600 dark:text-blue-400">{credits}</strong> credits. You get 1 free credit every 24 hours.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Gift className="w-4 h-4 text-purple-500" />
                  Refer a Friend
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Share this invite link with a friend. When they sign up, you get +1 credit automatically!
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-x-auto whitespace-nowrap bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 dark:text-slate-300">
                    {referralCode ? getInviteLink() : 'Loading...'}
                  </div>
                  <Button onClick={handleCopy} variant="outline" size="sm" className="shrink-0 gap-2">
                    {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {isCopied ? 'Copied' : 'Copy Link'}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Or</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Have a referral code?</h3>
                <form onSubmit={handleRedeem} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code (e.g. inv-12345)"
                      value={redeemCode}
                      onChange={e => setRedeemCode(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <Button type="submit" disabled={!redeemCode.trim() || isLoading} className="shrink-0">
                      Redeem
                    </Button>
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  {success && <p className="text-xs text-green-500">{success}</p>}
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
