'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, RefreshCw, Plus, Trash2, X, Users, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

interface SlotOverview {
    time_slot: string
    max_slots: number
    booked: number
    available: number
    is_enabled: boolean
    no_riders: boolean
}

function todayStr() {
    return new Date().toISOString().split('T')[0]
}

function periodOf(slot: string): 'Morning' | 'Afternoon' | 'Evening' {
    const [timePart, period] = slot.split(' ')
    let h = parseInt(timePart.split(':')[0])
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    if (h < 12) return 'Morning'
    if (h < 17) return 'Afternoon'
    return 'Evening'
}

const PERIOD_ICONS: Record<string, string> = {
    Morning: '🌅',
    Afternoon: '☀️',
    Evening: '🌙',
}

function CapacityBar({ booked, max }: { booked: number; max: number }) {
    const pct = max > 0 ? Math.min(100, (booked / max) * 100) : 0
    const color = pct >= 100 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'
    return (
        <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5">
            <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
    )
}

export default function SlotsPage() {
    const [slots, setSlots] = useState<SlotOverview[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(todayStr())
    const [noRiders, setNoRiders] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [toggling, setToggling] = useState<string | null>(null)
    const [togglingPeriod, setTogglingPeriod] = useState<string | null>(null)
    const [togglingAll, setTogglingAll] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [savingMax, setSavingMax] = useState<string | null>(null)
    const [localMax, setLocalMax] = useState<Record<string, number>>({})

    // Add form state
    const [newHour, setNewHour] = useState('10')
    const [newMinute, setNewMinute] = useState('00')
    const [newPeriod, setNewPeriod] = useState<'AM' | 'PM'>('AM')
    const [newMax, setNewMax] = useState(5)
    const [adding, setAdding] = useState(false)
    const [addError, setAddError] = useState('')

    // Operational hours config
    const [config, setConfig] = useState<any>(null)
    const [savingConfig, setSavingConfig] = useState(false)

    const fetchConfig = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/app-config`)
            if (res.ok) {
                const data = await res.json()
                setConfig(data)
            }
        } catch (err) {
            console.error('Failed to fetch config', err)
        }
    }, [])

    useEffect(() => { fetchConfig() }, [fetchConfig])

    const updateOperationalHours = async (field: string, value: string) => {
        setSavingConfig(true)
        try {
            await fetch(`${API_BASE}/admin/app-config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            })
            await fetchConfig()
        } finally {
            setSavingConfig(false)
        }
    }

    const fetchOverview = useCallback(async (d: string) => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/slots/overview?date=${d}`, { cache: 'no-store' })
            if (res.ok) {
                const data: SlotOverview[] = await res.json()
                setSlots(data)
                if (data.length > 0) setNoRiders(data[0].no_riders)
                const maxMap: Record<string, number> = {}
                data.forEach(s => { maxMap[s.time_slot] = s.max_slots })
                setLocalMax(maxMap)
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchOverview(date) }, [fetchOverview, date])

    // Auto-save toggle immediately
    const toggleSlot = async (slot: SlotOverview) => {
        setToggling(slot.time_slot)
        const newEnabled = !slot.is_enabled
        // Optimistic update
        setSlots(prev => prev.map(s => s.time_slot === slot.time_slot ? { ...s, is_enabled: newEnabled } : s))
        try {
            await fetch(`${API_BASE}/slots/configs/${encodeURIComponent(slot.time_slot)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ max_slots: slot.max_slots, is_enabled: newEnabled }),
            })
        } catch {
            // Revert on error
            setSlots(prev => prev.map(s => s.time_slot === slot.time_slot ? { ...s, is_enabled: slot.is_enabled } : s))
        } finally {
            setToggling(null)
        }
    }

    const saveMax = async (slot: SlotOverview) => {
        const newMaxVal = localMax[slot.time_slot] ?? slot.max_slots
        if (newMaxVal === slot.max_slots) return
        setSavingMax(slot.time_slot)
        try {
            const res = await fetch(`${API_BASE}/slots/configs/${encodeURIComponent(slot.time_slot)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ max_slots: newMaxVal, is_enabled: slot.is_enabled }),
            })
            if (res.ok) {
                setSlots(prev => prev.map(s => s.time_slot === slot.time_slot ? { ...s, max_slots: newMaxVal } : s))
            }
        } finally {
            setSavingMax(null)
        }
    }

    const deleteSlot = async (timeSlot: string) => {
        if (!confirm(`Remove the ${timeSlot} slot?`)) return
        setDeleting(timeSlot)
        try {
            const res = await fetch(`${API_BASE}/slots/configs/${encodeURIComponent(timeSlot)}`, { method: 'DELETE' })
            if (res.ok || res.status === 204) {
                setSlots(prev => prev.filter(s => s.time_slot !== timeSlot))
            }
        } finally {
            setDeleting(null)
        }
    }

    const togglePeriod = async (period: string, enable: boolean) => {
        setTogglingPeriod(period)
        const targets = grouped[period]
        setSlots(prev => prev.map(s => periodOf(s.time_slot) === period ? { ...s, is_enabled: enable } : s))
        try {
            await Promise.all(targets.map(s =>
                fetch(`${API_BASE}/slots/configs/${encodeURIComponent(s.time_slot)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ max_slots: s.max_slots, is_enabled: enable }),
                })
            ))
        } catch {
            await fetchOverview(date)
        } finally {
            setTogglingPeriod(null)
        }
    }

    const toggleAll = async (enable: boolean) => {
        setTogglingAll(true)
        setSlots(prev => prev.map(s => ({ ...s, is_enabled: enable })))
        try {
            await Promise.all(slots.map(s =>
                fetch(`${API_BASE}/slots/configs/${encodeURIComponent(s.time_slot)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ max_slots: s.max_slots, is_enabled: enable }),
                })
            ))
        } catch {
            await fetchOverview(date)
        } finally {
            setTogglingAll(false)
        }
    }

    const addSlot = async () => {
        setAddError('')
        const h = parseInt(newHour)
        if (isNaN(h) || h < 1 || h > 12) { setAddError('Hour must be between 1 and 12'); return }
        const slotStr = `${String(h).padStart(2, '0')}:${newMinute} ${newPeriod}`
        if (slots.some(s => s.time_slot === slotStr)) { setAddError('This slot already exists'); return }

        setAdding(true)
        try {
            const res = await fetch(`${API_BASE}/slots/configs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ time_slot: slotStr, max_slots: newMax, is_enabled: true }),
            })
            if (res.ok) {
                await fetchOverview(date)
                setShowAddForm(false)
                setNewHour('10'); setNewMinute('00'); setNewPeriod('AM'); setNewMax(5)
            } else {
                const err = await res.json()
                setAddError(err.detail || 'Failed to add slot')
            }
        } finally {
            setAdding(false)
        }
    }

    // Group slots by period
    const grouped: Record<string, SlotOverview[]> = { Morning: [], Afternoon: [], Evening: [] }
    slots.forEach(s => grouped[periodOf(s.time_slot)].push(s))
    const activePeriods = (['Morning', 'Afternoon', 'Evening'] as const).filter(p => grouped[p].length > 0)

    const totalSlots = slots.reduce((a, s) => a + s.max_slots, 0)
    const totalBooked = slots.reduce((a, s) => a + s.booked, 0)
    const enabledCount = slots.filter(s => s.is_enabled).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Slot Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Time slots apply to <span className="text-white font-medium">every day</span> — only the booking counts change per day. Use the date picker to see how full each slot is on a specific date.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                    />
                    <button onClick={() => fetchOverview(date)} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => { setShowAddForm(v => !v); setAddError('') }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-all"
                    >
                        {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showAddForm ? 'Cancel' : 'Add Slot'}
                    </button>
                </div>
            </div>

            {/* Operational Hours Settings */}
            <div className="glass-card flex flex-wrap items-center justify-between gap-6 p-5 border-primary/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Operational Hours</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Define the global booking window for customers.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Start Time</label>
                        <input 
                            type="text"
                            placeholder="10:00 AM"
                            value={config?.operational_start_time || ''}
                            onChange={(e) => setConfig({ ...config, operational_start_time: e.target.value })}
                            onBlur={(e) => updateOperationalHours('operational_start_time', e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm w-32 focus:border-primary/50 outline-none transition-all"
                        />
                    </div>
                    <div className="text-muted-foreground mt-4 text-xs font-medium">to</div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">End Time</label>
                        <input 
                            type="text"
                            placeholder="10:00 PM"
                            value={config?.operational_end_time || ''}
                            onChange={(e) => setConfig({ ...config, operational_end_time: e.target.value })}
                            onBlur={(e) => updateOperationalHours('operational_end_time', e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm w-32 focus:border-primary/50 outline-none transition-all"
                        />
                    </div>
                    {savingConfig && (
                        <div className="mt-4">
                            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        </div>
                    )}
                </div>
            </div>

            {/* No riders warning */}
            {noRiders && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>No riders are currently online — all slots will appear unavailable in the app.</span>
                </div>
            )}

            {/* Summary stats */}
            {slots.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total Slots', value: slots.length, sub: `${enabledCount} active` },
                        { label: 'Capacity', value: totalSlots, sub: 'max bookings today' },
                        { label: 'Booked', value: totalBooked, sub: `${totalSlots > 0 ? Math.round((totalBooked / totalSlots) * 100) : 0}% fill rate` },
                    ].map(stat => (
                        <div key={stat.label} className="glass-card py-3 text-center">
                            <div className="text-xl font-bold">{stat.value}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                            <div className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.sub}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Master toggle */}
            {slots.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                        <p className="text-sm font-semibold">All Slots</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{enabledCount} of {slots.length} enabled</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => toggleAll(false)}
                            disabled={togglingAll || enabledCount === 0}
                            className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-colors font-medium"
                        >
                            Disable All
                        </button>
                        <button
                            onClick={() => toggleAll(true)}
                            disabled={togglingAll || enabledCount === slots.length}
                            className="px-3 py-1.5 text-xs rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-40 transition-colors font-medium"
                        >
                            Enable All
                        </button>
                        {togglingAll && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
                    </div>
                </div>
            )}

            {/* Add slot form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="glass-card border border-primary/20">
                            <h2 className="text-sm font-semibold mb-4 text-primary">New Time Slot</h2>
                            <div className="flex flex-wrap items-end gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Hour (1–12)</label>
                                    <input type="number" min={1} max={12} value={newHour}
                                        onChange={e => setNewHour(e.target.value)}
                                        className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Minute</label>
                                    <select value={newMinute} onChange={e => setNewMinute(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
                                        {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">AM / PM</label>
                                    <div className="flex rounded-lg overflow-hidden border border-white/10">
                                        {(['AM', 'PM'] as const).map(p => (
                                            <button key={p} onClick={() => setNewPeriod(p)}
                                                className={`px-4 py-2 text-sm font-medium transition-colors ${newPeriod === p ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:text-white'}`}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Max bookings</label>
                                    <input type="number" min={1} max={50} value={newMax}
                                        onChange={e => setNewMax(parseInt(e.target.value) || 1)}
                                        className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">→</span>
                                    <span className="font-semibold text-sm">{`${String(parseInt(newHour) || 0).padStart(2, '0')}:${newMinute} ${newPeriod}`}</span>
                                    <button onClick={addSlot} disabled={adding}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-all">
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

            {/* Slot list */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : slots.length === 0 ? (
                <div className="glass-card text-center py-16">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm text-muted-foreground">No time slots yet.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Click "Add Slot" above to create the first one.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {activePeriods.map(period => (
                        <div key={period}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{PERIOD_ICONS[period]}</span>
                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{period}</h2>
                                    <span className="text-xs text-muted-foreground/50">{grouped[period].length} slot{grouped[period].length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {togglingPeriod === period && <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                                    <button
                                        onClick={() => togglePeriod(period, false)}
                                        disabled={togglingPeriod === period || grouped[period].every(s => !s.is_enabled)}
                                        className="px-2.5 py-1 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-colors font-medium"
                                    >
                                        Disable
                                    </button>
                                    <button
                                        onClick={() => togglePeriod(period, true)}
                                        disabled={togglingPeriod === period || grouped[period].every(s => s.is_enabled)}
                                        className="px-2.5 py-1 text-xs rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-40 transition-colors font-medium"
                                    >
                                        Enable
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {grouped[period].map((slot, i) => {
                                    const isDel = deleting === slot.time_slot
                                    const isToggling = toggling === slot.time_slot
                                    const isSavingMax = savingMax === slot.time_slot
                                    const currentMax = localMax[slot.time_slot] ?? slot.max_slots
                                    const pct = slot.max_slots > 0 ? Math.round((slot.booked / slot.max_slots) * 100) : 0
                                    const isFull = slot.booked >= slot.max_slots

                                    return (
                                        <motion.div key={slot.time_slot}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className={`glass-card flex flex-col gap-3 transition-opacity ${!slot.is_enabled ? 'opacity-50' : ''}`}
                                        >
                                            {/* Top row: time + status + toggle */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-primary" />
                                                    <span className="font-bold text-sm">{slot.time_slot}</span>
                                                    {isFull && slot.is_enabled && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">FULL</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {slot.is_enabled
                                                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                                        : <X className="w-3.5 h-3.5 text-red-400" />
                                                    }
                                                    {/* Toggle */}
                                                    <button
                                                        onClick={() => toggleSlot(slot)}
                                                        disabled={isToggling}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${slot.is_enabled ? 'bg-primary' : 'bg-white/15'}`}
                                                    >
                                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${slot.is_enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Capacity */}
                                            <div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <Users className="w-3 h-3" /> Bookings
                                                    </span>
                                                    <span className={`font-semibold ${isFull ? 'text-red-400' : 'text-white'}`}>
                                                        {slot.booked} / {slot.max_slots}
                                                        <span className="text-muted-foreground font-normal ml-1">({pct}%)</span>
                                                    </span>
                                                </div>
                                                <CapacityBar booked={slot.booked} max={slot.max_slots} />
                                            </div>

                                            {/* Max slots inline edit */}
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-muted-foreground shrink-0">Max</label>
                                                <input
                                                    type="number" min={1} max={50}
                                                    value={currentMax}
                                                    onChange={e => setLocalMax(prev => ({ ...prev, [slot.time_slot]: parseInt(e.target.value) || 1 }))}
                                                    onBlur={() => saveMax(slot)}
                                                    onKeyDown={e => e.key === 'Enter' && saveMax(slot)}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
                                                />
                                                {isSavingMax && <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground shrink-0" />}
                                            </div>

                                            {/* Delete */}
                                            <button onClick={() => deleteSlot(slot.time_slot)} disabled={isDel}
                                                className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50">
                                                {isDel ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                Remove slot
                                            </button>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
