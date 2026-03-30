'use client'

import { useState, useEffect, useCallback } from 'react'
import { ListTree, PlusCircle, X, Pencil, Trash2, RefreshCw, ChevronRight, ChevronDown, Layers, Subtitles, Clock, DollarSign, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

const CURRENCY_SYMBOL: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }

export default function ServicesPage() {
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showServiceForm, setShowServiceForm] = useState(false)
    const [showSubForm, setShowSubForm] = useState(false)
    const [showTierForm, setShowTierForm] = useState(false)
    const [editItem, setEditItem] = useState<any>(null)
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
    const [expandedSubId, setExpandedSubId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', description: '', price: 0, discount_price: '', duration: '', icon: '', price_unit: 'hr', currency: 'INR', service_id: '' })
    const [tierData, setTierData] = useState({ hours: '', label: '', price: '', discount_price: '', sub_service_id: '' })
    const [tierUnit, setTierUnit] = useState<'hours' | 'minutes'>('hours')
    const [tierDuration, setTierDuration] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const fetchServices = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/services/`, { cache: 'no-store' })
            const data = await res.json()
            setServices(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Failed to fetch services:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchServices() }, [fetchServices])

    // ── Service CRUD ────────────────────────────────────────────────────────
    const handleServiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const method = editItem ? 'PATCH' : 'POST'
            const url = editItem ? `${API_BASE}/services/${editItem.id}` : `${API_BASE}/services/`
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formData.name, description: formData.description, icon: formData.icon || null, currency: formData.currency || 'INR', is_active: true }),
            })
            if (res.ok) { resetForm(); fetchServices() }
        } finally { setSubmitting(false) }
    }

    // ── Sub-service CRUD ────────────────────────────────────────────────────
    const handleSubSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const method = editItem ? 'PATCH' : 'POST'
            const url = editItem ? `${API_BASE}/services/sub/${editItem.id}` : `${API_BASE}/services/sub/`
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    price: formData.price,
                    discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
                    duration: formData.duration || null,
                    icon: formData.icon || null,
                    price_unit: formData.price_unit || 'hr',
                    currency: formData.currency || 'INR',
                    service_id: formData.service_id,
                    is_active: true
                }),
            })
            if (res.ok) { resetForm(); fetchServices() }
        } finally { setSubmitting(false) }
    }

    // ── Pricing Tier CRUD ───────────────────────────────────────────────────
    const handleTierSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const method = editItem ? 'PATCH' : 'POST'
            const url = editItem ? `${API_BASE}/services/tiers/${editItem.id}` : `${API_BASE}/services/tiers`
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(!editItem && { sub_service_id: tierData.sub_service_id }),
                    hours: tierUnit === 'minutes' ? (parseFloat(tierDuration) / 60) : (parseFloat(tierDuration) || 0),
                    label: tierData.label,
                    price: parseFloat(tierData.price) || 0,
                    discount_price: tierData.discount_price ? parseFloat(tierData.discount_price) : null,
                }),
            })
            if (res.ok) { resetForm(); fetchServices() }
        } finally { setSubmitting(false) }
    }

    const handleDelete = async (type: 'service' | 'sub' | 'tier', id: string) => {
        if (!confirm(`Delete this ${type === 'tier' ? 'pricing tier' : type}?`)) return
        const urls: Record<string, string> = {
            service: `${API_BASE}/services/${id}`,
            sub: `${API_BASE}/services/sub/${id}`,
            tier: `${API_BASE}/services/tiers/${id}`,
        }
        await fetch(urls[type], { method: 'DELETE' })
        fetchServices()
    }

    const resetForm = () => {
        setShowServiceForm(false)
        setShowSubForm(false)
        setShowTierForm(false)
        setEditItem(null)
        setFormData({ name: '', description: '', price: 0, discount_price: '', duration: '', icon: '', price_unit: 'hr', currency: 'INR', service_id: '' })
        setTierData({ hours: '', label: '', price: '', discount_price: '', sub_service_id: '' })
        setTierUnit('hours')
        setTierDuration('')
    }

    const autoTierLabel = (val: string, unit: 'hours' | 'minutes') => {
        const num = parseFloat(val)
        if (!num || isNaN(num)) return ''
        if (unit === 'minutes') return `${num} mins`
        return num === 1 ? '1 hr' : `${num} hrs`
    }

    const handleTierDurationChange = (val: string, unit: 'hours' | 'minutes') => {
        setTierDuration(val)
        setTierData(p => ({ ...p, label: autoTierLabel(val, unit) }))
    }

    const startEditService = (service: any) => {
        setEditItem(service)
        setFormData({ name: service.name, description: service.description || '', price: 0, discount_price: '', duration: '', icon: service.icon || '', price_unit: 'hr', currency: service.currency || 'INR', service_id: '' })
        setShowServiceForm(true)
    }
    const startEditSub = (sub: any) => {
        setEditItem(sub)
        setFormData({ name: sub.name, description: sub.description || '', price: sub.price, discount_price: sub.discount_price ? String(sub.discount_price) : '', duration: sub.duration || '', icon: sub.icon || '', price_unit: sub.price_unit || 'hr', currency: sub.currency || 'INR', service_id: sub.service_id })
        setShowSubForm(true)
    }
    const startAddSub = (serviceId: string) => {
        setFormData({ name: '', description: '', price: 0, discount_price: '', duration: '', icon: '', price_unit: 'hr', currency: 'INR', service_id: serviceId })
        setShowSubForm(true)
    }
    const startAddTier = (subServiceId: string) => {
        resetForm()
        setTierData({ hours: '', label: '', price: '', discount_price: '', sub_service_id: subServiceId })
        setShowTierForm(true)
    }
    const startEditTier = (tier: any) => {
        setEditItem(tier)
        const isMinutes = tier.hours > 0 && tier.hours < 1
        const unit: 'hours' | 'minutes' = isMinutes ? 'minutes' : 'hours'
        const duration = isMinutes ? String(Math.round(tier.hours * 60)) : String(tier.hours)
        setTierUnit(unit)
        setTierDuration(duration)
        setTierData({ hours: String(tier.hours), label: tier.label, price: String(tier.price), discount_price: tier.discount_price ? String(tier.discount_price) : '', sub_service_id: tier.sub_service_id })
        setShowTierForm(true)
    }

    if (loading) {
        return (<div className="flex items-center justify-center min-h-[60vh]"><RefreshCw className="w-6 h-6 animate-spin text-primary" /></div>)
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Services & Items</h1>
                    <p className="text-muted-foreground mt-1">Manage service categories, sub-services, and hourly pricing tiers.</p>
                </div>
                <button onClick={() => { resetForm(); setShowServiceForm(true) }} className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-all">
                    <PlusCircle className="w-4 h-4" /> New Category
                </button>
            </div>

            {/* ── Forms ─────────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {showServiceForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="glass-card">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold">{editItem ? 'Edit Category' : 'New Category'}</h2>
                                <button onClick={resetForm} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleServiceSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Category Name</label>
                                    <input required value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" placeholder="e.g. Baby Care" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm h-20" />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50">{submitting ? 'Saving...' : 'Save Category'}</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {showSubForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="glass-card">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold">{editItem ? 'Edit Sub-service' : 'New Sub-service'}</h2>
                                <button onClick={resetForm} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleSubSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs text-muted-foreground mb-1 block">Sub-service Name</label>
                                    <input required value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" placeholder="e.g. Quick Baby Sitting" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                                    <select value={formData.service_id} onChange={(e) => setFormData(p => ({ ...p, service_id: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm">
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Base Price <span className="opacity-50">(fallback if no tiers)</span></label>
                                    <input required type="number" step="0.01" value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
                                    <select value={formData.currency} onChange={(e) => setFormData(p => ({ ...p, currency: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm">
                                        <option value="INR">₹ INR</option><option value="USD">$ USD</option><option value="EUR">€ EUR</option><option value="GBP">£ GBP</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Icon</label>
                                    <input value={formData.icon} onChange={(e) => setFormData(p => ({ ...p, icon: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" placeholder="https://cdn.example.com/icon.png or child_care" />
                                    <p className="text-xs text-muted-foreground mt-1">Use a square image URL (1:1 ratio) or a Material icon name</p>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm h-16" />
                                </div>
                                <div className="md:col-span-3 flex justify-end gap-3">
                                    <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50">Save Sub-service</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {showTierForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="glass-card">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold">{editItem ? 'Edit Pricing Tier' : 'New Pricing Tier'}</h2>
                                <button onClick={resetForm} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleTierSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                                    <div className="flex gap-2">
                                        <input required type="number" step={tierUnit === 'minutes' ? '5' : '0.5'} min={tierUnit === 'minutes' ? '5' : '0.5'} value={tierDuration} onChange={(e) => handleTierDurationChange(e.target.value, tierUnit)} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm" placeholder={tierUnit === 'minutes' ? 'e.g. 45' : 'e.g. 1, 2'} />
                                        <select value={tierUnit} onChange={(e) => { const u = e.target.value as 'hours' | 'minutes'; setTierUnit(u); handleTierDurationChange(tierDuration, u) }} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2.5 text-sm">
                                            <option value="hours">hrs</option>
                                            <option value="minutes">mins</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Display Label <span className="opacity-50">(auto-filled)</span></label>
                                    <input required value={tierData.label} onChange={(e) => setTierData(p => ({ ...p, label: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" placeholder="e.g. 1 hr, 45 mins" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Price</label>
                                    <input required type="number" step="0.01" value={tierData.price} onChange={(e) => setTierData(p => ({ ...p, price: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" placeholder="e.g. 499" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Discount Price <span className="opacity-50">(opt)</span></label>
                                    <input type="number" step="0.01" value={tierData.discount_price} onChange={(e) => setTierData(p => ({ ...p, discount_price: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" placeholder="e.g. 399" />
                                </div>
                                <div className="md:col-span-4 flex justify-end gap-3">
                                    <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50">{submitting ? 'Saving...' : 'Save Tier'}</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Service list ───────────────────────────────────────────────────── */}
            <div className="space-y-4">
                {services.map((service) => (
                    <div key={service.id} className="glass rounded-2xl border border-white/10 overflow-hidden">
                        {/* Category header */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Layers className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">{service.name}</h3>
                                    <p className="text-xs text-muted-foreground">{service.sub_services?.length || 0} sub-services</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => startAddSub(service.id)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all" title="Add Sub-service"><PlusCircle className="w-4 h-4" /></button>
                                <button onClick={() => startEditService(service)} className="p-2 text-muted-foreground hover:bg-white/10 rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete('service', service.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                <button onClick={() => setSelectedServiceId(selectedServiceId === service.id ? null : service.id)} className="p-2 text-muted-foreground hover:bg-white/10 rounded-lg transition-all">
                                    {selectedServiceId === service.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Sub-services */}
                        <AnimatePresence>
                            {selectedServiceId === service.id && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <div className="px-6 py-4 space-y-3 bg-black/20">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Sub-services ({service.sub_services?.length || 0})</p>
                                        {service.sub_services?.length ? (
                                            service.sub_services.map((sub: any) => {
                                                const cs = CURRENCY_SYMBOL[sub.currency] || sub.currency || '₹'
                                                const hasTiers = sub.pricing_tiers && sub.pricing_tiers.length > 0
                                                const isExpanded = expandedSubId === sub.id
                                                return (
                                                    <div key={sub.id} className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden">
                                                        {/* Sub-service row */}
                                                        <div className="flex items-center justify-between p-3 group">
                                                            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}>
                                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                                    <Subtitles className="w-4 h-4 text-muted-foreground" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium">{sub.name}</p>
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                        {hasTiers ? (
                                                                            <span className="text-primary">{sub.pricing_tiers.length} pricing tier{sub.pricing_tiers.length > 1 ? 's' : ''}</span>
                                                                        ) : (
                                                                            <span>{cs}{sub.price}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                                            </div>
                                                            <div className="flex items-center gap-1 ml-2">
                                                                <button onClick={() => startAddTier(sub.id)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg" title="Add Pricing Tier"><DollarSign className="w-3.5 h-3.5" /></button>
                                                                <button onClick={() => startEditSub(sub)} className="p-1.5 text-muted-foreground hover:text-white rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                                                                <button onClick={() => handleDelete('sub', sub.id)} className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                                            </div>
                                                        </div>

                                                        {/* Pricing tiers */}
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                                    <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-3">
                                                                        <div className="flex items-center justify-between">
                                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Hourly Pricing</p>
                                                                            <button onClick={() => startAddTier(sub.id)} className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium">
                                                                                <Plus className="w-3 h-3" /> Add Tier
                                                                            </button>
                                                                        </div>
                                                                        {hasTiers ? sub.pricing_tiers.map((tier: any) => (
                                                                            <div key={tier.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5 group/tier">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                                                                                        <Clock className="w-3 h-3 text-primary" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-sm font-medium">{tier.label}</span>
                                                                                        <span className="text-[10px] text-muted-foreground ml-2">({tier.hours}h)</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="text-right">
                                                                                        {tier.discount_price && <span className="text-[10px] text-muted-foreground line-through mr-1">{cs}{tier.price}</span>}
                                                                                        <span className="text-sm font-semibold text-primary">{cs}{tier.discount_price || tier.price}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-0.5">
                                                                                        <button onClick={() => startEditTier(tier)} className="p-1 text-muted-foreground hover:text-white rounded"><Pencil className="w-3 h-3" /></button>
                                                                                        <button onClick={() => handleDelete('tier', tier.id)} className="p-1 text-muted-foreground hover:text-red-400 rounded"><Trash2 className="w-3 h-3" /></button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )) : (
                                                                            <p className="text-xs text-muted-foreground py-2">No pricing tiers. Using base price {cs}{sub.price}. Click &quot;Add Tier&quot; to set hourly pricing.</p>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <p className="text-sm text-muted-foreground pb-2">No sub-services yet.</p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
                {services.length === 0 && (
                    <div className="glass-card py-20 text-center text-muted-foreground">
                        <ListTree className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No services defined yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
