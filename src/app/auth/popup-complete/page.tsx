'use client'

import { useEffect } from 'react'

export default function PopupComplete() {
  useEffect(() => {
    // Simplified and robust postMessage flow for the OAuth popup.
    // Leaves origin loose in development to tolerate cross-origin popup flows.
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status') || 'success'
    const token = params.get('token')
    const opener = window.opener
    
    if (opener && !opener.closed) {
      const targetOrigin = process.env.NODE_ENV === 'production' ? window.location.origin : '*'
      try {
        opener.postMessage({ 
          type: 'oauth-popup', 
          status, 
          token: token || undefined 
        }, targetOrigin)
      } catch {
        // best-effort fallback
        try { 
          opener.postMessage({ 
            type: 'oauth-popup', 
            status, 
            token: token || undefined 
          }, '*') 
        } catch { /* ignore */ }
      }
      try { window.close() } catch { /* ignore */ }
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Complete</h2>
        <p className="text-gray-600">You can close this window and return to the application.</p>
      </div>
    </div>
  )
}
