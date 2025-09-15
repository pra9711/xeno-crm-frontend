'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  ShoppingCart,
  Mail,
  Phone,
  Calendar,
  User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import useApi from '@/lib/useApi'
import { getInitials } from '@/lib/utils'
import { normalizeListAndPagination } from '@/lib/pagination'
import type { Customer, Order, CommunicationLog, ApiResponse } from '@/types'
import HomeLoading from '@/components/HomeLoading'

export default function CustomerDetailPage() {
  const params = useParams() || {}
  const router = useRouter()
  const customerId = String((params as { id?: string }).id ?? '')

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [communications, setCommunications] = useState<CommunicationLog[]>([])
  const [loading, setLoading] = useState(true)
  const client = useApi()

  // Helpers
  const fmtCurrency = (v?: number) => `$${(Number(v ?? 0)).toLocaleString('en-US')}`
  const fmtNumber = (v?: number) => (typeof v === 'number' ? v.toLocaleString('en-US') : '0')
  const safeDate = (d?: string | Date | null) => {
    if (!d) return null
    const dt = new Date(d)
    if (Number.isNaN(dt.getTime())) return null
    return dt
  }
  const fmtDateLong = (d?: string | Date | null) => {
    const dt = safeDate(d)
    return dt ? dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'
  }

  useEffect(() => {
    let mounted = true
    const fetchCustomerDetails = async () => {
      if (!customerId) return
      try {
        setLoading(true)
        const [customerRes, ordersRes, communicationsRes] = await Promise.all([
          client.request<ApiResponse<Customer>>({ method: 'get', url: `/customers/${customerId}` }),
          client.request<ApiResponse<Order[]>>({ method: 'get', url: `/customers/${customerId}/orders` }),
          client.request<ApiResponse<CommunicationLog[]>>({ method: 'get', url: `/customers/${customerId}/communications` })
        ])
        if (!mounted) return

        if (customerRes.ok) {
          const payload: any = customerRes.data ?? {}
          const data = payload.data ?? payload
          if (data?.customer) setCustomer(data.customer as Customer)
          else if (data?.id) setCustomer(data as Customer)
        }
        // Normalize orders payloads from various server shapes
        if (ordersRes.ok) {
          const raw = (ordersRes.data ?? ordersRes) as any
          const { list: ordersList } = normalizeListAndPagination<Order>(raw.data ?? raw)
          setOrders(ordersList || [])
        }
        if (communicationsRes.ok) {
          // Normalize communications payload as well
          const raw = (communicationsRes.data ?? communicationsRes) as any
          const { list: commList } = normalizeListAndPagination<CommunicationLog>(raw.data ?? raw)
          setCommunications(commList || [])
        }
      } catch (error) {
        console.error('Failed to fetch customer details:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchCustomerDetails()
    return () => { mounted = false }
  }, [customerId, client])

  // Polling (orders & communications) with guards to avoid overlapping polls and pause when tab is hidden
  const pollRef = useRef<number | null>(null)
  const pollingInFlight = useRef(false)
  const [justUpdated, setJustUpdated] = useState(false)
  const pulseTimeoutRef = useRef<number | null>(null)
  useEffect(() => {
    if (!customerId) return

    let mounted = true

    const fetchUpdates = async () => {
      if (!mounted) return
      // skip if already running
      if (pollingInFlight.current) return
      // pause polling when tab is hidden
      if (typeof document !== 'undefined' && document.hidden) return

      pollingInFlight.current = true
      try {
        const [ordersRes, communicationsRes] = await Promise.all([
          client.request<ApiResponse<Order[]>>({ method: 'get', url: `/customers/${customerId}/orders` }),
          client.request<ApiResponse<CommunicationLog[]>>({ method: 'get', url: `/customers/${customerId}/communications` })
        ])
        let anyOk = false
        if (ordersRes.ok) {
          const payload: any = ordersRes.data ?? {}
          const data = payload.data ?? payload
          setOrders(Array.isArray(data) ? data : (data?.orders ?? data?.items ?? []))
          anyOk = true
        }
        if (communicationsRes.ok) {
          const payload: any = communicationsRes.data ?? {}
          const data = payload.data ?? payload
          setCommunications(Array.isArray(data) ? data : (data?.communications ?? data?.items ?? []))
          anyOk = true
        }
        if (anyOk) {
          setJustUpdated(true)
          if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current)
          pulseTimeoutRef.current = window.setTimeout(() => setJustUpdated(false), 900)
        }
      } catch (err) {
        // polling errors are non-fatal
      } finally {
        pollingInFlight.current = false
      }
    }

    const onVisibility = () => {
      if (!document.hidden) {
        // immediately refresh when user returns
        void fetchUpdates()
      }
    }

  pollRef.current = window.setInterval(fetchUpdates, 90000)
    // initial fetch
    void fetchUpdates()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      mounted = false
      if (pollRef.current) window.clearInterval(pollRef.current)
      if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [customerId, client])

  if (loading) return <HomeLoading />

  if (!customer) {
    return (
      <div className="bg-background text-foreground min-h-screen flex flex-col items-center justify-center px-4 lg:px-8 py-6">
        <h2 className="text-3xl font-extrabold text-blue-700 mb-2">Customer not found</h2>
        <p className="mt-2 text-lg text-gray-500">The customer you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/dashboard/customers"
          className="mt-8 inline-flex items-center rounded-full px-5 py-2 text-base font-semibold bg-white hover:bg-blue-50 text-blue-700 border border-blue-100 transition"
        >
          Back to Customers
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground min-h-screen px-4 lg:px-8 py-6">
      <header className="flex flex-col md:flex-row items-center md:items-end gap-5 mb-10">
        <Link href="/dashboard/customers" aria-label="Back to customers"
          className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-white shadow border border-gray-100 hover:scale-105 transition">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            Customer Profile
            <span className="inline-flex items-center ml-2 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5">
              <span className={`${justUpdated ? 'animate-pulse' : ''} h-2 w-2 bg-green-500 rounded-full`} />
              <span className="text-xs font-semibold text-green-700 ml-1">Live</span>
            </span>
          </h2>
          <p className="text-base text-gray-500 mt-1">Detailed information and activity for <span className="font-semibold">{customer.name}</span></p>
        </div>
        {/* Removed header Edit button as requested; Edit remains in profile card */}
      </header>

      {/* Main Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Profile Block (left on desktop, top on mobile) */}
        <aside className="space-y-8 xl:col-span-1">
          <div className="bg-white shadow rounded-2xl p-6 flex flex-col items-center gap-3 border border-gray-100">
            <Avatar className="h-24 w-24 shadow border border-blue-100">
              <AvatarFallback className="text-2xl text-white bg-blue-600">{getInitials(customer.name)}</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold text-gray-900 mt-3">{customer.name}</h1>
            <div className="text-base text-gray-700">{customer.email}</div>
            <div className="mt-2 text-center w-full flex flex-wrap justify-center gap-3">
              <div className="rounded-lg bg-blue-50 px-3 py-1 text-sm text-blue-700 font-semibold">
                Orders: {orders.length}
              </div>
              <div className="rounded-lg bg-fuchsia-50 px-3 py-1 text-sm text-fuchsia-700 font-semibold">
                Messages: {communications.length}
              </div>
              <div className="rounded-lg bg-cyan-50 px-3 py-1 text-sm text-cyan-700 font-semibold">
                Total: {fmtCurrency(customer.totalSpending ?? 0)}
              </div>
            </div>
            {customer.phone && (
              <div className="mt-3 flex items-center gap-2 text-base text-gray-500">
                <Phone className="w-5 h-5" />
                <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a>
              </div>
            )}
            <Link
              href={`/dashboard/customers/${customer.id}/edit`}
              className="mt-3 inline-flex items-center px-5 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold shadow transition"
            >
              <Edit className="h-5 w-5 mr-2" />
              Edit Profile
            </Link>
          </div>
          
          <Card className="bg-white rounded-2xl shadow border-0 p-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
                <User className="h-5 w-5 text-blue-400" />
                Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-base">
                <div>
                  <dt className="font-semibold text-gray-500">Email</dt>
                  <dd className="mt-1 text-blue-900 flex items-center">
                    <Mail className="h-4 w-4 text-blue-400 mr-2" />
                    <a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">Phone</dt>
                  <dd className="mt-1 text-blue-900 flex items-center">
                    <Phone className="h-4 w-4 text-blue-400 mr-2" />
                    {customer.phone ? (
                      <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a>
                    ) : (
                      <span className="text-gray-300">Not provided</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">Customer Since</dt>
                  <dd className="mt-1 text-blue-900">{fmtDateLong(customer.createdAt)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">Last Visit</dt>
                  <dd className="mt-1 text-blue-900">{customer.lastVisit ? fmtDateLong(customer.lastVisit) : 'Never visited'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content (right on desktop, bottom on mobile) */}
        <main className="xl:col-span-2 space-y-10 pt-2">
          {/* Stat Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded-2xl p-6 flex items-center gap-4 border border-gray-100">
              <div className="p-3 rounded-lg bg-blue-50">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Spending</div>
                <div className="text-2xl font-extrabold text-gray-900">{fmtCurrency(customer.totalSpending)}</div>
              </div>
            </div>
            <div className="bg-white shadow rounded-2xl p-6 flex items-center gap-4 border border-gray-100">
              <div className="p-3 rounded-lg bg-cyan-50">
                <Calendar className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Visit Count</div>
                <div className="text-2xl font-extrabold text-gray-900">{fmtNumber(customer.visitCount ?? 0)}</div>
              </div>
            </div>
            <div className="bg-white shadow rounded-2xl p-6 flex items-center gap-4 border border-gray-100">
              <div className="p-3 rounded-lg bg-indigo-50">
                <ShoppingCart className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Orders</div>
                <div className="text-2xl font-extrabold text-gray-900">{orders.length}</div>
              </div>
            </div>
            <div className="bg-white shadow rounded-2xl p-6 flex items-center gap-4 border border-gray-100">
              <div className="p-3 rounded-lg bg-fuchsia-50">
                <Mail className="h-6 w-6 text-fuchsia-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Messages Sent</div>
                <div className="text-2xl font-extrabold text-gray-900">{communications.length}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Card className="bg-white shadow border-0 rounded-2xl">
            <Tabs defaultValue="overview" className="w-full">
              <CardHeader className="pb-0">
                <TabsList className="flex w-full bg-gray-50 rounded-xl border-0 shadow-inner">
                  <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 text-gray-800 rounded-xl py-2 font-semibold text-base transition">Overview</TabsTrigger>
                  <TabsTrigger value="orders" className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 text-gray-800 rounded-xl py-2 font-semibold text-base transition">Orders ({orders.length})</TabsTrigger>
                  <TabsTrigger value="communications" className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 text-gray-800 rounded-xl py-2 font-semibold text-base transition">Communications ({communications.length})</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="overview" className="space-y-5 py-6">
                  <h4 className="text-xl font-bold text-blue-900 mb-2">Customer Summary</h4>
                  <div className="prose text-base text-gray-800">
                    <p>
                      {customer.name} has been a customer since {fmtDateLong(customer.createdAt)}. They have made {orders.length} orders with a total spending of {fmtCurrency(customer.totalSpending ?? 0)}.
                    </p>
                    {orders.length > 0 && (
                      <p className="mt-2 font-semibold text-gray-900">Average order value: {fmtCurrency(Number(customer.totalSpending ?? 0) / orders.length)}</p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="orders" className="py-6">
                  <h4 className="text-xl font-bold text-blue-900 mb-2">Order History</h4>
                  {orders.length === 0 ? (
                    <p className="text-blue-400 text-center py-10">No orders found for this customer.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-100">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 text-blue-900 font-semibold text-base">
                            <TableHead>Order ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-blue-50 text-base">
                              <TableCell className="font-semibold text-blue-900">#{order.id.slice(-8)}</TableCell>
                              <TableCell className="font-semibold">{fmtCurrency(order.total ?? 0)}</TableCell>
                              <TableCell>
                                <Badge variant={order.status === 'COMPLETED' ? 'default' : order.status === 'PENDING' ? 'secondary' : order.status === 'CANCELLED' ? 'destructive' : 'outline'}>
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-blue-700">{safeDate(order.createdAt) ? new Date(order.createdAt).toLocaleDateString() : '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="communications" className="py-6">
                  <h4 className="text-xl font-bold text-blue-900 mb-2">Communication History</h4>
                  {communications.length === 0 ? (
                    <p className="text-blue-400 text-center py-10">No communications sent to this customer.</p>
                  ) : (
                    <div className="space-y-4">
                      {communications.map((comm) => (
                        <Card key={comm.id} className="bg-white border-0 shadow">
                          <CardContent className="pt-5">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="text-base font-bold text-blue-900">Campaign: {comm.campaign?.name || 'Unknown'}</h5>
                              <Badge variant={
                                comm.status === 'DELIVERED' ? 'default' :
                                  comm.status === 'SENT' ? 'secondary' :
                                    comm.status === 'FAILED' ? 'destructive' : 'outline'
                              }>{comm.status}</Badge>
                            </div>
                            <p className="text-base text-blue-800 mb-1">{comm.message}</p>
                            <div className="text-sm text-gray-400">
                              Sent: {comm.createdAt ? new Date(comm.createdAt).toLocaleString() : 'Unknown'}{comm.deliveredAt && <span className="ml-4">Delivered: {comm.deliveredAt ? new Date(comm.deliveredAt).toLocaleString() : 'Unknown'}</span>}
                            </div>
                            {comm.errorMessage && <p className="text-sm text-red-600 mt-2">Error: {comm.errorMessage}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </main>
      </div>
    </div>
  )
}
