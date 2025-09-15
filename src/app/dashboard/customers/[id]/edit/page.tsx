'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import useApi from '@/lib/useApi'
import { useToast } from '@/components/toast/ToastProvider'
import HomeLoading from '@/components/HomeLoading'
import type { CustomerFormData, ApiResponse, Customer } from '@/types'

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

export default function EditCustomerPage() {
  const params = useParams() || {}
  const router = useRouter()
  const customerId = (params as { id?: string }).id || ''

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const apiClient = useApi()
  const toast = useToast()

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<CustomerForm>({ resolver: zodResolver(customerSchema) })
  const [loaded, setLoaded] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchCustomer = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      if (!customerId) {
        setFetchError('Invalid customer id')
        setLoaded(false)
        setLoading(false)
        return
      }

      const resp = await apiClient.request<Record<string, any> | Customer>({ method: 'get', url: `/customers/${customerId}` })

      if (!resp.ok) {
        if (resp.status === 404) {
          setFetchError('Customer not found')
          setLoaded(false)
          return
        }
        setFetchError(resp.error || 'Failed to load customer')
        setLoaded(false)
        return
      }

      const payload = (resp.data ?? {}) as any

      // Normalize common server shapes into a Customer object
      let customerObj: Customer | undefined
      const data = payload?.data ?? payload
      if (data?.customer) customerObj = data.customer as Customer
      else if (data?.id) customerObj = data as Customer
      else if (payload?.customer) customerObj = payload.customer as Customer
      else if (payload?.id) customerObj = payload as Customer

      if (customerObj) {
        reset({
          name: customerObj.name ?? '',
          email: customerObj.email ?? '',
          phone: customerObj.phone ?? '',
          totalSpending: customerObj.totalSpending ?? 0,
          visitCount: customerObj.visitCount ?? 0,
        })
        setLoaded(true)
      } else {
        setFetchError('No customer data received from server')
        setLoaded(false)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV === 'development') console.error('Failed to load customer:', err)
      setFetchError('Failed to load customer')
      setLoaded(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (customerId) void fetchCustomer()
  }, [customerId])

  const onSubmit = async (data: CustomerForm) => {
    try {
      setSaving(true)
      const payload: CustomerFormData = {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        totalSpending: data.totalSpending ?? 0,
        visitCount: data.visitCount ?? 0
      }
      const resp = await apiClient.request<ApiResponse<null>>({ method: 'put', url: `/customers/${customerId}`, data: payload })
      if (!resp.ok) {
        if (resp.status === 400 && resp.data && (resp.data as any).details) {
          const details = (resp.data as any).details as Array<{ msg?: string; param?: string }>
          details.forEach((d) => { if (d.param) setError(d.param as any, { message: d.msg || 'Invalid value' }) })
          return
        }
        throw new Error(resp.error || 'Failed to update customer')
      }
      // After successful update, navigate back to the customers list.
      // Also apply a short fallback full reload to ensure the list fetches fresh data.
      try {
        router.push('/dashboard/customers')
      } finally {
        if (typeof window !== 'undefined') {
          setTimeout(() => { window.location.href = '/dashboard/customers' }, 150)
        }
      }
    } catch (err: unknown) {
      console.error('Failed to update customer:', err)
      const error = err as { response?: { data?: { error?: string } }; message?: string }
  if (error.response?.data?.error?.includes('email')) setError('email', { message: 'This email is already registered' })
  else toast.show({ message: error.message || 'Failed to update customer' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <HomeLoading />
  if (!loaded) {
    return (
      <div className="bg-background text-foreground min-h-screen px-4 lg:px-8 py-6 space-y-6">
        <div className="max-w-xl mx-auto text-center">
          {fetchError === 'Customer not found' ? (
            <>
              <h2 className="text-xl font-semibold">Customer not found</h2>
              <p className="text-sm text-slate-500 mt-2">The customer ID in the URL does not match any record. You can go back to the customers list.</p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <Link href="/dashboard/customers" className="inline-flex items-center px-4 py-2 rounded-full border border-blue-200 text-sm">Back to list</Link>
                    </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold">Could not load customer</h2>
              <p className="text-sm text-slate-500 mt-2">There was a problem loading this customer. You can retry or go back to the customers list.</p>
              {fetchError ? (
                <div className="mt-3 rounded bg-slate-50 p-3 text-sm text-red-700">{fetchError}</div>
              ) : null}
              <div className="mt-6 flex items-center justify-center gap-3">
                <button onClick={() => { if (customerId) void fetchCustomer() }} className="px-4 py-2 rounded-full bg-slate-800 text-white">Retry</button>
                <Link href="/dashboard/customers" className="inline-flex items-center px-4 py-2 rounded-full border border-blue-200 text-sm">Back to list</Link>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground min-h-screen px-4 lg:px-8 py-6 space-y-8">
      <div className="flex items-center gap-4 mb-3">
        <Link href="/dashboard/customers" className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 mb-1 tracking-tight">Edit Customer</h1>
          <p className="text-sm text-slate-500">Update the details for this customer</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <Card className="bg-white rounded-2xl shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800">Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold">Full Name *</Label>
                  <Input id="name" {...register('name')} placeholder="Enter customer's full name" className={`rounded-xl bg-slate-50 border-blue-100 ${errors.name ? 'border-destructive ring-1 ring-rose-200' : ''}`} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold">Email Address *</Label>
                  <Input type="email" id="email" {...register('email')} placeholder="customer@example.com" className={`rounded-xl bg-slate-50 border-blue-100 ${errors.email ? 'border-destructive ring-1 ring-rose-200' : ''}`} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-semibold">Phone Number</Label>
                  <Input type="tel" id="phone" {...register('phone')} placeholder="+1 (555) 123-4567" className="rounded-xl bg-slate-50 border-blue-100" />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalSpending" className="font-semibold">Total Spending</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 text-sm">$</span>
                    </div>
                    <Input type="number" id="totalSpending" step="0.01" min="0" {...register('totalSpending', { valueAsNumber: true })} className={`pl-7 rounded-xl bg-slate-50 border-blue-100 ${errors.totalSpending ? 'border-destructive ring-1 ring-rose-200' : ''}`} placeholder="0.00" />
                  </div>
                  {errors.totalSpending && <p className="text-xs text-destructive">{errors.totalSpending.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitCount" className="font-semibold">Visit Count</Label>
                  <Input type="number" id="visitCount" min="0" {...register('visitCount', { valueAsNumber: true })} placeholder="1" className={`rounded-xl bg-slate-50 border-blue-100 ${errors.visitCount ? 'border-destructive ring-1 ring-rose-200' : ''}`} />
                  {errors.visitCount && <p className="text-xs text-destructive">{errors.visitCount.message}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-8 border-t border-blue-50">
                <Button variant="outline" asChild className="px-5 py-2 rounded-full border-blue-200">
                  <Link href="/dashboard/customers">Cancel</Link>
                </Button>
                <Button type="submit" disabled={saving} className="px-7 py-2 rounded-full bg-slate-800 text-white hover:bg-slate-900 shadow">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
