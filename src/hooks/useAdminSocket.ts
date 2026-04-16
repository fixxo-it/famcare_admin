'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface AdminSocketEvent<T = unknown> {
    type: string
    payload: T
}

type Handler = (event: AdminSocketEvent) => void

/**
 * Single WebSocket connection per admin tab to /admin/ws.
 * Multiplexes event types via `{ type, payload }` envelope.
 * Subscribers register through `on(type, handler)` — returns unsubscribe.
 */
export function useAdminSocket() {
    const wsRef = useRef<WebSocket | null>(null)
    const handlersRef = useRef<Map<string, Set<Handler>>>(new Map())
    const reconnectTimerRef = useRef<number | null>(null)
    const [connected, setConnected] = useState(false)

    const connect = useCallback(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
        const wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/admin/ws'

        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
            setConnected(true)
            if (reconnectTimerRef.current) {
                window.clearTimeout(reconnectTimerRef.current)
                reconnectTimerRef.current = null
            }
        }

        ws.onmessage = (msg) => {
            try {
                const data: AdminSocketEvent = JSON.parse(msg.data)
                const handlers = handlersRef.current.get(data.type)
                handlers?.forEach((h) => h(data))
                const wildcard = handlersRef.current.get('*')
                wildcard?.forEach((h) => h(data))
            } catch {
                // ignore malformed messages
            }
        }

        ws.onclose = () => {
            setConnected(false)
            wsRef.current = null
            // Auto-reconnect with 3s backoff
            if (!reconnectTimerRef.current) {
                reconnectTimerRef.current = window.setTimeout(() => {
                    reconnectTimerRef.current = null
                    connect()
                }, 3000)
            }
        }

        ws.onerror = () => {
            ws.close()
        }
    }, [])

    useEffect(() => {
        connect()
        return () => {
            if (reconnectTimerRef.current) {
                window.clearTimeout(reconnectTimerRef.current)
                reconnectTimerRef.current = null
            }
            wsRef.current?.close()
            wsRef.current = null
        }
    }, [connect])

    const on = useCallback(<T = unknown,>(type: string, handler: (event: AdminSocketEvent<T>) => void) => {
        const map = handlersRef.current
        if (!map.has(type)) map.set(type, new Set())
        map.get(type)!.add(handler as Handler)
        return () => {
            map.get(type)?.delete(handler as Handler)
        }
    }, [])

    return { connected, on }
}
