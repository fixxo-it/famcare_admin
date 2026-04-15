'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Siren, Headphones, MicOff, Phone, MapPin, CheckCircle2, RefreshCw, X, Loader2, User, Briefcase, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Device, Call } from '@twilio/voice-sdk'
import { api } from '@/utils/api'
import { useAdminSocketContext } from '@/components/AdminSocketProvider'

interface SOSAlert {
    id: string
    rider_id: string
    status: string
    started_at: string
    ended_at?: string | null
    resolved_at?: string | null
    duration_seconds?: number | null
    latitude?: number | null
    longitude?: number | null
    twilio_conference_name?: string | null
    caregiver?: {
        id: string
        name?: string | null
        phone?: string | null
        rating?: number | null
    } | null
    active_request?: {
        id: string
        service_name?: string | null
        sub_service_name?: string | null
        address?: string | null
        customer?: { name?: string | null; phone?: string | null } | null
    } | null
}

interface JoinTokenResponse {
    twilio_token: string
    conference_name: string
    sos_id: string
}

function formatDuration(seconds: number | null | undefined): string {
    if (!seconds) return '—'
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        active: { label: 'ACTIVE', cls: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' },
        ended_by_caregiver: { label: 'ENDED', cls: 'bg-secondary text-muted-foreground border-border' },
        ended_by_timeout: { label: 'TIMEOUT', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
        ended_by_admin: { label: 'ADMIN END', cls: 'bg-secondary text-muted-foreground border-border' },
        resolved: { label: 'RESOLVED', cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
    }
    const s = map[status] || { label: status, cls: 'bg-secondary text-muted-foreground border-border' }
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${s.cls}`}>
            {s.label}
        </span>
    )
}

function SOSPageInner() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const listenId = searchParams.get('listen')
    const { on } = useAdminSocketContext()

    const [tab, setTab] = useState<'active' | 'history'>('active')
    const [activeList, setActiveList] = useState<SOSAlert[]>([])
    const [history, setHistory] = useState<SOSAlert[]>([])
    const [loading, setLoading] = useState(true)

    // Listen state
    const [listenTarget, setListenTarget] = useState<SOSAlert | null>(null)
    const [listenPhase, setListenPhase] = useState<'idle' | 'connecting' | 'listening' | 'error'>('idle')
    const [listenError, setListenError] = useState<string | null>(null)
    const deviceRef = useRef<Device | null>(null)
    const callRef = useRef<Call | null>(null)

    const fetchLists = useCallback(async () => {
        const [act, hist] = await Promise.all([
            api.get<SOSAlert[]>('/sos/active'),
            api.get<SOSAlert[]>('/sos/history'),
        ])
        setActiveList(act.data || [])
        setHistory(hist.data || [])
        setLoading(false)
    }, [])

    useEffect(() => {
        void fetchLists()
    }, [fetchLists])

    // Realtime updates
    useEffect(() => {
        const offNew = on<SOSAlert>('sos_new', (e) => {
            setActiveList((prev) => {
                if (prev.find((p) => p.id === e.payload.id)) return prev
                return [e.payload, ...prev]
            })
        })
        const offEnded = on<SOSAlert>('sos_ended', (e) => {
            setActiveList((prev) => prev.filter((p) => p.id !== e.payload.id))
            setHistory((prev) => [e.payload, ...prev.filter((p) => p.id !== e.payload.id)])
        })
        const offResolved = on<SOSAlert>('sos_resolved', (e) => {
            setActiveList((prev) => prev.filter((p) => p.id !== e.payload.id))
            setHistory((prev) => [e.payload, ...prev.filter((p) => p.id !== e.payload.id)])
        })
        return () => {
            offNew()
            offEnded()
            offResolved()
        }
    }, [on])

    const stopListen = useCallback(() => {
        callRef.current?.disconnect()
        callRef.current = null
        deviceRef.current?.destroy()
        deviceRef.current = null
        setListenPhase('idle')
        setListenTarget(null)
        setListenError(null)
    }, [])

    const startListen = useCallback(async (sos: SOSAlert) => {
        stopListen()
        setListenTarget(sos)
        setListenPhase('connecting')
        setListenError(null)

        const { data, error } = await api.post<JoinTokenResponse>(`/sos/${sos.id}/join-token`)
        if (error || !data) {
            setListenError(error || 'Failed to get join token')
            setListenPhase('error')
            return
        }

        try {
            const device = new Device(data.twilio_token, { logLevel: 1 })
            deviceRef.current = device
            await device.register()
            const call = await device.connect({ params: { Conference: data.conference_name, Muted: 'true' } })
            callRef.current = call
            call.on('accept', () => setListenPhase('listening'))
            call.on('disconnect', () => {
                callRef.current = null
                setListenPhase('idle')
            })
            call.on('error', (err) => {
                setListenError(err?.message || 'Call error')
                setListenPhase('error')
            })
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Twilio connection failed'
            setListenError(msg)
            setListenPhase('error')
        }
    }, [stopListen])

    // Auto-start listen from ?listen= query param
    useEffect(() => {
        if (!listenId || loading) return
        const target = activeList.find((a) => a.id === listenId)
        if (target && listenTarget?.id !== listenId) {
            void startListen(target)
        }
    }, [listenId, loading, activeList, listenTarget, startListen])

    useEffect(() => {
        return () => {
            callRef.current?.disconnect()
            deviceRef.current?.destroy()
        }
    }, [])

    const handleResolve = async (sosId: string) => {
        const { error } = await api.patch(`/sos/${sosId}/resolve`, {})
        if (!error) {
            await fetchLists()
            if (listenTarget?.id === sosId) stopListen()
        }
    }

    const handleForceEnd = async (sosId: string) => {
        if (!confirm('Force-end this SOS session? Caregiver will lose audio connection.')) return
        const { error } = await api.patch(`/sos/${sosId}/end`, { reason: 'admin' })
        if (!error) {
            await fetchLists()
            if (listenTarget?.id === sosId) stopListen()
        }
    }

    const closeListenPanel = () => {
        stopListen()
        if (listenId) router.replace('/sos')
    }

    const rows = tab === 'active' ? activeList : history

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Siren className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gradient">Emergency SOS</h1>
                        <p className="text-xs text-muted-foreground">Live caregiver alerts and session history</p>
                    </div>
                </div>
                <button
                    onClick={() => void fetchLists()}
                    className="flex items-center gap-2 px-4 py-2 bg-card/50 hover:bg-card/80 border border-white/10 rounded-xl text-sm font-medium transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/5">
                <button
                    onClick={() => setTab('active')}
                    className={`px-4 py-2.5 text-sm font-semibold relative transition-colors ${
                        tab === 'active' ? 'text-white' : 'text-muted-foreground hover:text-white'
                    }`}
                >
                    Active
                    {activeList.length > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                            {activeList.length}
                        </span>
                    )}
                    {tab === 'active' && <motion.div layoutId="sosTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
                <button
                    onClick={() => setTab('history')}
                    className={`px-4 py-2.5 text-sm font-semibold relative transition-colors ${
                        tab === 'history' ? 'text-white' : 'text-muted-foreground hover:text-white'
                    }`}
                >
                    History
                    {tab === 'history' && <motion.div layoutId="sosTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
            </div>

            {/* Table */}
            <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                            {tab === 'active' ? 'No active alerts' : 'No history yet'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {tab === 'active' ? 'Caregivers are safe.' : 'Resolved alerts will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 text-left">
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Caregiver</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Job</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Location</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Started</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duration</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((sos) => (
                                    <tr key={sos.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate">{sos.caregiver?.name || '—'}</p>
                                                    {sos.caregiver?.phone && (
                                                        <p className="text-[11px] text-muted-foreground font-mono">+{sos.caregiver.phone}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {sos.active_request ? (
                                                <div className="text-xs">
                                                    <p className="font-medium">
                                                        {sos.active_request.sub_service_name || sos.active_request.service_name || '—'}
                                                    </p>
                                                    {sos.active_request.customer?.name && (
                                                        <p className="text-muted-foreground mt-0.5">
                                                            for {sos.active_request.customer.name}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">No active job</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {sos.latitude != null && sos.longitude != null ? (
                                                <a
                                                    href={`https://maps.google.com/?q=${sos.latitude},${sos.longitude}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                                                >
                                                    <MapPin className="w-3 h-3" />
                                                    {sos.latitude.toFixed(4)}, {sos.longitude.toFixed(4)}
                                                </a>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                                            {formatTime(sos.started_at)}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono">
                                            {formatDuration(sos.duration_seconds)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={sos.status} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center gap-1 justify-end">
                                                {sos.status === 'active' && (
                                                    <>
                                                        <button
                                                            onClick={() => void startListen(sos)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg text-xs font-semibold transition-colors"
                                                        >
                                                            <Headphones className="w-3.5 h-3.5" />
                                                            Listen
                                                        </button>
                                                        {sos.caregiver?.phone && (
                                                            <a
                                                                href={`tel:+${sos.caregiver.phone}`}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-foreground rounded-lg text-xs font-semibold transition-colors"
                                                            >
                                                                <Phone className="w-3.5 h-3.5" />
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => void handleForceEnd(sos.id)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-muted-foreground rounded-lg text-xs font-semibold transition-colors"
                                                        >
                                                            End
                                                        </button>
                                                    </>
                                                )}
                                                {sos.status !== 'resolved' && sos.status !== 'active' && (
                                                    <button
                                                        onClick={() => void handleResolve(sos.id)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-400 rounded-lg text-xs font-semibold transition-colors"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Resolve
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Live Listen Panel */}
            <AnimatePresence>
                {listenTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                        onClick={closeListenPanel}
                    >
                        <motion.div
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 80, opacity: 0 }}
                            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-gradient-to-br from-red-600 to-red-800 text-white rounded-3xl shadow-2xl overflow-hidden border border-red-400/30"
                        >
                            <div className="px-5 py-4 bg-black/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                                    </span>
                                    <span className="font-bold text-sm uppercase tracking-wider">Live Listening</span>
                                </div>
                                <button onClick={closeListenPanel} className="p-1.5 hover:bg-white/10 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="px-6 py-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold">{listenTarget.caregiver?.name || 'Caregiver'}</p>
                                        {listenTarget.caregiver?.phone && (
                                            <p className="text-xs text-red-100 font-mono">+{listenTarget.caregiver.phone}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 text-xs">
                                    {listenTarget.active_request && (
                                        <div className="flex items-start gap-2 bg-black/20 rounded-xl px-3 py-2">
                                            <Briefcase className="w-3.5 h-3.5 mt-0.5 text-red-100" />
                                            <div>
                                                <p className="font-semibold">
                                                    {listenTarget.active_request.sub_service_name || listenTarget.active_request.service_name}
                                                </p>
                                                {listenTarget.active_request.customer?.name && (
                                                    <p className="text-red-100">for {listenTarget.active_request.customer.name}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {listenTarget.latitude != null && listenTarget.longitude != null && (
                                        <a
                                            href={`https://maps.google.com/?q=${listenTarget.latitude},${listenTarget.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2 hover:bg-black/30 transition-colors"
                                        >
                                            <MapPin className="w-3.5 h-3.5 text-red-100" />
                                            <span className="font-mono">
                                                {listenTarget.latitude.toFixed(5)}, {listenTarget.longitude.toFixed(5)}
                                            </span>
                                        </a>
                                    )}
                                    <div className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2">
                                        <Clock className="w-3.5 h-3.5 text-red-100" />
                                        <span>Started at {formatTime(listenTarget.started_at)}</span>
                                    </div>
                                </div>

                                {/* Audio state */}
                                <div className="flex flex-col items-center py-3">
                                    {listenPhase === 'connecting' && (
                                        <>
                                            <Loader2 className="w-10 h-10 animate-spin" />
                                            <p className="text-sm mt-2 font-semibold">Connecting to conference...</p>
                                        </>
                                    )}
                                    {listenPhase === 'listening' && (
                                        <>
                                            <div className="relative flex items-center justify-center">
                                                <motion.div
                                                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                                    transition={{ duration: 1.8, repeat: Infinity }}
                                                    className="absolute w-24 h-24 rounded-full bg-white/20"
                                                />
                                                <div className="relative w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                                    <Headphones className="w-7 h-7" />
                                                </div>
                                            </div>
                                            <p className="text-sm mt-3 font-semibold">Listening (muted)</p>
                                            <p className="text-[11px] text-red-100 mt-0.5">
                                                Caregiver cannot hear you
                                            </p>
                                        </>
                                    )}
                                    {listenPhase === 'error' && (
                                        <>
                                            <MicOff className="w-10 h-10 text-white/80" />
                                            <p className="text-sm mt-2 font-semibold">Connection failed</p>
                                            {listenError && <p className="text-[11px] text-red-100 mt-1 text-center">{listenError}</p>}
                                            <button
                                                onClick={() => void startListen(listenTarget)}
                                                className="mt-3 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold"
                                            >
                                                Retry
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => void handleResolve(listenTarget.id)}
                                        className="flex-1 py-3 bg-white text-red-700 font-bold rounded-xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Mark Resolved
                                    </button>
                                    <button
                                        onClick={closeListenPanel}
                                        className="px-4 py-3 bg-white/10 hover:bg-white/20 font-semibold rounded-xl text-sm transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default function SOSPage() {
    return (
        <Suspense fallback={<div className="p-12 flex items-center justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>}>
            <SOSPageInner />
        </Suspense>
    )
}
