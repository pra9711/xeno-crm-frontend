"use client"

import React, { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import apiRequest from '@/lib/apiRequest'
import { useToast } from '@/components/toast/ToastProvider'

type ChangePasswordForm = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setError } = useForm<ChangePasswordForm>()

  const { show } = useToast()

  const newPassword = watch('newPassword')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const firstInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // focus first input when opened
    setTimeout(() => firstInputRef.current?.focus(), 50)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // This modal focuses the first input when opened and traps Escape handling
  // to provide accessible, testable UI. Error mapping for server responses
  // is explicit to show where server-side validation is surfaced in the UI.

  const onSubmit = async (vals: ChangePasswordForm) => {
    if (vals.newPassword !== vals.confirmPassword) {
      setError('confirmPassword', { type: 'validate', message: "Passwords don't match" })
      return
    }

    try {
      const resp = await apiRequest<{ success: boolean }>({ method: 'post', url: '/auth/change-password', data: { currentPassword: vals.currentPassword, newPassword: vals.newPassword } })
      if (!resp.ok) {
        // Map common server errors to fields when possible
        if (resp.status === 403) {
          show({ message: resp.error || 'Not allowed' })
        } else if (resp.status === 400 && resp.data) {
          const data = resp.data as unknown
          if (typeof data === 'object' && data !== null) {
            const maybe = data as { errors?: unknown }
            const arr = maybe.errors
            if (Array.isArray(arr) && arr.length) {
              const first = arr[0] as unknown
              if (typeof first === 'object' && first !== null && 'message' in first) {
                const msg = (first as { message?: unknown }).message
                if (typeof msg === 'string' && msg.length > 0) {
                  show({ message: msg })
                } else {
                  show({ message: resp.error || 'Failed to change password' })
                }
              } else {
                show({ message: resp.error || 'Failed to change password' })
              }
            } else {
              show({ message: resp.error || 'Failed to change password' })
            }
          } else {
            show({ message: resp.error || 'Failed to change password' })
          }
        } else {
          show({ message: resp.error || 'Failed to change password' })
        }
        return
      }

  show({ message: 'Password updated' })
      onClose()
    } catch (err) {
  console.error('Change password error', err)
  show({ message: 'Failed to change password' })
    }
  }

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Change password" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={onClose} />
      <div ref={containerRef} className="relative w-full max-w-md p-4">
        <div className="transform transition-all duration-200 ease-out scale-95 opacity-0 animate-fade-in">
          <Card className="glass-card rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-describedby="change-password-desc">
                <p id="change-password-desc" className="sr-only">Change your account password. Current password required to confirm identity.</p>
                <div className="space-y-2">
                  <Label htmlFor="current">Current password</Label>
                  <Input id="current" type="password" {...register('currentPassword', { required: 'Current password required' })} ref={(el: HTMLInputElement | null) => { register('currentPassword').ref(el); firstInputRef.current = el }} />
                  {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new">New password</Label>
                  <Input id="new" type="password" {...register('newPassword', { required: 'New password required', minLength: { value: 8, message: 'Use at least 8 characters' } })} />
                  {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input id="confirm" type="password" {...register('confirmPassword', { required: 'Please confirm', validate: (v) => v === newPassword || "Passwords don't match" })} />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} aria-disabled={isSubmitting} aria-busy={isSubmitting}>{isSubmitting ? 'Saving...' : 'Change password'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
