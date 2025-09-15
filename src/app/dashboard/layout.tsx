 'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import HomeLoading from '@/components/HomeLoading'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // Redirect unauthenticated users to the canonical auth route.
    // Use `/auth/login` so the app's auth pages stay consistent.
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [loading, user, router])

  if (loading) {
    return <HomeLoading />
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="lg:pl-64 bg-background">
        <main className="bg-background text-foreground min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
