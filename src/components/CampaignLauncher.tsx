import React, { useState, useEffect } from 'react'
import apiRequest from '@/lib/apiRequest'

export default function CampaignLauncher() {
  const [name, setName] = useState('Interview Demo Campaign')
  const [message, setMessage] = useState("Hi {name}, here's 10% off on your next order!")
  const [loading, setLoading] = useState(false)
  const [campaign, setCampaign] = useState<any | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let t: any
    if (campaign) {
      // Poll campaign endpoint for logs every 5s to avoid rate limiting
      t = setInterval(async () => {
        try {
          const res = await apiRequest({ method: 'get', url: `/campaigns/${campaign.id}` })
          if (res.ok) {
            const payload: any = res.data ?? {}
            const camp = payload.data?.campaign ?? payload.campaign ?? null
            if (camp) {
              setCampaign(camp)
              setLogs(camp.communicationLogs || [])
            }
          }
        } catch (e) {
          // ignore transient errors
        }
      }, 5000)
    }
    return () => { if (t) clearInterval(t) }
  }, [campaign])

  const createAndLaunch = async () => {
    setError(null)
    setLoading(true)
    try {
      // Create campaign
      const create = await apiRequest({ method: 'post', url: '/campaigns', data: { name, description: 'Created from demo UI', rules: { logic: 'AND', conditions: [{ field: 'visitCount', operator: '>=', value: 0 }] } } })
      if (!create.ok || !create.data) {
        setError(create.error || 'Failed to create campaign')
        setLoading(false)
        return
      }
      const createPayload: any = create.data
      const id = createPayload.data?.id
      // Launch campaign with message
      const launch = await apiRequest({ method: 'post', url: `/campaigns/${id}/launch`, data: { message } })
      if (!launch.ok) {
        setError(launch.error || 'Failed to launch campaign')
        setLoading(false)
        return
      }
      // Fetch campaign details immediately
      const details = await apiRequest({ method: 'get', url: `/campaigns/${id}` })
      if (details.ok && details.data) {
        const detailsPayload: any = details.data
        if (detailsPayload.data?.campaign) setCampaign(detailsPayload.data.campaign)
      }
    } catch (e: any) {
      setError(e?.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h3 className="text-lg font-bold mb-2">Demo: Create & Launch Campaign</h3>
      <div className="mb-2 text-sm">
        <label className="block text-xs font-medium text-gray-700">Name</label>
        <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded px-2 py-1" />
      </div>
      <div className="mb-2 text-sm">
        <label className="block text-xs font-medium text-gray-700">Message</label>
        <textarea value={message} onChange={(e)=>setMessage(e.target.value)} className="w-full border rounded px-2 py-1" rows={3} />
        <div className="text-xs text-gray-500 mt-1">Use <code>{'{name}'}</code> to personalize.</div>
      </div>
      <div className="flex gap-2">
        <button onClick={createAndLaunch} disabled={loading} className="px-3 py-1 rounded bg-blue-600 text-white">{loading ? 'Working...' : 'Create & Launch'}</button>
        <button onClick={async ()=>{ setCampaign(null); setLogs([]); setError(null) }} className="px-3 py-1 rounded border">Reset</button>
      </div>

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

      {campaign ? (
        <div className="mt-4 text-sm">
          <div className="font-semibold">Campaign: {campaign.name}</div>
          <div className="text-xs text-gray-600">Audience size: {campaign.audienceSize || campaign.deliveryStats?.total || '—'}</div>
          <div className="mt-2">
            <strong>Communication Logs</strong>
            <ul className="mt-2 space-y-2 max-h-48 overflow-auto">
              {logs.length === 0 ? <li className="text-xs text-gray-500">No logs yet</li> : logs.map(l => (
                <li key={l.id} className="border p-2 rounded text-xs">
                  <div><strong>{l.customer?.name || l.customerId}</strong> — {l.message}</div>
                  <div className="text-xs text-gray-600">Status: {l.status} • SentAt: {l.sentAt ? new Date(l.sentAt).toLocaleTimeString() : '-' } • DeliveredAt: {l.deliveredAt ? new Date(l.deliveredAt).toLocaleTimeString() : '-'}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )
}
