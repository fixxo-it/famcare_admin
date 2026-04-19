'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, User, Baby, HeartPulse, PawPrint, MapPin, CreditCard,
    Package, Clock, Phone, Wallet, CalendarDays, Bike, Star,
    History, Hash, Gift, CheckCircle2, Circle
} from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

export interface EnrichedRequest {
    id: string
    status: string
    user_id?: string | null
    user_phone?: string | null
    sub_service_id?: string | null
    hub_id?: string | null
    scheduled_at?: string | null
    created_at?: string | null
    updated_at?: string | null
    details?: Record<string, unknown> | null
    rider?: {
        id: string
        name?: string | null
        phone?: string | null
        rating?: number | null
        latitude?: number | null
        longitude?: number | null
    } | null
    customer?: {
        id: string
        name?: string | null
        phone?: string | null
        gender?: string | null
        dob?: string | null
        relationship?: string | null
        city?: string | null
        area?: string | null
        address?: string | null
        pincode?: string | null
        wallet_balance?: number | null
        rating?: number | null
        referral_code?: string | null
        selected_services?: string[] | null
        is_profile_complete?: boolean | null
        registered_at?: string | null
        child_name?: string | null
        child_dob?: string | null
        child_gender?: string | null
        child_special_needs?: string | null
        elderly_name?: string | null
        elderly_age?: number | null
        elderly_care_needs?: string | null
        elderly_medical_support?: boolean | null
        elderly_mobility_assistance?: boolean | null
        elderly_special_instructions?: string | null
        pet_name?: string | null
        pet_age?: number | null
        pet_breed?: string | null
        pet_special_needs?: string | null
    } | null
    sub_service?: {
        id: string
        name?: string | null
        price?: number | null
        service_name?: string | null
    } | null
    payment?: {
        id: string
        amount?: number | null
        wallet_amount?: number | null
        status?: string | null
        razorpay_payment_id?: string | null
    } | null
}

function computeAgeFromDob(dob: string | null | undefined): string | null {
    if (!dob) return null
    const d = new Date(dob)
    if (isNaN(d.getTime())) return null
    const now = new Date()
    let years = now.getFullYear() - d.getFullYear()
    const m = now.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years--
    if (years < 2) {
        const months = (now.getFullYear() - d.getFullYear()) * 12 + m
        return `${Math.max(0, months)} months`
    }
    return `${years} years`
}

function inferCareType(req: EnrichedRequest): 'child' | 'elderly' | 'pet' | null {
    const name = (req.sub_service?.service_name || req.sub_service?.name || '').toLowerCase()
    if (name.includes('baby') || name.includes('child') || name.includes('nanny')) return 'child'
    if (name.includes('elder') || name.includes('senior')) return 'elderly'
    if (name.includes('pet') || name.includes('dog') || name.includes('cat')) return 'pet'
    // Fallback: check if user has filled any specific care details
    const c = req.customer
    if (!c) return null
    if (c.child_name || c.child_dob) return 'child'
    if (c.elderly_name || c.elderly_age) return 'elderly'
    if (c.pet_name || c.pet_breed) return 'pet'
    return null
}

interface Props {
    request: EnrichedRequest | null
    onClose: () => void
}

export default function OrderDetailDrawer({ request, onClose }: Props) {
    return (
        <AnimatePresence>
            {request && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                        onClick={onClose}
                    />
                    {/* Drawer */}
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-[480px] lg:w-[560px] bg-background border-l border-white/10 shadow-2xl z-[95] overflow-y-auto"
                    >
                        <DrawerBody request={request} onClose={onClose} />
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    )
}

interface EventLog {
    id: string
    request_id: string
    actor: string
    status: string
    message?: string | null
    created_at: string
}

function DrawerBody({ request, onClose }: { request: EnrichedRequest; onClose: () => void }) {
    const careType = inferCareType(request)
    const customer = request.customer
    const subService = request.sub_service
    const payment = request.payment
    const rider = request.rider
    const details = request.details || {}
    const duration = (details.duration as string | undefined) || null
    const hours = (details.hours as string | undefined) || null
    const isInstant = details.isInstant === true || details.isInstant === 'true'

    const [logs, setLogs] = useState<EventLog[]>([])
    const [logsLoading, setLogsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        setLogsLoading(true)
        fetch(`${API_BASE}/admin/requests/${request.id}/logs`, { cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (!cancelled) setLogs(Array.isArray(data) ? data : [])
            })
            .catch(() => {
                if (!cancelled) setLogs([])
            })
            .finally(() => {
                if (!cancelled) setLogsLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [request.id])

    return (
        <>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gradient">Order Details</h2>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">#{request.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                    <span className={`status-badge status-${request.status}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {request.status?.replace('_', ' ')}
                    </span>
                    {request.created_at && (
                        <span className="text-xs text-muted-foreground">
                            Created {new Date(request.created_at).toLocaleString('en-IN')}
                        </span>
                    )}
                </div>

                {/* Service */}
                <Section icon={<Package className="w-4 h-4" />} title="Service">
                    <Row label="Category" value={subService?.service_name || '—'} />
                    <Row label="Sub-Service" value={subService?.name || '—'} />
                    {subService?.price != null && (
                        <Row label="Price" value={`₹${subService.price}`} />
                    )}
                    {duration && <Row label="Duration" value={duration} />}
                    {hours && duration !== hours && (
                        <Row label="Hours" value={`${hours} hrs`} />
                    )}
                    {request.scheduled_at ? (
                        <Row
                            label="Scheduled"
                            value={new Date(request.scheduled_at).toLocaleString('en-IN')}
                            icon={<CalendarDays className="w-3.5 h-3.5" />}
                        />
                    ) : (
                        <Row label="Type" value={isInstant ? 'Instant' : '—'} pill={isInstant ? 'green' : 'muted'} />
                    )}
                </Section>

                {/* Customer */}
                <Section icon={<User className="w-4 h-4" />} title="Customer">
                    <Row label="Name" value={customer?.name || '—'} />
                    <Row
                        label="Phone"
                        value={customer?.phone || request.user_phone || '—'}
                        icon={<Phone className="w-3.5 h-3.5" />}
                        mono
                    />
                    {customer?.gender && <Row label="Gender" value={customer.gender} capitalize />}
                    {customer?.dob && (
                        <>
                            <Row label="Date of Birth" value={customer.dob} />
                            <Row label="Age" value={computeAgeFromDob(customer.dob) || '—'} />
                        </>
                    )}
                    {customer?.relationship && (
                        <Row label="Relationship" value={customer.relationship} capitalize />
                    )}
                    <Row label="City" value={customer?.city || '—'} />
                    <Row label="Area" value={customer?.area || '—'} />
                    {customer?.address && (
                        <Row
                            label="Address"
                            value={customer.address}
                            icon={<MapPin className="w-3.5 h-3.5" />}
                            multiline
                        />
                    )}
                    {customer?.pincode && <Row label="Pincode" value={customer.pincode} mono />}
                    {customer?.wallet_balance != null && (
                        <Row
                            label="Wallet"
                            value={`₹${customer.wallet_balance}`}
                            icon={<Wallet className="w-3.5 h-3.5" />}
                        />
                    )}
                    {customer?.rating != null && (
                        <Row
                            label="Rating"
                            value={`${Number(customer.rating).toFixed(1)} / 5`}
                            icon={<Star className="w-3.5 h-3.5 text-yellow-400" />}
                        />
                    )}
                    {customer?.referral_code && (
                        <Row
                            label="Referral Code"
                            value={customer.referral_code}
                            icon={<Gift className="w-3.5 h-3.5" />}
                            mono
                        />
                    )}
                    {customer?.selected_services && customer.selected_services.length > 0 && (
                        <Row
                            label="Services"
                            value={customer.selected_services.join(', ')}
                            capitalize
                            multiline
                        />
                    )}
                    {customer?.registered_at && (
                        <Row
                            label="Registered"
                            value={new Date(customer.registered_at).toLocaleDateString('en-IN')}
                        />
                    )}
                    {customer?.is_profile_complete != null && (
                        <Row
                            label="Profile"
                            value={customer.is_profile_complete ? 'Complete' : 'Incomplete'}
                            pill={customer.is_profile_complete ? 'green' : 'red'}
                        />
                    )}
                </Section>

                {/* Care Details */}
                {careType === 'child' && customer && (
                    <Section icon={<Baby className="w-4 h-4 text-pink-400" />} title="Child Details" accent="pink">
                        <Row label="Name" value={customer.child_name || '—'} />
                        {customer.child_dob && (
                            <>
                                <Row label="Date of Birth" value={customer.child_dob} />
                                <Row label="Age" value={computeAgeFromDob(customer.child_dob) || '—'} />
                            </>
                        )}
                        <Row label="Gender" value={customer.child_gender || '—'} capitalize />
                        {customer.child_special_needs && (
                            <Row label="Special Needs" value={customer.child_special_needs} multiline />
                        )}
                    </Section>
                )}

                {careType === 'elderly' && customer && (
                    <Section icon={<HeartPulse className="w-4 h-4 text-orange-400" />} title="Elderly Details" accent="orange">
                        <Row label="Name" value={customer.elderly_name || '—'} />
                        {customer.elderly_age != null && <Row label="Age" value={`${customer.elderly_age} years`} />}
                        {customer.elderly_care_needs && (
                            <Row label="Care Needs" value={customer.elderly_care_needs} multiline />
                        )}
                        <Row
                            label="Medical Support"
                            value={customer.elderly_medical_support ? 'Required' : 'Not required'}
                            pill={customer.elderly_medical_support ? 'red' : 'muted'}
                        />
                        <Row
                            label="Mobility Assistance"
                            value={customer.elderly_mobility_assistance ? 'Required' : 'Not required'}
                            pill={customer.elderly_mobility_assistance ? 'red' : 'muted'}
                        />
                        {customer.elderly_special_instructions && (
                            <Row label="Instructions" value={customer.elderly_special_instructions} multiline />
                        )}
                    </Section>
                )}

                {careType === 'pet' && customer && (
                    <Section icon={<PawPrint className="w-4 h-4 text-amber-400" />} title="Pet Details" accent="amber">
                        <Row label="Name" value={customer.pet_name || '—'} />
                        <Row label="Breed" value={customer.pet_breed || '—'} />
                        {customer.pet_age != null && <Row label="Age" value={`${customer.pet_age} years`} />}
                        {customer.pet_special_needs && (
                            <Row label="Special Needs" value={customer.pet_special_needs} multiline />
                        )}
                    </Section>
                )}

                {/* Location */}
                {(request.details?.latitude != null || request.details?.address) && (
                    <Section icon={<MapPin className="w-4 h-4" />} title="Location">
                        {request.details?.address != null && (
                            <Row label="Address" value={String(request.details.address)} multiline />
                        )}
                        {request.details?.latitude != null && request.details?.longitude != null && (
                            <Row
                                label="Coordinates"
                                value={`${Number(request.details.latitude).toFixed(5)}, ${Number(request.details.longitude).toFixed(5)}`}
                                mono
                            />
                        )}
                    </Section>
                )}

                {/* Payment */}
                {payment && (
                    <Section icon={<CreditCard className="w-4 h-4" />} title="Payment">
                        <Row label="Amount" value={payment.amount != null ? `₹${(payment.amount / 100).toFixed(2)}` : '—'} />
                        {payment.wallet_amount != null && payment.wallet_amount > 0 && (
                            <Row label="Wallet Used" value={`₹${(payment.wallet_amount / 100).toFixed(2)}`} />
                        )}
                        <Row
                            label="Status"
                            value={payment.status || '—'}
                            pill={payment.status === 'paid' ? 'green' : payment.status === 'failed' ? 'red' : 'muted'}
                            capitalize
                        />
                        {payment.razorpay_payment_id && (
                            <Row label="Razorpay ID" value={payment.razorpay_payment_id} mono />
                        )}
                    </Section>
                )}

                {/* Rider */}
                {rider && (
                    <Section icon={<Bike className="w-4 h-4" />} title="Rider">
                        <Row label="Name" value={rider.name || '—'} />
                        <Row label="Phone" value={rider.phone || '—'} mono />
                        {rider.rating != null && (
                            <Row
                                label="Rating"
                                value={`${rider.rating.toFixed(1)} / 5`}
                                icon={<Star className="w-3.5 h-3.5 text-yellow-400" />}
                            />
                        )}
                    </Section>
                )}

                {/* IDs (for support / debugging) */}
                <Section icon={<Hash className="w-4 h-4" />} title="IDs">
                    <Row label="Request ID" value={request.id} mono multiline />
                    {request.user_id && <Row label="User ID" value={request.user_id} mono multiline />}
                    {request.hub_id && <Row label="Hub ID" value={request.hub_id} mono multiline />}
                </Section>

                {/* Timeline — key milestones */}
                <Section icon={<Clock className="w-4 h-4" />} title="Timeline">
                    {(() => {
                        // Define milestones in sequential order. Each entry picks the
                        // first matching log (by status token). If not found yet the
                        // row renders as pending.
                        const findFirst = (keys: string[]) =>
                            logs.find((l) => keys.includes(l.status?.toLowerCase?.() || ''))
                        const milestones: Array<{ label: string; keys: string[] }> = [
                            { label: 'Booked',        keys: ['new', 'created', 'scheduled'] },
                            { label: 'Assigned',      keys: ['assigned'] },
                            { label: 'Accepted',      keys: ['accepted', 'rider_accepted'] },
                            { label: 'On the way',    keys: ['on_the_way', 'en_route'] },
                            { label: 'Arrived',       keys: ['arrived', 'reached'] },
                            { label: 'In progress',   keys: ['in_progress', 'started'] },
                            { label: 'Completed',     keys: ['completed', 'done'] },
                        ]
                        const cancelled = findFirst(['cancelled', 'canceled'])
                        const ordered: Array<{ label: string; at?: string }> = milestones.map((m) => ({
                            label: m.label,
                            at: findFirst(m.keys)?.created_at,
                        }))
                        // Fallback: if "Booked" has no event but request.created_at exists, use that
                        if (!ordered[0].at && request.created_at) {
                            ordered[0].at = request.created_at
                        }
                        const lastActiveIdx = ordered.reduce((acc, r, i) => (r.at ? i : acc), -1)
                        if (logsLoading) {
                            return <p className="text-xs text-muted-foreground">Loading…</p>
                        }
                        return (
                            <div className="space-y-2">
                                {ordered.map((row, i) => {
                                    const done = !!row.at
                                    return (
                                        <div key={row.label} className="flex items-start gap-3">
                                            {done ? (
                                                <CheckCircle2
                                                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                                                        i === lastActiveIdx ? 'text-primary' : 'text-emerald-400/80'
                                                    }`}
                                                />
                                            ) : (
                                                <Circle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/40" />
                                            )}
                                            <div className="flex-1 flex items-baseline justify-between gap-4">
                                                <span className={`text-xs ${done ? 'text-white' : 'text-muted-foreground/60'}`}>
                                                    {row.label}
                                                </span>
                                                <span className="text-[11px] font-mono text-muted-foreground">
                                                    {row.at
                                                        ? new Date(row.at).toLocaleString('en-IN', {
                                                            day: '2-digit', month: 'short',
                                                            hour: '2-digit', minute: '2-digit',
                                                        })
                                                        : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                                {cancelled && (
                                    <div className="flex items-start gap-3 pt-2 mt-2 border-t border-white/5">
                                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                                        <div className="flex-1 flex items-baseline justify-between gap-4">
                                            <span className="text-xs text-red-400">Cancelled</span>
                                            <span className="text-[11px] font-mono text-muted-foreground">
                                                {new Date(cancelled.created_at).toLocaleString('en-IN', {
                                                    day: '2-digit', month: 'short',
                                                    hour: '2-digit', minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })()}
                </Section>

                {/* Event Log */}
                <Section icon={<History className="w-4 h-4" />} title="Event Log">
                    {logsLoading ? (
                        <p className="text-xs text-muted-foreground">Loading...</p>
                    ) : logs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No events yet.</p>
                    ) : (
                        <div className="relative pl-4 space-y-3 before:content-[''] before:absolute before:left-[5px] before:top-1 before:bottom-1 before:w-px before:bg-white/10">
                            {logs.map((log, i) => (
                                <div key={log.id} className="relative">
                                    <span
                                        className={`absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full border-2 border-background ${
                                            i === logs.length - 1 ? 'bg-primary' : 'bg-white/30'
                                        }`}
                                    />
                                    <p className="text-xs font-semibold capitalize">
                                        {log.status.replace('_', ' ')}
                                        <span className="ml-2 text-muted-foreground font-normal">
                                            by {log.actor}
                                        </span>
                                    </p>
                                    {log.message && (
                                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                            {log.message}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">
                                        {new Date(log.created_at).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            </div>
        </>
    )
}

function Section({
    icon,
    title,
    accent,
    children,
}: {
    icon: React.ReactNode
    title: string
    accent?: 'pink' | 'orange' | 'amber'
    children: React.ReactNode
}) {
    const accentBorder =
        accent === 'pink' ? 'border-pink-400/20 bg-pink-400/5' :
        accent === 'orange' ? 'border-orange-400/20 bg-orange-400/5' :
        accent === 'amber' ? 'border-amber-400/20 bg-amber-400/5' :
        'border-white/10 bg-white/[0.02]'

    return (
        <div className={`rounded-2xl border ${accentBorder} p-4 space-y-3`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {icon}
                <span>{title}</span>
            </div>
            <div className="space-y-2">
                {children}
            </div>
        </div>
    )
}

function Row({
    label,
    value,
    icon,
    mono,
    multiline,
    capitalize,
    pill,
}: {
    label: string
    value: string
    icon?: React.ReactNode
    mono?: boolean
    multiline?: boolean
    capitalize?: boolean
    pill?: 'green' | 'red' | 'muted'
}) {
    const pillCls =
        pill === 'green' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
        pill === 'red' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
        pill === 'muted' ? 'bg-white/5 text-muted-foreground border-white/10' :
        ''

    return (
        <div className={`flex ${multiline ? 'flex-col gap-1' : 'items-center justify-between gap-3'}`}>
            <span className="text-xs text-muted-foreground shrink-0">{label}</span>
            {pill ? (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${pillCls} ${capitalize ? 'capitalize' : ''}`}>
                    {icon}
                    {value}
                </span>
            ) : (
                <span className={`text-sm font-medium text-right flex items-center gap-1.5 ${mono ? 'font-mono' : ''} ${capitalize ? 'capitalize' : ''} ${multiline ? '!text-left leading-relaxed' : ''}`}>
                    {icon}
                    {value}
                </span>
            )}
        </div>
    )
}
