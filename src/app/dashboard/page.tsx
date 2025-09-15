'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  ShoppingCart, 
  DollarSign,
  Megaphone,
  TrendingUp,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// Table components not used on the dashboard overview - removed to avoid unused imports
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import QuickAction from '@/components/QuickAction'
import useApi from '@/lib/useApi'
import { getInitials } from '@/lib/utils'
import { statGradients, quickActionColors } from '@/lib/dashboardTheme'
import { useAuth } from '@/providers/AuthProvider'
import type { DashboardAnalytics } from '@/types'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease'
  icon: React.ComponentType<{ className?: string }>
  color?: 'indigo' | 'teal' | 'rose' | 'amber'
}

function StatCard({ title, value, change, changeType, icon: Icon, color = 'indigo' }: StatCardProps) {
  const colorMap = {
    indigo: { bg: 'bg-blue-500', icon: 'bg-blue-500' },
    teal: { bg: 'bg-cyan-500', icon: 'bg-cyan-500' },
    rose: { bg: 'bg-rose-500', icon: 'bg-rose-500' },
    amber: { bg: 'bg-amber-500', icon: 'bg-amber-500' }
  }
  const colors = colorMap[color] || colorMap.indigo
  
  return (
    <Card className="rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg ${colors.icon} flex items-center justify-center`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {change && (
            <div className="text-xs font-medium text-green-600 flex items-center">
              {typeof change === 'string' && /^[0-9]+$/.test(change) ? `+${change}%` : change}
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-xs text-gray-400">
            vs last month
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingCard() {
  return (
    <Card className="rounded-xl bg-white shadow-sm border border-gray-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse"></div>
          <div className="h-3 rounded w-10 bg-gray-200 animate-pulse"></div>
        </div>
        <div>
          <div className="h-3 rounded w-1/2 mb-2 bg-gray-200 animate-pulse"></div>
          <div className="h-6 rounded w-3/4 mb-1 bg-gray-200 animate-pulse"></div>
          <div className="h-2 rounded w-1/3 bg-gray-200 animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  // use shared helper `getInitials`
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const client = useApi()

  const router = useRouter()

  useEffect(() => {
    // Polling-based fetch: refresh analytics periodically so the dashboard
    // stays up-to-date without requiring a full page reload. Uses a 15s
    // interval which is a reasonable default for dashboards (configurable
    // later via env or user preference).
    let isMounted = true
    let intervalId: number | undefined

    const fetchAnalytics = async () => {
      try {
        // Only set loading on first load to avoid janky UI on subsequent polls.
        if (!analytics) setLoading(true)
        setError(null)
        const response = await client.request({ method: 'get', url: '/analytics/dashboard' })
        if (!isMounted) return
        if (response.ok && response.data) {
          const raw = response.data as unknown
          let data: unknown = raw
          if (typeof raw === 'object' && raw !== null && 'data' in raw) {
            data = (raw as { data: unknown }).data
          }
          setAnalytics(data as DashboardAnalytics)
        } else {
          setError(response.error || 'Failed to load dashboard data')
        }
      } catch (err) {
        if (!isMounted) return
        console.error('Dashboard fetch error:', err)
        setError('Failed to load dashboard data')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    // Initial fetch immediately, then poll every 15s. If you prefer server
    // push updates, later refactor to use WebSocket/SSE and update `analytics`.
    fetchAnalytics()
    intervalId = window.setInterval(fetchAnalytics, 15000)

    return () => {
      isMounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [client])

  // Keyboard shortcuts: C => Customers, N => New Campaign, A => Analytics
  useEffect(() => {
    // Named keyboard handler keeps effect concise and allows easier testing.
    const keyboardShortcuts = (e: KeyboardEvent) => {
      // Respect platform modifier keys to avoid hijacking common shortcuts.
      if (e.ctrlKey || e.metaKey) return
      const key = e.key.toLowerCase()
      switch (key) {
        case 'c':
          router.push('/dashboard/customers')
          break
        case 'n':
          router.push('/dashboard/campaigns/new')
          break
        case 'a':
          router.push('/dashboard/analytics')
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', keyboardShortcuts)
    return () => window.removeEventListener('keydown', keyboardShortcuts)
  }, [router])

  const stats = analytics ? [
    {
      title: 'Total Customers',
      value: analytics.summary.totalCustomers,
      change: '12%',
      changeType: 'increase' as const,
      icon: Users,
    },
    {
      title: 'Total Orders',
      value: analytics.summary.totalOrders,
      change: '8%',
      changeType: 'increase' as const,
      icon: ShoppingCart,
    },
    {
      title: 'Revenue',
      value: `$${analytics.summary.totalRevenue.toLocaleString()}`,
      change: '23%',
      changeType: 'increase' as const,
      icon: DollarSign,
    },
    {
      title: 'Active Campaigns',
      value: analytics.summary.activeCampaigns,
      change: '2',
      changeType: 'increase' as const,
      icon: Megaphone,
    },
  ] : []

  if (error) {
    return (
      <div className="bg-background text-foreground min-h-screen space-y-6">
        <div className="text-center py-12">
          <div className="mb-4 text-muted-foreground">{error}</div>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Try Again
          </Button>
          <div className="text-sm mt-4 text-muted-foreground">Contact support if data does not load.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground min-h-screen px-4 lg:px-8 py-6 space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor your CRM performance and metrics</p>
        </div>
        <div />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <LoadingCard key={`loading-card-${i}`} />)
        ) : (
          [
            { ...stats[0], color: 'indigo' as const },
            { ...stats[1], color: 'teal' as const },
            { ...stats[2], color: 'rose' as const },
            { ...stats[3], color: 'amber' as const }
          ].map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeType={stat.changeType}
              icon={stat.icon}
              color={stat.color}
            />
          ))
        )}
      </div>

      {/* Communication Overview */}
      <Card className="rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-900 text-lg">
            <div className="text-slate-500">
              <Megaphone className="h-4 w-4" />
            </div>
            Communication Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {analytics ? (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-slate-500">Total Messages Sent</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">
                  {analytics.campaignStats.totalMessages.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Delivered</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">
                  {analytics.campaignStats.deliveredMessages.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Delivery Rate</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">
                  {analytics.campaignStats.deliveryRate.toFixed(1)}%
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-center py-3 text-slate-500 text-sm">No campaign stats available</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {analytics?.recentActivity?.orders && analytics.recentActivity.orders.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {analytics.recentActivity.orders.slice(0, 4).map((transaction, index) => (
                  <div key={transaction.id} className="p-4 hover:bg-gray-50/50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Avatar className="h-8 w-8 border border-white shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white font-medium text-xs">
                              {getInitials(transaction.customer?.name || 'Unknown')}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transaction.customer?.name || 'Unknown Customer'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            ${transaction.total.toFixed(2)}
                          </p>
                        </div>
                        <Badge 
                          variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}
                          className={`px-2 py-0.5 text-xs font-medium rounded-md ${
                            transaction.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <ShoppingCart className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No recent transactions</p>
                <p className="text-xs text-gray-400 mt-1">Transactions will appear here once you start processing orders</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Customers */}
        <Card className="rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Top Customers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {analytics?.topCustomers && analytics.topCustomers.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {analytics.topCustomers.slice(0, 4).map((customer, index) => (
                  <div key={customer.id} className="p-4 hover:bg-gray-50/50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Avatar className="h-8 w-8 border border-white shadow-sm">
                            <AvatarFallback 
                              className={`text-white font-medium text-xs ${
                                index === 0 ? 'bg-gradient-to-br from-purple-500 to-purple-700' :
                                index === 1 ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                                index === 2 ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
                                'bg-gradient-to-br from-orange-500 to-orange-700'
                              }`}
                            >
                              {getInitials(customer.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {customer.name}
                            </p>
                            {index < 3 && (
                              <div className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                index === 1 ? 'bg-gray-100 text-gray-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          ${customer.totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer.visitCount} {customer.visitCount === 1 ? 'order' : 'orders'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No customers yet</p>
                <p className="text-xs text-gray-400 mt-1">Your customer list will appear here as you add them</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-900 text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
            <QuickAction onClick={() => router.push('/dashboard/customers')} icon={Users} label="Customers" />
            <QuickAction onClick={() => router.push('/dashboard/campaigns/new')} icon={Megaphone} label="Campaigns" />
            <QuickAction onClick={() => router.push('/dashboard/analytics')} icon={Eye} label="Analytics" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}