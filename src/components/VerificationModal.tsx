'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, Loader2, CheckCircle2, AlertCircle, FileText, RefreshCw, Download } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

interface VerificationModalProps {
    rider: any
    isOpen: boolean
    onClose: () => void
    onVerificationStarted?: () => void
}

type VerificationView = 'initiate' | 'status'

export default function VerificationModal({ rider, isOpen, onClose, onVerificationStarted }: VerificationModalProps) {
    const [view, setView] = useState<VerificationView>('initiate')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [statusData, setStatusData] = useState<any>(null)
    const [checkingStatus, setCheckingStatus] = useState(false)

    const hasActiveVerification = rider?.springverify_status && rider.springverify_status !== 'not_initiated'

    useEffect(() => {
        if (isOpen) {
            setError(null)
            setSuccess(false)
            if (hasActiveVerification) {
                setView('status')
                fetchStatus()
            } else {
                setView('initiate')
            }
        }
    }, [isOpen, rider?.id])

    const fetchStatus = async () => {
        setCheckingStatus(true)
        setError(null)
        try {
            const res = await fetch(`${API_BASE}/admin/riders/${rider.id}/verification`, { cache: 'no-store' })
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json()
            setStatusData(data)
        } catch (e: any) {
            setError(e.message || 'Failed to fetch status')
        } finally {
            setCheckingStatus(false)
        }
    }

    const handleInitiate = async () => {
        setLoading(true)
        setError(null)
        try {
            const body: any = {}
            if (rider.email) body.email = rider.email

            const res = await fetch(`${API_BASE}/admin/riders/${rider.id}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok) {
                const detail = await res.json().catch(() => ({ detail: 'Unknown error' }))
                throw new Error(detail.detail || `Error ${res.status}`)
            }
            setSuccess(true)
            onVerificationStarted?.()
            setTimeout(() => {
                setView('status')
                fetchStatus()
            }, 1500)
        } catch (e: any) {
            setError(e.message || 'Failed to initiate verification')
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadReport = () => {
        window.open(`${API_BASE}/admin/riders/${rider.id}/verification/report`, '_blank')
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'verified':
                return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle2, label: 'Verified' }
            case 'failed':
                return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertCircle, label: 'Failed' }
            case 'in_progress':
                return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Loader2, label: 'In Progress' }
            case 'insufficiency':
                return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertCircle, label: 'Insufficiency' }
            default:
                return { color: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10', icon: ShieldCheck, label: 'Not Initiated' }
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-[#0A0A0A] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Background Verification</h2>
                                <p className="text-xs text-muted-foreground">{rider?.name} · {rider?.phone}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        {view === 'initiate' && !success && (
                            <div className="space-y-6">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                                    <p className="text-sm font-medium text-white/80">Rider Details for Verification</p>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Name</p>
                                            <p className="text-white/90">{rider?.name || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Phone</p>
                                            <p className="text-white/90">{rider?.phone || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Email</p>
                                            <p className="text-white/90">{rider?.email || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Date of Birth</p>
                                            <p className="text-white/90">{rider?.date_of_birth || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Father&apos;s Name</p>
                                            <p className="text-white/90">{rider?.father_name || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Address</p>
                                            <p className="text-white/90">{rider?.address || '—'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
                                    <p className="text-xs text-yellow-400/80">
                                        <strong>Note:</strong> This will send the rider&apos;s details to SpringVerify for a comprehensive background check.
                                        The verification typically takes 3-7 business days. Status will be automatically updated.
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}

                        {success && (
                            <div className="flex flex-col items-center gap-4 py-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', duration: 0.5 }}
                                >
                                    <CheckCircle2 className="w-16 h-16 text-green-400" />
                                </motion.div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-white">Verification Initiated!</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        SpringVerify has started processing the background check.
                                    </p>
                                </div>
                            </div>
                        )}

                        {view === 'status' && (
                            <div className="space-y-4">
                                {checkingStatus ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    </div>
                                ) : statusData ? (
                                    <>
                                        {/* Status badge */}
                                        {(() => {
                                            const cfg = getStatusConfig(statusData.springverify_status)
                                            const Icon = cfg.icon
                                            return (
                                                <div className={`p-4 ${cfg.bg} border ${cfg.border} rounded-2xl flex items-center gap-3`}>
                                                    <Icon className={`w-6 h-6 ${cfg.color} ${statusData.springverify_status === 'in_progress' ? 'animate-spin' : ''}`} />
                                                    <div>
                                                        <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            SV Case ID: {statusData.springverify_candidate_id || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        {/* Timeline */}
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Initiated</span>
                                                <span className="text-white/80 font-mono text-xs">
                                                    {statusData.springverify_initiated_at
                                                        ? new Date(statusData.springverify_initiated_at).toLocaleString()
                                                        : '—'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Completed</span>
                                                <span className="text-white/80 font-mono text-xs">
                                                    {statusData.springverify_completed_at
                                                        ? new Date(statusData.springverify_completed_at).toLocaleString()
                                                        : 'Pending...'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Report download */}
                                        {statusData.springverify_status === 'verified' && (
                                            <button
                                                onClick={handleDownloadReport}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm font-medium text-green-400 hover:bg-green-500/20 transition-all"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download Verification Report
                                            </button>
                                        )}

                                        {error && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                                                {error}
                                            </div>
                                        )}
                                    </>
                                ) : error ? (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                                        {error}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/20">
                        {view === 'initiate' && !success && (
                            <>
                                <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInitiate}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(255,51,102,0.3)] transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    {loading ? 'Sending...' : 'Send for Verification'}
                                </button>
                            </>
                        )}
                        {view === 'status' && (
                            <>
                                <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">
                                    Close
                                </button>
                                <button
                                    onClick={fetchStatus}
                                    disabled={checkingStatus}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/15 transition-all disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                                    Refresh Status
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
