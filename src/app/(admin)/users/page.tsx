'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Search, RefreshCw, ChevronDown, ChevronUp, Phone, MapPin, Calendar, Package, Save, Edit2, Wallet, Share2, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import UserDocumentsModal from '@/components/UserDocumentsModal'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [expandedUser, setExpandedUser] = useState<string | null>(null)
    const [userRequests, setUserRequests] = useState<Record<string, any[]>>({})
    const [loadingRequests, setLoadingRequests] = useState<string | null>(null)

    // Editing State
    const [editMode, setEditMode] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<any>({})
    const [saving, setSaving] = useState(false)
    const [showDeleted, setShowDeleted] = useState(false)

    // Documents modal state
    const [docsModal, setDocsModal] = useState<{ userId: string; userName: string } | null>(null)

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/users`, { cache: 'no-store' })
            const data = await res.json()
            setUsers(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Failed to fetch users:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchUsers() }, [fetchUsers])

    const toggleExpand = async (userId: string, userObj?: any) => {
        if (expandedUser === userId) {
            setExpandedUser(null)
            setEditMode(null)
            return
        }

        setExpandedUser(userId)
        setEditMode(null)

        if (!userRequests[userId]) {
            setLoadingRequests(userId)
            try {
                const res = await fetch(`${API_BASE}/admin/users/${userId}/requests`, { cache: 'no-store' })
                const data = await res.json()
                setUserRequests(prev => ({ ...prev, [userId]: Array.isArray(data) ? data : [] }))
            } catch (e) {
                console.error('Failed to fetch user requests:', e)
                setUserRequests(prev => ({ ...prev, [userId]: [] }))
            } finally {
                setLoadingRequests(null)
            }
        }
    }

    const startEditing = (user: any) => {
        setEditMode(user.id)
        setEditForm({ ...user })
    }

    const saveEdits = async (userId: string) => {
        setSaving(true)
        try {
            const payload = {
                name: editForm.name,
                phone: editForm.phone,
                city: editForm.city,
                area: editForm.area,
                address: editForm.address,
                pincode: editForm.pincode,
                wallet_balance: Number(editForm.wallet_balance) || 0,
                referral_code: editForm.referral_code,
                is_profile_complete: Boolean(editForm.is_profile_complete),
                selected_services: typeof editForm.selected_services === 'string' 
                    ? editForm.selected_services.split(',').map((s: string) => s.trim()).filter(Boolean) 
                    : editForm.selected_services,
                relationship: editForm.relationship,
                gender: editForm.gender,
                dob: editForm.dob,
                child_name: editForm.child_name,
                child_dob: editForm.child_dob,
                child_gender: editForm.child_gender,
                child_special_needs: editForm.child_special_needs,
                elderly_name: editForm.elderly_name,
                elderly_age: Number(editForm.elderly_age) || null,
                elderly_care_needs: editForm.elderly_care_needs,
                elderly_medical_support: Boolean(editForm.elderly_medical_support),
                elderly_mobility_assistance: Boolean(editForm.elderly_mobility_assistance),
                elderly_special_instructions: editForm.elderly_special_instructions,
                pet_name: editForm.pet_name,
                pet_age: Number(editForm.pet_age) || null,
                pet_breed: editForm.pet_breed,
                pet_special_needs: editForm.pet_special_needs
            };

            const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                const updated = await res.json()
                setUsers(prev => prev.map(u => u.id === userId ? updated : u))
                setEditMode(null)
            } else {
                alert("Failed to save user.")
            }
        } catch (e) {
            console.error('Error saving user:', e)
            alert("Error saving user.")
        } finally {
            setSaving(false)
        }
    }

    const filtered = users.filter((u) => {
        if (!showDeleted && u.is_deleted) return false
        if (!search) return true
        const q = search.toLowerCase()
        return u.phone?.includes(q) || u.name?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q) || u.referral_code?.toLowerCase().includes(q)
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gradient">Users Database</h1>
                <p className="text-muted-foreground mt-1">Manage all registered users, edit profiles, and view service histories.</p>
            </div>

            {/* Stats */}
            <div className="glass-card flex items-center gap-4 inline-flex">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                </div>
            </div>

            {/* Search + List */}
            <div className="glass rounded-2xl overflow-hidden border border-white/10">
                <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, phone, city, or referral code..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showDeleted}
                            onChange={e => setShowDeleted(e.target.checked)}
                            className="rounded accent-red-500"
                        />
                        Show Deleted
                    </label>
                </div>

                <div className="divide-y divide-white/5">
                    {filtered.map((user) => (
                        <div key={user.id}>
                            <button
                                onClick={() => toggleExpand(user.id, user)}
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center border border-blue-500/20">
                                        <span className="font-bold text-blue-400 text-sm">{user.name?.[0]?.toUpperCase() || '?'}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-white">
                                            {user.name || 'Unnamed'}
                                            {user.is_deleted && (
                                                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                                                    Deleted {user.deleted_at ? new Date(user.deleted_at).toLocaleDateString() : ''}
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {user.phone}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Wallet className="w-3 h-3 text-yellow-500/70" /> {user.wallet_balance || 0} Coins
                                            </span>
                                            {user.referral_code && (
                                                <span className="flex items-center gap-1">
                                                    <Share2 className="w-3 h-3 text-purple-400/70" /> {user.referral_code}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground hidden md:block">
                                        {expandedUser === user.id ? 'Hide Details' : 'View Profile'}
                                    </span>
                                    {expandedUser === user.id ? (
                                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </div>
                            </button>

                            {/* Expanded Content Area */}
                            <AnimatePresence>
                                {expandedUser === user.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden bg-white/[0.01]"
                                    >
                                        <div className="p-6 ml-14 grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-white/5">
                                            
                                            {/* Profile Editor Side */}
                                            <div className="max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                                                <div className="flex items-center justify-between mb-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 py-2 border-b border-white/5">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                                        User Profile
                                                    </p>
                                                    {editMode !== user.id ? (
                                                        <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => startEditing(user)}
                                                            disabled={user.is_deleted}
                                                            className="flex items-center gap-1.5 text-xs bg-white/5 px-3 py-1.5 rounded hover:bg-white/10 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                                                        >
                                                            <Edit2 className="w-3 h-3" /> Edit Profile
                                                        </button>
                                                        <button
                                                            onClick={() => setDocsModal({ userId: user.id, userName: user.name || 'Unknown' })}
                                                            className="flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                                        >
                                                            <FileText className="w-3 h-3" /> Documents
                                                        </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => setEditMode(null)}
                                                                className="text-xs px-3 py-1.5 text-muted-foreground hover:text-white"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button 
                                                                onClick={() => saveEdits(user.id)}
                                                                disabled={saving}
                                                                className="flex items-center gap-1.5 text-xs bg-primary px-4 py-1.5 rounded text-white hover:bg-primary/80 transition-colors shadow-lg shadow-primary/20"
                                                            >
                                                                {saving ? 'Saving...' : <><Save className="w-3 h-3" /> Save Changes</>}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-6 pb-8">
                                                    {/* Section 1: Basic & System */}
                                                    <div className="space-y-4">
                                                        <h4 className="text-sm font-bold text-primary">Basic Info & Wallet</h4>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Full Name</label>
                                                                {editMode === user.id ? (
                                                                    <input value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                                                ) : <p className="text-sm font-medium">{user.name || '—'}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Phone Number</label>
                                                                {editMode === user.id ? (
                                                                    <input value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                                                ) : <p className="text-sm font-medium">{user.phone}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">City</label>
                                                                {editMode === user.id ? (
                                                                    <input value={editForm.city || ''} onChange={e => setEditForm({...editForm, city: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                                                ) : <p className="text-sm font-medium">{user.city || '—'}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Area & Pincode</label>
                                                                {editMode === user.id ? (
                                                                    <div className="flex gap-2">
                                                                        <input value={editForm.area || ''} placeholder="Area" onChange={e => setEditForm({...editForm, area: e.target.value})} className="w-2/3 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                                                        <input value={editForm.pincode || ''} placeholder="Pin" onChange={e => setEditForm({...editForm, pincode: e.target.value})} className="w-1/3 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                                                    </div>
                                                                ) : <p className="text-sm font-medium">{user.area || '—'} {user.pincode ? `(${user.pincode})` : ''}</p>}
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Full Address</label>
                                                                {editMode === user.id ? (
                                                                    <textarea value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none h-16" />
                                                                ) : <p className="text-sm font-medium text-muted-foreground">{user.address || '—'}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Wallet Balance (Coins)</label>
                                                                {editMode === user.id ? (
                                                                    <input type="number" value={editForm.wallet_balance || 0} onChange={e => setEditForm({...editForm, wallet_balance: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-yellow-400 font-bold" />
                                                                ) : <p className="text-sm font-bold text-yellow-500">{user.wallet_balance || 0}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Referral Code</label>
                                                                {editMode === user.id ? (
                                                                    <input value={editForm.referral_code || ''} onChange={e => setEditForm({...editForm, referral_code: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 uppercase" />
                                                                ) : <p className="text-sm font-medium text-purple-400">{user.referral_code || '—'}</p>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Section 2: Onboarding & Parents */}
                                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                                        <h4 className="text-sm font-bold text-primary">Guardian & Services</h4>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="col-span-2 flex items-center gap-3">
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">Profile Complete?</label>
                                                                {editMode === user.id ? (
                                                                    <input type="checkbox" checked={editForm.is_profile_complete || false} onChange={e => setEditForm({...editForm, is_profile_complete: e.target.checked})} className="w-4 h-4 accent-primary" />
                                                                ) : <p className="text-sm font-medium">{user.is_profile_complete ? "Yes" : "No"}</p>}
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Selected Services (comma separated)</label>
                                                                {editMode === user.id ? (
                                                                    <input value={Array.isArray(editForm.selected_services) ? editForm.selected_services.join(', ') : editForm.selected_services || ''} onChange={e => setEditForm({...editForm, selected_services: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                                                ) : <p className="text-sm font-medium">{user.selected_services?.join(', ') || '—'}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Relationship</label>
                                                                {editMode === user.id ? (
                                                                    <input value={editForm.relationship || ''} onChange={e => setEditForm({...editForm, relationship: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none" />
                                                                ) : <p className="text-sm font-medium">{user.relationship || '—'}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Guardian DOB</label>
                                                                {editMode === user.id ? (
                                                                    <input value={editForm.dob || ''} onChange={e => setEditForm({...editForm, dob: e.target.value})} placeholder="YYYY-MM-DD" className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none" />
                                                                ) : <p className="text-sm font-medium">{user.dob || '—'}</p>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Section 3: Child Info */}
                                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                                        <h4 className="text-sm font-bold text-blue-400">Child Care Info</h4>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Child Name</label>
                                                                {editMode === user.id ? (
                                                                    <input value={editForm.child_name || ''} onChange={e => setEditForm({...editForm, child_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none" />
                                                                ) : <p className="text-sm font-medium">{user.child_name || '—'}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Child DOB</label>
                                                                {editMode === user.id ? (
                                                                    <input value={editForm.child_dob || ''} onChange={e => setEditForm({...editForm, child_dob: e.target.value})} placeholder="YYYY-MM-DD" className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none" />
                                                                ) : <p className="text-sm font-medium">{user.child_dob || '—'}</p>}
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Special Needs</label>
                                                                {editMode === user.id ? (
                                                                    <textarea value={editForm.child_special_needs || ''} onChange={e => setEditForm({...editForm, child_special_needs: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none h-12 resize-none" />
                                                                ) : <p className="text-sm font-medium text-muted-foreground">{user.child_special_needs || '—'}</p>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Section 4: Elderly Info */}
                                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                                        <h4 className="text-sm font-bold text-orange-400">Elderly Care Info</h4>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Elderly Name</label>
                                                                {editMode === user.id ? (
                                                                    <input value={editForm.elderly_name || ''} onChange={e => setEditForm({...editForm, elderly_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none" />
                                                                ) : <p className="text-sm font-medium">{user.elderly_name || '—'}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Age</label>
                                                                {editMode === user.id ? (
                                                                    <input type="number" value={editForm.elderly_age || ''} onChange={e => setEditForm({...editForm, elderly_age: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none" />
                                                                ) : <p className="text-sm font-medium">{user.elderly_age || '—'}</p>}
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Care Needs</label>
                                                                {editMode === user.id ? (
                                                                    <input value={editForm.elderly_care_needs || ''} onChange={e => setEditForm({...editForm, elderly_care_needs: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none" />
                                                                ) : <p className="text-sm font-medium text-muted-foreground">{user.elderly_care_needs || '—'}</p>}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {editMode === user.id ? (
                                                                    <input type="checkbox" checked={editForm.elderly_medical_support || false} onChange={e => setEditForm({...editForm, elderly_medical_support: e.target.checked})} className="w-4 h-4 accent-primary" />
                                                                ) : <div className={`w-3 h-3 rounded-full ${user.elderly_medical_support ? 'bg-success' : 'bg-muted-foreground/30'}`} />}
                                                                <span className="text-xs">Medical Support</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {editMode === user.id ? (
                                                                    <input type="checkbox" checked={editForm.elderly_mobility_assistance || false} onChange={e => setEditForm({...editForm, elderly_mobility_assistance: e.target.checked})} className="w-4 h-4 accent-primary" />
                                                                ) : <div className={`w-3 h-3 rounded-full ${user.elderly_mobility_assistance ? 'bg-success' : 'bg-muted-foreground/30'}`} />}
                                                                <span className="text-xs">Mobility Assist</span>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Special Instructions</label>
                                                                {editMode === user.id ? (
                                                                    <textarea value={editForm.elderly_special_instructions || ''} onChange={e => setEditForm({...editForm, elderly_special_instructions: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none h-12 resize-none" />
                                                                ) : <p className="text-sm font-medium text-muted-foreground">{user.elderly_special_instructions || '—'}</p>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Section 5: Pet Info */}
                                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                                        <h4 className="text-sm font-bold text-yellow-600">Pet Care Info</h4>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Pet Name</label>
                                                                {editMode === user.id ? (
                                                                    <input value={editForm.pet_name || ''} onChange={e => setEditForm({...editForm, pet_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none" />
                                                                ) : <p className="text-sm font-medium">{user.pet_name || '—'}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Breed</label>
                                                                {editMode === user.id ? (
                                                                    <input value={editForm.pet_breed || ''} onChange={e => setEditForm({...editForm, pet_breed: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none" />
                                                                ) : <p className="text-sm font-medium">{user.pet_breed || '—'}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Age</label>
                                                                {editMode === user.id ? (
                                                                    <input type="number" value={editForm.pet_age || ''} onChange={e => setEditForm({...editForm, pet_age: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none" />
                                                                ) : <p className="text-sm font-medium">{user.pet_age || '—'}</p>}
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Special Needs</label>
                                                                {editMode === user.id ? (
                                                                    <input value={editForm.pet_special_needs || ''} onChange={e => setEditForm({...editForm, pet_special_needs: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none" />
                                                                ) : <p className="text-sm font-medium text-muted-foreground">{user.pet_special_needs || '—'}</p>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {!editMode && (
                                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-4">
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Joined Date</label>
                                                                <p className="text-sm text-muted-foreground">{new Date(user.created_at).toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">System ID</label>
                                                                <p className="text-xs text-muted-foreground font-mono truncate">{user.id}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Booking History Side */}
                                            <div className="border-l border-white/5 pl-8">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                                        Booking History
                                                    </p>
                                                    {!loadingRequests && userRequests[user.id] && (
                                                        <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded-full text-white">
                                                            {userRequests[user.id].length} Total
                                                        </span>
                                                    )}
                                                </div>

                                                {loadingRequests === user.id ? (
                                                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                                                        <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                                                    </div>
                                                ) : userRequests[user.id]?.length ? (
                                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {userRequests[user.id].map((req: any) => (
                                                            <div key={req.id} className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                                                                            <Package className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-sm font-medium capitalize truncate">
                                                                                {req.service?.replace('_', ' ')}
                                                                            </p>
                                                                            <p className="text-[10px] text-muted-foreground truncate font-mono">
                                                                                ID: {req.id.split('-').pop()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <span className={`status-badge status-${req.status}`}>
                                                                        {req.status}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="bg-black/20 rounded-lg p-2 flex justify-between items-center px-3 mt-1">
                                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                        <Calendar className="w-3 h-3" /> 
                                                                        {new Date(req.scheduled_at || req.created_at).toLocaleDateString()}
                                                                    </div>
                                                                    {req.amount_inr && (
                                                                        <span className="text-xs font-bold text-white">₹{req.amount_inr}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-10 bg-white/[0.02] rounded-xl border border-white/5 border-dashed">
                                                        <Package className="w-8 h-8 mx-auto text-white/10 mb-2" />
                                                        <p className="text-sm text-muted-foreground">No bookings made yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="px-6 py-16 text-center text-muted-foreground">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No users match your search terms.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Documents Modal */}
            {docsModal && (
                <UserDocumentsModal
                    userId={docsModal.userId}
                    userName={docsModal.userName}
                    isOpen={!!docsModal}
                    onClose={() => setDocsModal(null)}
                />
            )}
        </div>
    )
}
