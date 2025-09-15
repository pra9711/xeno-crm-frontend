import apiRequest from './apiRequest'

export type OAuthPopupResult = { status: 'success' | 'error'; message?: string }

export function openOAuthPopup(): Promise<OAuthPopupResult> {
  return new Promise((resolve, reject) => {
    const width = 600
    const height = 700
    const left = window.screenX + (window.innerWidth - width) / 2
    const top = window.screenY + (window.innerHeight - height) / 2
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')
    const url = `${apiBase}/auth/google?popup=1`

    const popup = window.open(url, 'oauth_popup', `width=${width},height=${height},left=${left},top=${top}`)
    if (!popup) {
      // Popup blocked — fallback to full-window redirect to start OAuth
      try {
        window.location.href = url
        return
      } catch (err) {
        reject({ status: 'error', message: 'Popup blocked' })
        return
      }
    }

    try { popup.focus() } catch {}

  const handleMessage = async (_e: MessageEvent) => {
      // Only accept messages from same origin in production. Allow cross-origin in development/tests.
      try {
        const originAllowed = (process.env.NODE_ENV === 'production') ? (_e as MessageEvent).origin === window.location.origin : true
        if (!originAllowed) return
        const payload = (_e as MessageEvent).data
        if (!payload || payload.type !== 'oauth-popup') return
        window.removeEventListener('message', handleMessage)
        try {
          // Call /api/auth/me to refresh session
          const me = await apiRequest({ method: 'get', url: '/auth/me' })
          const payload = me.data as Record<string, unknown> | undefined
          if (me.ok && payload?.['success'] === true) {
            resolve({ status: 'success' })
          } else {
            resolve({ status: 'error', message: me.error || 'Failed to refresh session' })
          }
        } catch (_err) {
          resolve({ status: 'error', message: _err instanceof Error ? _err.message : 'Unknown error' })
        }
        // close popup
        try { popup.close() } catch { /* ignore */ }
      } catch {
        // ignore
      }
    }

    window.addEventListener('message', handleMessage)

    const checkInterval = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkInterval)
        window.removeEventListener('message', handleMessage)
        clearTimeout(timeoutTimer)
        reject({ status: 'error', message: 'Popup closed' })
      }
    }, 500)

    // Safety timeout: reject if no completion in 2 minutes
    const timeoutTimer = setTimeout(() => {
      try { window.removeEventListener('message', handleMessage) } catch {}
      try { clearInterval(checkInterval) } catch {}
      try { if (popup && !popup.closed) popup.close() } catch {}
      reject({ status: 'error', message: 'OAuth flow timed out' })
    }, 2 * 60 * 1000)
  })
}
