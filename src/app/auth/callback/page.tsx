"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { inputFocusRing } from '@/lib/dashboardTheme'
import { useAuth } from '@/providers/AuthProvider'
import Spinner from '@/components/Spinner'

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const { refresh } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
        const error = params ? params.get('error') : null
        const token = params ? params.get('token') : null

        if (error) {
          setStatus('error')
          setMessage(decodeURIComponent(error))
          return
        }

        // For production (cross-domain), token is passed in URL
        // For development (same-domain), backend sets httpOnly cookie
        if (token) {
          // Store the token in localStorage for cross-domain auth
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token)
          }
          // Refresh the auth context to get the current user session
          await refresh()
          setStatus('success')
          setMessage('Authentication successful!')
          
          // Redirect to dashboard after a brief success message
          setTimeout(() => {
            router.push('/dashboard')
          }, 1000)
        } else {
          // Fallback to cookie-based auth (development)
          // The backend sets an httpOnly cookie on successful OAuth. 
          // Refresh the auth context to get the current user session.
          await refresh()
          setStatus('success')
          setMessage('Authentication successful!')
          
          // Redirect to dashboard after a brief success message
          setTimeout(() => {
            router.push('/dashboard')
          }, 1000)
        }
        const user = await refresh()
        if (user) {
          setStatus('success')
          setMessage(`Welcome, ${user.name}!`)
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        } else {
          throw new Error('Failed to get user information')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Authentication failed')
      }
    }

    handleCallback()
  }, [router, refresh])

  const handleRetry = () => {
    router.push('/')
  }

  return (
  <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-4"><Spinner size={48} className="text-blue-600" ariaLabel="Signing in" /></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Signing you in...
            </h2>
            <p className="text-gray-600">
              Please wait while we finish authentication.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Successful!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={handleRetry}
              className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 ${inputFocusRing} focus:ring-offset-2 transition-colors`}
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
