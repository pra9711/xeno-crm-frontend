'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import useApi from '@/lib/useApi'
import { formatCurrency } from '@/lib/utils'
import type { Customer, Order } from '@/types'
import { OrderStatus } from '@/types'
import HomeLoading from '@/components/HomeLoading'

interface OrderItem {
  productName: string
  quantity: number
  price: number
}

interface OrderFormData {
  customerId: string
  items: OrderItem[]
  status: OrderStatus
  notes?: string
}

export default function EditOrderPage() {
  const params = useParams() || {}
  const orderId = (params as { id?: string }).id || ''
  const router = useRouter()
  const apiClient = useApi()
  // Use environment flag to enable deterministic local mocks for demos/tests
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'

  // Form state
  const [formData, setFormData] = useState<OrderFormData>({
    customerId: '',
    items: [{ productName: '', quantity: 1, price: 0 }],
    status: OrderStatus.PENDING,
    notes: ''
  })
  const [originalOrder, setOriginalOrder] = useState<Order | null>(null)

  // UI state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Load order and customers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch order
        const orderResponse = await apiClient.request<unknown>({ method: 'get', url: `/orders/${orderId}` })
        const orderPayload = orderResponse.data as Record<string, unknown> | undefined
        
        let order: Order | null = null
        if (orderResponse.ok && orderPayload?.['success'] === true) {
          order = orderPayload['data'] as Order
        } else {
          // Fallback: only use local mock when explicitly enabled for dev/tests.
          if (!useMocks) {
            console.warn('Order API returned no data and mocks are disabled.')
          } else {
            // Mock order for demonstration
          order = {
            id: orderId,
            customerId: 'cust1',
            customer: {
              id: 'cust1',
              name: 'John Doe',
              email: 'john@example.com',
              phone: '+1 (555) 123-4567',
              totalSpending: 1250.50,
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
          }
        }
        
        }

        if (order) {
          setOriginalOrder(order)
          setFormData({
            customerId: order.customerId,
            items: [...order.items],
            status: order.status,
            notes: ''
          })
          
          if (order.customer) {
            setSelectedCustomer(order.customer as Customer)
            setCustomerSearch(order.customer.name)
          }
        }

        // Fetch customers
        const customersResponse = await apiClient.request<unknown>({ method: 'get', url: '/customers' })
        const customersPayload = customersResponse.data as Record<string, unknown> | undefined
        if (customersResponse.ok && customersPayload?.['success'] === true) {
          const data = customersPayload['data'] as Record<string, unknown> | undefined
          setCustomers((data?.['customers'] as Customer[]) ?? [])
        } else {
          // Fallback: only use mocked customers when explicitly enabled for dev/tests.
          if (!useMocks) {
            console.warn('Customers API returned no data and mocks are disabled.')
          } else {
            // Mock customers for demonstration
          const mockCustomers: Customer[] = [
            {
              id: 'cust1',
              name: 'John Doe',
              email: 'john@example.com',
              phone: '+1234567890',
              totalSpending: 1250.50,
              visitCount: 15,
              createdAt: '2024-01-15T00:00:00Z',
              updatedAt: '2024-01-15T00:00:00Z'
            },
            {
              id: 'cust2',
              name: 'Jane Smith',
              email: 'jane@example.com',
              phone: '+1234567891',
              totalSpending: 850.25,
              visitCount: 8,
              createdAt: '2024-01-10T00:00:00Z',
              updatedAt: '2024-01-10T00:00:00Z'
            },
            {
              id: 'cust3',
              name: 'Bob Johnson',
              email: 'bob@example.com',
              phone: '+1234567892',
              totalSpending: 2100.75,
              visitCount: 22,
              createdAt: '2024-01-05T00:00:00Z',
              updatedAt: '2024-01-05T00:00:00Z'
            }
          ]
          setCustomers(mockCustomers)
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setNotification({ type: 'error', message: 'Failed to load order data' })
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchData()
    }
  }, [orderId, apiClient])

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearch.toLowerCase())
  )

  // Calculate total
  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData(prev => ({ ...prev, customerId: customer.id }))
    setCustomerSearch(customer.name)
    setShowCustomerDropdown(false)
    setErrors(prev => ({ ...prev, customerId: '' }))
  }

  // Handle item changes
  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData(prev => ({ ...prev, items: newItems }))
    
    // Clear item-specific errors
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[`item_${index}_${field}`]
      return newErrors
    })
  }

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: 1, price: 0 }]
    }))
  }

  // Remove item
  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Customer validation
    if (!formData.customerId) {
      newErrors.customerId = 'Please select a customer'
    }

    // Items validation
    formData.items.forEach((item, index) => {
      if (!item.productName.trim()) {
        newErrors[`item_${index}_productName`] = 'Product name is required'
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0'
      }
      if (item.price <= 0) {
        newErrors[`item_${index}_price`] = 'Price must be greater than 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setNotification({ type: 'error', message: 'Please fix the errors below' })
      return
    }

    setSaving(true)
    
    try {
      const orderData = {
        customerId: formData.customerId,
        items: formData.items,
        total: calculateTotal(),
        status: formData.status,
        notes: formData.notes
      }

      const response = await apiClient.request({
        method: 'put',
        url: `/orders/${orderId}`,
        data: orderData
      })

      const payload = response.data as Record<string, unknown> | undefined
      if (response.ok && payload?.['success'] === true) {
        setNotification({ type: 'success', message: 'Order updated successfully!' })
        setTimeout(() => {
          router.push(`/dashboard/orders/${orderId}`)
        }, 1500)
      } else {
        // For demo purposes, only simulate success when mocks are explicitly enabled
        if (useMocks) {
          setNotification({ type: 'success', message: 'Order updated successfully!' })
          setTimeout(() => {
            router.push(`/dashboard/orders/${orderId}`)
          }, 1500)
        } else {
          setNotification({ type: 'error', message: 'Failed to update order. Please try again.' })
        }
      }
    } catch (error) {
      console.error('Failed to update order:', error)
      setNotification({ type: 'error', message: 'Failed to update order. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <HomeLoading />
  }

  if (!originalOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Order not found</div>
          <Link 
            href="/dashboard/orders" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground min-h-screen px-4 lg:px-8 py-6">
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-100 border border-green-200 text-green-800' 
              : 'bg-red-100 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5" />
              )}
              {notification.message}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/orders/${orderId}`}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Order
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Edit Order #{orderId}
                </h1>
                <p className="text-gray-600 text-sm">Modify order details and items</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PencilIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Order Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Customer
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers by name or email..."
                  className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.customerId ? 'border-red-300' : 'border-gray-200'
                  }`}
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setShowCustomerDropdown(true)
                    if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                      setSelectedCustomer(null)
                      setFormData(prev => ({ ...prev, customerId: '' }))
                    }
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                />
                {errors.customerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
                )}
                
                {/* Customer Dropdown */}
                {showCustomerDropdown && customerSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => handleCustomerSelect(customer)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                              {customer.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-600">{customer.email}</div>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        No customers found
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Selected Customer Info */}
              {selectedCustomer && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold">
                      {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{selectedCustomer.name}</div>
                      <div className="text-sm text-gray-600">{selectedCustomer.email}</div>
                      <div className="text-sm text-green-600 font-medium">
                        Total Spending: {formatCurrency(selectedCustomer.totalSpending)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCartIcon className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={`${item.productName ?? 'form-item'}-${index}`} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Product Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter product name"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors[`item_${index}_productName`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={item.productName}
                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                      />
                      {errors[`item_${index}_productName`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_productName`]}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors[`item_${index}_quantity`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                      {errors[`item_${index}_quantity`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_quantity`]}</p>
                      )}
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors[`item_${index}_price`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        />
                        {errors[`item_${index}_price`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_price`]}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Item Total & Remove Button */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-semibold text-gray-900">
                      Item Total: {formatCurrency(item.quantity * item.price)}
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="flex items-center gap-1 px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                <span className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5" />
                  Order Total
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
                >
                  <option value={OrderStatus.PENDING}>Pending</option>
                  <option value={OrderStatus.PROCESSING}>Processing</option>
                  <option value={OrderStatus.COMPLETED}>Completed</option>
                  <option value={OrderStatus.CANCELLED}>Cancelled</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add any notes for this order..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/dashboard/orders/${orderId}`}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium text-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving Changes...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}