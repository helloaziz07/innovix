import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Users, Mail, Shield, ShieldAlert, Check, Loader2, Trash2 } from 'lucide-react'
import { projectsApi } from '../../lib/api'

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  user_email?: string
  user_full_name?: string
  user_avatar?: string
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  created_at: string
}

interface TeamSettingsModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

export default function TeamSettingsModal({ projectId, isOpen, onClose }: TeamSettingsModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const res = await projectsApi.getMembers(projectId)
      setMembers(res.data.members || [])
      setInvitations(res.data.invitations || [])
    } catch (err) {
      console.error('Failed to load team', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchTeam()
      setSuccess('')
      setError('')
      setInviteEmail('')
    }
  }, [isOpen, projectId])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return

    try {
      setInviting(true)
      setError('')
      setSuccess('')
      await projectsApi.inviteMember(projectId, { email: inviteEmail, role: inviteRole })
      setSuccess(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      fetchTeam() // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    try {
      await projectsApi.removeMember(projectId, userId)
      fetchTeam()
    } catch (err) {
      console.error('Failed to remove member', err)
      alert('Failed to remove member')
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return
    try {
      await projectsApi.revokeInvitation(projectId, inviteId)
      fetchTeam()
    } catch (err: any) {
      console.error('Failed to revoke invitation', err)
      alert(err.response?.data?.detail || 'Failed to revoke invitation')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Share Project</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage who has access to this project</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* Invite Form */}
            <form onSubmit={handleInvite} className="mb-8">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Invite a collaborator
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="relative w-full sm:w-36">
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full pl-3 pr-8 py-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all outline-none"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Invite
                </button>
              </div>
              
              {/* Notifications */}
              {error && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><X className="w-3 h-3"/>{error}</p>}
              {success && <p className="mt-2 text-sm text-green-500 flex items-center gap-1"><Check className="w-3 h-3"/>{success}</p>}
            </form>

            {/* Members List */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 flex items-center justify-between">
                Project Members
                {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              </h3>
              
              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-inner">
                        {member.user_full_name ? member.user_full_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {member.user_full_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize flex items-center gap-1">
                          {member.role === 'owner' ? <ShieldAlert className="w-3 h-3 text-blue-500"/> : null}
                          {member.role}
                        </p>
                      </div>
                    </div>
                    {member.role !== 'owner' && (
                      <button 
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Pending Invitations
                </h3>
                <div className="space-y-3">
                  {invitations.map(invite => (
                    <div key={invite.id} className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent opacity-80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {invite.email}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                            Invited as {invite.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 rounded-md text-xs font-medium">
                          Pending
                        </span>
                        <button
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Revoke invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
