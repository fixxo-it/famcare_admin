'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Download, Image as ImageIcon, File } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

interface Document {
    id: string
    doc_type: string
    original_name: string
    file_size: number
    mime_type: string
    uploaded_at: string
    download_url: string
}

interface Props {
    userId: string
    userName: string
    isOpen: boolean
    onClose: () => void
}

const TABS = [
    { key: 'baby_care', label: 'Baby Care' },
    { key: 'elder_care', label: 'Elder Care' },
    { key: 'pet_care', label: 'Pet Care' },
] as const

type TabKey = typeof TABS[number]['key']

const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function SkeletonCard() {
    return (
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden animate-pulse">
            <div className="h-32 bg-white/[0.06]" />
            <div className="p-3 space-y-2">
                <div className="h-3 bg-white/10 rounded w-2/3" />
                <div className="h-2.5 bg-white/[0.07] rounded w-full" />
                <div className="h-2 bg-white/[0.05] rounded w-1/2" />
            </div>
        </div>
    )
}

function DocCard({ doc }: { doc: Document }) {
    const isImage = doc.mime_type?.startsWith('image/')
    const isPdf = doc.mime_type === 'application/pdf'

    return (
        <motion.a
            href={doc.download_url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden hover:border-emerald-500/40 hover:bg-white/[0.07] transition-all cursor-pointer block"
        >
            {/* Preview area */}
            <div className="h-32 bg-black/30 flex items-center justify-center relative overflow-hidden">
                {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={doc.download_url}
                        alt={doc.original_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : isPdf ? (
                    <div className="flex flex-col items-center gap-2 text-red-400/70">
                        <FileText className="w-10 h-10" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">PDF</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-white/30">
                        <File className="w-10 h-10" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">File</span>
                    </div>
                )}
                {/* Download overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Download className="w-6 h-6 text-emerald-400" />
                </div>
            </div>

            {/* Info */}
            <div className="p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                    {isImage ? (
                        <ImageIcon className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    ) : (
                        <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    )}
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider truncate">
                        {doc.doc_type?.replace(/_/g, ' ') || 'Document'}
                    </span>
                </div>
                <p className="text-xs text-white/80 font-medium truncate" title={doc.original_name}>
                    {doc.original_name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{formatDate(doc.uploaded_at)}</span>
                    <span>{formatSize(doc.file_size)}</span>
                </div>
            </div>
        </motion.a>
    )
}

export default function UserDocumentsModal({ userId, userName, isOpen, onClose }: Props) {
    const [activeTab, setActiveTab] = useState<TabKey>('baby_care')
    const [docs, setDocs] = useState<Record<TabKey, Document[] | null>>({
        baby_care: null,
        elder_care: null,
        pet_care: null,
    })
    const [loading, setLoading] = useState<Record<TabKey, boolean>>({
        baby_care: false,
        elder_care: false,
        pet_care: false,
    })

    const fetchDocs = async (category: TabKey) => {
        if (docs[category] !== null) return // already fetched
        setLoading(prev => ({ ...prev, [category]: true }))
        try {
            const res = await fetch(
                `${API_BASE}/admin/users/${userId}/documents?category=${category}`,
                { cache: 'no-store' }
            )
            const data = await res.json()
            setDocs(prev => ({ ...prev, [category]: Array.isArray(data) ? data : [] }))
        } catch (e) {
            console.error('Failed to fetch documents:', e)
            setDocs(prev => ({ ...prev, [category]: [] }))
        } finally {
            setLoading(prev => ({ ...prev, [category]: false }))
        }
    }

    // Fetch docs for the active tab whenever it changes (and modal is open)
    useEffect(() => {
        if (isOpen) {
            fetchDocs(activeTab)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, activeTab])

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setActiveTab('baby_care')
            setDocs({ baby_care: null, elder_care: null, pet_care: null })
            setLoading({ baby_care: false, elder_care: false, pet_care: false })
        }
    }, [isOpen])

    const currentDocs = docs[activeTab]
    const isLoading = loading[activeTab]

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal panel */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div
                            className="pointer-events-auto w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02] flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">
                                            Documents &mdash; <span className="text-emerald-400">{userName}</span>
                                        </h2>
                                        <p className="text-[10px] text-muted-foreground">Uploaded care documents</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-white/10 bg-white/[0.01] flex-shrink-0">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`relative px-6 py-3 text-sm font-medium transition-colors ${
                                            activeTab === tab.key
                                                ? 'text-emerald-400'
                                                : 'text-muted-foreground hover:text-white'
                                        }`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.key && (
                                            <motion.div
                                                layoutId="activeTabLine"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-t"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, x: 12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -12 }}
                                        transition={{ duration: 0.18 }}
                                    >
                                        {isLoading ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {[...Array(6)].map((_, i) => (
                                                    <SkeletonCard key={i} />
                                                ))}
                                            </div>
                                        ) : currentDocs && currentDocs.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {currentDocs.map(doc => (
                                                    <DocCard key={doc.id} doc={doc} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 border-dashed flex items-center justify-center mb-4">
                                                    <FileText className="w-7 h-7 text-white/20" />
                                                </div>
                                                <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                                                <p className="text-[11px] text-white/20 mt-1">
                                                    {TABS.find(t => t.key === activeTab)?.label} documents will appear here.
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
