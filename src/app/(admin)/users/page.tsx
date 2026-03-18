'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Search, RefreshCw, ChevronDown, ChevronUp, Phone, MapPin, Calendar, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [expandedUser, setExpandedUser] = useState<string | null>(null)
    const [userRequests, setUserRequests] = useState<Record<string, any[]>>({})
    const [loadingRequests, setLoadingRequests] = useState<string | null>(null)

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/users`, { cache: 'no-store' })
            const data = await res.json()
            setUsers(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Failed to fetch users:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchUsers() }, [fetchUsers])

    const toggleExpand = async (userId: string) => {
        if (expandedUser === userId) {
            setExpandedUser(null)
            return
        }

        setExpandedUser(userId)

        // Fetch booking history if not cached
        if (!userRequests[userId]) {
            setLoadingRequests(userId)
            try {
                const res = await fetch(`${API_BASE}/admin/users/${userId}/requests`, { cache: 'no-store' })
                const data = await res.json()
                setUserRequests(prev => ({ ...prev, [userId]: Array.isArray(data) ? data : [] }))
            } catch (e) {
                console.error('Failed to fetch user requests:', e)
                setUserRequests(prev => ({ ...prev, [userId]: [] }))
            } finally {
                setLoadingRequests(null)
            }
        }
    }

    const filtered = users.filter((u) => {
        if (!search) return true
        const q = search.toLowerCase()
        return u.phone?.includes(q) || u.name?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q)
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gradient">Users</h1>
                <p className="text-muted-foreground mt-1">View customers and their booking history.</p>
            </div>

            {/* Stats */}
            <div className="glass-card flex items-center gap-4 inline-flex">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                </div>
            </div>

            {/* Search + List */}
            <div className="glass rounded-2xl overflow-hidden border border-white/10">
                <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, phone, or city..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                </div>

                <div className="divide-y divide-white/5">
                    {filtered.map((user) => (
                        <div key={user.id}>
                            <button
                                onClick={() => toggleExpand(user.id)}
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center border border-blue-500/20">
                                        <span className="font-bold text-blue-400 text-sm">{user.name?.[0] || '?'}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{user.name || 'Unnamed'}</p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {user.phone}
                                            </span>
                                            {user.city && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {user.city}{user.area ? `, ${user.area}` : ''}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {new Date(user.created_at).toLocaleDateString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground hidden md:block">
                                        {expandedUser === user.id ? 'Hide history' : 'View history'}
                                    </span>
                                    {expandedUser === user.id ? (
                                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </div>
                            </button>

                            {/* Booking History Expandable */}
                            <AnimatePresence>
                                {expandedUser === user.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-4 pt-1 ml-14">
                                            {loadingRequests === user.id ? (
                                                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                                                    <RefreshCw className="w-4 h-4 animate-spin" /> Loading history...
                                                </div>
                                            ) : userRequests[user.id]?.length ? (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
                                                        Booking History ({userRequests[user.id].length})
                                                    </p>
                                                    {userRequests[user.id].map((req: any) => (
                                                        <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                                                            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                                                                <Package className="w-4 h-4 text-muted-foreground" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium capitalize">
                                                                    {req.service?.replace('_', ' ')}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {new Date(req.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    {req.assigned_rider?.name && ` • ${req.assigned_rider.name}`}
                                                                </p>
                                                            </div>
                                                            <span className={`status-badge status-${req.status}`}>
                                                                {req.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground py-4">No bookings yet</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="px-6 py-16 text-center text-muted-foreground">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No users found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
