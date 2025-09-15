import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'

type Draft = { id: string; name: string; createdAt: number; campaignData: any; message?: string }

const DRAFTS_KEY = 'campaignDrafts'

function loadDrafts(): Draft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Draft[]
  } catch {
    return []
  }
}

function saveDrafts(list: Draft[]) {
  try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(list)) } catch {}
}

export default function DraftsManager({ onLoad, onDelete }: { onLoad: (d: Draft) => void; onDelete?: (id: string) => void }) {
  // DraftsManager persists drafts to localStorage for a lightweight offline UX.
  // Keep logic isolated for easy testing and to avoid leaking storage access to parent components.
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [name, setName] = useState('')

  useEffect(() => {
    setDrafts(loadDrafts())
  }, [])

  const handleDelete = (id: string) => {
    const next = drafts.filter(d => d.id !== id)
    setDrafts(next)
    saveDrafts(next)
    onDelete && onDelete(id)
  }

  const handleSaveCurrent = () => {
    try {
      const raw = localStorage.getItem('pendingCampaignForm')
      if (!raw) return
      const parsed = JSON.parse(raw) as { campaignData: any; message?: string }
      const draft: Draft = { id: String(Date.now()), name: name || parsed.campaignData.name || `Draft ${new Date().toLocaleString()}`, createdAt: Date.now(), campaignData: parsed.campaignData, message: parsed.message }
      const next = [draft, ...drafts]
      setDrafts(next)
      saveDrafts(next)
      setName('')
    } catch (e) {
      // ignore
    }
  }

  if (!drafts.length) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground font-medium">Drafts</div>
        <div className="flex gap-2">
          <Input placeholder="Name this draft (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <Button size="sm" onClick={handleSaveCurrent}>Save</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground font-medium">Saved drafts</div>
      <div className="flex gap-2">
        <Input placeholder="Name this draft (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <Button size="sm" onClick={handleSaveCurrent}>Save</Button>
      </div>
      <div className="grid gap-2">
        {drafts.map(d => (
          <div key={d.id} className="flex items-center justify-between p-2 border rounded">
            <div>
              <div className="text-sm font-medium">{d.name || `Draft ${new Date(d.createdAt).toLocaleString()}`}</div>
              <div className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => onLoad(d)}>Load</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(d.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
