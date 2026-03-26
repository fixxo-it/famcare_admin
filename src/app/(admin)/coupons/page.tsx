'use client'

import { useState, useEffect, useCallback } from 'react'
import { Ticket, PlusCircle, X, Pencil, Trash2, RefreshCw, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

interface SubService {
    id: string
    name: string
    service_name?: string
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([])
    const [subServices, setSubServices] = useState<SubService[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editCoupon, setEditCoupon] = useState<any>(null)
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'flat',
        discount_value: 0,
        min_order_value: 0,
        max_discount: 0,
        expiry_date: '',
        usage_limit: 0,
        per_user_limit: 0,
        allowed_sub_service_ids: [] as string[],
        is_active: true
    })
    const [submitting, setSubmitting] = useState(false)

    const fetchCoupons = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/coupons/`, { cache: 'no-store' })
            const data = await res.json()
            setCoupons(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Failed to fetch coupons:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchSubServices = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/services/`, { cache: 'no-store' })
            const data = await res.json()
            // Flatten: each category has sub_services[]
            const subs: SubService[] = []
            if (Array.isArray(data)) {
                for (const cat of data) {
                    if (Array.isArray(cat.sub_services)) {
                        for (const sub of cat.sub_services) {
                            subs.push({ id: sub.id, name: sub.name, service_name: cat.name })
                        }
                    }
                }
            }
            setSubServices(subs)
        } catch (e) {
            console.error('Failed to fetch services:', e)
        }
    }, [])

    useEffect(() => { fetchCoupons(); fetchSubServices() }, [fetchCoupons, fetchSubServices])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const method = editCoupon ? 'PATCH' : 'POST'
            const url = editCoupon ? `${API_BASE}/coupons/${editCoupon.id}` : `${API_BASE}/coupons/`
            
            const body: any = { ...formData }
            if (!body.expiry_date) delete body.expiry_date
            if (body.usage_limit === 0) body.usage_limit = null
            if (body.per_user_limit === 0) body.per_user_limit = null
            if (body.min_order_value === 0) body.min_order_value = null
            if (body.max_discount === 0) body.max_discount = null
            if (body.allowed_sub_service_ids?.length === 0) body.allowed_sub_service_ids = []
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            
            if (res.ok) {
                resetForm()
                fetchCoupons()
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this coupon code?')) return
        await fetch(`${API_BASE}/coupons/${id}`, { method: 'DELETE' })
        fetchCoupons()
    }

    const resetForm = () => {
        setShowForm(false)
        setEditCoupon(null)
        setFormData({
            code: '',
            discount_type: 'flat',
            discount_value: 0,
            min_order_value: 0,
            max_discount: 0,
            expiry_date: '',
            usage_limit: 0,
            per_user_limit: 0,
            allowed_sub_service_ids: [],
            is_active: true
        })
    }

    const startEdit = (coupon: any) => {
        setEditCoupon(coupon)
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            min_order_value: coupon.min_order_value || 0,
            max_discount: coupon.max_discount || 0,
            expiry_date: coupon.expiry_date ? new Date(coupon.expiry_date).toISOString().split('T')[0] : '',
            usage_limit: coupon.usage_limit || 0,
            per_user_limit: coupon.per_user_limit || 0,
            allowed_sub_service_ids: coupon.allowed_sub_service_ids || [],
            is_active: coupon.is_active
        })
        setShowForm(true)
    }

    const toggleSubService = (id: string) => {
        setFormData(prev => {
            const ids = prev.allowed_sub_service_ids.includes(id)
                ? prev.allowed_sub_service_ids.filter(x => x !== id)
                : [...prev.allowed_sub_service_ids, id]
            return { ...prev, allowed_sub_service_ids: ids }
        })
    }

    const getSubServiceName = (id: string) => {
        const sub = subServices.find(s => s.id === id)
        return sub ? `${sub.service_name} → ${sub.name}` : id.slice(0, 8)
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
                    <h1 className="text-3xl font-bold text-gradient">Coupons</h1>
                    <p className="text-muted-foreground mt-1">Manage promotional offers and discounts.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true) }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
                >
                    <PlusCircle className="w-4 h-4" />
                    New Coupon
                </button>
            </div>

            {/* Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="glass-card">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold">{editCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
                                <button onClick={resetForm} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Coupon Code</label>
                                        <input required value={formData.code} onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm uppercase font-mono" placeholder="OFF50" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                                        <select value={formData.discount_type} onChange={(e) => setFormData(p => ({ ...p, discount_type: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm">
                                            <option value="flat">Flat Amount (₹)</option>
                                            <option value="percentage">Percentage (%)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">
                                            {formData.discount_type === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
                                        </label>
                                        <input required type="number" value={formData.discount_value} onChange={(e) => setFormData(p => ({ ...p, discount_value: parseFloat(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Min Order Value (₹)</label>
                                        <input type="number" value={formData.min_order_value} onChange={(e) => setFormData(p => ({ ...p, min_order_value: parseFloat(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Max Discount (₹, for % type)</label>
                                        <input type="number" value={formData.max_discount} onChange={(e) => setFormData(p => ({ ...p, max_discount: parseFloat(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Expiry Date</label>
                                        <input type="date" value={formData.expiry_date} onChange={(e) => setFormData(p => ({ ...p, expiry_date: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Global Usage Limit (0 = ∞)</label>
                                        <input type="number" value={formData.usage_limit} onChange={(e) => setFormData(p => ({ ...p, usage_limit: parseInt(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Per-User Limit (0 = ∞)</label>
                                        <input type="number" value={formData.per_user_limit} onChange={(e) => setFormData(p => ({ ...p, per_user_limit: parseInt(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                                    </div>
                                    <div className="flex items-end mb-2">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary" />
                                            <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">Active</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Sub-service selector */}
                                <div>
                                    <label className="text-xs text-muted-foreground mb-2 block">
                                        Allowed Services (leave empty = all services)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {subServices.map(sub => {
                                            const selected = formData.allowed_sub_service_ids.includes(sub.id)
                                            return (
                                                <button
                                                    key={sub.id}
                                                    type="button"
                                                    onClick={() => toggleSubService(sub.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                        selected
                                                            ? 'bg-primary/20 border-primary/40 text-primary'
                                                            : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/20'
                                                    }`}
                                                >
                                                    {sub.service_name} → {sub.name}
                                                </button>
                                            )
                                        })}
                                        {subServices.length === 0 && (
                                            <p className="text-xs text-muted-foreground">Loading services...</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50">
                                        {submitting ? 'Saving...' : 'Save Coupon'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                    <div key={coupon.id} className="glass-card group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => startEdit(coupon)} className="p-1.5 bg-white/10 rounded-lg hover:bg-primary/20 hover:text-primary transition-all"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(coupon.id)} className="p-1.5 bg-white/10 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${coupon.is_active ? 'bg-primary/10 border-primary/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                <Ticket className={`w-6 h-6 ${coupon.is_active ? 'text-primary' : 'text-red-400'}`} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg font-mono tracking-wider">{coupon.code}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {coupon.discount_type === 'flat' ? `₹${coupon.discount_value} OFF` : `${coupon.discount_value}% OFF`}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold font-mono">Usage</p>
                                <p className="text-sm font-medium">{coupon.used_count} {coupon.usage_limit > 0 ? `/ ${coupon.usage_limit}` : 'uses'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold font-mono">Per User</p>
                                <p className="text-sm font-medium">{coupon.per_user_limit ? `${coupon.per_user_limit}x` : '∞'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold font-mono">Expiry</p>
                                <p className="text-sm font-medium">{coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : 'Never'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold font-mono">Min Order</p>
                                <p className="text-sm font-medium">{coupon.min_order_value ? `₹${coupon.min_order_value}` : 'None'}</p>
                            </div>
                        </div>
                        {/* Allowed services tags */}
                        {coupon.allowed_sub_service_ids?.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold font-mono mb-2">Services</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {coupon.allowed_sub_service_ids.map((id: string) => (
                                        <span key={id} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-md">
                                            {getSubServiceName(id)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!coupon.allowed_sub_service_ids?.length && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Applies to <span className="text-white font-medium">all services</span>.
                                    {coupon.discount_type === 'percentage' && coupon.max_discount > 0 && ` Max discount ₹${coupon.max_discount}.`}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
                {coupons.length === 0 && (
                    <div className="md:col-span-2 lg:col-span-3 py-20 text-center text-muted-foreground glass-card">
                        <Tag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No coupons found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
