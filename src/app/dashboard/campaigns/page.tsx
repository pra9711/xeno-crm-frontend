'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Play,
  Pause,
  Eye,
  Pencil,
  Trash2,
  Users,
  Send,
  MessageSquare,
  Layers
} from 'lucide-react'
import HomeLoading from '@/components/HomeLoading'
import CampaignStats from '@/components/CampaignStats'
import useApi from '@/lib/useApi'
import { useToast } from '@/components/toast/ToastProvider'
import { normalizeListAndPagination } from '@/lib/pagination'
import type { Campaign } from '@/types'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCampaigns, setTotalCampaigns] = useState(0)
  const [avgSuccessRate, setAvgSuccessRate] = useState(0)
  const [totalAudience, setTotalAudience] = useState(0)
  const [messagesSent, setMessagesSent] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const client = useApi()
  const toast = useToast()
  // Mock data is strictly dev-only. Production uses live backend.
  // This page uses `normalizeListAndPagination` to handle backend variations.
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'

  // Use shared pagination util (see `frontend/src/lib/pagination.ts`)

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })
      const response = await client.request<unknown>({ method: 'get', url: `/campaigns?${params}` })
      // -- normalize returned data --
      const payload = response.data as any
  const { list, pagination } = normalizeListAndPagination(payload)
  setCampaigns(list)
  setTotalPages(pagination && typeof pagination.pages === 'number' ? pagination.pages : 1)
      // compute top-level stats
      try {
        const total = Array.isArray(list) ? list.length : 0
        let audienceSum = 0
        let messagesSum = 0
        let delivered = 0
        let totalDeliveries = 0
        list.forEach((c: any) => {
          if (typeof c.audienceSize === 'number') audienceSum += c.audienceSize
          if (c._count && typeof c._count.communicationLogs === 'number') messagesSum += c._count.communicationLogs
          if (c.deliveryStats && typeof c.deliveryStats.delivered === 'number') delivered += c.deliveryStats.delivered
          if (c.deliveryStats && typeof c.deliveryStats.total === 'number') totalDeliveries += c.deliveryStats.total
        })
        setTotalCampaigns(total)
        setTotalAudience(audienceSum)
        setMessagesSent(messagesSum)
        setAvgSuccessRate(totalDeliveries > 0 ? Math.round((delivered / totalDeliveries) * 1000) / 10 : 0)
      } catch (e) {
        console.warn('Failed to compute stats', e)
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter])

  // Poll for updates to make the campaigns list near-real-time in the dashboard.
  // Polling frequency: 15s — keeps UI fresh without adding socket complexity.
  useEffect(() => {
    const id = setInterval(() => {
      try {
        fetchCampaigns()
      } catch (e) {
        // ignore polling errors; fetchCampaigns handles logging
      }
    }, 15000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter])

  // fetch server-side aggregated stats to improve perceived load
  useEffect(() => {
    let mounted = true
    const fetchStats = async () => {
      try {
        const resp = await client.request({ method: 'get', url: '/campaigns/stats' })
        if (!mounted) return
        if (resp && (resp as any).data && (resp as any).data.data) {
          const s = (resp as any).data.data
          if (typeof s.totalCampaigns === 'number') setTotalCampaigns(s.totalCampaigns)
          if (typeof s.avgSuccessRate === 'number') setAvgSuccessRate(s.avgSuccessRate)
          if (typeof s.totalAudience === 'number') setTotalAudience(s.totalAudience)
          if (typeof s.messagesSent === 'number') setMessagesSent(s.messagesSent)
        }
      } catch (e) {
        // silently ignore
      }
    }
    fetchStats()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchCampaigns()
  }

  const handleLaunchCampaign = async (campaign: Campaign) => {
    try {
      // Use campaign description as default message if present, otherwise fallback to a simple templated message
      const defaultMessage = (campaign.description && campaign.description.trim()) ? campaign.description : `Hello from ${campaign.name}`
      const resp = await client.request({ method: 'post', url: `/campaigns/${campaign.id}/launch`, data: { message: defaultMessage } })
      if (!resp.ok) {
        const msg = resp.error || 'Launch failed'
        toast.show({ message: `Failed to launch campaign — ${msg}` })
        // Do not throw (avoid noisy unhandled errors). Just return after showing a toast.
        return
      }
      toast.show({ message: 'Campaign launched successfully' })
      fetchCampaigns()
    } catch (error) {
      console.error('Failed to launch campaign:', error)
    }
  }

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const resp = await client.request({ method: 'post', url: `/campaigns/${campaignId}/pause` })
      if (!resp.ok) {
        const msg = resp.error || (resp.status === 404 ? 'Campaign not found' : 'Pause failed')
        toast.show({ message: `Failed to pause campaign — ${msg}` })
        return
      }
      toast.show({ message: 'Campaign paused' })
      fetchCampaigns()
    } catch (error) {
      console.error('Failed to pause campaign:', error)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return
    try {
      const resp = await client.request({ method: 'delete', url: `/campaigns/${campaignId}` })
      if (!resp.ok) {
        const msg = resp.error || 'Delete failed'
        toast.show({ message: `Failed to delete campaign — ${msg}` })
        return
      }
      toast.show({ message: 'Campaign deleted' })
      fetchCampaigns()
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'PAUSED': return 'secondary'
      case 'COMPLETED': return 'outline'
      case 'CANCELLED': return 'destructive'
      default: return 'outline'
    }
  }

  // --- UI ---
  return (
    <div className="bg-background text-foreground min-h-screen px-6 lg:px-10 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Campaigns</h1>
          <p className="text-base text-muted-foreground mt-2 max-w-xl">Create and manage targeted marketing campaigns with ease — optimize engagement and reach.</p>
        </div>
        <div>
          <Link href="/dashboard/campaigns/new" className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold shadow-md hover:opacity-95 transition">
            <Plus className="h-4 w-4" />
            Create Campaign
          </Link>
        </div>
      </div>
      <CampaignStats
        loading={loading}
        totalCampaigns={totalCampaigns}
        avgSuccessRate={avgSuccessRate}
        totalAudience={totalAudience}
        messagesSent={messagesSent}
        completedCount={campaigns.filter(c => c.status === 'COMPLETED').length}
      />
      {/* Search and Filters */}
      <Card className="mb-8 rounded-2xl bg-white/70 backdrop-blur-sm border border-transparent shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute left-4 top-3 text-gray-400"><Search className="h-5 w-5" /></div>
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 h-14 text-base bg-white rounded-full border border-gray-200 shadow-sm"
                />
              </div>
            </div>

            <Button onClick={handleSearch} className="h-12 px-6 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-sm hover:opacity-95">
              Search
            </Button>

            <div>
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-[180px] h-12 bg-white rounded-full shadow-sm border border-gray-200">
                  <SelectValue placeholder="All Status" className="text-sm font-medium text-muted-foreground" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">All Status</SelectItem>
                  <SelectItem value="DRAFT" className="text-sm">Draft</SelectItem>
                  <SelectItem value="ACTIVE" className="text-sm">Active</SelectItem>
                  <SelectItem value="PAUSED" className="text-sm">Paused</SelectItem>
                  <SelectItem value="COMPLETED" className="text-sm">Completed</SelectItem>
                  <SelectItem value="CANCELLED" className="text-sm">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Campaign Grid */}
      {loading ? (
        <HomeLoading />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {(() => {
            const safeCampaigns = Array.isArray(campaigns) ? campaigns : []
            // If no campaigns and developer enabled mocks, show deterministic demo cards.
            if (safeCampaigns.length === 0) {
              if (useMocks && !searchTerm) {
                const mockCampaigns: Campaign[] = [
                  {
                    id: 'mock-1',
                    name: 'Summer Sale (Demo)',
                    description: 'Demo campaign showing segmentation and delivery metrics.',
                    status: 'COMPLETED',
                    audienceSize: 1250,
                    _count: { communicationLogs: 450 },
                    deliveryStats: { delivered: 1188, total: 1250 },
                    createdAt: new Date().toISOString()
                  } as any,
                  {
                    id: 'mock-2',
                    name: 'Welcome Series (Demo)',
                    description: 'Demo welcome series for new subscribers.',
                    status: 'ACTIVE',
                    audienceSize: 450,
                    _count: { communicationLogs: 210 },
                    deliveryStats: { delivered: 198, total: 210 },
                    createdAt: new Date().toISOString()
                  } as any
                ]
                return mockCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="shadow-sm rounded-2xl border border-transparent hover:shadow-md transition-all">
                    <CardContent className="pt-6 pb-5">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-foreground truncate">{campaign.name}</h3>
                        <Badge variant={getStatusVariant(campaign.status)} className="text-sm px-3 py-1 rounded-full">{campaign.status}</Badge>
                      </div>
                      <p className="text-base text-gray-600 mb-5 line-clamp-2">{campaign.description}</p>
                      <div className="space-y-2 text-base mb-6">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Audience Size:</span>
                          <span className="font-semibold">{(campaign.audienceSize || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Messages Sent:</span>
                          <span className="font-semibold">{campaign._count?.communicationLogs || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Created:</span>
                          <span>{campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : '-'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              }
              return (
                <div className="col-span-full text-center py-20">
                  <div className="text-muted-foreground text-lg mb-6">
                    {searchTerm ? 'No campaigns found matching your search.' : 'No campaigns yet.'}
                  </div>
                  <Link href="/dashboard/campaigns/new" className="inline-block rounded-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold shadow-md">
                    Create Your First Campaign
                  </Link>
                </div>
              )
            }
            return safeCampaigns.map((campaign) => (
              <Card key={campaign.id} className="shadow-sm rounded-2xl border border-transparent hover:shadow-md transition-all">
                <CardContent className="pt-6 pb-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-foreground truncate">{campaign.name}</h3>
                    <Badge variant={getStatusVariant(campaign.status)} className="text-sm px-3 py-1 rounded-full">
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-base text-gray-600 mb-5 line-clamp-2">
                    {campaign.description || 'No description provided'}
                  </p>
                  <div className="space-y-2 text-base mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Audience Size:</span>
                      <span className="font-semibold">{(typeof campaign.audienceSize === 'number' ? campaign.audienceSize : 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Messages Sent:</span>
                      <span className="font-semibold">{campaign._count?.communicationLogs || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span>{campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>
                  {/* Campaign Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      {campaign.status === 'DRAFT' && (
                        <Button
                          onClick={() => handleLaunchCampaign(campaign)}
                          variant="ghost"
                          size="icon"
                          className="text-green-600 hover:text-green-700"
                          title="Launch campaign"
                          type="button"
                        >
                          <Play className="h-5 w-5" />
                        </Button>
                      )}
                      {campaign.status === 'ACTIVE' && (
                        <Button
                          onClick={() => handlePauseCampaign(campaign.id)}
                          variant="ghost"
                          size="icon"
                          className="text-yellow-600 hover:text-yellow-700"
                          title="Pause campaign"
                          type="button"
                        >
                          <Pause className="h-5 w-5" />
                        </Button>
                      )}
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="text-blue-600 hover:text-blue-700"
                        title="View campaign"
                      >
                        <Link href={`/dashboard/campaigns/${campaign.id}`}>
                          <Eye className="h-5 w-5" />
                        </Link>
                      </Button>
                      {campaign.status === 'DRAFT' && (
                        <>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:text-primary/80"
                            title="Edit campaign"
                          >
                            <Link href={`/dashboard/campaigns/${campaign.id}/edit`}>
                              <Pencil className="h-5 w-5" />
                            </Link>
                          </Button>
                          <Button
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            title="Delete campaign"
                            type="button"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                    </div>
                    {campaign.deliveryStats && typeof campaign.deliveryStats.delivered === 'number' && typeof campaign.deliveryStats.total === 'number' ? (
                      <div className="text-xs text-gray-400">
                        {campaign.deliveryStats.total > 0 ? (
                          ((campaign.deliveryStats.delivered / campaign.deliveryStats.total) * 100).toFixed(1) + '% delivered'
                        ) : '—'}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          })()}
        </div>
      )}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-12 space-x-3">
          <Button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            variant="outline"
            className="rounded-full px-6"
            type="button"
          >
            Previous
          </Button>
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const page = i + Math.max(1, currentPage - 2)
            if (page > totalPages) return null
            return (
              <Button
                key={page}
                onClick={() => setCurrentPage(page)}
                variant={page === currentPage ? "default" : "outline"}
                className="rounded-full px-5"
                type="button"
              >
                {page}
              </Button>
            )
          })}
          <Button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            className="rounded-full px-6"
            type="button"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
