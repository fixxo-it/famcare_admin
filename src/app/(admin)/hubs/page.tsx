'use client'

import { useState, useEffect, useCallback } from 'react'
import { Map, MapPin, Search, RefreshCw, PlusCircle, X, Pencil, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

export default function HubsPage() {
    const [hubs, setHubs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editHub, setEditHub] = useState<any>(null)
    const [search, setSearch] = useState('')
    const [formData, setFormData] = useState({ name: '', latitude: 0, longitude: 0, radius: 5, is_active: true })
    const [submitting, setSubmitting] = useState(false)

    const fetchHubs = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/hubs`, { cache: 'no-store' })
            const data = await res.json()
            setHubs(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Failed to fetch hubs:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchHubs() }, [fetchHubs])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const method = editHub ? 'PATCH' : 'POST'
            const url = editHub ? `${API_BASE}/hubs/${editHub.id}` : `${API_BASE}/hubs/`
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            
            if (res.ok) {
                resetForm()
                fetchHubs()
            }
        } catch (e) {
            console.error('Submit failed:', e)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this hub? This may affect serviceability in this area.')) return
        await fetch(`${API_BASE}/hubs/${id}`, { method: 'DELETE' })
        fetchHubs()
    }

    const resetForm = () => {
        setShowForm(false)
        setEditHub(null)
        setFormData({ name: '', latitude: 0, longitude: 0, radius: 5, is_active: true })
    }

    const startEdit = (hub: any) => {
        setEditHub(hub)
        setFormData({ 
            name: hub.name, 
            latitude: hub.latitude, 
            longitude: hub.longitude, 
            radius: hub.radius,
            is_active: hub.is_active 
        })
        setShowForm(true)
    }

    const filtered = hubs.filter((h) => {
        if (!search) return true
        const q = search.toLowerCase()
        return h.name?.toLowerCase().includes(q)
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
                    <h1 className="text-3xl font-bold text-gradient">Service Hubs</h1>
                    <p className="text-muted-foreground mt-1">Define operational areas and service radii.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true) }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-all"
                >
                    <PlusCircle className="w-4 h-4" />
                    Add Hub
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                        <Map className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Total Hubs</p>
                        <p className="text-2xl font-bold">{hubs.length}</p>
                    </div>
                </div>
                <div className="glass-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Active Areas</p>
                        <p className="text-2xl font-bold">{hubs.filter(h => h.is_active).length}</p>
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
                                    {editHub ? 'Edit Hub' : 'Add New Hub'}
                                </h2>
                                <button onClick={resetForm} className="p-1 rounded-lg hover:bg-white/10">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs text-muted-foreground mb-1 block">Hub Name</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                        placeholder="e.g. Indiranagar Center"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Latitude</label>
                                    <input
                                        required
                                        type="number"
                                        step="any"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData(p => ({ ...p, latitude: parseFloat(e.target.value) }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Longitude</label>
                                    <input
                                        required
                                        type="number"
                                        step="any"
                                        value={formData.longitude}
                                        onChange={(e) => setFormData(p => ({ ...p, longitude: parseFloat(e.target.value) }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Radius (km)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.1"
                                        value={formData.radius}
                                        onChange={(e) => setFormData(p => ({ ...p, radius: parseFloat(e.target.value) }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                    />
                                </div>
                                <div className="flex items-end mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                                        />
                                        <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">Active Operation</span>
                                    </label>
                                </div>
                                <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                                    <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : editHub ? 'Update Hub' : 'Create Hub'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            <div className="glass rounded-2xl overflow-hidden border border-white/10">
                <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search hubs..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.03] text-xs uppercase tracking-wider text-muted-foreground">
                                <th className="px-6 py-4 font-semibold">Hub Name</th>
                                <th className="px-6 py-4 font-semibold">Location</th>
                                <th className="px-6 py-4 font-semibold">Radius</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((hub) => (
                                <tr key={hub.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <MapPin className="w-5 h-5 text-primary" />
                                            </div>
                                            <span className="font-medium text-sm">{hub.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-muted-foreground">
                                            {hub.latitude.toFixed(6)}, {hub.longitude.toFixed(6)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm">{hub.radius} km</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-1.5 text-xs font-medium ${hub.is_active ? 'text-green-400' : 'text-red-400'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${hub.is_active ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400'}`} />
                                            {hub.is_active ? 'Active' : 'Inactive'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button
                                                onClick={() => startEdit(hub)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(hub.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
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
                                        <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">No hubs found.</p>
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
