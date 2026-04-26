'use client'

import { useState } from 'react'
import { Bell, Send, Users, Bike, Info, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

export default function NotificationsPage() {
    const [target, setTarget] = useState<'users' | 'riders'>('users')
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [link, setLink] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !body) return

        if (!confirm(`Are you sure you want to send this notification to ALL ${target}?`)) return

        setLoading(true)
        setStatus(null)
        try {
            const res = await fetch(`${API_BASE}/admin/push-all?target=${target}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body, link: link || undefined })
            })
            const data = await res.json()
            if (res.ok) {
                setStatus({ 
                    type: 'success', 
                    message: `Successfully sent to ${data.success_count} ${target} (${data.total_tokens} total tokens found).` 
                })
                setTitle('')
                setBody('')
                setLink('')
            } else {
                setStatus({ type: 'error', message: data.detail || 'Failed to send notifications.' })
            }
        } catch (e) {
            console.error('Failed to send notification:', e)
            setStatus({ type: 'error', message: 'An error occurred while sending.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold text-gradient">Universal Notifications</h1>
                <p className="text-muted-foreground mt-1">Construct and broadcast push notifications to all registered users or caretakers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleSend} className="glass-card p-8 space-y-6 border border-white/10">
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-white block">Select Target Audience</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setTarget('users')}
                                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                                        target === 'users' 
                                        ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/20' 
                                        : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                                    }`}
                                >
                                    <Users className="w-5 h-5" />
                                    <span className="font-medium">All Users</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTarget('riders')}
                                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                                        target === 'riders' 
                                        ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                        : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                                    }`}
                                >
                                    <Bike className="w-5 h-5" />
                                    <span className="font-medium">All Caretakers</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-white mb-1.5 block">Notification Title</label>
                                <input
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Special Offer! 🎁"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-white mb-1.5 block">Message Body</label>
                                <textarea
                                    required
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Enter the message content here..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20 resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-white mb-1.5 block">Deep Link / Route (Optional)</label>
                                <input
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    placeholder="e.g. /payment-flow or /profile"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
                                />
                                <p className="text-[11px] text-muted-foreground mt-1">This will navigate the user to the specified screen when they tap the notification.</p>
                            </div>
                        </div>

                        {status && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl flex items-start gap-3 ${
                                    status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                            >
                                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                                <p className="text-sm font-medium">{status.message}</p>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !title || !body}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Sending Notifications...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    <span>Broadcast to {target === 'users' ? 'All Users' : 'All Caretakers'}</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-6 border border-white/10 space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Info className="w-5 h-5" />
                            <h3>Preview</h3>
                        </div>
                        <div className="bg-black/40 rounded-3xl p-4 border border-white/5 shadow-2xl">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white shadow-lg">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">FAMCARE APP</p>
                                    <h4 className="text-sm font-bold text-white truncate">{title || 'Notification Title'}</h4>
                                </div>
                                <span className="text-[10px] text-white/30">now</span>
                            </div>
                            <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                                {body || 'The notification message body will appear here. This is how it will look on a user\'s device.'}
                            </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            This is a visual representation of how the notification might appear on a mobile device. Appearance may vary slightly between iOS and Android.
                        </p>
                    </div>

                    <div className="glass-card p-6 border border-white/10 bg-blue-500/5">
                        <h4 className="text-sm font-bold text-blue-400 mb-2">Broadcasting Best Practices</h4>
                        <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                            <li>Keep titles short and punchy (under 30 characters).</li>
                            <li>Use emojis 🎁 to increase click-through rates.</li>
                            <li>Be concise; long bodies might get truncated.</li>
                            <li>Avoid sending more than 1-2 universal notifications per day to prevent "notification fatigue".</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
