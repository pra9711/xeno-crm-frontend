import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/toast/ToastProvider'
import Spinner from '@/components/Spinner'

interface MessageSuggestion {
  id: number;
  message: string;
  tone: string;
  estimatedEngagement: number;
  recommendation: string;
}

export default function AISuggestions({ suggestions, onUse, appliedSuggestionId, isLive, loading }: { suggestions: MessageSuggestion[]; onUse: (message: string, id?: number) => void; appliedSuggestionId?: number | null; isLive?: boolean; loading?: boolean }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMessage, setPreviewMessage] = useState<string | null>(null)
  const { show } = useToast()
  if (!suggestions || !suggestions.length) return null
  // Presentational component: receives pre-computed AI suggestions from parent.
  // Keep this component pure and stateless for easier testing and interview discussion.
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">AI Message Suggestions</h4>
        <div className="flex items-center gap-3">
          {isLive && <div className="text-xs text-green-700 font-medium bg-green-50 px-2 py-1 rounded-full">Live</div>}
          {loading && (
            <div className="flex items-center gap-2">
              <Spinner size={14} />
              <span className="text-xs text-gray-600" aria-live="polite">Generating…</span>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {suggestions.map(s => (
          <Card 
            key={s.id} 
            className={`p-4 transition-all duration-250 border border-gray-200 rounded-xl hover:shadow-sm group relative ${appliedSuggestionId === s.id ? 'bg-green-50/60' : 'hover:bg-blue-50'}`}>
            {/* Applied animation overlay */}
            {appliedSuggestionId === s.id && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-2 bg-white/80 rounded-full px-3 py-1 shadow-md animate-fade-in">
                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                  <span className="text-sm font-semibold text-green-700">Applied</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-start mb-3">
              <Badge 
                variant="secondary" 
                className="text-xs bg-purple-100 text-purple-700 border-0 px-2 py-1 rounded-full font-medium"
              >
                {s.tone}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Engagement:</span>
                <span className="text-xs font-semibold text-green-600">{s.estimatedEngagement}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-800 mb-3 leading-relaxed font-medium">{s.message}</p>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-600 italic">{s.recommendation}</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setPreviewMessage(s.message); setPreviewOpen(true) }} className="text-xs">Preview</Button>
                <Button size="sm" variant="secondary" onClick={() => { onUse(s.message, s.id); try { show({ message: 'Suggestion applied' }) } catch {} }} className="text-xs">Apply</Button>
              </div>
            </div>
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-xs text-purple-600 font-medium">Click Apply to use this message →</span>
            </div>
          </Card>
        ))}
      </div>
  <ConfirmModal open={previewOpen} title="Preview AI Suggestion" message={previewMessage || ''} confirmLabel="Apply" cancelLabel="Close" onConfirm={() => { if (previewMessage) { const matched = suggestions.find(x => x.message === previewMessage); if (previewMessage) { onUse(previewMessage, matched?.id); try { show({ message: 'Suggestion applied' }) } catch {} } } setPreviewOpen(false); setPreviewMessage(null); }} onCancel={() => { setPreviewOpen(false); setPreviewMessage(null) }} />
    </div>
  )
}
