'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, RefreshCw, Save } from 'lucide-react'
import { motion } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

const ALL_SLOTS = [
    '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM',
    '05:30 PM', '07:00 PM', '08:30 PM', '10:00 PM',
]

interface SlotConfig {
    time_slot: string
    max_slots: number
    is_enabled: boolean
}

export default function SlotsPage() {
    const [configs, setConfigs] = useState<Record<string, SlotConfig>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)

    const fetchConfigs = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/slots/configs`, { cache: 'no-store' })
            if (res.ok) {
                const data: SlotConfig[] = await res.json()
                const map: Record<string, SlotConfig> = {}
                data.forEach(c => { map[c.time_slot] = c })
                setConfigs(map)
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchConfigs() }, [fetchConfigs])

    const getSlotConfig = (slot: string): SlotConfig =>
        configs[slot] ?? { time_slot: slot, max_slots: 5, is_enabled: true }

    const updateLocal = (slot: string, patch: Partial<SlotConfig>) => {
        setConfigs(prev => ({
            ...prev,
            [slot]: { ...getSlotConfig(slot), ...patch },
        }))
    }

    const save = async (slot: string) => {
        setSaving(slot)
        const cfg = getSlotConfig(slot)
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Time Slot Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Set the maximum bookings allowed per time slot. Disabled slots show "No slot available" in the app.
                    </p>
                </div>
                <button onClick={fetchConfigs} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ALL_SLOTS.map((slot, i) => {
                    const cfg = getSlotConfig(slot)
                    const isSaving = saving === slot
                    return (
                        <motion.div
                            key={slot}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
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
                                {/* Enable / Disable toggle */}
                                <button
                                    onClick={() => updateLocal(slot, { is_enabled: !cfg.is_enabled })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cfg.is_enabled ? 'bg-primary' : 'bg-white/10'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cfg.is_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Max bookings per slot</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={50}
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
                                <button
                                    onClick={() => save(slot)}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                                >
                                    {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
