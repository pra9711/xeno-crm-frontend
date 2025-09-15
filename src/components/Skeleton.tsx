"use client"

import React from 'react'

interface SkeletonProps {
  width?: string
  height?: string
  className?: string
}

export default function Skeleton({ width = 'w-12', height = 'h-4', className = '' }: SkeletonProps) {
  return (
    <span className={`inline-block ${width} ${height} bg-gray-200 rounded ${className} animate-pulse`} aria-hidden="true" />
  )
}
