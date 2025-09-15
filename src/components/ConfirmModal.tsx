import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, FileText } from 'lucide-react'

type ConfirmModalProps = {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null

  // ConfirmModal: simple, accessible confirmation dialog. Keep content minimal
  // to allow re-use across different flows (deletion, submissions, etc.).

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <Card className="bg-white rounded-2xl shadow-2xl z-10 max-w-md w-full overflow-hidden border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              {title && <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>}
              <CardDescription className="text-gray-600 text-sm mt-1">Draft management</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-700 leading-relaxed mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <Button 
              onClick={onCancel} 
              variant="outline" 
              className="px-6 rounded-lg border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {cancelLabel}
            </Button>
            <Button 
              onClick={onConfirm} 
              className="px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              {confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
