import React, { useState } from 'react'
import Skeleton from '@/components/Skeleton'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'

export default function SignInModal({ open, onSuccess }: { open: boolean; onSuccess?: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  if (!open) return null

  const handleRedirectSignIn = () => {
    setLoading(true)
    try {
      authService.loginWithGoogleRedirect()
      // the page will navigate away to backend
    } catch (err) {
      // stringify and log error for better diagnostics
      import('@/lib/log').then(({ logError }) => logError('Redirect sign-in failed:', err)).catch(() => console.error('Redirect sign-in failed:', err))
  router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  // Sign-in modal: initiates provider redirect. Keep UI minimal since auth flow
  // is completed by the backend; ensure errors are logged for debugging.

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="fixed inset-0 bg-background/80" />
      <div className="bg-card rounded-lg shadow-lg z-10 max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-foreground">Sign in required</h3>
  <p className="mt-2 text-sm text-muted-dark">You must sign in to preview audiences and create campaigns.</p>
        <div className="mt-4 flex justify-end space-x-2">
          <button onClick={handleRedirectSignIn} className="btn-primary" disabled={loading}>
            {loading ? <Skeleton width="w-16" height="h-4" className="bg-white/40" /> : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
