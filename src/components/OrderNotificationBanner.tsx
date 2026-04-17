'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Eye, X, MapPin, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminSocketContext } from './AdminSocketProvider'

interface OrderPayload {
    id: string
    status: string
    user_phone?: string | null
    scheduled_at?: string | null
    details?: Record<string, unknown>
    customer?: {
        name?: string | null
        phone?: string | null
        city?: string | null
        area?: string | null
    } | null
    sub_service?: {
        name?: string | null
        service_name?: string | null
    } | null
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

interface OrderAlert extends OrderPayload {
    received_at: string
}

export default function OrderNotificationBanner() {
    const { on } = useAdminSocketContext()
    const router = useRouter()
    const [alerts, setAlerts] = useState<OrderAlert[]>([])
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())
    const [, forceTick] = useState(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Lazy-init audio (avoid SSR issues)
    useEffect(() => {
        audioRef.current = new Audio('/sounds/notification.wav')
        audioRef.current.volume = 0.8
        audioRef.current.preload = 'auto'
    }, [])

    useEffect(() => {
        const offNew = on<OrderPayload>('new_order', (e) => {
            setAlerts((prev) => {
                if (prev.find((p) => p.id === e.payload.id)) return prev
                return [{ ...e.payload, received_at: new Date().toISOString() }, ...prev]
            })
            // Play notification sound (ignore errors from autoplay restrictions)
            audioRef.current?.play().catch(() => {})
        })
        return () => {
            offNew()
        }
    }, [on])

    useEffect(() => {
        const id = window.setInterval(() => forceTick((x) => x + 1), 5000)
        return () => window.clearInterval(id)
    }, [])

    // Auto-dismiss after 30 seconds
    useEffect(() => {
        if (alerts.length === 0) return
        const timer = window.setTimeout(() => {
            const oldest = alerts[alerts.length - 1]
            if (oldest) setDismissed((prev) => new Set(prev).add(oldest.id))
        }, 30000)
        return () => window.clearTimeout(timer)
    }, [alerts])

    const visible = alerts.filter((a) => !dismissed.has(a.id)).slice(0, 3)
    if (visible.length === 0) return null

    const handleView = (requestId: string) => {
        setDismissed((prev) => new Set(prev).add(requestId))
        router.push(`/requests?id=${requestId}`)
    }

    const handleDismiss = (requestId: string) => {
        setDismissed((prev) => new Set(prev).add(requestId))
    }

    return (
        <div className="fixed top-4 right-4 z-[99] space-y-3 w-full max-w-sm pointer-events-none">
            <AnimatePresence>
                {visible.map((alert) => {
                    const addr = (alert.details?.address as string | undefined) || null
                    return (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: 40, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 40, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                            className="pointer-events-auto bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-2xl shadow-emerald-500/40 overflow-hidden border border-emerald-400/30"
                        >
                            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                                </span>
                                <Package className="w-4 h-4" />
                                <span className="font-bold text-sm uppercase tracking-wider">New Order</span>
                                <span className="ml-auto text-[11px] text-emerald-100">{formatRelative(alert.received_at)}</span>
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
                                        {alert.customer?.name || `Order #${alert.id.slice(0, 8)}`}
                                    </p>
                                    {(alert.customer?.phone || alert.user_phone) && (
                                        <p className="text-xs text-emerald-100 font-mono mt-0.5">
                                            +{alert.customer?.phone || alert.user_phone}
                                        </p>
                                    )}
                                    {(alert.sub_service?.name || alert.sub_service?.service_name) && (
                                        <p className="text-xs text-emerald-50 mt-1.5 font-medium">
                                            {alert.sub_service.service_name}
                                            {alert.sub_service.name && alert.sub_service.name !== alert.sub_service.service_name && (
                                                <span className="text-emerald-200"> · {alert.sub_service.name}</span>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {alert.scheduled_at && (
                                    <div className="flex items-center gap-1 text-[11px] text-emerald-100 bg-black/20 rounded-lg px-2.5 py-1.5">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            Scheduled: {new Date(alert.scheduled_at).toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                {addr && (
                                    <div className="flex items-start gap-1 text-[11px] text-emerald-100">
                                        <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">{addr}</span>
                                    </div>
                                )}
                            </div>

                            <div className="px-4 pb-3 flex gap-2">
                                <button
                                    onClick={() => handleView(alert.id)}
                                    className="flex-1 py-2.5 bg-white text-emerald-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Order
                                </button>
                            </div>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
