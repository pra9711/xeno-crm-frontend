import React, { useEffect, useState } from 'react'
import apiRequest from '@/lib/apiRequest'

export default function CampaignDeliveryDemo() {
  const [vendorStats, setVendorStats] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const vendorUrl = process.env.NEXT_PUBLIC_VENDOR_API_URL || 'http://localhost:3001/api/vendor'
  const vendorKey = process.env.NEXT_PUBLIC_VENDOR_API_KEY || ''

  useEffect(() => {
    async function load() {
      try {
        const vs = await apiRequest({ method: 'get', url: `${vendorUrl}/stats` })
        if (vs.ok) {
          const payload: any = vs.data ?? {}
          const stats = payload.data?.stats ?? payload.stats ?? payload
          setVendorStats(stats)
        }
      } catch (e) { /* ignore */ }

      try {
        const c = await apiRequest({ method: 'get', url: '/campaigns' })
        if (c.ok) {
          const payload: any = c.data ?? {}
          const list = payload.data?.campaigns ?? payload.campaigns ?? []
          setCampaigns(list)
        }
      } catch (e) { /* ignore */ }
    }
    load()
  }, [])

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h3 className="text-lg font-bold mb-2">Campaign Delivery Demo</h3>
      <div className="text-sm mb-3">
        <strong>Vendor API:</strong> <code>{vendorUrl}</code>
      </div>
      <div className="text-sm mb-3">
        <strong>Vendor Key:</strong> <code>{vendorKey ? 'configured' : 'not configured'}</code>
      </div>
      <div className="mb-3">
        <strong>Vendor Stats:</strong>
        {vendorStats ? (
          <pre className="text-xs bg-gray-50 p-2 rounded mt-1">{JSON.stringify(vendorStats, null, 2)}</pre>
        ) : (
          <div className="text-xs text-gray-500">No stats available</div>
        )}
      </div>
      <div>
        <strong>Your campaigns:</strong>
        {campaigns.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {campaigns.map((c:any) => (
              <li key={c.id} className="border p-2 rounded">
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-gray-600">Audience size: {c.audienceSize} • Sent: {c.deliveryStats?.sent || 0} • Delivered: {c.deliveryStats?.delivered || 0} • Failed: {c.deliveryStats?.failed || 0}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-gray-500">No campaigns yet</div>
        )}
      </div>
    </div>
  )
}
