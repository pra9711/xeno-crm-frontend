'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TruckIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  EnvelopeIcon, PhoneIcon
} from '@heroicons/react/24/outline'
import useApi from '@/lib/useApi'
import { normalizeListAndPagination } from '@/lib/pagination'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import type { Order } from '@/types'
import { OrderStatus } from '@/types'
import HomeLoading from '@/components/HomeLoading'

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ComponentType<Record<string, unknown>> }> = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon
  },
  PROCESSING: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-800',
    icon: TruckIcon
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800',
    icon: XCircleIcon
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'total' | 'customer'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const apiClient = useApi()
  // Dev-only flag: enable predictable local mocks only when explicitly set.
  // Tests enable this flag via `test/jest.setup.ts`.
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'

  // Debounce search term to avoid API calls on every keystroke
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setSearchLoading(true)
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setSearchLoading(false)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchTerm, debouncedSearchTerm])

  // Filter orders locally if we have mock data
  const filteredOrders = useMemo(() => {
    if (!useMocks) return orders
    
    let filtered = [...orders]
    
    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(order => 
        order.customer?.name?.toLowerCase().includes(searchLower) ||
        order.customer?.email?.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter)
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'total':
          aValue = a.total
          bValue = b.total
          break
        case 'customer':
          aValue = a.customer?.name || ''
          bValue = b.customer?.name || ''
          break
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return sortOrder === 'asc' 
        ? (aValue < bValue ? -1 : aValue > bValue ? 1 : 0)
        : (bValue < aValue ? -1 : bValue > aValue ? 1 : 0)
    })
    
    return filtered
  }, [orders, debouncedSearchTerm, statusFilter, sortBy, sortOrder, useMocks])

  const fetchOrders = async (overridePage?: number) => {
    try {
      setLoading(true)
      const pageToUse = overridePage ?? pagination.page
      const params = new URLSearchParams({
        page: pageToUse.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(statusFilter && { status: statusFilter }),
      })
      const response = await apiClient.request<unknown>({ method: 'get', url: `/orders?${params}` })
      const payload = response.data as any
      if (response.ok) {
        // Try to normalize various response shapes
        const { list, pagination: pag } = normalizeListAndPagination<Order>(payload?.data ?? payload)
        if (Array.isArray(list) && list.length > 0) {
          setOrders(list)
          setPagination((pag as any) ?? pagination)
          setLoading(false)
          return
        }
      }

      // Fallback: previous behavior — handle empty responses and dev mocks
      if (response.ok && (payload?.success === true || payload?.data)) {
        const data = payload?.data
        if (data) {
          setOrders((data['orders'] as Order[]) ?? [])
          setPagination((data['pagination'] as unknown as typeof pagination) ?? pagination)
        }
      } else {
        // Fallback: use local mocks only when explicitly enabled for dev.
        if (!useMocks) {
          // If not mocking, leave orders empty and surface a console warning.
          console.warn('Orders API returned no data and mocks are disabled.')
        } else {
          // Mock data for local development or screenshots
          const mockOrders: Order[] = [
          {
            id: '1',
            customerId: 'cust1',
            customer: {
              id: 'cust1',
              name: 'John Doe',
              email: 'john@example.com',
              phone: '+1234567890',
              totalSpending: 1250.50,
              audienceId: 'aud1',
              createdAt: '2024-01-15T00:00:00Z',
              updatedAt: '2024-01-15T00:00:00Z'
            },
            items: [
              { productName: 'Premium Package', quantity: 1, price: 99.99 },
              { productName: 'Additional Service', quantity: 2, price: 25.00 }
            ],
            total: 149.99,
            status: OrderStatus.COMPLETED,
            createdAt: '2024-01-20T10:00:00Z',
            updatedAt: '2024-01-22T15:30:00Z'
          },
          {
            id: '2',
            customerId: 'cust2',
            customer: {
              id: 'cust2',
              name: 'Jane Smith',
              email: 'jane@example.com',
              phone: '+1234567891',
              totalSpending: 850.25,
              audienceId: 'aud2',
              createdAt: '2024-01-10T00:00:00Z',
              updatedAt: '2024-01-10T00:00:00Z'
            },
            items: [
              { productName: 'Standard Plan', quantity: 3, price: 49.99 }
            ],
            total: 149.97,
            status: OrderStatus.PROCESSING,
            createdAt: '2024-01-21T10:00:00Z',
            updatedAt: '2024-01-21T10:00:00Z'
          },
          {
            id: '3',
            customerId: 'cust3',
            customer: {
              id: 'cust3',
              name: 'Bob Johnson',
              email: 'bob@example.com',
              phone: '+1234567892',
              totalSpending: 2100.75,
              audienceId: 'aud3',
              createdAt: '2024-01-05T00:00:00Z',
              updatedAt: '2024-01-05T00:00:00Z'
            },
            items: [
              { productName: 'Enterprise Solution', quantity: 1, price: 299.99 },
              { productName: 'Support Package', quantity: 1, price: 99.99 }
            ],
            total: 399.98,
            status: OrderStatus.PENDING,
            createdAt: '2024-01-22T10:00:00Z',
            updatedAt: '2024-01-22T10:00:00Z'
          }
        ]
    const filteredOrders = mockOrders.filter(order => {
          const matchesSearch = !searchTerm ||
            order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.includes(searchTerm)
          const matchesStatus = !statusFilter || order.status === statusFilter
          return matchesSearch && matchesStatus
        })
        setOrders(filteredOrders)
        setPagination({
          page: 1,
          limit: 10,
          total: filteredOrders.length,
          totalPages: Math.ceil(filteredOrders.length / 10)
        })
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line
  }, [pagination.page, debouncedSearchTerm, statusFilter, sortBy, sortOrder])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const resp = await apiClient.request({ method: 'patch', url: `/orders/${orderId}`, data: { status: newStatus } })
      const payload = resp.data as Record<string, unknown> | undefined
      if (resp.ok && payload?.['success'] === true) {
        setOrders(orders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus as Order['status'] }
            : order
        ))
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
    avgOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0,
    statusCounts: {
      PENDING: orders.filter(o => o.status === OrderStatus.PENDING).length,
      PROCESSING: orders.filter(o => o.status === OrderStatus.PROCESSING).length,
      COMPLETED: orders.filter(o => o.status === OrderStatus.COMPLETED).length,
      CANCELLED: orders.filter(o => o.status === OrderStatus.CANCELLED).length
    }
  }

  if (loading) {
    return <HomeLoading />
  }

  return (
    <div className="bg-background text-foreground min-h-screen px-4 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Orders
          </h1>
          <p className="text-sm text-slate-600 mt-1">Manage and track all customer orders.</p>
        </div>
        <Link
          href="/dashboard/orders/add"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"
        >
          <PencilIcon className="h-4 w-4" />
          Create Order
        </Link>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-3 border border-gray-100">
          <CurrencyDollarIcon className="h-6 w-6 text-green-500" />
          <div>
            <div className="text-xs font-medium uppercase text-gray-500 mb-1">Total Revenue</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-3 border border-gray-100">
          <CalendarIcon className="h-6 w-6 text-blue-500" />
          <div>
            <div className="text-xs font-medium uppercase text-gray-500 mb-1">Total Orders</div>
            <div className="text-lg font-bold text-gray-900">{stats.totalOrders}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-3 border border-gray-100">
          <CurrencyDollarIcon className="h-6 w-6 text-indigo-500" />
          <div>
            <div className="text-xs font-medium uppercase text-gray-500 mb-1">Avg. Order Value</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(stats.avgOrderValue)}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-3 border border-gray-100">
          <CheckCircleIcon className="h-6 w-6 text-green-500" />
          <div>
            <div className="text-xs font-medium uppercase text-gray-500 mb-1">Completed Orders</div>
            <div className="text-lg font-bold text-gray-900">{stats.statusCounts.COMPLETED}</div>
          </div>
        </div>
      </section>

      {/* Filtering */}
      <section className="bg-white shadow rounded-2xl px-6 py-4 mb-9">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-blue-400" />
            <input
              type="text"
              placeholder="Search by customer, email, or order ID"
              className="w-full rounded-full pl-10 pr-10 py-2 bg-slate-50 border border-blue-100 focus:border-blue-400 text-base"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                // Reset to page 1 when search term changes
                if (e.target.value !== searchTerm) {
                  setPagination(prev => ({ ...prev, page: 1 }))
                }
              }}
            />
            {searchLoading && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
              </div>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="rounded-xl bg-white border border-gray-200 focus:border-gray-300 px-4 py-2 text-base text-black shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={e => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field as typeof sortBy)
              setSortOrder(order as typeof sortOrder)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="rounded-xl bg-white border border-gray-200 focus:border-gray-300 px-4 py-2 text-base text-black shadow-sm"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="total-desc">Highest Value</option>
            <option value="total-asc">Lowest Value</option>
            <option value="customer-asc">Customer A-Z</option>
            <option value="customer-desc">Customer Z-A</option>
          </select>
        </div>
      </section>

      {/* Orders Table */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Orders List</h3>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-2 text-base font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter
                ? 'Try adjusting your search criteria.'
                : 'Get started by creating your first order.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {(useMocks ? filteredOrders : orders).map((order) => {
                    const status = statusConfig[order.status]
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 text-sm">
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap align-top">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium text-sm">
                              {getInitials(order.customer?.name)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{order.customer?.name || 'Unknown'}</div>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                                <span className="flex items-center gap-1"><EnvelopeIcon className="h-3 w-3" /> {order.customer?.email || 'No email'}</span>
                                {order.customer?.phone && <span className="flex items-center gap-1"><PhoneIcon className="h-3 w-3" /> {order.customer?.phone}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 font-medium">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.items.slice(0, 2).map(item => item.productName).join(', ')}
                            {order.items.length > 2 && ` +${order.items.length - 2} more`}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={e => handleStatusUpdate(order.id, e.target.value)}
                            className={`rounded-full px-3 py-1 font-medium ${status.color} border-0 focus:ring-2 focus:ring-blue-200 text-xs`}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-medium text-sm">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link
                              href={`/dashboard/orders/${order.id}`}
                              className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/dashboard/orders/${order.id}/edit`}
                              className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 transition-colors"
                              title="Edit Order"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {(useMocks ? filteredOrders : orders).length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        {debouncedSearchTerm || statusFilter ? (
                          <div>
                            <div className="text-lg font-medium mb-2">No orders found</div>
                            <div className="text-sm">
                              Try adjusting your search terms or filters
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-lg font-medium mb-2">No orders yet</div>
                            <div className="text-sm">
                              Orders will appear here once customers start placing them
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-5 flex justify-between border-t border-blue-50 bg-white">
                <span className="text-sm text-blue-500 font-semibold">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 rounded-full bg-slate-50 text-blue-500 hover:bg-blue-100 font-bold text-base transition disabled:opacity-40"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setPagination(prev => ({ ...prev, page }))}
                      className={`px-4 py-1 rounded-full font-bold transition text-base
                        ${page === pagination.page
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow'
                          : 'bg-slate-50 text-blue-500 hover:bg-blue-100'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 rounded-full bg-slate-50 text-blue-500 hover:bg-blue-100 font-bold text-base transition disabled:opacity-40"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
