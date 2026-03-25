'use client'

import { useState, useEffect, useCallback } from 'react'
import { ListTree, PlusCircle, X, Pencil, Trash2, RefreshCw, ChevronRight, ChevronDown, Layers, Subtitles, Clock, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

export default function ServicesPage() {
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showServiceForm, setShowServiceForm] = useState(false)
    const [showSubForm, setShowSubForm] = useState(false)
    const [editItem, setEditItem] = useState<any>(null)
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', description: '', price: 0, discount_price: '', duration: '', icon: '', price_unit: 'hr', currency: 'INR', service_id: '' })
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

    const handleServiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const method = editItem ? 'PATCH' : 'POST'
            const url = editItem ? `${API_BASE}/services/${editItem.id}` : `${API_BASE}/services/`
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formData.name, description: formData.description, is_active: true }),
            })
            if (res.ok) {
                resetForm()
                fetchServices()
            }
        } finally {
            setSubmitting(false)
        }
    }

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
            if (res.ok) {
                resetForm()
                fetchServices()
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (type: 'service' | 'sub', id: string) => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return
        const url = type === 'service' ? `${API_BASE}/services/${id}` : `${API_BASE}/services/sub/${id}`
        await fetch(url, { method: 'DELETE' })
        fetchServices()
    }

    const resetForm = () => {
        setShowServiceForm(false)
        setShowSubForm(false)
        setEditItem(null)
        setFormData({ name: '', description: '', price: 0, discount_price: '', duration: '', icon: '', price_unit: 'hr', currency: 'INR', service_id: '' })
    }

    const startEditService = (service: any) => {
        setEditItem(service)
        setFormData({ name: service.name, description: service.description || '', price: 0, discount_price: '', duration: '', icon: '', price_unit: 'hr', currency: service.currency || 'INR', service_id: '' })
        setShowServiceForm(true)
    }

    const startEditSub = (sub: any) => {
        setEditItem(sub)
        setFormData({ 
            name: sub.name, 
            description: sub.description || '', 
            price: sub.price, 
            discount_price: sub.discount_price ? String(sub.discount_price) : '',
            duration: sub.duration || '',
            icon: sub.icon || '',
            price_unit: sub.price_unit || 'hr',
            currency: sub.currency || 'INR',
            service_id: sub.service_id 
        })
        setShowSubForm(true)
    }

    const startAddSub = (serviceId: string) => {
        setFormData({ name: '', description: '', price: 0, discount_price: '', duration: '', icon: '', price_unit: 'hr', currency: 'INR', service_id: serviceId })
        setShowSubForm(true)
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
                    <h1 className="text-3xl font-bold text-gradient">Services & Items</h1>
                    <p className="text-muted-foreground mt-1">Manage service categories and their pricing.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowServiceForm(true) }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-all"
                >
                    <PlusCircle className="w-4 h-4" />
                    New Category
                </button>
            </div>

            {/* Category Form */}
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
                                    <input required value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" placeholder="e.g. Home Care" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm h-20" placeholder="A brief about this category..." />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50">
                                        {submitting ? 'Saving...' : 'Save Category'}
                                    </button>
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
                                    <label className="text-xs text-muted-foreground mb-1 block">Item Name</label>
                                    <input required value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" placeholder="e.g. Newborn Care" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                                    <select value={formData.service_id} onChange={(e) => setFormData(p => ({ ...p, service_id: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm">
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Price</label>
                                    <input required type="number" step="0.01" value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Discount Price <span className="opacity-50">(optional)</span></label>
                                    <input type="number" step="0.01" value={formData.discount_price} onChange={(e) => setFormData(p => ({ ...p, discount_price: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" placeholder="e.g. 299" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Duration / Hours</label>
                                    <input value={formData.duration} onChange={(e) => setFormData(p => ({ ...p, duration: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" placeholder="e.g. 1 hr, 2 hrs, 4-8 hrs" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Price Unit</label>
                                    <select value={formData.price_unit} onChange={(e) => setFormData(p => ({ ...p, price_unit: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm">
                                        <option value="hr">Per Hour</option>
                                        <option value="session">Per Session</option>
                                        <option value="day">Per Day</option>
                                        <option value="visit">Per Visit</option>
                                        <option value="month">Per Month</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
                                    <select value={formData.currency} onChange={(e) => setFormData(p => ({ ...p, currency: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm">
                                        <option value="INR">₹ INR</option>
                                        <option value="USD">$ USD</option>
                                        <option value="EUR">€ EUR</option>
                                        <option value="GBP">£ GBP</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Icon Name</label>
                                    <select value={formData.icon} onChange={(e) => setFormData(p => ({ ...p, icon: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm">
                                        <option value="">Select icon...</option>
                                        <option value="child_care">Child Care</option>
                                        <option value="nightlight">Night / Moon</option>
                                        <option value="spa">Spa / Massage</option>
                                        <option value="science">Science / STEM</option>
                                        <option value="pregnant_woman">Pregnant / Postpartum</option>
                                        <option value="elderly">Elderly / Accessibility</option>
                                        <option value="pets">Pets</option>
                                        <option value="favorite">Heart / Favorite</option>
                                        <option value="directions_walk">Walking</option>
                                        <option value="home">Home</option>
                                    </select>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm h-20" />
                                </div>
                                <div className="md:col-span-3 flex justify-end gap-3">
                                    <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50">Save Item</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hierarchy List */}
            <div className="space-y-4">
                {services.map((service) => (
                    <div key={service.id} className="glass rounded-2xl border border-white/10 overflow-hidden">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Layers className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">{service.name}</h3>
                                    <p className="text-xs text-muted-foreground">{service.description || 'No description'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => startAddSub(service.id)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all" title="Add Sub-service">
                                    <PlusCircle className="w-4 h-4" />
                                </button>
                                <button onClick={() => startEditService(service)} className="p-2 text-muted-foreground hover:bg-white/10 rounded-lg transition-all">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete('service', service.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setSelectedServiceId(selectedServiceId === service.id ? null : service.id)}
                                    className="p-2 text-muted-foreground hover:bg-white/10 rounded-lg transition-all"
                                >
                                    {selectedServiceId === service.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {selectedServiceId === service.id && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <div className="px-6 py-4 space-y-3 bg-black/20">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Sub-services ({service.sub_services?.length || 0})</p>
                                        {service.sub_services?.length ? (
                                            service.sub_services.map((sub: any) => (
                                                <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                            <Subtitles className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{sub.name}</p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <span>{sub.currency === 'INR' ? '₹' : sub.currency === 'USD' ? '$' : sub.currency === 'EUR' ? '€' : sub.currency || '₹'}{sub.price}/{sub.price_unit || 'hr'}</span>
                                                                {sub.discount_price && (
                                                                    <span className="text-green-400">Discount: {sub.currency === 'INR' ? '₹' : sub.currency || '₹'}{sub.discount_price}</span>
                                                                )}
                                                                {sub.duration && (
                                                                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{sub.duration}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEditSub(sub)} className="p-2 text-muted-foreground hover:text-white rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => handleDelete('sub', sub.id)} className="p-2 text-muted-foreground hover:text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </div>
                                            ))
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
