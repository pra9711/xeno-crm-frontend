import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Skeleton from '@/components/Skeleton'
import Spinner from '@/components/Spinner'

export default function MessageEditor({ value, onChange, audienceSize = 0, onGenerate, loading, flash }: { value: string; onChange: (v: string) => void; audienceSize?: number; onGenerate?: () => void; loading?: boolean; flash?: boolean }) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  React.useEffect(() => {
    if (flash && textareaRef.current) {
      try { textareaRef.current.focus(); textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length) } catch {}
    }
  }, [flash])
  const softLimit = 1000
  const percent = Math.min(100, (value.length / softLimit) * 100)
  const isOverLimit = false
  // Editor component: controlled input to make autosave and validation simpler.
  // Expose `onGenerate` to keep AI generation side-effect in the parent for testability.
  
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label htmlFor="message" className="text-sm font-medium text-gray-900">Message Content *</Label>
        <div className="relative">
          <Textarea 
            id="message" 
            rows={6} 
            ref={(el) => { textareaRef.current = el }}
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder={loading ? 'Generating message...' : 'Enter your campaign message...'}
            disabled={!!loading}
            className={`resize-none border-gray-200 rounded-xl focus:border-purple-500 focus:ring-purple-500/20 text-sm transition-colors duration-300 ${flash ? 'bg-green-50' : 'bg-white'}`}
          />
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="flex items-center gap-3">
                <Skeleton width="w-24" height="h-4" className="bg-white/40 inline-block align-middle" />
                <span className="text-sm font-medium text-gray-700">Generating...</span>
              </div>
            </div>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className={`text-sm font-medium text-gray-700`}>
              {value.length} characters
            </div>
            <div className="text-sm text-gray-600">
              Audience: <span className="font-semibold text-gray-900">{audienceSize.toLocaleString()}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isOverLimit ? 'bg-red-500' : percent > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`} 
              style={{ width: `${Math.min(100, percent)}%` }} 
            />
          </div>
        </div>
      </div>
      
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">AI Message Suggestions</h4>
          <Button 
            type="button" 
            onClick={onGenerate} 
            disabled={!!loading} 
            variant="outline" 
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-purple-500 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            {loading ? <><Spinner size={14} className="text-white" /> <span className="text-sm">Generating</span></> : 'Generate'}
          </Button>
        </div>
        <div aria-live="polite" className="sr-only">{loading ? 'Generating AI suggestion' : ''}</div>
      </div>
    </div>
  )
}
