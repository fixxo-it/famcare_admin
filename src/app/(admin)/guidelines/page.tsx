'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, CheckCircle2, XCircle, Save, Loader2, RefreshCw } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

interface Guideline {
    id?: string
    category: string
    service_type: string
    type: 'do' | 'dont'
    content: string
    display_order: number
    is_active: boolean
    _isNew?: boolean
    _dirty?: boolean
    _deleted?: boolean
}

interface ServiceType {
    id: string
    name: string
    service_name: string
}

export default function GuidelinesPage() {
    const [tab, setTab] = useState<'family' | 'caretaker'>('family')
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
    const [selectedService, setSelectedService] = useState('')
    const [dos, setDos] = useState<Guideline[]>([])
    const [donts, setDonts] = useState<Guideline[]>([])
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetch(`${API}/admin/service-types`)
            .then(r => r.json())
            .then((data: ServiceType[]) => {
                setServiceTypes(data)
                if (data.length > 0) {
                    const firstName = data[0].service_name.toLowerCase().replace(/\s+care$/i, '').replace(/\s+/g, '_')
                    setSelectedService(firstName)
                }
            })
            .catch(console.error)
    }, [])

    const fetchGuidelines = useCallback(async () => {
        if (!selectedService) return
        setLoading(true)
        try {
            const res = await fetch(`${API}/admin/guidelines?category=${tab}&service_type=${selectedService}`)
            const data = await res.json()
            const items = Array.isArray(data) ? data : []
            setDos(items.filter((g: Guideline) => g.type === 'do').sort((a: Guideline, b: Guideline) => a.display_order - b.display_order))
            setDonts(items.filter((g: Guideline) => g.type === 'dont').sort((a: Guideline, b: Guideline) => a.display_order - b.display_order))
        } catch (e) {
            console.error(e)
            setDos([])
            setDonts([])
        }
        setLoading(false)
    }, [tab, selectedService])

    useEffect(() => { fetchGuidelines() }, [fetchGuidelines])

    const addItem = (type: 'do' | 'dont') => {
        const newItem: Guideline = {
            category: tab,
            service_type: selectedService,
            type,
            content: '',
            display_order: type === 'do' ? dos.length + 1 : donts.length + 1,
            is_active: true,
            _isNew: true,
        }
        if (type === 'do') setDos([...dos, newItem])
        else setDonts([...donts, newItem])
    }

    const updateContent = (type: 'do' | 'dont', index: number, content: string) => {
        if (type === 'do') {
            const updated = [...dos]
            updated[index] = { ...updated[index], content, _dirty: true }
            setDos(updated)
        } else {
            const updated = [...donts]
            updated[index] = { ...updated[index], content, _dirty: true }
            setDonts(updated)
        }
    }

    const removeItem = async (type: 'do' | 'dont', index: number) => {
        const list = type === 'do' ? dos : donts
        const item = list[index]
        if (item.id && !item._isNew) {
            await fetch(`${API}/admin/guidelines/${item.id}`, { method: 'DELETE' })
        }
        if (type === 'do') setDos(dos.filter((_, i) => i !== index))
        else setDonts(donts.filter((_, i) => i !== index))
    }

    const saveAll = async () => {
        setSaving(true)
        try {
            const allItems = [
                ...dos.map((d, i) => ({ ...d, display_order: i + 1 })),
                ...donts.map((d, i) => ({ ...d, display_order: i + 1 })),
            ]
            for (const item of allItems) {
                if (!item.content.trim()) continue
                if (item._isNew || !item.id) {
                    await fetch(`${API}/admin/guidelines`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            category: tab,
                            service_type: selectedService,
                            type: item.type,
                            content: item.content,
                            display_order: item.display_order,
                        }),
                    })
                } else if (item._dirty) {
                    await fetch(`${API}/admin/guidelines/${item.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            content: item.content,
                            display_order: item.display_order,
                        }),
                    })
                }
            }
            await fetchGuidelines()
        } catch (e) {
            console.error(e)
            alert('Failed to save guidelines')
        }
        setSaving(false)
    }

    const uniqueServices = [...new Set(serviceTypes.map(s => s.service_name))]

    const renderColumn = (title: string, items: Guideline[], type: 'do' | 'dont', colorClass: string, bgClass: string) => (
        <div className="glass-card !p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {type === 'do'
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        : <XCircle className="w-5 h-5 text-red-400" />
                    }
                    <h3 className={`text-lg font-bold ${colorClass}`}>{title}</h3>
                </div>
                <span className="text-xs text-muted-foreground">{items.length} items</span>
            </div>
            <div className="space-y-3">
                {items.map((item, idx) => (
                    <motion.div
                        key={item.id || `new-${idx}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2"
                    >
                        <span className="text-xs text-muted-foreground mt-3 w-5 shrink-0">{idx + 1}.</span>
                        <textarea
                            value={item.content}
                            onChange={e => updateContent(type, idx, e.target.value)}
                            placeholder="Enter guideline..."
                            rows={2}
                            className={`flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50`}
                        />
                        <button
                            onClick={() => removeItem(type, idx)}
                            className="mt-2 p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors shrink-0"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </div>
            <button
                onClick={() => addItem(type)}
                className="mt-4 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
                <Plus className="w-4 h-4" /> Add {type === 'do' ? "Do" : "Don't"}
            </button>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gradient">Guidelines</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage do&apos;s and don&apos;ts shown during booking and order acceptance</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchGuidelines}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={saveAll}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {(['family', 'caretaker'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            tab === t
                                ? 'bg-primary/15 text-white border border-primary/20'
                                : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/5'
                        }`}
                    >
                        {t === 'family' ? 'Family' : 'Caretaker'}
                    </button>
                ))}
            </div>

            {/* Service selector */}
            <div>
                <label className="text-sm text-muted-foreground block mb-2">Service Type</label>
                <select
                    value={selectedService}
                    onChange={e => setSelectedService(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 min-w-[200px]"
                >
                    {uniqueServices.map(s => {
                        const key = s.toLowerCase().replace(/\s+care$/i, '').replace(/\s+/g, '_')
                        return (
                            <option key={s} value={key} className="bg-gray-900">
                                {s}
                            </option>
                        )
                    })}
                </select>
            </div>

            {/* Two-column layout */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="flex gap-6 flex-col md:flex-row">
                    {renderColumn("Do's", dos, 'do', 'text-emerald-400', 'bg-emerald-500/5')}
                    {renderColumn("Don'ts", donts, 'dont', 'text-red-400', 'bg-red-500/5')}
                </div>
            )}
        </div>
    )
}
