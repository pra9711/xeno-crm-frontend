import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'
import { ToastProvider } from '@/components/toast/ToastProvider'
import { ThemeProvider } from "@/components/theme-provider";
import Header from '@/components/layout/Header'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Xeno CRM - Customer Relationship Management',
  description: 'A comprehensive CRM platform for customer segmentation and campaign management',
  keywords: 'CRM, customer management, campaigns, segmentation, analytics',
  authors: [{ name: 'Xeno Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning prevents console warnings when browser
    // extensions or client-side scripts inject attributes that differ
    // from the server-rendered HTML (e.g., webcrx="").
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground min-h-screen`}>
        <div id="__next" className="min-h-screen">
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <main className="min-h-screen">
                  {children}
                </main>
                <Toaster position="top-right" />
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </div>
        <div id="modal-root" />
      </body>
    </html>
  )
}
