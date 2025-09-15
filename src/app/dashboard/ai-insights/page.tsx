'use client'

import { useState, useEffect } from 'react'
import HomeLoading from '@/components/HomeLoading'
import {
  SparklesIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  MegaphoneIcon,
  ClockIcon,
  FireIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import {
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import useApi from '@/lib/useApi'
import { panelGradient } from '@/lib/dashboardTheme'
import { formatCurrency, formatDate, capitalize } from '@/lib/utils'

interface AIInsight {
  id: string
  type: 'opportunity' | 'warning' | 'recommendation' | 'trend'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
  category: string
  createdAt: string
}

interface CustomerScore {
  customerId: string
  customerName: string
  score: number
  factors: {
    engagement: number
    spending: number
    frequency: number
    recency: number
  }
  risk: 'high' | 'medium' | 'low'
  recommendations: string[]
}

interface PredictiveAnalytics {
  churnPrediction: {
    highRisk: number
    mediumRisk: number
    lowRisk: number
  }
  revenueForecasts: Array<{
    month: string
    predicted: number
    confidence: number
  }>
  campaignOptimization: {
    bestTimes: string[]
    optimalFrequency: number
    topPerformingChannels: string[]
  }
}

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [customerScores, setCustomerScores] = useState<CustomerScore[]>([])
  const [predictiveAnalytics, setPredictiveAnalytics] = useState<PredictiveAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [justUpdated, setJustUpdated] = useState(false)
  const client = useApi()

  useEffect(() => {
    const fetchAIInsights = async () => {
      if (!insights.length) setLoading(true)

      // Allow dev-only mock via env var. In production we call the backend.
  // Use backend analytics in production. Local mocks exist for offline
  // demos and interviews and are enabled only with NEXT_PUBLIC_USE_MOCKS.
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'

      try {
        if (!useMocks) {
          // The frontend `api` baseURL already contains `/api` (see `src/lib/api.ts`),
          // so call the backend router path without duplicating `/api`.
          const resp = await client.request<{ success: boolean; data: any }>({ method: 'get', url: '/analytics/dashboard', params: { timeframe: '30d' } })
          if (resp.ok && resp.data) {
            const d = resp.data.data || resp.data
            // Defensive mapping: backend returns a dashboard analytics shape.
            const newInsights = (d?.insights as AIInsight[]) || []
            const newCustomerScores = (d?.topCustomers as CustomerScore[]) || []
            const newPredictive = (d?.predictiveAnalytics as PredictiveAnalytics) || null

            // Update states only once and trigger the 'Updated' indicator when
            // the insights materially change (helps during interviews to show
            // thoughtful UX behavior instead of always pulsing on every poll).
            setInsights((prev) => {
              try {
                const changed = JSON.stringify(prev || []) !== JSON.stringify(newInsights || [])
                if (changed) {
                  setJustUpdated(true)
                  setTimeout(() => setJustUpdated(false), 900)
                }
              } catch (e) {
                // Fallback: if deep compare fails, optimistically mark updated.
                setJustUpdated(true)
                setTimeout(() => setJustUpdated(false), 900)
              }
              return newInsights
            })
            setCustomerScores(newCustomerScores)
            setPredictiveAnalytics(newPredictive)
            setLoading(false)
          } else {
            throw new Error(resp.error || 'Failed to fetch analytics')
          }
        } else {
          // Keep a small, predictable mock for local dev when backend isn't reachable
          const mockInsights: AIInsight[] = [
            { id: '1', type: 'opportunity', title: 'High-Value Customer Segment Identified', description: 'A group of 45 customers shows 80% higher lifetime value potential. Consider creating a premium tier.', impact: 'high', actionable: true, category: 'customer', createdAt: '2024-01-22T10:00:00Z' },
            { id: '2', type: 'warning', title: 'Campaign Fatigue Detected', description: 'Email open rates have declined 15% in the last 30 days. Reduce frequency or diversify content.', impact: 'medium', actionable: true, category: 'campaign', createdAt: '2024-01-22T09:30:00Z' },
            { id: '3', type: 'trend', title: 'Mobile Engagement Surge', description: 'Mobile interactions increased 45% this quarter. Optimize campaigns for mobile-first experience.', impact: 'high', actionable: true, category: 'campaign', createdAt: '2024-01-22T09:00:00Z' }
          ]
          const mockCustomerScores: CustomerScore[] = [
            { customerId: '1', customerName: 'John Doe', score: 85, factors: { engagement: 90, spending: 85, frequency: 80, recency: 85 }, risk: 'low', recommendations: ['Upsell premium services', 'Invite to loyalty program'] },
            { customerId: '2', customerName: 'Jane Smith', score: 45, factors: { engagement: 40, spending: 60, frequency: 30, recency: 50 }, risk: 'high', recommendations: ['Send re-engagement campaign', 'Offer discount incentive'] }
          ]
          const mockPredictive: PredictiveAnalytics = {
            churnPrediction: { highRisk: 12, mediumRisk: 28, lowRisk: 160 },
            revenueForecasts: [
              { month: 'Feb', predicted: 145000, confidence: 85 },
              { month: 'Mar', predicted: 152000, confidence: 82 },
              { month: 'Apr', predicted: 158000, confidence: 79 }
            ],
            campaignOptimization: {
              bestTimes: ['Tuesday 2PM', 'Thursday 10AM'],
              optimalFrequency: 2.5,
              topPerformingChannels: ['Email', 'SMS']
            }
          }

          // Local dev: predictable mock data only when explicitly enabled.
          setInsights(mockInsights)
          setCustomerScores(mockCustomerScores)
          setPredictiveAnalytics(mockPredictive)
          setLoading(false)
        }
        // NOTE: 'justUpdated' is set above when insights change. Avoids
        // flashing the indicator on every successful poll.
      } catch (err) {
        console.warn('Failed to load AI insights from API, falling back to dev mock:', err)
        if (process.env.NODE_ENV !== 'production') {
          setInsights([])
          setCustomerScores([])
          setPredictiveAnalytics(null)
          setLoading(false)
        } else {
          setLoading(false)
        }
      }
    }

    // Initial fetch
    fetchAIInsights()

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(fetchAIInsights, 30000)

    // Cleanup on unmount
    return () => clearInterval(interval)
  }, [client])

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return ArrowTrendingUpIcon
      case 'warning': return ExclamationTriangleIcon
      case 'recommendation': return LightBulbIcon
      case 'trend': return ChartBarIcon
      default: return SparklesIcon
    }
  }
  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return 'bg-green-50 border-green-200 text-green-800'
      case 'warning': return 'bg-red-50 border-red-200 text-red-800'
      case 'recommendation': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'trend': return 'bg-purple-50 border-purple-200 text-purple-800'
      default: return 'bg-background border-gray-200 text-gray-800'
    }
  }
  const getImpactBadge = (impact: AIInsight['impact']) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
    }
  }
  const getRiskColor = (risk: CustomerScore['risk']) => {
    switch (risk) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
    }
  }
  const filteredInsights = insights.filter(insight =>
    selectedCategory === 'all' || insight.category === selectedCategory
  )
  if (loading) return <HomeLoading />

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center text-blue-900 gap-2">
            <SparklesIcon className="h-7 w-7 text-indigo-600" />
            AI Insights
            {justUpdated && (
              <div className="flex items-center ml-2">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 ml-1">Updated</span>
              </div>
            )}
          </h1>
          <p className="text-base text-gray-500 mt-1">AI-powered analytics and recommendations for your CRM</p>
        </div>
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-base shadow-sm hover:border-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 text-gray-800"
          >
            <option value="all">All Categories</option>
            <option value="customer">Customer</option>
            <option value="campaign">Campaign</option>
            <option value="revenue">Revenue</option>
            <option value="retention">Retention</option>
          </select>
        </div>
      </div>
      {/* Stats */}
      {predictiveAnalytics && (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-xl rounded-2xl p-6 flex items-center gap-4 border border-gray-100">
            <FireIcon className="h-8 w-8 text-red-400" />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">High Churn Risk</div>
              <div className="text-2xl font-extrabold text-blue-900">{predictiveAnalytics.churnPrediction.highRisk}</div>
            </div>
          </div>
          <div className="bg-white shadow-xl rounded-2xl p-6 flex items-center gap-4 border border-gray-100">
            <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Revenue Forecast</div>
              <div className="text-2xl font-extrabold text-blue-900">{formatCurrency(predictiveAnalytics.revenueForecasts[0]?.predicted || 0)}</div>
            </div>
          </div>
          <div className="bg-white shadow-xl rounded-2xl p-6 flex items-center gap-4 border border-gray-100">
            <ClockIcon className="h-8 w-8 text-blue-400" />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Optimal Frequency</div>
              <div className="text-2xl font-extrabold text-blue-900">{predictiveAnalytics.campaignOptimization.optimalFrequency}/week</div>
            </div>
          </div>
          <div className="bg-white shadow-xl rounded-2xl p-6 flex items-center gap-4 border border-gray-100">
            <ShieldCheckIcon className="h-8 w-8 text-indigo-400" />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Low Risk Customers</div>
              <div className="text-2xl font-extrabold text-blue-900">{predictiveAnalytics.churnPrediction.lowRisk}</div>
            </div>
          </div>
        </section>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left: Insights Feed */}
        <section>
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 mb-8">
            <div className="px-7 py-5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-blue-900">Latest AI Insights</h3>
            </div>
            <div className="p-7 space-y-5">
              {filteredInsights.map((insight, idx) => {
                const Icon = getInsightIcon(insight.type)
                return (
                  <div key={insight.id ?? `insight-${idx}`} className={`flex gap-4 items-start p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                    <Icon className="h-7 w-7 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-base font-bold text-gray-900">{insight.title}</h4>
                        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${getImpactBadge(insight.impact)}`}>
                          {insight.impact} impact
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                        <span className="capitalize">{insight.category}</span>
                        <span>{formatDate(insight.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* Actions Panel */}
          <div className={`bg-gradient-to-r ${panelGradient} border border-indigo-200 rounded-2xl p-6 shadow-xl`}>
            <div className="flex gap-3 items-start">
              <LightBulbIcon className="h-6 w-6 text-indigo-500 mt-1" />
              <div>
                <h3 className="text-base font-extrabold text-indigo-900 mb-1">AI-Powered Action Items</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-indigo-800">
                  <li>Contact {predictiveAnalytics?.churnPrediction.highRisk || 0} high-risk customers with retention campaigns</li>
                  <li>Schedule campaigns for optimal engagement times (Tuesday 2PM, Thursday 10AM)</li>
                  <li>Focus on email and SMS channels for maximum impact</li>
                  <li>Create premium tier for high-value customer segment (45 customers identified)</li>
                  <li>Reduce campaign frequency to avoid fatigue (rates declining)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        {/* Right: Forecast/Scoring */}
        <section className="flex flex-col gap-8">
          {predictiveAnalytics && (
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
              <div className="px-7 py-5 border-b border-gray-100">
                <h3 className="text-xl font-bold text-blue-900">Revenue Forecast (Next 5 Months)</h3>
              </div>
              <div className="p-7">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={predictiveAnalytics.revenueForecasts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Predicted Revenue']} />
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.18}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {/* Customer scoring */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
            <div className="px-7 py-5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-blue-900">Customer Scoring & Risk Analysis</h3>
            </div>
            <div className="p-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                <div>
                  <h4 className="text-base font-bold text-gray-900 mb-4">Top Customer Scores</h4>
                  <div className="space-y-4">
                    {customerScores.map((customer, idx) => (
                      <div key={customer.customerId ?? idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg shadow-sm">
                        <div>
                          <div className="font-semibold text-gray-900">{customer.customerName}</div>
                          <div className={`text-sm ${getRiskColor(customer.risk ?? 'unknown')}`}>
                            {(customer.risk ? capitalize(customer.risk) : 'Unknown')} Risk
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-900">{customer.score}</div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Radar chart visual */}
                <div>
                  <h4 className="text-base font-bold text-gray-900 mb-4">Factor Analysis</h4>
                  <ResponsiveContainer width="100%" height={170}>
                    <RadarChart data={customerScores.map(c => ({ name: c.customerName, ...c.factors }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis angle={90} domain={[0,100]} />
                      <Radar name="Engagement" dataKey="engagement" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.13} />
                      <Radar name="Spending" dataKey="spending" stroke="#10B981" fill="#10B981" fillOpacity={0.13} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          {/* Campaign Optimization */}
          {predictiveAnalytics && (
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
              <div className="px-7 py-5 border-b border-gray-100">
                <h3 className="text-xl font-bold text-blue-900">Campaign Optimization</h3>
              </div>
              <div className="p-7 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h4 className="text-base font-bold text-gray-900 mb-2">Best Send Times</h4>
                  <div className="space-y-2">
                    {predictiveAnalytics.campaignOptimization.bestTimes.map((time, idx) => (
                      <div key={time ?? `besttime-${idx}`} className="flex items-center p-2 bg-blue-50 rounded shadow-sm">
                        <ClockIcon className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm font-semibold text-blue-900">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 mb-2">Top Channels</h4>
                  <div className="space-y-2">
                    {predictiveAnalytics.campaignOptimization.topPerformingChannels.map((channel, idx) => (
                      <div key={channel ?? `channel-${idx}`} className="flex items-center p-2 bg-green-50 rounded shadow-sm">
                        <MegaphoneIcon className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm font-semibold text-green-900">{channel}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 mb-2">Optimal Frequency</h4>
                  <div className="flex flex-col items-center gap-1 p-4 bg-purple-50 rounded shadow-sm">
                    <div className="text-2xl font-bold text-purple-700">{predictiveAnalytics.campaignOptimization.optimalFrequency}</div>
                    <div className="text-xs text-purple-600">campaigns/week</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
