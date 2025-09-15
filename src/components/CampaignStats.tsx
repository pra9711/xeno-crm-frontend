import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, MessageSquare, Layers, Send } from 'lucide-react'
import useApi from '@/lib/useApi'
import CountUp from './CountUp'

// CampaignStats: lightweight analytics preview. Animations are intentionally
// enabled in-browser but skipped during tests for determinism (see `CountUp`).
// Server fetch is kept optional and must be enabled explicitly to avoid
// surprising background calls during static rendering.

type ServerData = {
  totalCampaigns: number
  avgSuccessRate: number
  totalAudience: number
  messagesSent: number
}

type Props = {
  loading: boolean
  totalCampaigns: number
  avgSuccessRate: number
  totalAudience: number
  messagesSent: number
  completedCount?: number
  fetchServer?: boolean
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') { setValue(target); return }
    if (target === 0) { setValue(0); return }
    let start: number | null = null
    const step = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      setValue(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    const raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

export default function CampaignStats({ loading, totalCampaigns, avgSuccessRate, totalAudience, messagesSent, completedCount = 0 }: Props) {
  const client = useApi()
  const [serverLoading, setServerLoading] = useState(false)
  const [serverData, setServerData] = useState<ServerData | null>(null)

  const shownCampaigns = loading || serverLoading ? 0 : totalCampaigns
  const shownAudience = loading || serverLoading ? 0 : totalAudience
  const shownMessages = loading || serverLoading ? 0 : messagesSent

  const formatCompact = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
    return n.toLocaleString()
  }

  useEffect(() => {
    let mounted = true
    const fetchStats = async () => {
      if (!process?.env) return
      // only fetch when explicitly enabled via prop
    }
    return () => { mounted = false }
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card className="rounded-2xl p-4 shadow-sm" aria-live="polite">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Campaigns</div>
              {loading ? (
                <div className="mt-2 space-y-2">
                  <div className="h-8 w-24 bg-gray-100 rounded-md animate-pulse" />
                  <div className="h-3 w-32 bg-gray-100 rounded-md animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-extrabold mt-2">
                    <span role="status" aria-live="polite">
                      <CountUp end={shownCampaigns} duration={0.9} separator="," />
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{completedCount} completed</div>
                </>
              )}
            </div>
            <div className="text-indigo-500 p-3 bg-indigo-50 rounded-full">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl p-4 shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Avg Success Rate</div>
              {loading ? (
                <div className="mt-2 space-y-2">
                  <div className="h-8 w-20 bg-gray-100 rounded-md animate-pulse" />
                  <div className="h-3 w-36 bg-gray-100 rounded-md animate-pulse" />
                </div>
              ) : (
                <>
                      <div className="text-3xl font-extrabold mt-2">
                        <span role="status" aria-live="polite">{avgSuccessRate}%</span>
                      </div>
                      <div className="w-36 h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                        <div className="h-2 bg-indigo-200 rounded-full transition-all duration-700 ease-out" style={{ width: `${avgSuccessRate}%` }} />
                      </div>
                </>
              )}
            </div>
            <div className="text-green-500 p-3 bg-green-50 rounded-full">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl p-4 shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Audience</div>
              {loading ? (
                <div className="mt-2 space-y-2">
                  <div className="h-8 w-28 bg-gray-100 rounded-md animate-pulse" />
                  <div className="h-3 w-32 bg-gray-100 rounded-md animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-extrabold mt-2">
                    <span role="status" aria-live="polite">
                      <CountUp end={shownAudience} duration={1.1} formattingFn={(n) => formatCompact(Number(n))} />
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">customers reached</div>
                </>
              )}
            </div>
            <div className="text-blue-500 p-3 bg-blue-50 rounded-full">
              <Layers className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl p-4 shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Messages Sent</div>
              {loading ? (
                <div className="mt-2 space-y-2">
                  <div className="h-8 w-20 bg-gray-100 rounded-md animate-pulse" />
                  <div className="h-3 w-28 bg-gray-100 rounded-md animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-extrabold mt-2">
                    <span role="status" aria-live="polite">
                      <CountUp end={shownMessages} duration={1.1} formattingFn={(n) => formatCompact(Number(n))} />
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">total deliveries</div>
                </>
              )}
            </div>
            <div className="text-emerald-500 p-3 bg-emerald-50 rounded-full">
              <Send className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
