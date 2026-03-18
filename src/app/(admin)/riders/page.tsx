'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bike, Star, MapPin, Search, RefreshCw, PlusCircle, X, CheckCircle2, Users, Pencil, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

const SERVICE_OPTIONS = ['ironing', 'dog_walker', 'nanny', 'gardener', 'baby', 'women', 'elder']

export default function RidersPage() {
    const [riders, setRiders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editRider, setEditRider] = useState<any>(null)
    const [search, setSearch] = useState('')
    const [formData, setFormData] = useState({ name: '', phone: '', service: 'baby', address: '' })
    const [submitting, setSubmitting] = useState(false)

    const fetchRiders = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/riders`, { cache: 'no-store' })
            const data = await res.json()
            setRiders(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Failed to fetch riders:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchRiders() }, [fetchRiders])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (editRider) {
                await fetch(`${API_BASE}/admin/riders/${editRider.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                })
            } else {
                await fetch(`${API_BASE}/admin/riders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                })
            }
            resetForm()
            fetchRiders()
        } catch (e) {
            console.error('Submit failed:', e)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this rider?')) return
        await fetch(`${API_BASE}/admin/riders/${id}`, { method: 'DELETE' })
        fetchRiders()
    }

    const handleToggleAvailability = async (rider: any) => {
        await fetch(`${API_BASE}/admin/riders/${rider.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_available: !rider.is_available }),
        })
        fetchRiders()
    }

    const resetForm = () => {
        setShowForm(false)
        setEditRider(null)
        setFormData({ name: '', phone: '', service: 'baby', address: '' })
    }

    const startEdit = (rider: any) => {
        setEditRider(rider)
        setFormData({ name: rider.name, phone: rider.phone, service: rider.service, address: rider.address || '' })
        setShowForm(true)
    }

    const filtered = riders.filter((r) => {
        if (!search) return true
        const q = search.toLowerCase()
        return r.name?.toLowerCase().includes(q) || r.phone?.includes(q) || r.service?.toLowerCase().includes(q)
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Riders</h1>
                    <p className="text-muted-foreground mt-1">Manage your service partner fleet.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true) }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-all"
                >
                    <PlusCircle className="w-4 h-4" />
                    Add Rider
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Total Riders</p>
                        <p className="text-2xl font-bold">{riders.length}</p>
                    </div>
                </div>
                <div className="glass-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Available</p>
                        <p className="text-2xl font-bold">{riders.filter(r => r.is_available).length}</p>
                    </div>
                </div>
                <div className="glass-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Avg Rating</p>
                        <p className="text-2xl font-bold">
                            {riders.length ? (riders.reduce((a, r) => a + (r.rating || 5), 0) / riders.length).toFixed(1) : '—'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Add/Edit Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="glass-card">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold">
                                    {editRider ? 'Edit Rider' : 'Add New Rider'}
                                </h2>
                                <button onClick={resetForm} className="p-1 rounded-lg hover:bg-white/10">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                        placeholder="Partner name"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                                    <input
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                        placeholder="+91..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Service</label>
                                    <select
                                        value={formData.service}
                                        onChange={(e) => setFormData(p => ({ ...p, service: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                    >
                                        {SERVICE_OPTIONS.map(s => (
                                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Address</label>
                                    <input
                                        value={formData.address}
                                        onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                        placeholder="Area / Address"
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                                    <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : editRider ? 'Update' : 'Add Rider'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search + Table */}
            <div className="glass rounded-2xl overflow-hidden border border-white/10">
                <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search riders by name, phone, or service..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.03] text-xs uppercase tracking-wider text-muted-foreground">
                                <th className="px-6 py-4 font-semibold">Details</th>
                                <th className="px-6 py-4 font-semibold">Service</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Rating</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((rider) => (
                                <tr key={rider.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                                                <span className="font-bold text-primary text-sm">{rider.name?.[0]}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{rider.name}</p>
                                                <p className="text-xs text-muted-foreground">{rider.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 capitalize">
                                                {rider.service?.replace('_', ' ')}
                                            </span>
                                            {rider.address && (
                                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {rider.address}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleAvailability(rider)}
                                            className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-lg border transition-all ${
                                                rider.is_available
                                                    ? 'text-green-400 bg-green-500/10 border-green-500/20 hover:bg-green-500/20'
                                                    : 'text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
                                            }`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                            {rider.is_available ? 'Available' : 'Offline'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm font-medium">{rider.rating ?? '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button
                                                onClick={() => startEdit(rider)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rider.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                                        <Bike className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">No riders found. Add one to get started!</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
