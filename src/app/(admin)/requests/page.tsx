'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { Package, Clock, CheckCircle2, AlertCircle, Search, RefreshCw, UserPlus, Filter, ShieldAlert, Eye, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import OrderDetailDrawer, { EnrichedRequest } from '@/components/OrderDetailDrawer'
import { useAdminSocketContext } from '@/components/AdminSocketProvider'
import { useSearchParams } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

const STATUS_OPTIONS = ['all', 'new', 'assigned', 'scheduled', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled']

function RequestsPageInner() {
    const [requests, setRequests] = useState<any[]>([])
    const [riders, setRiders] = useState<any[]>([])
    const [subServices, setSubServices] = useState<{id: string, name: string, service_name: string}[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [assigningId, setAssigningId] = useState<string | null>(null)
    const [selectedRider, setSelectedRider] = useState<string>('')
    const [refreshing, setRefreshing] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<EnrichedRequest | null>(null)
    const { on } = useAdminSocketContext()
    const searchParams = useSearchParams()

    const getSubServiceName = (id: string) => subServices.find(s => s.id === id)?.name || '—'

    const fetchData = useCallback(async () => {
        try {
            const [reqRes, riderRes, subRes] = await Promise.all([
                fetch(`${API_BASE}/admin/requests`, { cache: 'no-store' }),
                fetch(`${API_BASE}/admin/riders`, { cache: 'no-store' }),
                fetch(`${API_BASE}/admin/service-types`, { cache: 'no-store' }),
            ])
            const reqData = await reqRes.json()
            const riderData = await riderRes.json()
            const subData = await subRes.json()
            setRequests(Array.isArray(reqData) ? reqData : [])
            setRiders(Array.isArray(riderData) ? riderData : [])
            setSubServices(Array.isArray(subData) ? subData : [])
        } catch (e) {
            console.error('Failed to fetch data:', e)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    // Auto-open drawer when ?id=... is in URL (e.g. clicked from notification popup)
    useEffect(() => {
        const id = searchParams.get('id')
        if (!id || requests.length === 0) return
        const match = requests.find((r) => r.id === id)
        if (match) setSelectedRequest(match as EnrichedRequest)
    }, [searchParams, requests])

    // Live updates: when a new order arrives, append to the list
    useEffect(() => {
        const off = on<EnrichedRequest>('new_order', (e) => {
            setRequests((prev) => {
                if (prev.find((p) => p.id === e.payload.id)) return prev
                return [e.payload, ...prev]
            })
        })
        return () => { off() }
    }, [on])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchData()
    }

    const handleAssign = async (requestId: string) => {
        if (!selectedRider) return
        try {
            const res = await fetch(`${API_BASE}/admin/assign?request_id=${requestId}&rider_id=${selectedRider}`, {
                method: 'POST',
            })
            if (res.ok) {
                setAssigningId(null)
                setSelectedRider('')
                fetchData()
            } else {
                const err = await res.json()
                alert(`Assignment failed: ${err.detail || 'Unknown error'}`)
            }
        } catch (e: any) {
            alert(`Assignment failed: ${e.message}`)
        }
    }

    const handleResolve = async (requestId: string) => {
        if (!confirm('Are you sure you want to resolve/clear all assignments for this request? This will revert it to NEW.')) return
        try {
            const res = await fetch(`${API_BASE}/admin/requests/${requestId}/resolve`, {
                method: 'POST',
            })
            if (res.ok) {
                fetchData()
            } else {
                alert('Resolve failed')
            }
        } catch (e) {
            alert('Resolve failed')
        }
    }

    const filtered = requests.filter((r) => {
        if (filter !== 'all' && r.status !== filter) return false
        if (search) {
            const q = search.toLowerCase()
            return (
                r.user_phone?.toLowerCase().includes(q) ||
                r.service?.toLowerCase().includes(q) ||
                r.id?.toLowerCase().includes(q)
            )
        }
        return true
    })

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'new').length,
        completed: requests.filter(r => r.status === 'completed').length,
        unassigned: requests.filter(r => !r.assigned_rider_id).length,
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Requests</h1>
                    <p className="text-muted-foreground mt-1">Monitor, filter, and assign service requests.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10 transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MiniStat icon={<Package className="w-5 h-5 text-primary" />} label="Total" value={stats.total} />
                <MiniStat icon={<Clock className="w-5 h-5 text-yellow-400" />} label="Pending" value={stats.pending} />
                <MiniStat icon={<CheckCircle2 className="w-5 h-5 text-green-400" />} label="Completed" value={stats.completed} />
                <MiniStat icon={<AlertCircle className="w-5 h-5 text-red-400" />} label="Unassigned" value={stats.unassigned} />
            </div>

            {/* Filters */}
            <div className="glass rounded-2xl overflow-hidden border border-white/10">
                <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02]">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by phone, service, or ID..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                        {STATUS_OPTIONS.map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                                    filter === s
                                        ? 'bg-primary/20 text-primary border border-primary/30'
                                        : 'bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {s === 'all' ? 'All' : s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.03] text-xs uppercase tracking-wider text-muted-foreground">
                                <th className="px-6 py-4 font-semibold">Service</th>
                                <th className="px-6 py-4 font-semibold">Duration</th>
                                <th className="px-6 py-4 font-semibold">Amount</th>
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Rider</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence>
                                {filtered.map((req) => (
                                    <motion.tr
                                        key={req.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setSelectedRequest(req as EnrichedRequest)}
                                        className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 capitalize">
                                                {req.sub_service_id ? getSubServiceName(req.sub_service_id) : req.service?.replace('_', ' ') || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {(() => {
                                                const d = (req as EnrichedRequest).details || {}
                                                const dur = (d.duration as string | undefined) || (d.hours as string | undefined)
                                                if (!dur) return <span className="text-muted-foreground/60 text-xs">—</span>
                                                return (
                                                    <span className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-medium">
                                                        {dur}
                                                    </span>
                                                )
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {(() => {
                                                const p = (req as EnrichedRequest).payment
                                                const sub = (req as EnrichedRequest).sub_service
                                                const amt = p?.amount ?? sub?.price ?? null
                                                if (amt == null) return <span className="text-muted-foreground/60 text-xs">—</span>
                                                return (
                                                    <span className="font-semibold text-emerald-300">
                                                        ₹{Number(amt).toLocaleString('en-IN')}
                                                    </span>
                                                )
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-sm">{req.user_phone}</td>
                                        <td className="px-6 py-4">
                                            <span className={`status-badge status-${req.status}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                {req.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {req.rider?.name || (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[11px] uppercase tracking-wide text-muted-foreground/60">
                                                    Booked
                                                </span>
                                                <span className="text-xs">
                                                    {new Date(req.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {req.scheduled_at && (
                                                    <span className="text-[11px] text-amber-400 mt-0.5">
                                                        Scheduled: {new Date(req.scheduled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedRequest(req as EnrichedRequest) }}
                                                    className="p-1.5 bg-white/5 text-muted-foreground hover:text-white text-xs rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                                                    title="View details"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                            {(req.status === 'new' || req.status === 'scheduled') && !req.assigned_rider_id ? (
                                                assigningId === req.id ? (
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <select
                                                            value={selectedRider}
                                                            onChange={(e) => setSelectedRider(e.target.value)}
                                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                                        >
                                                            <option value="">Select rider</option>
                                                            {riders.filter(r => r.is_available).map((r) => (
                                                                <option key={r.id} value={r.id}>{r.name} ({r.sub_service_id ? (subServices.find(s => s.id === r.sub_service_id)?.service_name || '?') : r.service || '?'})</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => handleAssign(req.id)}
                                                            disabled={!selectedRider}
                                                            className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors"
                                                        >
                                                            Assign
                                                        </button>
                                                        <button
                                                            onClick={() => { setAssigningId(null); setSelectedRider('') }}
                                                            className="px-2 py-1.5 text-xs text-muted-foreground hover:text-white"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 justify-end">
                                                        {(req.status === 'new' || req.status === 'scheduled') && (
                                                            <button
                                                                onClick={() => handleResolve(req.id)}
                                                                title="Resolve / Reset Assignment"
                                                                className="p-1.5 bg-red-400/10 text-red-400 text-xs rounded-lg hover:bg-red-400/20 transition-colors border border-red-400/20"
                                                            >
                                                                <ShieldAlert className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setAssigningId(req.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-lg hover:bg-primary/20 transition-colors border border-primary/20"
                                                        >
                                                            <UserPlus className="w-3.5 h-3.5" />
                                                            Assign
                                                        </button>
                                                    </div>
                                                )
                                            ) : null}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center text-muted-foreground">
                                        <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">No requests found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <OrderDetailDrawer
                request={selectedRequest}
                onClose={() => setSelectedRequest(null)}
            />
        </div>
    )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="glass-card flex items-center gap-4 py-4">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                {icon}
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
            </div>
        </div>
    )
}

// Wrap in <Suspense> because RequestsPageInner uses useSearchParams.
// Next.js 16 requires this — without it, prerendering /requests fails the build.
// Same pattern as /sos/page.tsx.
export default function RequestsPage() {
    return (
        <Suspense fallback={<div className="p-12 flex items-center justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>}>
            <RequestsPageInner />
        </Suspense>
    )
}
