'use client'

import { useState } from 'react'
import { Send, X, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PushNotificationModalProps {
    targetId: string
    targetName: string
    targetType: 'user' | 'rider'
    isOpen: boolean
    onClose: () => void
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

export default function PushNotificationModal({ targetId, targetName, targetType, isOpen, onClose }: PushNotificationModalProps) {
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [link, setLink] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const handleSend = async () => {
        if (!title || !body) return alert('Please enter both title and body.')
        setLoading(true)
        setStatus('idle')
        try {
            const endpoint = targetType === 'user' ? `admin/users/${targetId}/push` : `admin/riders/${targetId}/push`
            const res = await fetch(`${API_BASE}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body, link: link || undefined })
            })

            if (res.ok) {
                setStatus('success')
                setTimeout(() => {
                    onClose()
                    setStatus('idle')
                    setTitle('')
                    setBody('')
                    setLink('')
                }, 1500)
            } else {
                const err = await res.json()
                alert(`Failed: ${err.detail || 'Unknown error'}`)
                setStatus('error')
            }
        } catch (e) {
            console.error('Push error:', e)
            setStatus('error')
            alert("Connection error.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-[#0A0A0A] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">Send Push Notification</h2>
                                    <p className="text-xs text-muted-foreground">Target: <span className="text-white font-medium">{targetName}</span></p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notification Title</label>
                                <input 
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Your caretaker is arriving!"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message Body</label>
                                <textarea 
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    placeholder="Enter the message you want the user to see..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all h-24 resize-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deep Link / Route (Optional)</label>
                                <input 
                                    value={link}
                                    onChange={e => setLink(e.target.value)}
                                    placeholder="e.g. /payment-flow or /profile"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                                <p className="text-[10px] text-muted-foreground">Enter a screen route to navigate the user when they tap the notification.</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
                            <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
                            <button
                                onClick={handleSend}
                                disabled={loading || status === 'success'}
                                className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                                    status === 'success' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-primary text-white hover:shadow-[0_0_20px_rgba(255,51,102,0.3)] disabled:opacity-50'
                                }`}
                            >
                                {loading ? 'Sending...' : status === 'success' ? 'Sent!' : <><Send className="w-4 h-4" /> Send Notification</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
