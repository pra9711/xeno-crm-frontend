"use client"

import { useCallback } from 'react'
import { useToast as useAdapterToast } from '../components/toast/ToastProvider'

type ToastOptions = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'info'
}

export function useToast() {
  const { show } = useAdapterToast()

  const toastFn = useCallback((opts: ToastOptions) => {
    const { title, description } = opts || {}
    const lines: string[] = []
    if (title) lines.push(title)
    if (description) lines.push(description)
    const message = lines.join(' — ') || 'Notification'

    show({ message })
  }, [show])

  return { toast: toastFn }
}

export default useToast
