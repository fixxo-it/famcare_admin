'use client'

import { useEffect, useState } from 'react'
import { Code2, Plus, Trash2, RefreshCw, Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

interface Developer {
    id: string
    phone: string
    label: string | null
    created_at: string
}

export default function DevelopersPage() {
    const [devs, setDevs] = useState<Developer[]>([])
    const [loading, setLoading] = useState(true)
    const [phone, setPhone] = useState('')
    const [label, setLabel] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const fetchDevs = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/admin/developers`, { cache: 'no-store' })
            const data = await res.json()
            setDevs(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Failed to load developers', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDevs()
    }, [])

    const showError = (msg: string) => {
        setError(msg)
        setSuccess(null)
        setTimeout(() => setError(null), 4000)
    }
    const showSuccess = (msg: string) => {
        setSuccess(msg)
        setError(null)
        setTimeout(() => setSuccess(null), 3000)
    }

    const handleAdd = async () => {
        // Strip non-digits, then remove a leading 91 ONLY when it looks like a
        // country-code prefix (12 total digits). A 10-digit number starting with
        // 91 (e.g. 9198765432) is valid and must be kept intact.
        const digitsOnly = phone.replace(/\D/g, '')
        const cleaned = digitsOnly.length === 12 && digitsOnly.startsWith('91')
            ? digitsOnly.slice(2)
            : digitsOnly
        if (!/^[6-9]\d{9}$/.test(cleaned)) {
            showError('Enter a valid 10-digit Indian mobile number starting with 6-9.')
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch(`${API_BASE}/admin/developers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleaned, label: label.trim() || null }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                showError(data.detail || `Failed (status ${res.status})`)
                return
            }
            showSuccess('Developer added.')
            setPhone('')
            setLabel('')
            fetchDevs()
        } catch (e) {
            showError(String(e))
        } finally {
            setSubmitting(false)
        }
    }

    const handleRemove = async (id: string, phoneStr: string) => {
        if (!confirm(`Remove ${phoneStr} from the developers list?\n\nTheir developer access will be revoked immediately.`)) return
        try {
            const res = await fetch(`${API_BASE}/admin/developers/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                showError(data.detail || `Failed (status ${res.status})`)
                return
            }
            showSuccess('Developer removed.')
            fetchDevs()
        } catch (e) {
            showError(String(e))
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
                        <Code2 className="w-7 h-7" />
                        Developers
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Phone numbers listed here get developer access: they see the hidden
                        Test Service and skip payment flows on every booking.
                    </p>
                </div>
                <button
                    onClick={fetchDevs}
                    className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl hover:bg-white/5 border border-white/10"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Add form */}
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide text-muted-foreground">
                    Add new developer
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                    <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-primary/60"
                            placeholder="10-digit mobile number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            inputMode="numeric"
                            maxLength={13}
                        />
                    </div>
                    <input
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-primary/60"
                        placeholder="Label (optional) — e.g. Niriksh, QA"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        maxLength={60}
                    />
                    <button
                        onClick={handleAdd}
                        disabled={submitting || !phone.trim()}
                        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        {submitting ? 'Adding…' : 'Add'}
                    </button>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-red-400 mt-2"
                        >
                            {error}
                        </motion.p>
                    )}
                    {success && (
                        <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-emerald-400 mt-2"
                        >
                            {success}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* List */}
            <div className="glass-card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Current developers
                    </h2>
                    <span className="text-xs text-muted-foreground">
                        {loading ? '…' : `${devs.length} total`}
                    </span>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-xs text-muted-foreground">
                        Loading…
                    </div>
                ) : devs.length === 0 ? (
                    <div className="p-12 text-center">
                        <Code2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No developer phones added yet.
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Add one above to grant developer access.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-white/10">
                                <th className="px-5 py-3 font-semibold">Phone</th>
                                <th className="px-5 py-3 font-semibold">Label</th>
                                <th className="px-5 py-3 font-semibold">Added on</th>
                                <th className="px-5 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devs.map((d) => (
                                <tr
                                    key={d.id}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                    <td className="px-5 py-3 font-mono">+91 {d.phone}</td>
                                    <td className="px-5 py-3 text-muted-foreground">
                                        {d.label || '—'}
                                    </td>
                                    <td className="px-5 py-3 text-xs text-muted-foreground">
                                        {new Date(d.created_at).toLocaleString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <button
                                            onClick={() => handleRemove(d.id, d.phone)}
                                            className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
