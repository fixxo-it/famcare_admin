import { api } from '@/utils/api'
import Link from 'next/link'
import {
    TrendingUp,
    Clock,
    ArrowUpRight,
    Package,
    Activity,
    CheckCircle2,
    Users,
    Bike,
    AlertCircle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const { data: stats } = await api.get<any>('/admin/stats')
    const { data: requests } = await api.get<any[]>('/admin/requests')

    const recentRequests = requests?.slice(0, 5) || []

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Real-time overview of the FamCare service network.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Requests"
                    value={stats?.total_requests ?? '—'}
                    icon={<Package className="w-5 h-5 text-primary" />}
                    color="primary"
                />
                <StatsCard
                    title="Active Riders"
                    value={`${stats?.active_riders ?? 0} / ${stats?.total_riders ?? 0}`}
                    icon={<Bike className="w-5 h-5 text-green-400" />}
                    color="green"
                />
                <StatsCard
                    title="Pending"
                    value={stats?.pending_requests ?? '—'}
                    icon={<Clock className="w-5 h-5 text-yellow-400" />}
                    color="yellow"
                />
                <StatsCard
                    title="Completed"
                    value={stats?.completed_requests ?? '—'}
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    color="emerald"
                />
            </div>

            {/* Recent Requests + Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold">Recent Requests</h2>
                        <Link href="/requests" className="text-xs text-primary hover:underline flex items-center gap-1">
                            View All <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentRequests.map((req: any) => (
                            <div key={req.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                    {req.status === 'completed' ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    ) : req.status === 'new' ? (
                                        <AlertCircle className="w-5 h-5 text-blue-400" />
                                    ) : (
                                        <Activity className="w-5 h-5 text-primary" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {req.service?.replace('_', ' ')} — {req.user_phone}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {req.rider?.name ? `Assigned to ${req.rider.name}` : 'Unassigned'} • {new Date(req.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`status-badge status-${req.status}`}>
                                    {req.status}
                                </span>
                            </div>
                        ))}
                        {recentRequests.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No requests yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-card space-y-6">
                    <h2 className="text-lg font-semibold">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link href="/riders" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all group">
                            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                                <Bike className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium group-hover:text-white transition-colors">Add Rider</p>
                                <p className="text-xs text-muted-foreground">Onboard new partners</p>
                            </div>
                        </Link>
                        <Link href="/requests" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all group">
                            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium group-hover:text-white transition-colors">Check Requests</p>
                                <p className="text-xs text-muted-foreground">View & assign bookings</p>
                            </div>
                        </Link>
                        <Link href="/users" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all group">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium group-hover:text-white transition-colors">View Users</p>
                                <p className="text-xs text-muted-foreground">Customer directory</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatsCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
    const borderColors: Record<string, string> = {
        primary: 'border-primary/20 hover:border-primary/40',
        green: 'border-green-500/20 hover:border-green-500/40',
        yellow: 'border-yellow-500/20 hover:border-yellow-500/40',
        emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
    }

    return (
        <div className={`glass-card border ${borderColors[color] || 'border-white/10'} transition-all`}>
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                    {icon}
                </div>
            </div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 text-white">{value}</p>
        </div>
    )
}
