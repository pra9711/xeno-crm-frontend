import Cookies from 'js-cookie'
import apiRequest from './apiRequest'
import { logError } from './log'
import type { User, ApiResponse } from '@/types'

export class AuthService {
  // Use the standard cookie key used by the API client
  private tokenKey = 'auth_token'
  // Subscribers to logout/token removal events
  private logoutSubscribers: Set<() => void> = new Set()

  // Get the stored auth token from localStorage (production) or cookies (development)
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    
    // For production (cross-domain), use localStorage
    if (process.env.NODE_ENV === 'production') {
      return localStorage.getItem(this.tokenKey) || null
    }
    
    // For development (same-domain), use cookies
    return Cookies.get(this.tokenKey) || null
  }

  // Store the auth token
  setToken(token: string): void {
    if (typeof window === 'undefined') return
    
    // For production (cross-domain), use localStorage
    if (process.env.NODE_ENV === 'production') {
      localStorage.setItem(this.tokenKey, token)
    } else {
      // For development (same-domain), use cookies
      Cookies.set(this.tokenKey, token, { 
        expires: 7, // 7 days
        secure: false,
        sameSite: 'lax',
        path: '/',
      })
    }
  }

  // Remove the auth token
  removeToken(): void {
    if (typeof window === 'undefined') return
    
    // For production (cross-domain), remove from localStorage
    if (process.env.NODE_ENV === 'production') {
      localStorage.removeItem(this.tokenKey)
    } else {
      // For development (same-domain), remove from cookies
      Cookies.remove(this.tokenKey, { path: '/' })
    }
    
    // Notify subscribers that token was removed
    try {
      for (const fn of Array.from(this.logoutSubscribers)) {
        try { fn() } catch { /* ignore subscriber errors */ }
      }
    } catch { /* ignore */ }
  }

  // Login with token (for use after OAuth callback)
  login(token: string): void {
    this.setToken(token)
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // Get current user from API
  async getCurrentUser(): Promise<User | null> {
    try {
      // Always call the server to validate the session. The server will
      // read the httpOnly cookie when present and return the current user.
  const response = await apiRequest<ApiResponse<User>>({ method: 'get', url: '/auth/me' })
      if (response.ok && response.data?.success && response.data.data) {
        return response.data.data as User
      }
  // If server returned success:false, do not immediately remove token here;
  // treat as unauthenticated but leave token removal to explicit 401 handling or refresh flow.
  return null
    } catch (error: unknown) {
      // 401 is expected when not authenticated - don't log as error
      let status: number | undefined = undefined
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const maybeErr = error as { response?: { status?: number } }
        status = maybeErr.response?.status
      }

      if (status === 401) {
        // Silently handle unauthenticated state and remove token when explicitly unauthorized
        this.removeToken()
        return null
      }

      // Log other errors (network issues, server errors, etc.). Don't remove token for transient errors
      logError('Failed to get current user (transient):', error)
      return null
    }
  }

  // Login with email and password
  async loginWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await apiRequest<ApiResponse<User & { token?: string }>>({
        method: 'post',
        url: '/auth/login',
        data: { email, password }
      })

      if (response.ok && response.data?.success && response.data.data) {
        const userData = response.data.data
        
        // If we received a token (production), store it
        if (userData.token) {
          this.setToken(userData.token)
        }
        
        // Set flag to show welcome toast
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('xeno:show_welcome_toast', '1')
        }

        return { 
          success: true, 
          user: {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            avatar: userData.avatar,
            createdAt: userData.createdAt,
            googleId: userData.googleId
          }
        }
      } else {
        return { success: false, error: response.data?.error || response.error || 'Login failed' }
      }
    } catch (error: unknown) {
      logError('Login error:', error)
      return { success: false, error: 'Login failed due to network error' }
    }
  }

  // Register with email, name and password
  async registerWithEmail(email: string, name: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await apiRequest<ApiResponse<User & { token?: string }>>({
        method: 'post',
        url: '/auth/register',
        data: { email, name, password }
      })

      if (response.ok && response.data?.success && response.data.data) {
        const userData = response.data.data
        
        // If we received a token (production), store it
        if (userData.token) {
          this.setToken(userData.token)
        }
        
        // Set flag to show welcome toast
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('xeno:show_welcome_toast', '1')
        }

        return { 
          success: true, 
          user: {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            avatar: userData.avatar || '',
            createdAt: userData.createdAt,
            googleId: userData.googleId
          }
        }
      } else {
        return { success: false, error: response.data?.error || response.error || 'Registration failed' }
      }
    } catch (error: unknown) {
      logError('Registration error:', error)
      return { success: false, error: 'Registration failed due to network error' }
    }
  }

  // Login with Google (redirect to backend)
  loginWithGoogle(): void {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')
    window.location.href = `${apiBase}/auth/google`
  }

  // Redirect-based Google login (no popup)
  loginWithGoogleRedirect(): void {
    this.loginWithGoogle()
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
  await apiRequest({ method: 'post', url: '/auth/logout' })
    } catch (error) {
      logError('Logout error:', error)
    } finally {
      // Always remove local token
      this.removeToken()
      // Redirect to homepage after logout
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  }

  // Subscribe to logout/token-removal events. Returns an unsubscribe function.
  subscribeOnLogout(fn: () => void): () => void {
    this.logoutSubscribers.add(fn)
    return () => { this.logoutSubscribers.delete(fn) }
  }

  // Refresh user session
  async refreshSession(): Promise<User | null> {
    try {
  const response = await apiRequest<ApiResponse<{ user: User, token: string }>>({ method: 'post', url: '/auth/refresh' })
      if (response.ok && response.data?.success && response.data.data) {
        const { user, token } = response.data.data
        this.setToken(token)
        return user
      }
      return null
    } catch (error) {
      logError('Session refresh failed:', error)
      this.removeToken()
      return null
    }
  }
}

export const authService = new AuthService()
