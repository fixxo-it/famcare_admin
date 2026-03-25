/**
 * API client for communicating with the FamCARE Sutram (FastAPI) backend.
 */

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

export interface ApiResponse<T = any> {
    data: T | null
    error: string | null
}

/**
 * Make an API request to the FastAPI backend.
 */
export async function apiRequest<T = any>(
    endpoint: string,
    options: {
        method?: string
        body?: any
        token?: string
    } = {}
): Promise<ApiResponse<T>> {
    const { method = 'GET', body, token } = options

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            cache: 'no-store',
        })

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ detail: res.statusText }))
            return { data: null, error: errorData.detail || `API Error: ${res.status}` }
        }

        const data = await res.json()
        return { data, error: null }
    } catch (err: any) {
        return { data: null, error: err.message || 'Network error' }
    }
}

// Convenience methods
export const api = {
    get: <T = any>(endpoint: string, token?: string) =>
        apiRequest<T>(endpoint, { method: 'GET', token }),

    post: <T = any>(endpoint: string, body?: any, token?: string) =>
        apiRequest<T>(endpoint, { method: 'POST', body, token }),

    patch: <T = any>(endpoint: string, body?: any, token?: string) =>
        apiRequest<T>(endpoint, { method: 'PATCH', body, token }),

    delete: <T = any>(endpoint: string, token?: string) =>
        apiRequest<T>(endpoint, { method: 'DELETE', token }),
}
