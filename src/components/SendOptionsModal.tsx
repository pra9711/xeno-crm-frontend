import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

type Props = {
  open: boolean
  onCancel: () => void
  onConfirm: (options: { scheduleAt?: string; queue: boolean }) => void
  defaultSchedule?: string
}

export default function SendOptionsModal({ open, onCancel, onConfirm, defaultSchedule }: Props) {
  const [scheduleAt, setScheduleAt] = useState(defaultSchedule || '')
  const [queue, setQueue] = useState(false)

  if (!open) return null

  // SendOptionsModal: lightweight UI for scheduling vs background queueing.
  // Keep logic here minimal; parent components should handle validation and
  // scheduling semantics to keep modal testable.

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <Card className="z-10 max-w-md w-full shadow-2xl rounded-xl">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-md">
              <Calendar className="h-5 w-5 text-gray-700" />
            </div>
            <CardTitle className="text-lg">Send options</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Choose whether to schedule this send or queue it for background processing.</p>

          <div>
            <Label className="text-sm font-medium">Schedule send</Label>
            <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="mt-2" />
          </div>

          <div className="flex items-center gap-3">
            <input id="queue" type="checkbox" checked={queue} onChange={(e) => setQueue(e.target.checked)} />
            <label htmlFor="queue" className="text-sm text-gray-700">Queue send for background processing</label>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={onCancel} className="h-9">Cancel</Button>
            <Button onClick={() => onConfirm({ scheduleAt: scheduleAt || undefined, queue })} className="h-9">Confirm</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
