"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useToast } from '@/components/toast/ToastProvider'
import { authService } from '@/lib/auth'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  refresh: () => Promise<User | null>
  logout: () => Promise<void>
  login: (token: string) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { show } = useToast()

  useEffect(() => {
    const init = async () => {
      try {
        const u = await authService.getCurrentUser()
        setUser(u)
        // Do NOT show a welcome toast on initial page load; this avoids
        // showing a toast when the user refreshes the page. Welcome toasts
        // should be shown only after explicit sign-in/refresh actions.
      } catch (err) {
        // Only log unexpected errors (getCurrentUser should handle 401s gracefully)
        // use dynamic import to avoid affecting SSR bundles
        import('@/lib/log').then(({ logError }) => logError('Auth init error:', err)).catch(() => console.error('Auth init error:', err))
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    init()

    // Subscribe to external logout events (e.g., other tabs or manual token removals)
    const unsubscribe = authService.subscribeOnLogout(() => {
      setUser(null)
    })

    return () => {
      try { unsubscribe() } catch { /* ignore */ }
    }
  }, [])

  const refresh = async () => {
    try {
      const u = await authService.getCurrentUser()
      const wasNull = user === null
      setUser(u)
      // If this refresh is called and the user transitioned from unauthenticated
      // to authenticated, show a welcome toast only if a one-time flag has been
      // set in sessionStorage (set by the login/register flows). This prevents
      // toasts from appearing on every page refresh.
      if (wasNull && u) {
        try {
          const shouldShow = typeof window !== 'undefined' && sessionStorage.getItem('xeno:show_welcome_toast') === '1'
          if (shouldShow) {
            const displayName = u.name || u.email || 'there'
            show({ message: `Welcome, ${displayName}!` })
            sessionStorage.removeItem('xeno:show_welcome_toast')
          }
        } catch (e) {
          // Ignore storage errors and fall back to not showing the toast
          console.warn('Welcome toast storage check failed', e)
        }
      }
      return u
    } catch (err) {
      import('@/lib/log').then(({ logError }) => logError('Auth refresh error:', err)).catch(() => console.error('Auth refresh error:', err))
      setUser(null)
      return null
    }
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    // authService.logout performs a redirect; we still clear local state here
    // to ensure UI updates before the navigation occurs.
  }

  const login = (token: string) => {
    authService.login(token)
    // Set flag to show welcome toast after the next refresh
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('xeno:show_welcome_toast', '1')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout, login }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
