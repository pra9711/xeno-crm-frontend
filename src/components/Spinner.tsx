"use client"

import React from 'react'

interface SpinnerProps {
  size?: number // px
  className?: string
  ariaLabel?: string
}

export default function Spinner({ size = 16, className = '', ariaLabel = 'Loading' }: SpinnerProps) {
  const px = `${size}px`
  const sizeClass = `h-[${px}] w-[${px}]`
  return (
    <span role="status" aria-live="polite" aria-label={ariaLabel} className={`${sizeClass} inline-block rounded-full border-b-2 border-current animate-spin ${className}`} />
  )
}
