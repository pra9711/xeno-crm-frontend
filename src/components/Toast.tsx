import { useEffect } from 'react'

type ToastProps = {
  open: boolean
  message?: string
  onClose?: () => void
}

export default function Toast({ open, message, onClose }: ToastProps) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => onClose && onClose(), 2500)
    return () => clearTimeout(t)
  }, [open, onClose])

  // Toast: transient presentation component. Keep behavior simple and self-contained
  // so it's easy to mock in tests and predictable in UX.

  if (!open) return null

  return (
    <div aria-live="polite" role="status" className="fixed right-6 bottom-6 z-50">
      <div className="rounded-md bg-foreground text-background px-4 py-2 shadow-md">
        <div className="text-sm">{message}</div>
      </div>
    </div>
  )
}
