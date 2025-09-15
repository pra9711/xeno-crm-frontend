"use client"

import React, { createContext, useContext, useCallback } from 'react'
import toast from 'react-hot-toast'

/**
 * ToastItem: public payload for showing a toast via adapter.
 * - `title` (optional): short bold prefix shown before message (adapter currently joins with `—`).
 * - `message`: main toast body.
 * - `duration` (optional): milliseconds to display; default is 4000.
 * - `action` (optional): reserved for future support of actionable toasts.
 */
type ToastItem = { id?: string; title?: string; message: string; duration?: number; action?: { label: string; onClick: () => void } }

/**
 * Public API exposed by `ToastProvider`:
 * - `show(t: ToastItem)`: display a toast.
 * - `dismiss(id?)`: dismiss one or all toasts.
 */
type ToastContextValue = {
  show: (t: ToastItem) => void
  dismiss: (id?: string) => void
}

// Adapter provider: keep the existing `useToast()` API but delegate rendering
// and lifecycle to `react-hot-toast` (root Toaster is already mounted in layout).
const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const show = useCallback((t: ToastItem) => {
    const id = t.id ?? String(Date.now())
    const message = t.title ? `${t.title} — ${t.message}` : t.message

    // For now keep a simple mapping: use toast.success / toast.error heuristics
    // could be extended to render custom components when `action` is provided.
    toast(message, { id, duration: t.duration ?? 4000 })
  }, [])

  const dismiss = useCallback((id?: string) => {
    // react-hot-toast accepts undefined to dismiss all toasts
    toast.dismiss(id)
  }, [])

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

// Usage: import { ToastProvider, useToast } from '@/components/toast/ToastProvider'
// Wrap the app (e.g. in `app/layout.tsx`) with <ToastProvider>. Then in client
// components call `const { show, dismiss } = useToast()` to display notifications.
