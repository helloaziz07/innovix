import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, Mail, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react'
import { invitationsApi } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

interface InviteDetails {
  invitation_id: string
  project_id: string
  project_title: string
  role: string
  email: string
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState<InviteDetails | null>(null)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link')
      setLoading(false)
      return
    }

    const fetchDetails = async () => {
      try {
        const res = await invitationsApi.getDetails(token)
        setDetails(res.data)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'This invitation is invalid or has expired.')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [token])

  const handleAccept = async () => {
    if (!token) return
    if (!user) {
      // Need to login first. In a real app, you might save the token to localStorage and redirect after login.
      navigate('/login?redirect=/invite/' + token)
      return
    }

    try {
      setAccepting(true)
      await invitationsApi.accept(token)
      // Redirect to the project
      navigate(`/projects/${details?.project_id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to accept invitation.')
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B1120]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0B1120]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 text-center"
      >
        {error ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invitation Error</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        ) : details ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <Mail className="w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              You've been invited!
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              You have been invited to collaborate on <br/>
              <span className="font-semibold text-slate-900 dark:text-white">"{details.project_title}"</span>
            </p>
            
            <div className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 mb-8 flex items-center justify-between text-left">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Role</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  {details.role}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-right">Invited Email</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                  {details.email}
                </p>
              </div>
            </div>
            
            {!user ? (
              <div className="w-full space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">You need to log in to accept.</p>
                <button 
                  onClick={handleAccept}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Log In or Sign Up
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleAccept}
                disabled={accepting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {accepting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Accept Invitation
              </button>
            )}
          </div>
        ) : null}
      </motion.div>
    </div>
  )
}
