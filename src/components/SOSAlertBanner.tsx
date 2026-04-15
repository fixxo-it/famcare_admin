'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Phone, Headphones, X, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminSocketContext } from './AdminSocketProvider'

interface SOSPayload {
    id: string
    rider_id: string
    status: string
    started_at: string
    latitude?: number | null
    longitude?: number | null
    caregiver?: {
        id: string
        name?: string | null
        phone?: string | null
    } | null
    active_request?: {
        id: string
        service_name?: string | null
        sub_service_name?: string | null
        customer?: { name?: string | null; phone?: string | null } | null
    } | null
}

interface EndedPayload {
    id: string
}

function formatRelative(iso: string): string {
    const t = new Date(iso).getTime()
    const diff = Math.max(0, Date.now() - t)
    const s = Math.floor(diff / 1000)
    if (s < 60) return `${s}s ago`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    return `${h}h ago`
}

export default function SOSAlertBanner() {
    const { on } = useAdminSocketContext()
    const router = useRouter()
    const [alerts, setAlerts] = useState<SOSPayload[]>([])
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())
    const [, forceTick] = useState(0)

    useEffect(() => {
        const offNew = on<SOSPayload>('sos_new', (e) => {
            setAlerts((prev) => {
                if (prev.find((p) => p.id === e.payload.id)) return prev
                return [e.payload, ...prev]
            })
        })
        const offEnded = on<EndedPayload>('sos_ended', (e) => {
            setAlerts((prev) => prev.filter((p) => p.id !== e.payload.id))
        })
        const offResolved = on<EndedPayload>('sos_resolved', (e) => {
            setAlerts((prev) => prev.filter((p) => p.id !== e.payload.id))
        })
        return () => {
            offNew()
            offEnded()
            offResolved()
        }
    }, [on])

    useEffect(() => {
        const id = window.setInterval(() => forceTick((x) => x + 1), 5000)
        return () => window.clearInterval(id)
    }, [])

    const visible = alerts.filter((a) => !dismissed.has(a.id))
    if (visible.length === 0) return null

    const handleListen = (sosId: string) => {
        router.push(`/sos?listen=${sosId}`)
    }

    const handleDismiss = (sosId: string) => {
        setDismissed((prev) => new Set(prev).add(sosId))
    }

    return (
        <div className="fixed top-4 right-4 z-[100] space-y-3 w-full max-w-sm pointer-events-none">
            <AnimatePresence>
                {visible.map((alert) => (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 40, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 40, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                        className="pointer-events-auto bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl shadow-2xl shadow-red-500/40 overflow-hidden border border-red-400/30"
                    >
                        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                            </span>
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-bold text-sm uppercase tracking-wider">Emergency SOS</span>
                            <span className="ml-auto text-[11px] text-red-100">{formatRelative(alert.started_at)}</span>
                            <button
                                onClick={() => handleDismiss(alert.id)}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Dismiss"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="px-4 py-3 space-y-2">
                            <div>
                                <p className="font-bold text-base leading-tight">
                                    {alert.caregiver?.name || 'Caregiver'}
                                </p>
                                {alert.caregiver?.phone && (
                                    <p className="text-xs text-red-100 font-mono mt-0.5">+{alert.caregiver.phone}</p>
                                )}
                            </div>

                            {alert.active_request && (
                                <div className="text-xs text-red-100 bg-black/20 rounded-lg px-2.5 py-1.5">
                                    <span className="font-semibold">Active job:</span>{' '}
                                    {alert.active_request.sub_service_name || alert.active_request.service_name || 'In service'}
                                    {alert.active_request.customer?.name && (
                                        <> for {alert.active_request.customer.name}</>
                                    )}
                                </div>
                            )}

                            {alert.latitude != null && alert.longitude != null && (
                                <div className="flex items-center gap-1 text-[11px] text-red-100">
                                    <MapPin className="w-3 h-3" />
                                    <span className="font-mono">
                                        {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="px-4 pb-3 flex gap-2">
                            <button
                                onClick={() => handleListen(alert.id)}
                                className="flex-1 py-2.5 bg-white text-red-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                            >
                                <Headphones className="w-4 h-4" />
                                Listen Now
                            </button>
                            {alert.caregiver?.phone && (
                                <a
                                    href={`tel:+${alert.caregiver.phone}`}
                                    className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm flex items-center gap-1.5 transition-colors"
                                >
                                    <Phone className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
