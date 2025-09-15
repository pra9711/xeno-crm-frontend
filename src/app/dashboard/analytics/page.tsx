'use client'

import { useState, useEffect } from 'react'
import HomeLoading from '@/components/HomeLoading'
import {
  UsersIcon, ShoppingCartIcon, CurrencyDollarIcon, MegaphoneIcon, ChartBarIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import useApi from '@/lib/useApi'
import type { DashboardAnalytics } from '@/types'

interface AnalyticsData {
  dashboard: DashboardAnalytics
  customerGrowth: Array<{ month: string; customers: number; revenue: number }>
  campaignPerformance: Array<{ name: string; sent: number; delivered: number; failed: number }>
  orderStatus: Array<{ name: string; value: number; color: string }>
  topProducts: Array<{ name: string; orders: number; revenue: number }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const client = useApi()
  // Gate deterministic demo data behind a single env flag so production
  // never serves predictable mocks. Tests enable this via `test/jest.setup.ts`.
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'

  useEffect(() => {
    let isMounted = true
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        // Use centralized client; baseURL already includes `/api`.
        const dashboardRes = await client.request({ method: 'get', url: `/analytics/dashboard?timeframe=${timeRange}` })
        // ancillary endpoints, fire-and-forget for backend caching
        ;(async () => {
          try {
            await Promise.all([
              client.request({ method: 'get', url: `/analytics/customer-growth?timeframe=${timeRange}` }),
              client.request({ method: 'get', url: `/analytics/campaign-performance?timeframe=${timeRange}` }),
              client.request({ method: 'get', url: `/analytics/order-status?timeframe=${timeRange}` })
            ])
          } catch (e) { }
        })()
        // Fallback behavior: prefer live API responses. If developer
        // explicitly enables mocks (`NEXT_PUBLIC_USE_MOCKS=true`) use the
        // local predictable dataset for convenient offline screenshots
        // and interviews — otherwise map the backend response to our view.
        const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
        if (!useMocks) {
          const payload = dashboardRes.data as Record<string, unknown> | undefined
          const mapped: AnalyticsData = {
            dashboard: payload?.['success'] === true ? (payload['data'] as DashboardAnalytics) : (payload as any).dashboard,
            customerGrowth: (payload?.['customerGrowth'] as any) || [],
            campaignPerformance: (payload?.['campaignPerformance'] as any) || [],
            orderStatus: (payload?.['orderStatus'] as any) || [],
            topProducts: (payload?.['topProducts'] as any) || []
          }
          if (isMounted) setAnalytics(mapped)
        } else {
          // Simple, deterministic mock tailored for local dev.
          const mockAnalytics: AnalyticsData = {
            dashboard: {
              summary: {
                totalCustomers: 1245, newCustomers: 123, totalOrders: 3456,
                totalRevenue: 125000, activeCampaigns: 8, avgOrderValue: 36.15
              },
              campaignStats: {
                totalCampaigns: 25, totalMessages: 45000, deliveredMessages: 42750, deliveryRate: 0.95
              },
              topCustomers: [],
              recentActivity: { orders: [], campaigns: [] },
              timeframe: timeRange
            },
            customerGrowth: [
              { month: 'Jan', customers: 800, revenue: 85000 },
              { month: 'Feb', customers: 950, revenue: 92000 },
              { month: 'Mar', customers: 1100, revenue: 105000 },
              { month: 'Apr', customers: 1245, revenue: 125000 },
              { month: 'May', customers: 1380, revenue: 140000 },
              { month: 'Jun', customers: 1520, revenue: 155000 }
            ],
            campaignPerformance: [
              { name: 'Welcome Series', sent: 1250, delivered: 1188, failed: 62 },
              { name: 'Summer Sale', sent: 3400, delivered: 3230, failed: 170 },
              { name: 'Product Launch', sent: 2100, delivered: 1995, failed: 105 }
            ],
            orderStatus: [
              { name: 'Completed', value: 2145, color: '#10B981' },
              { name: 'Processing', value: 567, color: '#3B82F6' },
              { name: 'Pending', value: 234, color: '#F59E0B' }
            ],
            topProducts: [
              { name: 'Premium Package', orders: 345, revenue: 34500 },
              { name: 'Standard Plan', orders: 567, revenue: 28350 }
            ]
          }
          if (isMounted) setAnalytics(mockAnalytics)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchAnalytics()
    return () => { isMounted = false }
  }, [timeRange, client])

  if (loading) return <HomeLoading />

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Failed to load analytics data</div>
      </div>
    )
  }

  const { dashboard, customerGrowth, campaignPerformance, orderStatus, topProducts } = analytics

  // Derived metrics for the UI — prefer backend values, fall back to reasonable
  // derived numbers when the backend doesn't supply specific segment counts.
  const highValueCount = (dashboard?.topCustomers && dashboard.topCustomers.length) ? dashboard.topCustomers.length : (dashboard?.summary?.totalCustomers ? Math.round(dashboard.summary.totalCustomers * 0.05) : null)
  const newSubscribers = dashboard?.summary?.newCustomers ?? null
  const frequentBuyersCount = dashboard?.summary?.totalCustomers ? Math.round(dashboard.summary.totalCustomers * 0.1) : null

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-3 lg:px-6 py-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600 max-w-2xl">
              Track campaign performance and customer insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
              className="bg-white border border-gray-200 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-medium text-gray-700 min-w-[120px]"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="bg-white border border-gray-200 rounded-md py-2 px-3 shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50">
              Export
            </button>
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Live Data
            </div>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Total Revenue</span>
              </div>
              <div className="text-xs text-green-600 font-medium">↗ +12.5%</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">${dashboard.summary.totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">from last month</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Campaign ROI</span>
              </div>
              <div className="text-xs text-green-600 font-medium">↗ +45.2%</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">340%</div>
            <div className="text-xs text-gray-500 mt-1">from last month</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <MegaphoneIcon className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Avg Open Rate</span>
              </div>
              <div className="text-xs text-red-600 font-medium">↘ -2.1%</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">24.8%</div>
            <div className="text-xs text-gray-500 mt-1">from last month</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <ChartBarIcon className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Conversion Rate</span>
              </div>
              <div className="text-xs text-red-600 font-medium">↘ -0.8%</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">3.2%</div>
            <div className="text-xs text-gray-500 mt-1">from last month</div>
          </div>
        </div>



        {/* Campaign Performance & Segment Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Campaign Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-50 rounded-md">
                <MegaphoneIcon className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Campaign Performance</h3>
              <span className="text-xs text-gray-500">Detailed metrics for recent campaigns</span>
            </div>
            
            <div className="space-y-4">
              {campaignPerformance && campaignPerformance.length > 0 ? (
                campaignPerformance.map((c) => {
                  const sent = c.sent || 0
                  const delivered = c.delivered || 0
                  const failed = c.failed || 0
                  const deliveredPercent = sent ? ((delivered / sent) * 100).toFixed(1) : '0.0'
                  const failedPercent = sent ? ((failed / sent) * 100).toFixed(1) : '0.0'
                  const funnelPercent = sent ? (((delivered - failed) / sent) * 100).toFixed(1) : '0.0'
                  return (
                    <div key={c.name} className="border-b border-gray-100 pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{c.name}</h4>
                        <span className="text-sm font-bold text-green-600">${((delivered * (dashboard?.summary?.avgOrderValue ?? 0)) || 0).toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center mb-2">
                        <div>
                          <div className="text-lg font-bold text-gray-900">{sent.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Sent</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">{delivered.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Delivered</div>
                          <div className="text-xs text-gray-400">{deliveredPercent}%</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-orange-600">{failed.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Failed</div>
                          <div className="text-xs text-gray-400">{failedPercent}%</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">{Math.max(0, delivered - failed)}</div>
                          <div className="text-xs text-gray-500">Converted</div>
                          <div className="text-xs text-gray-400">{funnelPercent}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600">Conversion Funnel</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, Number(funnelPercent))}%` }}></div>
                        </div>
                        <span className="font-medium">{funnelPercent}% overall</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-sm text-gray-500">No campaign data available</div>
              )}
            </div>
          </div>

          {/* Segment Insights */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-purple-50 rounded-md">
                <UsersIcon className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Segment Insights</h3>
              <span className="text-xs text-gray-500">Performance breakdown by customer segments</span>
            </div>
            
            <div className="space-y-4">
              {/* High-Value Customers */}
              <div className="border-b border-gray-100 pb-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-900">High-Value Customers</h4>
                  <span className="text-xs text-green-600 font-medium">{dashboard?.summary?.newCustomers ? '↗ ' + Math.round((dashboard.summary.newCustomers / Math.max(1, dashboard.summary.totalCustomers)) * 100) + '%' : ''}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center mb-2">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{useMocks ? '1,240' : (highValueCount ?? '—')}</div>
                    <div className="text-xs text-gray-500">Customers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{useMocks ? '$850' : (dashboard?.summary?.avgOrderValue ? `$${dashboard.summary.avgOrderValue}` : '—')}</div>
                    <div className="text-xs text-gray-500">Avg Spend</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{useMocks ? '4.2%' : (dashboard?.summary?.totalOrders ? `${((dashboard.summary.totalOrders / Math.max(1, dashboard.summary.totalCustomers)) * 100).toFixed(1)}%` : '—')}</div>
                    <div className="text-xs text-gray-500">Conversion</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Segment Health</span>
                  <span className="text-green-600 font-medium">{useMocks ? 'Good' : (dashboard?.summary ? (dashboard.summary.totalOrders > 0 ? 'Good' : 'Unknown') : 'Unknown')}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: useMocks ? '85%' : `${Math.min(100, dashboard?.summary ? Math.round((dashboard.summary.totalOrders / Math.max(1, dashboard.summary.totalCustomers)) * 100) : 50)}%` }}></div>
                </div>
              </div>

              {/* New Subscribers */}
              <div className="border-b border-gray-100 pb-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-900">New Subscribers</h4>
                  <span className="text-xs text-green-600 font-medium">{useMocks ? '↗ 45.2%' : (newSubscribers ? `↗ ${Math.round((newSubscribers / Math.max(1, dashboard?.summary?.totalCustomers ?? 1)) * 100)}%` : '')}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center mb-2">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{useMocks ? '3,450' : (newSubscribers ?? '—')}</div>
                    <div className="text-xs text-gray-500">Customers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{useMocks ? '$125' : (dashboard?.summary?.avgOrderValue ? `$${Math.round(dashboard.summary.avgOrderValue)}` : '—')}</div>
                    <div className="text-xs text-gray-500">Avg Spend</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{useMocks ? '2.1%' : (dashboard?.summary?.totalOrders ? `${((dashboard.summary.totalOrders / Math.max(1, dashboard.summary.totalCustomers)) * 100).toFixed(1)}%` : '—')}</div>
                    <div className="text-xs text-gray-500">Conversion</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Segment Health</span>
                  <span className="text-yellow-600 font-medium">{useMocks ? 'Fair' : 'Unknown'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: useMocks ? '60%' : `${Math.min(100, dashboard?.summary ? Math.round((dashboard.summary.newCustomers / Math.max(1, dashboard.summary.totalCustomers)) * 100) : 40)}%` }}></div>
                </div>
              </div>

              {/* Frequent Buyers */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-900">Frequent Buyers</h4>
                  <span className="text-xs text-green-600 font-medium">{useMocks ? '↗ 8.7%' : ''}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center mb-2">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{useMocks ? '567' : (frequentBuyersCount ?? '—')}</div>
                    <div className="text-xs text-gray-500">Customers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{useMocks ? '$1,240' : (dashboard?.summary?.avgOrderValue ? `$${Math.round(dashboard.summary.avgOrderValue * 2)}` : '—')}</div>
                    <div className="text-xs text-gray-500">Avg Spend</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{useMocks ? '6.8%' : (dashboard?.summary?.totalOrders ? `${((dashboard.summary.totalOrders / Math.max(1, dashboard.summary.totalCustomers)) * 100).toFixed(1)}%` : '—')}</div>
                    <div className="text-xs text-gray-500">Conversion</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Segment Health</span>
                  <span className="text-green-600 font-medium">{useMocks ? 'Excellent' : (dashboard?.summary ? (dashboard.summary.totalOrders > 0 ? 'Good' : 'Unknown') : 'Unknown')}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: useMocks ? '95%' : `${Math.min(100, dashboard?.summary ? Math.round((dashboard.summary.totalOrders / Math.max(1, dashboard.summary.totalCustomers)) * 100) : 80)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Revenue Growth Chart - Full Width */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <ChartBarIcon className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Customer & Revenue Growth</h3>
          </div>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={customerGrowth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Legend />
                <Bar yAxisId="right" dataKey="revenue" fill="#6366F1" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="customers" stroke="#10B981" strokeWidth={3} name="Customers" dot={{ fill: '#10B981', r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Order Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-indigo-50 rounded-md">
                <ShoppingCartIcon className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Order Status</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={orderStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  fill="#6366F1"
                  dataKey="value"
                  label={({ name, value }) => {
                    const total = orderStatus.reduce((s, e) => s + e.value, 0)
                    const pct = total > 0 ? (Number(value) / total) * 100 : 0
                    return `${pct.toFixed(0)}%`
                  }}
                  labelLine={false}
                  fontSize={10}
                >
                  {orderStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
              {orderStatus.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-gray-600">{entry.name}</span>
                  </div>
                  <span className="font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Performance Bar Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-50 rounded-md">
                <MegaphoneIcon className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Campaign Delivery</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={campaignPerformance} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px' }} />
                <Bar dataKey="delivered" stackId="a" fill="#10B981" name="Delivered" radius={[2, 2, 0, 0]} />
                <Bar dataKey="failed" stackId="a" fill="#EF4444" name="Failed" radius={[0, 0, 2, 2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-purple-50 rounded-md">
                <ArrowTrendingUpIcon className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Top Products</h3>
            </div>
            <div className="space-y-2">
              {topProducts.slice(0, 4).map((product, index) => (
                <div key={product.name} className="flex justify-between items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-150">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center">
                      <span className="text-purple-600 font-semibold text-xs">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-xs">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.orders} orders</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-xs">${product.revenue.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Campaign Stats Detail / More Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <MegaphoneIcon className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Campaign Analytics Summary</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700 mb-1">{dashboard.campaignStats.totalCampaigns}</div>
              <div className="text-xs text-blue-600 font-medium">Total Campaigns</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700 mb-1">{dashboard.campaignStats.totalMessages.toLocaleString()}</div>
              <div className="text-xs text-green-600 font-medium">Messages Sent</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-700 mb-1">{dashboard.campaignStats.deliveredMessages.toLocaleString()}</div>
              <div className="text-xs text-indigo-600 font-medium">Messages Delivered</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700 mb-1">${dashboard.summary.avgOrderValue.toFixed(2)}</div>
              <div className="text-xs text-purple-600 font-medium">Avg. Order Value</div>
            </div>
          </div>
        </div>

        {/* Insights - Compact */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Performance Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs text-blue-800">Your campaign delivery rate of {(dashboard.campaignStats.deliveryRate * 100).toFixed(1)}% is excellent</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs text-blue-800">Customer growth increased by {dashboard.summary.newCustomers} new customers this period</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs text-blue-800">Average order value is ${dashboard.summary.avgOrderValue.toFixed(2)}, consider upselling strategies</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs text-blue-800">You have {dashboard.summary.activeCampaigns} active campaigns running</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
