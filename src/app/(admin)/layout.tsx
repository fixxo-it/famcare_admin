'use client'

import { Shield, LayoutDashboard, Package, Users, Bike, Map, ListTree, Ticket, ImageIcon, Clock, LogOut, Menu, X, Siren, Settings, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminSocketProvider } from '@/components/AdminSocketProvider'
import SOSAlertBanner from '@/components/SOSAlertBanner'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/requests', label: 'Requests', icon: Package },
    { href: '/riders', label: 'Riders', icon: Bike },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/hubs', label: 'Hubs', icon: Map },
    { href: '/services', label: 'Services', icon: ListTree },
    { href: '/coupons', label: 'Coupons', icon: Ticket },
    { href: '/banners', label: 'Banners', icon: ImageIcon },
    { href: '/guidelines', label: 'Guidelines', icon: ClipboardList },
    { href: '/slots', label: 'Slots', icon: Clock },
    { href: '/sos', label: 'SOS', icon: Siren },
    { href: '/config', label: 'Config', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleLogout = async () => {
        await fetch('/auth/logout', { method: 'POST' })
        router.push('/login')
        router.refresh()
    }

    const NavContent = () => (
        <>
            <div className="p-6">
                <div className="flex items-center gap-2.5 font-bold text-xl text-gradient">
                    <Shield className="w-6 h-6 text-primary" />
                    <span>FamCare</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-8.5">Admin Panel</p>
            </div>

            <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                                isActive
                                    ? 'bg-primary/15 text-white border border-primary/20'
                                    : 'hover:bg-white/5 text-muted-foreground hover:text-white'
                            }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                            <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-white'}`} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                </button>
            </div>
        </>
    )

    return (
        <AdminSocketProvider>
        <div className="min-h-screen bg-background flex">
            <SOSAlertBanner />
            {/* Desktop Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-card/30 backdrop-blur-xl hidden md:flex flex-col fixed inset-y-0 left-0 z-30">
                <NavContent />
            </aside>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 w-72 bg-background border-r border-white/10 flex flex-col z-50 md:hidden"
                        >
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <NavContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="h-14 border-b border-white/5 bg-card/30 backdrop-blur-xl md:hidden flex items-center px-4 justify-between sticky top-0 z-20">
                    <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/5">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 font-bold text-gradient">
                        <Shield className="w-5 h-5 text-primary" />
                        <span>FamCare</span>
                    </div>
                    <div className="w-9" /> {/* Spacer */}
                </header>

                <div className="flex-1 overflow-y-auto bg-gradient-mesh">
                    <div className="max-w-7xl mx-auto p-4 md:p-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
        </AdminSocketProvider>
    )
}
