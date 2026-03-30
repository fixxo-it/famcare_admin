'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, RefreshCw, Save, Plus, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

interface SlotConfig {
    id: string
    time_slot: string
    max_slots: number
    is_enabled: boolean
}

const MINUTE_OPTIONS = ['00', '15', '30', '45']

function formatSlot(hour: string, minute: string, period: string): string {
    return `${hour.padStart(2, '0')}:${minute} ${period}`
}

export default function SlotsPage() {
    const [configs, setConfigs] = useState<Record<string, SlotConfig>>({})
    const [orderedSlots, setOrderedSlots] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)

    // New slot form state
    const [newHour, setNewHour] = useState('10')
    const [newMinute, setNewMinute] = useState('00')
    const [newPeriod, setNewPeriod] = useState('AM')
    const [newMaxSlots, setNewMaxSlots] = useState(5)
    const [adding, setAdding] = useState(false)
    const [addError, setAddError] = useState('')

    const fetchConfigs = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/slots/configs`, { cache: 'no-store' })
            if (res.ok) {
                const data: SlotConfig[] = await res.json()
                const map: Record<string, SlotConfig> = {}
                const order: string[] = []
                data.forEach(c => {
                    map[c.time_slot] = c
                    order.push(c.time_slot)
                })
                setConfigs(map)
                setOrderedSlots(order)
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchConfigs() }, [fetchConfigs])

    const updateLocal = (slot: string, patch: Partial<SlotConfig>) => {
        setConfigs(prev => ({ ...prev, [slot]: { ...prev[slot], ...patch } }))
    }

    const save = async (slot: string) => {
        setSaving(slot)
        const cfg = configs[slot]
        try {
            await fetch(`${API_BASE}/slots/configs/${encodeURIComponent(slot)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ max_slots: cfg.max_slots, is_enabled: cfg.is_enabled }),
            })
        } finally {
            setSaving(null)
        }
    }

    const deleteSlot = async (slot: string) => {
        if (!confirm(`Delete the ${slot} slot? This cannot be undone.`)) return
        setDeleting(slot)
        try {
            const res = await fetch(`${API_BASE}/slots/configs/${encodeURIComponent(slot)}`, { method: 'DELETE' })
            if (res.ok || res.status === 204) {
                setOrderedSlots(prev => prev.filter(s => s !== slot))
                setConfigs(prev => {
                    const next = { ...prev }
                    delete next[slot]
                    return next
                })
            }
        } finally {
            setDeleting(null)
        }
    }

    const addSlot = async () => {
        setAddError('')
        const h = parseInt(newHour)
        if (isNaN(h) || h < 1 || h > 12) { setAddError('Hour must be 1–12'); return }
        const slotStr = formatSlot(newHour, newMinute, newPeriod)
        if (orderedSlots.includes(slotStr)) { setAddError('This slot already exists'); return }

        setAdding(true)
        try {
            const res = await fetch(`${API_BASE}/slots/configs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ time_slot: slotStr, max_slots: newMaxSlots, is_enabled: true }),
            })
            if (res.ok) {
                await fetchConfigs()
                setShowAddForm(false)
                setNewHour('10'); setNewMinute('00'); setNewPeriod('AM'); setNewMaxSlots(5)
            } else {
                const err = await res.json()
                setAddError(err.detail || 'Failed to add slot')
            }
        } finally {
            setAdding(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Time Slot Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Add or remove time slots. Slots grey out in the app when full or when no riders are online.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchConfigs} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => { setShowAddForm(true); setAddError('') }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Add Slot
                    </button>
                </div>
            </div>

            {/* Add slot form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="glass-card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold">New Time Slot</h2>
                                <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-white/10">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex flex-wrap items-end gap-3">
                                {/* Hour */}
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Hour</label>
                                    <input
                                        type="number" min={1} max={12} value={newHour}
                                        onChange={e => setNewHour(e.target.value)}
                                        className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                        placeholder="10"
                                    />
                                </div>
                                {/* Minute */}
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Minute</label>
                                    <select
                                        value={newMinute} onChange={e => setNewMinute(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                    >
                                        {MINUTE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                {/* AM/PM */}
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Period</label>
                                    <select
                                        value={newPeriod} onChange={e => setNewPeriod(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                                {/* Max bookings */}
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Max bookings</label>
                                    <input
                                        type="number" min={1} max={50} value={newMaxSlots}
                                        onChange={e => setNewMaxSlots(parseInt(e.target.value) || 1)}
                                        className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                {/* Preview + Add */}
                                <div className="flex items-end gap-2">
                                    <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-muted-foreground">
                                        → <span className="text-white font-medium">{formatSlot(newHour, newMinute, newPeriod)}</span>
                                    </div>
                                    <button
                                        onClick={addSlot}
                                        disabled={adding}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                    >
                                        {adding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                        Add
                                    </button>
                                </div>
                            </div>
                            {addError && <p className="mt-3 text-xs text-red-400">{addError}</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Slot cards */}
            {orderedSlots.length === 0 ? (
                <div className="glass-card text-center py-12 text-muted-foreground">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No time slots configured yet.</p>
                    <p className="text-xs mt-1">Click "Add Slot" to create the first one.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orderedSlots.map((slot, i) => {
                        const cfg = configs[slot]
                        if (!cfg) return null
                        const isSaving = saving === slot
                        const isDeleting = deleting === slot
                        return (
                            <motion.div
                                key={slot}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.04 }}
                                className={`glass-card flex flex-col gap-4 ${!cfg.is_enabled ? 'opacity-60' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <Clock className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="font-semibold text-sm">{slot}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {/* Enable/Disable toggle */}
                                        <button
                                            onClick={() => updateLocal(slot, { is_enabled: !cfg.is_enabled })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cfg.is_enabled ? 'bg-primary' : 'bg-white/10'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cfg.is_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Max bookings per slot</label>
                                    <input
                                        type="number" min={1} max={50}
                                        value={cfg.max_slots}
                                        onChange={e => updateLocal(slot, { max_slots: parseInt(e.target.value) || 1 })}
                                        disabled={!cfg.is_enabled}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm disabled:opacity-40"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.is_enabled ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                                        {cfg.is_enabled ? 'Active' : 'Disabled'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => deleteSlot(slot)}
                                            disabled={isDeleting}
                                            className="flex items-center gap-1 px-2.5 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg text-xs transition-all disabled:opacity-50"
                                        >
                                            {isDeleting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                        </button>
                                        <button
                                            onClick={() => save(slot)}
                                            disabled={isSaving}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                                        >
                                            {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
