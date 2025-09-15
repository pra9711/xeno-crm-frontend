"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { quickActionColors, inputFocusRing } from '@/lib/dashboardTheme'

interface QuickActionProps {
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
  shortcut?: string
  variant?: 'default' | 'outline'
}

export default function QuickAction({ onClick, icon: Icon, label, shortcut, variant = 'default' }: QuickActionProps) {
  const ring = variant === 'default' ? quickActionColors.primary : (variant === 'outline' ? quickActionColors.campaign : quickActionColors.analytics)

  return (
    <Button 
      onClick={onClick} 
      variant={variant === 'outline' ? 'outline' : undefined} 
      className={`w-full group flex items-center justify-start p-6 min-h-[80px] rounded-lg bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 focus:outline-none ${inputFocusRing} ${ring} transition-all duration-200 border border-gray-100 hover:border-gray-200`} 
      aria-label={label}
    >
      <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 shadow-sm group-hover:shadow-md group-hover:from-blue-100 group-hover:to-indigo-200 transition-all duration-200">
        <Icon className="h-6 w-6 text-indigo-600 group-hover:text-indigo-700 transition-colors duration-200" />
      </div>
      <div className="ml-4 flex-1 text-left">
        <div className="flex flex-col justify-center h-full">
          <span className="block text-sm font-semibold text-slate-900 group-hover:text-slate-800">{label}</span>
          <div className="mt-1 h-px bg-gradient-to-r from-gray-200 to-transparent opacity-60"></div>
        </div>
      </div>
    </Button>
  )
}
