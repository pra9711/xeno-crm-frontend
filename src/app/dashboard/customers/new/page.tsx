'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import Skeleton from '@/components/Skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import useApi from '@/lib/useApi'
import { useToast } from '@/components/toast/ToastProvider'
import type { CustomerFormData, ApiResponse } from '@/types'

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  totalSpending: z.number().min(0, 'Total spending must be positive').optional(),
  phone: z.string()
    .transform((v) => (v === '' ? undefined : v))
    .optional()
    .refine((v) => v === undefined || /^\+?[0-9\s()\-]{7,}$/.test(v), { message: 'Enter a valid phone number' }),
  visitCount: z.number().min(0, 'Visit count must be positive').optional(),
})

type CustomerForm = z.infer<typeof customerSchema>

export default function NewCustomerPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      totalSpending: 0,
      visitCount: 1
    }
  })

  const apiClient = useApi()
  const toast = useToast()

  const onSubmit = async (data: CustomerForm) => {
    try {
      setLoading(true)

      const customerData: CustomerFormData = {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        totalSpending: data.totalSpending || 0,
        visitCount: data.visitCount || 1
      }
      const response = await apiClient.request<ApiResponse<{ id: string }>>({ method: 'post', url: '/customers', data: customerData })
      if (!response.ok) {
        if (response.status === 401) {
          toast.show({ message: 'Please sign in to create customers' })
          return
        }

        // Handle validation errors returned from express-validator
        if (response.status === 400 && response.data && (response.data as any).details) {
          const details = (response.data as any).details as Array<{ msg?: string; param?: string }>
          details.forEach((d) => {
            if (d.param) setError(d.param as any, { message: d.msg || 'Invalid value' })
          })
          return
        }

        throw new Error(response.error || 'Failed to create customer')
      }

      if (response.data?.success) {
        // Navigate to customers list and force a full reload to ensure
        // the customers page fetches fresh data and shows the newly created customer.
        try {
          router.push('/dashboard/customers')
        } finally {
          // Defensively force a full page load if the SPA navigation doesn't trigger a fresh fetch.
          // This handles cases where client state or caching prevents the list from updating.
          if (typeof window !== 'undefined') {
            setTimeout(() => { window.location.href = '/dashboard/customers' }, 150)
          }
        }
      } else {
        throw new Error(response.data?.error || 'Failed to create customer')
      }
    } catch (err: unknown) {
      console.error('Failed to create customer:', err)

      // narrow error shape from Axios-like errors
      const error = err as { response?: { data?: { error?: string } }; message?: string }
      if (error.response?.data?.error?.includes('email')) {
        setError('email', { message: 'This email is already registered' })
      } else {
        toast.show({ message: error.message || 'Failed to create customer' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 lg:p-10 space-y-8 bg-background text-foreground">
      {/* Page Header */}
      <div className="flex items-center gap-5 mb-4">
        <Link href="/dashboard/customers" className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-1 tracking-tight">Add New Customer</h1>
          <p className="text-lg text-slate-500">Create a new customer profile in your CRM</p>
        </div>
      </div>

      {/* Customer Form */}
      <div className="max-w-3xl mx-auto">
        <Card className="bg-white rounded-3xl shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold">Full Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter customer's full name"
                  className={`rounded-xl bg-slate-50 border-blue-100 ${errors.name ? 'border-destructive ring-1 ring-rose-200' : ''}`}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">Email Address *</Label>
                <Input
                  type="email"
                  id="email"
                  {...register('email')}
                  placeholder="customer@example.com"
                  className={`rounded-xl bg-slate-50 border-blue-100 ${errors.email ? 'border-destructive ring-1 ring-rose-200' : ''}`}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-semibold">Phone Number</Label>
                <Input
                  type="tel"
                  id="phone"
                  {...register('phone')}
                  placeholder="+1 (555) 123-4567"
                  className="rounded-xl bg-slate-50 border-blue-100"
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>

              {/* Total Spending */}
              <div className="space-y-2">
                <Label htmlFor="totalSpending" className="font-semibold">Total Spending</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm">$</span>
                  </div>
                  <Input
                    type="number"
                    id="totalSpending"
                    step="0.01"
                    min="0"
                    {...register('totalSpending', { valueAsNumber: true })}
                    className={`pl-7 rounded-xl bg-slate-50 border-blue-100 ${errors.totalSpending ? 'border-destructive ring-1 ring-rose-200' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.totalSpending && (
                  <p className="text-xs text-destructive">{errors.totalSpending.message}</p>
                )}
              </div>

              {/* Visit Count */}
              <div className="space-y-2">
                <Label htmlFor="visitCount" className="font-semibold">Visit Count</Label>
                <Input
                  type="number"
                  id="visitCount"
                  min="0"
                  {...register('visitCount', { valueAsNumber: true })}
                  placeholder="1"
                  className={`rounded-xl bg-slate-50 border-blue-100 ${errors.visitCount ? 'border-destructive ring-1 ring-rose-200' : ''}`}
                />
                {errors.visitCount && (
                  <p className="text-xs text-destructive">{errors.visitCount.message}</p>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-8 border-t border-blue-50">
              <Button variant="outline" asChild className="px-5 py-2 rounded-full border-blue-200">
                <Link href="/dashboard/customers">
                  Cancel
                </Link>
              </Button>
              <Button type="submit" disabled={loading} className="px-7 py-2 rounded-full bg-slate-800 text-white hover:bg-slate-900 shadow">
                {loading ? <Skeleton width="w-20" height="h-4" className="bg-primary/80" /> : 'Create Customer'}
              </Button>
            </div>
          </form>
        </CardContent>
        </Card>
      </div>

      {/* Help Text */}
      <div className="max-w-3xl mx-auto">
        <Card className="bg-slate-100/60 rounded-2xl border-0 mt-6 shadow-inner">
          <CardContent className="pt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-md font-semibold text-slate-700">
                Customer Information
              </h3>
              <div className="mt-2 text-sm text-slate-500">
                <ul className="list-disc list-inside space-y-1">
                  <li>Name and email are required fields</li>
                  <li>Email must be unique across all customers</li>
                  <li>Total spending and visit count will be automatically updated based on orders</li>
                  <li>Phone number should include country code for international customers</li>
                </ul>
              </div>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
