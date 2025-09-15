'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PrinterIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TruckIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import useApi from '@/lib/useApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import type { Order } from '@/types'
import { OrderStatus } from '@/types'
import HomeLoading from '@/components/HomeLoading'

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ComponentType<Record<string, unknown>> }> = {
  PENDING: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: ClockIcon
  },
  PROCESSING: { 
    label: 'Processing', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: TruckIcon
  },
  COMPLETED: { 
    label: 'Completed', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircleIcon
  },
  CANCELLED: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircleIcon
  }
}

export default function OrderDetailPage() {
  const params = useParams() || {}
  const orderId = (params as { id?: string }).id || ''
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const client = useApi()
  // Use environment flag to enable deterministic local mocks for demos/tests
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'

  // use shared getInitials from utils

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await client.request({ method: 'get', url: `/orders/${orderId}` })

        const payload = response.data as Record<string, unknown> | undefined
        if (response.ok && payload?.['success'] === true) {
          setOrder(payload['data'] as Order)
        } else {
          // Fallback: only use local mock when explicitly enabled for dev/tests.
          if (!useMocks) {
            console.warn('Order API returned no data and mocks are disabled.')
          } else {
            const mockOrder: Order = {
              id: orderId,
              customerId: 'cust1',
              customer: {
                id: 'cust1',
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1 (555) 123-4567',
                totalSpending: 1250.5,
                audienceId: 'aud1',
                createdAt: '2024-01-15T00:00:00Z',
                updatedAt: '2024-01-15T00:00:00Z'
              },
              items: [
                { productName: 'Premium Package', quantity: 1, price: 99.99 },
                { productName: 'Additional Service', quantity: 2, price: 25.0 },
                { productName: 'Support Package', quantity: 1, price: 49.99 }
              ],
              total: 199.98,
              status: OrderStatus.COMPLETED,
              createdAt: '2024-01-20T10:00:00Z',
              updatedAt: '2024-01-22T15:30:00Z'
            }
            setOrder(mockOrder)
          }
        }
      } catch (error) {
        console.error('Failed to fetch order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, client])

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return
    
    try {
      setUpdating(true)
  const resp = await client.request({ method: 'patch', url: `/orders/${orderId}`, data: { status: newStatus } })
      const payload = resp.data as Record<string, unknown> | undefined
      if (resp.ok && payload?.['success'] === true) {
        setOrder({ ...order, status: newStatus })
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return <HomeLoading />
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 text-center py-12">
        <div className="text-gray-500">Order not found</div>
        <Link href="/dashboard/orders" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          ← Back to Orders
        </Link>
      </div>
    )
  }

  const statusInfo = statusConfig[order.status]
  const StatusIcon = statusInfo.icon

  return (
    <div className="bg-background text-foreground min-h-screen px-4 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start space-x-4">
              <Link
                href="/dashboard/orders"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Orders
              </Link>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Order #{order.id}
                  </h1>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}>
                    <StatusIcon className="h-4 w-4 mr-2" />
                    {statusInfo.label}
                  </div>
                </div>
                <p className="text-gray-600 flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4" />
                  Created on {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print
              </button>
              <Link
                href={`/dashboard/orders/${order.id}/edit`}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Order
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />
                  Order Items
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={`${item.productName ?? 'item'}-${index}`} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">{item.productName}</h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(item.price)} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                    <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-gray-600" />
                  Order Timeline
                </h3>
              </div>
              <div className="p-4">
                <div className="flow-root">
                  <ul className="-mb-8">
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-300" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center ring-4 ring-white shadow-sm">
                              <CalendarIcon className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Order created</p>
                              <p className="text-sm text-gray-600">Order was successfully placed</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap">
                              <div className="text-gray-900 font-medium">{formatDate(order.createdAt)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                    {order.status !== OrderStatus.PENDING && (
                      <li>
                        <div className="relative pb-8">
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-300" aria-hidden="true"></span>
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center ring-4 ring-white shadow-sm">
                                <TruckIcon className="h-4 w-4 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">Order processing started</p>
                                <p className="text-sm text-gray-600">Order moved to processing queue</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap">
                                <div className="text-gray-900 font-medium">{formatDate(order.updatedAt)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    )}
                    {order.status === OrderStatus.COMPLETED && (
                      <li>
                        <div className="relative">
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center ring-4 ring-white shadow-sm">
                                <CheckCircleIcon className="h-4 w-4 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">Order completed</p>
                                <p className="text-sm text-gray-600">Order successfully fulfilled</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap">
                                <div className="text-gray-900 font-medium">{formatDate(order.updatedAt)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <StatusIcon className="h-5 w-5 text-gray-600" />
                  Order Status
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold border-2 ${statusInfo.color}`}>
                  <StatusIcon className="h-4 w-4 mr-2" />
                  {statusInfo.label}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Update Status
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(e.target.value as OrderStatus)}
                    disabled={updating}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
                  >
                    {(Object.values(OrderStatus) as OrderStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {statusConfig[status].label}
                        </option>
                      ))}
                  </select>
                  {updating && (
                    <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Updating...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  Customer Information
                </h3>
              </div>
              <div className="p-4">
                {order.customer ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {getInitials(order.customer?.name)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold text-gray-900 truncate">{order.customer.name}</div>
                        <Link href={`/dashboard/customers/${order.customer.id}`} className="text-sm text-blue-600 hover:text-blue-700 truncate inline-flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          View Customer Profile
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <EnvelopeIcon className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Email</div>
                          <div className="text-sm font-medium text-gray-900 truncate">{order.customer.email}</div>
                        </div>
                      </div>
                      {order.customer.phone && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <PhoneIcon className="h-4 w-4 text-gray-600" />
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Phone</div>
                            <div className="text-sm font-medium text-gray-900 truncate">{order.customer.phone}</div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="text-xs text-green-700 uppercase tracking-wide font-medium">Total Spending</div>
                          <div className="text-base font-bold text-green-700">{formatCurrency(order.customer.totalSpending)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <UserIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <div className="text-sm text-gray-500">No customer information available</div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-gray-600" />
                  Order Summary
                </h3>
              </div>
              <div className="p-4">
                <dl className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-600">Order ID</dt>
                    <dd className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded-md shadow-sm">#{order.id}</dd>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-600">Items</dt>
                    <dd className="text-sm font-bold text-gray-900">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</dd>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-600">Created</dt>
                    <dd className="text-sm font-semibold text-gray-900">{formatDate(order.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-600">Last Updated</dt>
                    <dd className="text-sm font-semibold text-gray-900">{formatDate(order.updatedAt)}</dd>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <dt className="text-base font-bold text-gray-900">Total</dt>
                    <dd className="text-xl font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
