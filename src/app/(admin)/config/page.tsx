'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, ExternalLink, RefreshCw, Save, Settings } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

type AppConfig = {
    play_store_url: string | null
    latest_version: string | null
    latest_build_number: number | null
    force_update: boolean
    update_title: string | null
    update_message: string | null
    version_source: string
    is_active: boolean
    app_name: string
    app_logo_url: string
    app_description: string
}

type FormState = {
    play_store_url: string
    latest_version: string
    latest_build_number: string
    force_update: boolean
    update_title: string
    update_message: string
    is_active: boolean
    app_name: string
    app_logo_url: string
    app_description: string
}

const emptyForm: FormState = {
    play_store_url: '',
    latest_version: '',
    latest_build_number: '',
    force_update: false,
    update_title: 'Update available',
    update_message: 'A newer version is available. Please update to continue.',
    is_active: true,
    app_name: 'FamCare',
    app_logo_url: '',
    app_description: '',
}

function normalizeForm(config: AppConfig): FormState {
    return {
        play_store_url: config.play_store_url || '',
        latest_version: config.latest_version || '',
        latest_build_number: config.latest_build_number == null ? '' : String(config.latest_build_number),
        force_update: Boolean(config.force_update),
        update_title: config.update_title || 'Update available',
        update_message: config.update_message || 'A newer version is available. Please update to continue.',
        is_active: Boolean(config.is_active),
        app_name: config.app_name || 'FamCare',
        app_logo_url: config.app_logo_url || '',
        app_description: config.app_description || '',
    }
}

function validate(form: FormState): string | null {
    const url = form.play_store_url.trim()
    if (url) {
        try {
            const parsed = new URL(url)
            if (parsed.protocol !== 'https:') return 'Play Store link must use HTTPS.'
        } catch {
            return 'Play Store link must be a valid URL.'
        }
    }

    if (form.latest_version.trim() && !/^\d+(\.\d+){1,3}$/.test(form.latest_version.trim())) {
        return 'Latest version should look like 1.0.1.'
    }

    if (form.latest_build_number.trim()) {
        const build = Number(form.latest_build_number)
        if (!Number.isInteger(build) || build < 0) return 'Build number must be a positive integer.'
    }

    return null
}

export default function ConfigPage() {
    const [form, setForm] = useState<FormState>(emptyForm)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)

    const loadConfig = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${API_BASE}/admin/app-config`, { cache: 'no-store' })
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json()
            setForm(normalizeForm(data))
        } catch (e: any) {
            setError(e?.message || 'Failed to load config.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadConfig() }, [loadConfig])

    const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
        setSaved(false)
        setError(null)
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const validationError = validate(form)
        if (validationError) {
            setError(validationError)
            return
        }

        setSaving(true)
        setError(null)
        setSaved(false)
        try {
            const payload = {
                play_store_url: form.play_store_url.trim() || null,
                latest_version: form.latest_version.trim() || null,
                latest_build_number: form.latest_build_number.trim() ? Number(form.latest_build_number) : null,
                force_update: form.force_update,
                update_title: form.update_title.trim() || 'Update available',
                update_message: form.update_message.trim() || 'A newer version is available. Please update to continue.',
                version_source: 'admin',
                is_active: form.is_active,
                app_name: form.app_name.trim() || 'FamCare',
                app_logo_url: form.app_logo_url.trim() || null,
                app_description: form.app_description.trim() || null,
            }

            const res = await fetch(`${API_BASE}/admin/app-config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json()
            setForm(normalizeForm(data))
            setSaved(true)
        } catch (e: any) {
            setError(e?.message || 'Failed to save config.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Settings className="w-7 h-7 text-primary" />
                        Config
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage Praja app update settings and Play Store redirect.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadConfig}
                    disabled={loading || saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
                <button
                    type="button"
                    onClick={async () => {
                        if (!confirm('This will trigger a production build and deployment to the App Stores. Are you sure?')) return;
                        setSaving(true);
                        try {
                            const res = await fetch(`${API_BASE}/admin/trigger-build`, { method: 'POST' });
                            if (!res.ok) throw new Error(await res.text());
                            alert('Build triggered successfully!');
                        } catch (e: any) {
                            alert('Failed to trigger build: ' + e.message);
                        } finally {
                            setSaving(false);
                        }
                    }}
                    disabled={loading || saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-sm text-orange-200 border border-orange-500/20 transition-all disabled:opacity-50"
                >
                    <Settings className="w-4 h-4" />
                    Trigger Rebuild
                </button>
            </div>

            {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-300" />
                    <span>{error}</span>
                </div>
            )}

            {saved && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-300" />
                    <span>Config saved.</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="rounded-xl border border-white/10 bg-card/40 p-5 space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-white">Play Store link</label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={form.play_store_url}
                                    onChange={e => updateField('play_store_url', e.target.value)}
                                    placeholder="https://play.google.com/store/apps/details?id=..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                                />
                                <a
                                    href={form.play_store_url || undefined}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`inline-flex items-center justify-center px-3 rounded-lg border border-white/10 text-sm transition-all ${
                                        form.play_store_url ? 'text-white hover:bg-white/10' : 'pointer-events-none text-muted-foreground opacity-50'
                                    }`}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white">Latest Android version</label>
                            <input
                                type="text"
                                value={form.latest_version}
                                onChange={e => updateField('latest_version', e.target.value)}
                                placeholder="1.0.1"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white">Latest Android build number</label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={form.latest_build_number}
                                onChange={e => updateField('latest_build_number', e.target.value)}
                                placeholder="2"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={e => updateField('is_active', e.target.checked)}
                                className="h-4 w-4 accent-primary"
                            />
                            Enable update checks
                        </label>

                        <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                            <input
                                type="checkbox"
                                checked={form.force_update}
                                onChange={e => updateField('force_update', e.target.checked)}
                                className="h-4 w-4 accent-primary"
                            />
                            Force update
                        </label>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-white">Popup title</label>
                            <input
                                type="text"
                                value={form.update_title}
                                onChange={e => updateField('update_title', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-white">Popup message</label>
                            <textarea
                                value={form.update_message}
                                onChange={e => updateField('update_message', e.target.value)}
                                rows={4}
                                className="w-full resize-none bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        <div className="md:col-span-2 pt-4 border-t border-white/10">
                            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">App Branding (Requires Rebuild)</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white">App Display Name</label>
                            <input
                                type="text"
                                value={form.app_name}
                                onChange={e => updateField('app_name', e.target.value)}
                                placeholder="FamCare"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white">App Logo URL</label>
                            <input
                                type="url"
                                value={form.app_logo_url}
                                onChange={e => updateField('app_logo_url', e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-white">Store Description</label>
                            <textarea
                                value={form.app_description}
                                onChange={e => updateField('app_description', e.target.value)}
                                rows={6}
                                className="w-full resize-none bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-all disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save config
                    </button>
                </div>
            </form>
        </div>
    )
}
