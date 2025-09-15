import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

type Props = {
  index: number
  condition: any
  fieldOptions: { value: string; label: string }[]
  operatorOptions: any
  onUpdate: (index: number, updates: any) => void
  onRemove: (index: number) => void
}

export default function RuleRow({ index, condition, fieldOptions, operatorOptions, onUpdate, onRemove }: Props) {
  const safeFieldOptions = Array.isArray(fieldOptions) ? fieldOptions : []
  const fieldValue = condition?.field ?? (safeFieldOptions[0] ? safeFieldOptions[0].value : '')
  const safeOperatorList = (operatorOptions && operatorOptions[fieldValue]) ? operatorOptions[fieldValue] : []
  return (
    <div className="relative group">
      {/* RuleRow: keep UI stateless — parent owns rule logic. This simplifies unit tests and
          makes it easy to explain how field/operator/value are normalized before submission. */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md">
        <div className="flex-1">
          <Select value={fieldValue} onValueChange={(value) => {
            const fv = value as any
            const defaultOperator = (operatorOptions && operatorOptions[fv] && operatorOptions[fv][0] && operatorOptions[fv][0].value) ? operatorOptions[fv][0].value : ((safeOperatorList[0] && safeOperatorList[0].value) || '')
            onUpdate(index, { field: fv, operator: defaultOperator })
          }}>
            <SelectTrigger className="w-full border-0 bg-gray-50 rounded-lg h-11 focus:bg-white focus:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {safeFieldOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select value={condition?.operator ?? (safeOperatorList[0] && safeOperatorList[0].value) ?? ''} onValueChange={(value) => onUpdate(index, { operator: value })}>
            <SelectTrigger className="w-full border-0 bg-gray-50 rounded-lg h-11 focus:bg-white focus:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {safeOperatorList.map((opt: any) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          {condition.field === 'lastVisit' ? (
            <Input 
              type="date" 
              value={condition.value as string} 
              onChange={(e) => onUpdate(index, { value: e.target.value })} 
              className="border-0 bg-gray-50 rounded-lg h-11 focus:bg-white focus:border-primary"
            />
          ) : condition.field === 'email' ? (
            <Input 
              type="text" 
              value={condition.value as string} 
              onChange={(e) => onUpdate(index, { value: e.target.value })} 
              placeholder="Text to search for" 
              className="border-0 bg-gray-50 rounded-lg h-11 focus:bg-white focus:border-primary"
            />
          ) : (
            <Input 
              type="number" 
              value={condition.value as number} 
              onChange={(e) => onUpdate(index, { value: Number(e.target.value) })} 
              placeholder="Enter value" 
              className="border-0 bg-gray-50 rounded-lg h-11 focus:bg-white focus:border-primary"
            />
          )}
        </div>

        <Button 
          type="button" 
          onClick={() => onRemove(index)} 
          variant="ghost" 
          size="icon" 
          className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg h-11 w-11 opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
