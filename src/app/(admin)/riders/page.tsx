'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bike, Star, MapPin, Search, RefreshCw, PlusCircle, X, CheckCircle2, Users, Pencil, Trash2, Globe, ShieldCheck, Briefcase, Heart, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

export default function RidersPage() {
    const [riders, setRiders] = useState<any[]>([])
    const [hubs, setHubs] = useState<any[]>([])
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editRider, setEditRider] = useState<any>(null)
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState('general')
    const [formData, setFormData] = useState<any>({
        name: '', phone: '', service: '', address: '', hub_id: '',
        gender: '', age: '', languages: [], 
        govt_id_verified: false, govt_id_type: '', address_verified: false,
        background_check_status: 'pending', verification_badge: 'none',
        medical_checkup: false, experience_years: 0,
        care_types: [], work_formats: [], bio: '', hobbies: []
    })
    const [submitting, setSubmitting] = useState(false)
    const [editingSpecialization, setEditingSpecialization] = useState<string | null>(null)
    const [serviceEnums, setServiceEnums] = useState<string[]>([])





    const fetchData = useCallback(async () => {
        try {
            const [rRes, hRes, sRes, eRes] = await Promise.all([
                fetch(`${API_BASE}/admin/riders`, { cache: 'no-store' }),
                fetch(`${API_BASE}/hubs/`, { cache: 'no-store' }),
                fetch(`${API_BASE}/services/`, { cache: 'no-store' }),
                fetch(`${API_BASE}/admin/service-types`, { cache: 'no-store' })
            ])
            const [rData, hData, sData, eData] = await Promise.all([rRes.json(), hRes.json(), sRes.json(), eRes.json()])
            setRiders(Array.isArray(rData) ? rData : [])
            setHubs(Array.isArray(hData) ? hData : [])
            setServices(Array.isArray(sData) ? sData : [])
            setServiceEnums(Array.isArray(eData) ? eData : [])
        } catch (e) {
            console.error('Failed to fetch data:', e)
        } finally {
            setLoading(false)
        }
    }, [])


    useEffect(() => { fetchData() }, [fetchData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const method = editRider ? 'PATCH' : 'POST'
            const url = editRider ? `${API_BASE}/admin/riders/${editRider.id}` : `${API_BASE}/admin/riders`
            
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            resetForm()
            fetchData()
        } catch (e) {
            console.error('Submit failed:', e)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this rider?')) return
        await fetch(`${API_BASE}/admin/riders/${id}`, { method: 'DELETE' })
        fetchData()
    }

    const updateSpecialization = async (riderId: string, newService: string) => {
        try {
            await fetch(`${API_BASE}/admin/riders/${riderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service: newService }),
            })
            fetchData()
            setEditingSpecialization(null)
        } catch (e) {
            console.error('Update specialization failed:', e)
        }
    }


    const resetForm = () => {
        setShowForm(false)
        setEditRider(null)
        setFormData({
            name: '', phone: '', service: '', address: '', hub_id: '',
            gender: '', age: '', languages: [], 
            govt_id_verified: false, govt_id_type: '', address_verified: false,
            background_check_status: 'pending', verification_badge: 'none',
            medical_checkup: false, experience_years: 0,
            care_types: [], work_formats: [], bio: '', hobbies: []
        })
        setActiveTab('general')
    }

    const startEdit = (rider: any) => {
        setEditRider(rider)
        setFormData({
            ...rider,
            languages: rider.languages || [],
            care_types: rider.care_types || [],
            work_formats: rider.work_formats || [],
            hobbies: rider.hobbies || []
        })
        setShowForm(true)
    }

    const filtered = riders.filter((r) => {
        if (!search) return true
        const q = search.toLowerCase()
        return r.name?.toLowerCase().includes(q) || r.phone?.includes(q) || r.service?.toLowerCase().includes(q)
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
    }

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                activeTab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'
            }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Caretakers</h1>
                    <p className="text-muted-foreground mt-1">Manage your professional caregiving fleet.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true) }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-all"
                >
                    <PlusCircle className="w-4 h-4" />
                    Add Caretaker
                </button>
            </div>

            {/* Add/Edit Form Overlay */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            className="bg-[#0A0A0A] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-xl font-bold">{editRider ? 'Edit Profile' : 'New Caretaker'}</h2>
                                <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="flex border-b border-white/10 px-6">
                                <TabButton id="general" label="General" icon={Bike} />
                                <TabButton id="identity" label="Identity" icon={BookOpen} />
                                <TabButton id="verification" label="Trust" icon={ShieldCheck} />
                                <TabButton id="experience" label="Experience" icon={Briefcase} />
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                                {activeTab === 'general' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2 space-y-4">
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                                                <input required value={formData.name} onChange={(e) => setFormData((p:any) => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" placeholder="e.g. Sarah Johnson" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                                                    <input required value={formData.phone} onChange={(e) => setFormData((p:any) => ({ ...p, phone: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" placeholder="+91..." />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">Primary Service</label>
                                                    <select required value={formData.service} onChange={(e) => setFormData((p:any) => ({ ...p, service: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm">
                                                        <option value="">Select Service</option>
                                                        {serviceEnums.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}

                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">Assigned Hub</label>
                                                    <select value={formData.hub_id || ''} onChange={(e) => setFormData((p:any) => ({ ...p, hub_id: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm">
                                                        <option value="">None (Free Roam)</option>
                                                        {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">Profile Photo URL</label>
                                                    <input value={formData.profile_photo || ''} onChange={(e) => setFormData((p:any) => ({ ...p, profile_photo: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" placeholder="https://..." />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'identity' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Gender</label>
                                                <select value={formData.gender || ''} onChange={(e) => setFormData((p:any) => ({ ...p, gender: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm">
                                                    <option value="">Select Gender</option>
                                                    <option value="female">Female</option>
                                                    <option value="male">Male</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Age</label>
                                                <input type="number" value={formData.age || ''} onChange={(e) => setFormData((p:any) => ({ ...p, age: parseInt(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Bio (Internal Note)</label>
                                            <textarea value={formData.bio || ''} onChange={(e) => setFormData((p:any) => ({ ...p, bio: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm h-24" placeholder="Brief info about the caretaker..." />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'verification' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer">
                                                <input type="checkbox" checked={formData.govt_id_verified} onChange={(e) => setFormData((p:any) => ({ ...p, govt_id_verified: e.target.checked }))} className="w-4 h-4 rounded border-white/10" />
                                                <span className="text-sm">Govt ID Verified</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer">
                                                <input type="checkbox" checked={formData.address_verified} onChange={(e) => setFormData((p:any) => ({ ...p, address_verified: e.target.checked }))} className="w-4 h-4 rounded border-white/10" />
                                                <span className="text-sm">Address Verified</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer">
                                                <input type="checkbox" checked={formData.medical_checkup} onChange={(e) => setFormData((p:any) => ({ ...p, medical_checkup: e.target.checked }))} className="w-4 h-4 rounded border-white/10" />
                                                <span className="text-sm">Medical Checkup Done</span>
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Background Check</label>
                                                <select value={formData.background_check_status} onChange={(e) => setFormData((p:any) => ({ ...p, background_check_status: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm">
                                                    <option value="pending">Pending</option>
                                                    <option value="verified">Verified</option>
                                                    <option value="expired">Expired</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Badge Level</label>
                                                <select value={formData.verification_badge} onChange={(e) => setFormData((p:any) => ({ ...p, verification_badge: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm">
                                                    <option value="none">None</option>
                                                    <option value="certified">Certified</option>
                                                    <option value="expert">Expert</option>
                                                    <option value="pro">Pro</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'experience' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Years of Experience</label>
                                            <input type="number" step="0.5" value={formData.experience_years} onChange={(e) => setFormData((p:any) => ({ ...p, experience_years: parseFloat(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
                                        </div>
                                        {/* Simplified list handling for demo */}
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Experience details will be expanded in next update</p>
                                    </div>
                                )}
                            </form>

                            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/20">
                                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(255,51,102,0.3)] transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editRider ? 'Update Profile' : 'Create Caretaker'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List and Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Partners</p>
                        <p className="text-2xl font-bold">{riders.length}</p>
                    </div>
                </div>
                <div className="glass-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Online</p>
                        <p className="text-2xl font-bold">{riders.filter(r => r.is_available).length}</p>
                    </div>
                </div>
                <div className="glass-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Elite</p>
                        <p className="text-2xl font-bold">{riders.filter(r => (r.rating || 5) >= 4.5).length}</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.03] text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                <th className="px-6 py-5">Profile</th>
                                <th className="px-6 py-5">Specialization</th>
                                <th className="px-6 py-5">Verification</th>
                                <th className="px-6 py-5">Performance</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((rider) => (
                                <tr key={rider.id} className="hover:bg-white/[0.03] transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            {rider.profile_photo ? (
                                                <img src={rider.profile_photo} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                                                    <span className="font-bold text-primary text-lg">{rider.name?.[0]}</span>
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm">{rider.name}</p>
                                                    {rider.verification_badge !== 'none' && (
                                                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{rider.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-1.5 flex flex-col items-start">
                                            {editingSpecialization === rider.id ? (
                                                <select 
                                                    autoFocus
                                                    className="bg-[#1A1A1A] border border-primary/40 rounded-lg text-[10px] font-bold px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                                                    value={rider.service}
                                                    onBlur={() => setEditingSpecialization(null)}
                                                    onChange={(e) => updateSpecialization(rider.id, e.target.value)}
                                                >
                                                    <option value={rider.service}>{rider.service?.replace('_', ' ')}</option>
                                                    {serviceEnums.filter(e => e !== rider.service).map(e => (
                                                        <option key={e} value={e}>{e.replace('_', ' ')}</option>
                                                    ))}

                                                </select>
                                            ) : (
                                                <button 
                                                    onClick={() => setEditingSpecialization(rider.id)}
                                                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-tighter hover:bg-primary/20 transition-all cursor-pointer"
                                                >
                                                    {rider.service?.replace('_', ' ')}
                                                </button>
                                            )}
                                            {rider.hub_id && (
                                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                    <MapPin className="w-3 h-3" /> {hubs.find(h => h.id === rider.hub_id)?.name || 'Matching Hub'}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-1">
                                            {rider.govt_id_verified && <span className="px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-400 text-[10px] font-medium border border-green-500/20">ID</span>}
                                            {rider.address_verified && <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-medium border border-blue-500/20">ADDR</span>}
                                            {rider.medical_checkup && <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400 text-[10px] font-medium border border-yellow-500/20">MED</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1.5">
                                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                            <span className="text-sm font-bold">{rider.rating ?? '5.0'}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium ml-1">({rider.experience_years || 0}y exp)</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button onClick={() => startEdit(rider)} className="p-2.5 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-all"><Pencil className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(rider.id)} className="p-2.5 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
