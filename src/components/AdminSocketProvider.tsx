'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAdminSocket, AdminSocketEvent } from '@/hooks/useAdminSocket'

interface AdminSocketContextValue {
    connected: boolean
    on: <T = unknown>(type: string, handler: (event: AdminSocketEvent<T>) => void) => () => void
}

const AdminSocketContext = createContext<AdminSocketContextValue | null>(null)

export function AdminSocketProvider({ children }: { children: ReactNode }) {
    const socket = useAdminSocket()
    return (
        <AdminSocketContext.Provider value={socket}>
            {children}
        </AdminSocketContext.Provider>
    )
}

export function useAdminSocketContext() {
    const ctx = useContext(AdminSocketContext)
    if (!ctx) throw new Error('useAdminSocketContext must be used within AdminSocketProvider')
    return ctx
}
