'use client'

import { useState, useEffect, useCallback } from 'react'
import { Ticket, PlusCircle, X, Pencil, Trash2, RefreshCw, AlertCircle, Calendar, Tag, Percent, DollarSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([])
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

    useEffect(() => { fetchCoupons() }, [fetchCoupons])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const method = editCoupon ? 'PATCH' : 'POST'
            const url = editCoupon ? `${API_BASE}/coupons/${editCoupon.id}` : `${API_BASE}/coupons/`
            
            // Format expiry_date for API if provided
            const body = { ...formData }
            if (!body.expiry_date) delete (body as any).expiry_date
            
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
            is_active: coupon.is_active
        })
        setShowForm(true)
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
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Coupon Code</label>
                                    <input required value={formData.code} onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm uppercase font-mono" placeholder="OFF50" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                                    <select value={formData.discount_type} onChange={(e) => setFormData(p => ({ ...p, discount_type: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm">
                                        <option value="flat">Flat Amount</option>
                                        <option value="percentage">Percentage (%)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Value</label>
                                    <input required type="number" value={formData.discount_value} onChange={(e) => setFormData(p => ({ ...p, discount_value: parseFloat(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Min Order Value</label>
                                    <input type="number" value={formData.min_order_value} onChange={(e) => setFormData(p => ({ ...p, min_order_value: parseFloat(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Max Discount (for %)</label>
                                    <input type="number" value={formData.max_discount} onChange={(e) => setFormData(p => ({ ...p, max_discount: parseFloat(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Expiry Date</label>
                                    <input type="date" value={formData.expiry_date} onChange={(e) => setFormData(p => ({ ...p, expiry_date: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Usage Limit (0 = infinite)</label>
                                    <input type="number" value={formData.usage_limit} onChange={(e) => setFormData(p => ({ ...p, usage_limit: parseInt(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                                </div>
                                <div className="flex items-end mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary" />
                                        <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">Active</span>
                                    </label>
                                </div>
                                <div className="md:col-span-3 flex justify-end gap-3 mt-4">
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
                                <p className="text-[10px] uppercase text-muted-foreground font-bold font-mono">Expiry</p>
                                <p className="text-sm font-medium">{coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : 'Never'}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Min order of <span className="text-white font-medium">₹{coupon.min_order_value}</span> required. 
                                {coupon.discount_type === 'percentage' && ` Max discount up to ₹${coupon.max_discount}.`}
                            </p>
                        </div>
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
