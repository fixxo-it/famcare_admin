'use client'

import { useState, useEffect, useCallback } from 'react'
import { Link2, Copy, Check, QrCode, RefreshCw, Smartphone, ExternalLink, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'react-qr-code'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

const routes = [
    { label: 'Home', path: '/home' },
    { label: 'Instant Care', path: '/instant-care' },
    { label: 'Schedule Care', path: '/schedule-care' },
    { label: 'Wallet', path: '/wallet' },
    { label: 'Profile', path: '/profile' },
    { label: 'Refer & Earn', path: '/refer_earn' },
    { label: 'Booking History', path: '/booking_history' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Subscription', path: '/subscription' },
]

export default function DeepLinkBuilderPage() {
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    
    // Form State
    const [targetRoute, setTargetRoute] = useState('/instant-care')
    const [categoryId, setCategoryId] = useState('')
    const [subServiceId, setSubServiceId] = useState('')
    const [tierId, setTierId] = useState('')
    const [autoConfirm, setAutoConfirm] = useState(false)
    
    const [generatedUrl, setGeneratedUrl] = useState('')

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

    // Generate URL logic
    useEffect(() => {
        let url = `famcare://${targetRoute.replace('/', '')}`
        const params = new URLSearchParams()
        
        if (targetRoute === '/instant-care' || targetRoute === '/schedule-care') {
            if (categoryId) params.append('category', categoryId)
            if (subServiceId) params.append('subService', subServiceId)
            if (tierId) params.append('tier', tierId)
            if (autoConfirm) params.append('autoConfirm', 'true')
        }
        
        const queryString = params.toString()
        if (queryString) {
            url += `?${queryString}`
        }
        
        setGeneratedUrl(url)
    }, [targetRoute, categoryId, subServiceId, tierId, autoConfirm])

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const selectedCategory = services.find(s => s.id === categoryId)
    const subServices = selectedCategory?.sub_services || []
    const selectedSubService = subServices.find((s: any) => s.id === subServiceId)
    const tiers = selectedSubService?.pricing_tiers || []

    if (loading) {
        return (<div className="flex items-center justify-center min-h-[60vh]"><RefreshCw className="w-6 h-6 animate-spin text-primary" /></div>)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Deep Link Builder</h1>
                    <p className="text-muted-foreground mt-1">Generate precision links for notifications, QR codes, and marketing.</p>
                </div>
                <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">Native App Links</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Builder Form */}
                <div className="space-y-6">
                    <div className="glass-card space-y-6">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">1. Select Target Page</label>
                            <div className="grid grid-cols-2 gap-2">
                                {routes.map(r => (
                                    <button
                                        key={r.path}
                                        onClick={() => setTargetRoute(r.path)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                            targetRoute === r.path 
                                            ? 'bg-primary/20 border-primary text-white' 
                                            : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                                        }`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {(targetRoute === '/instant-care' || targetRoute === '/schedule-care') && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 pt-4 border-t border-white/5"
                            >
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">2. Precision Options</label>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] text-muted-foreground mb-1 block ml-1">Service Category</label>
                                        <select 
                                            value={categoryId} 
                                            onChange={(e) => { setCategoryId(e.target.value); setSubServiceId(''); setTierId(''); }}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm"
                                        >
                                            <option value="">Any Category</option>
                                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    {categoryId && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <label className="text-[10px] text-muted-foreground mb-1 block ml-1">Specific Sub-service</label>
                                            <select 
                                                value={subServiceId} 
                                                onChange={(e) => { setSubServiceId(e.target.value); setTierId(''); }}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm"
                                            >
                                                <option value="">Any Sub-service</option>
                                                {subServices.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </motion.div>
                                    )}

                                    {subServiceId && tiers.length > 0 && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <label className="text-[10px] text-muted-foreground mb-1 block ml-1">Duration Tier</label>
                                            <select 
                                                value={tierId} 
                                                onChange={(e) => setTierId(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm"
                                            >
                                                <option value="">Default Duration</option>
                                                {tiers.map((t: any) => <option key={t.id} value={t.id}>{t.label} ({t.hours}h)</option>)}
                                            </select>
                                        </motion.div>
                                    )}

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${autoConfirm ? 'bg-primary/20' : 'bg-white/5'}`}>
                                                <Zap className={`w-4 h-4 ${autoConfirm ? 'text-primary' : 'text-muted-foreground'}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Auto Confirm</p>
                                                <p className="text-[10px] text-muted-foreground">Skip setup and book instantly</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setAutoConfirm(!autoConfirm)}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${autoConfirm ? 'bg-primary' : 'bg-white/20'}`}
                                        >
                                            <motion.div 
                                                animate={{ x: autoConfirm ? 22 : 2 }}
                                                className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                                            />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Result Preview */}
                <div className="space-y-6">
                    <div className="glass-card flex flex-col items-center justify-center py-10 space-y-6 text-center">
                        <div className="p-4 bg-white rounded-2xl shadow-2xl">
                            <QRCode 
                                value={generatedUrl} 
                                size={180}
                                level="H"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">QR Code Preview</p>
                            <p className="text-xs text-muted-foreground max-w-[200px] mx-auto mt-1">Scan with any mobile camera to open the app to this exact spot.</p>
                        </div>
                    </div>

                    <div className="glass-card space-y-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Generated Deep Link</label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-primary break-all">
                                {generatedUrl}
                            </div>
                            <button 
                                onClick={copyToClipboard}
                                className={`w-12 flex items-center justify-center rounded-xl transition-all ${
                                    copied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-primary text-white hover:bg-primary/90'
                                }`}
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-dashed border-white/10">
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            <p className="text-[10px] text-muted-foreground">Use this URL in AppsFlyer OneLinks, FCM Data Payloads, or SMS campaigns.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
