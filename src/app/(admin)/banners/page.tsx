'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ImageIcon, PlusCircle, X, Pencil, Trash2, RefreshCw, ToggleLeft, ToggleRight, Upload, Link } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

// ── Image Upload Field ─────────────────────────────────────────────────────
function ImageUploadField({
    value,
    onChange,
    aspectHint,
}: {
    value: string
    onChange: (url: string) => void
    aspectHint: string
}) {
    const [tab, setTab] = useState<'upload' | 'url'>('upload')
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [urlInput, setUrlInput] = useState(value)
    const fileRef = useRef<HTMLInputElement>(null)

    const uploadFile = async (file: File) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowed.includes(file.type)) {
            alert('Only JPEG, PNG, WebP or GIF images are allowed.')
            return
        }
        setUploading(true)
        try {
            const fd = new FormData()
            fd.append('file', file)
            const res = await fetch(`${API_BASE}/banners/upload`, { method: 'POST', body: fd })
            if (!res.ok) throw new Error(await res.text())
            const { url } = await res.json()
            onChange(url)
        } catch (e) {
            alert('Upload failed: ' + e)
        } finally {
            setUploading(false)
        }
    }

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) uploadFile(file)
        e.target.value = ''
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) uploadFile(file)
    }

    const applyUrl = () => {
        onChange(urlInput.trim())
    }

    return (
        <div className="space-y-3">
            {/* Tab switcher */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
                {(['upload', 'url'] as const).map(t => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            tab === t ? 'bg-primary text-white' : 'text-muted-foreground hover:text-white'
                        }`}
                    >
                        {t === 'upload' ? <Upload className="w-3 h-3" /> : <Link className="w-3 h-3" />}
                        {t === 'upload' ? 'Upload File' : 'Paste URL'}
                    </button>
                ))}
            </div>

            {tab === 'upload' ? (
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`relative w-full rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-2 py-8
                        ${dragOver ? 'border-primary bg-primary/10' : 'border-white/15 hover:border-primary/40 hover:bg-white/5'}
                        ${uploading ? 'pointer-events-none opacity-60' : ''}
                    `}
                >
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onFileChange} />
                    {uploading ? (
                        <>
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">Uploading…</p>
                        </>
                    ) : (
                        <>
                            <Upload className="w-7 h-7 text-primary/60" />
                            <p className="text-sm text-white font-medium">Drop image here or click to browse</p>
                            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP · Max 10 MB · {aspectHint}</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onBlur={applyUrl}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyUrl())}
                        placeholder="https://cdn.example.com/banner.jpg"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                    />
                    <button
                        type="button"
                        onClick={applyUrl}
                        className="px-3 py-2.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium transition-all"
                    >
                        Use
                    </button>
                </div>
            )}

            {/* Preview — shown regardless of tab once URL is set */}
            {value && (
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/5 group">
                    <img
                        src={value}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <button
                        type="button"
                        onClick={() => { onChange(''); setUrlInput('') }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            <p className="text-xs text-muted-foreground">{aspectHint} recommended</p>
        </div>
    )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function BannersPage() {
    const [banners, setBanners] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        image_url: '',
        title: '',
        subtitle: '',
        is_active: true,
        display_order: 0,
        service_id: '',
    })
    const [categories, setCategories] = useState<any[]>([])

    const fetchBanners = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/banners/?include_inactive=true`, { cache: 'no-store' })
            const data = await res.json()
            setBanners(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Failed to fetch banners:', e)
        } finally {
            setLoading(false)
        }
    }, [])
    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/services/`, { cache: 'no-store' })
            const data = await res.json()
            setCategories(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Failed to fetch categories:', e)
        }
    }, [])

    useEffect(() => { 
        fetchBanners()
        fetchCategories()
    }, [fetchBanners, fetchCategories])

    const openCreate = () => {
        setEditItem(null)
        setFormData({ 
            image_url: '', 
            title: '', 
            subtitle: '', 
            is_active: true, 
            display_order: banners.length,
            service_id: '',
        })
        setShowForm(true)
    }

    const openEdit = (banner: any) => {
        setEditItem(banner)
        setFormData({
            image_url: banner.image_url,
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            is_active: banner.is_active,
            display_order: banner.display_order,
            service_id: banner.service_id || '',
        })
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.image_url.trim()) {
            alert('Please upload an image or paste a URL.')
            return
        }
        setSubmitting(true)
        try {
            const url = editItem ? `${API_BASE}/banners/${editItem.id}` : `${API_BASE}/banners/`
            const method = editItem ? 'PATCH' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, display_order: Number(formData.display_order) }),
            })
            if (!res.ok) throw new Error(await res.text())
            await fetchBanners()
            setShowForm(false)
        } catch (e) {
            alert('Error: ' + e)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this banner?')) return
        try {
            await fetch(`${API_BASE}/banners/${id}`, { method: 'DELETE' })
            await fetchBanners()
        } catch (e) {
            alert('Error: ' + e)
        }
    }

    const toggleActive = async (banner: any) => {
        try {
            await fetch(`${API_BASE}/banners/${banner.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !banner.is_active }),
            })
            await fetchBanners()
        } catch (e) {
            alert('Error: ' + e)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <ImageIcon className="w-7 h-7 text-primary" />
                        Banners
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage home screen banners (4:3 ratio images recommended)
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchBanners}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-xl font-medium text-sm transition-all"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Add Banner
                    </button>
                </div>
            </div>

            {/* Ratio hint */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary flex items-center gap-2">
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span>Banners: <strong>4:3 ratio</strong> (e.g. 1200×900 px) · Service icons: <strong>1:1 square</strong> (e.g. 512×512 px)</span>
            </div>

            {/* Banner list */}
            {loading ? (
                <div className="text-muted-foreground text-sm">Loading...</div>
            ) : banners.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No banners yet. Add your first one.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {banners.map((banner, i) => (
                            <motion.div
                                key={banner.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-card/50 border border-white/5 rounded-2xl overflow-hidden"
                            >
                                <div className="flex gap-4 p-4 items-start">
                                    {/* Thumbnail */}
                                    <div className="w-32 h-24 rounded-xl overflow-hidden bg-white/5 shrink-0 relative">
                                        {banner.image_url ? (
                                            <img
                                                src={banner.image_url}
                                                alt={banner.title || 'Banner'}
                                                className="w-full h-full object-cover"
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                <ImageIcon className="w-8 h-8 opacity-30" />
                                            </div>
                                        )}
                                        <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                                            #{banner.display_order + 1}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-white truncate">
                                                    {banner.title || <span className="text-muted-foreground italic">No title</span>}
                                                </p>
                                                {banner.subtitle && (
                                                    <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1 truncate font-mono">{banner.image_url}</p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => toggleActive(banner)}
                                                    className={`p-1.5 rounded-lg transition-all ${banner.is_active ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-muted-foreground hover:bg-white/5'}`}
                                                    title={banner.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                                                >
                                                    {banner.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => openEdit(banner)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(banner.id)}
                                                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${banner.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-muted-foreground'}`}>
                                                {banner.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Form modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-white">
                                    {editItem ? 'Edit Banner' : 'Add Banner'}
                                </h2>
                                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Image upload / URL */}
                                <div>
                                    <label className="block text-sm text-muted-foreground mb-1.5">
                                        Banner Image <span className="text-red-400">*</span>
                                    </label>
                                    <ImageUploadField
                                        value={formData.image_url}
                                        onChange={url => setFormData(p => ({ ...p, image_url: url }))}
                                        aspectHint="4:3 ratio (1200×900 px)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-muted-foreground mb-1.5">Title (optional)</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                        placeholder="Banner headline"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-muted-foreground mb-1.5">Subtitle (optional)</label>
                                    <input
                                        type="text"
                                        value={formData.subtitle}
                                        onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))}
                                        placeholder="Supporting text"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-muted-foreground mb-1.5">Link to Service (optional)</label>
                                    <select
                                        value={formData.service_id}
                                        onChange={e => setFormData(p => ({ ...p, service_id: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                                    >
                                        <option value="" className="bg-slate-900">None — No link</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id} className="bg-slate-900">
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-muted-foreground mt-1">If selected, clicking this banner in the app will open the booking flow for this category.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-muted-foreground mb-1.5">Display Order</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={formData.display_order}
                                            onChange={e => setFormData(p => ({ ...p, display_order: Number(e.target.value) }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <label className="flex items-center gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                                                className="w-4 h-4 accent-primary"
                                            />
                                            <span className="text-sm text-white">Active</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-all disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : editItem ? 'Update' : 'Add Banner'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
