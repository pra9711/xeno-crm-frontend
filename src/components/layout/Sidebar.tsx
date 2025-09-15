'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Dialog, Transition } from '@headlessui/react'
import {
  X,
  Home,
  Users,
  Megaphone,
  BarChart3,
  Settings,
  ShoppingCart,
  Sparkles,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'AI Insights', href: '/dashboard/ai-insights', icon: Sparkles },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  // Sidebar: purely presentational navigation. Keep business logic (routing, auth)
  // at a higher level or in hooks to keep the component simple during interviews.
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const SidebarContent = () => (
  <div className="flex grow flex-col justify-between overflow-y-auto px-6 pb-6 bg-white border-r" style={{ borderColor: '#E9E9F0' }}>
      <div>
        <div className="flex h-20 items-center">
          <Link href="/" className="flex items-center gap-3" onClick={(e) => { e.preventDefault(); router.push('/'); if (onClose) onClose() }}>
             <div className="h-12 w-12 rounded-lg overflow-hidden bg-purple-100 flex items-center justify-center">
              <Image src="/logo-default.svg" alt="Xeno CRM" width={44} height={44} />
            </div>
            <div className="flex flex-col ml-3 leading-tight">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6B21A8] to-[#8B5CF6]">Xeno CRM</span>
              <span className="text-xs text-gray-400">Mini CRM Platform</span>
            </div>
          </Link>
        </div>
  {/* top separator */}
  <div className="mt-2 -mx-6 border-t border-gray-300" />

        <nav className="mt-8">
          <ul role="list" className="space-y-2">
            {navigation.map((item) => {
              const active = pathname === item.href
              return (
                <li key={item.name}>
                  <Link href={item.href} className={classNames(
                    'flex items-center gap-x-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all justify-start',
                    active ? 'bg-gradient-to-r from-[#6B21A8]/10 to-[#8B5CF6]/10 text-[#6B21A8] border border-[#6B21A8]/20 shadow-sm' : 'text-gray-700 hover:bg-background/50'
                  )}>
                    <item.icon strokeWidth={1.6} className={classNames('h-5 w-5', active ? 'text-[#6B21A8]' : 'text-gray-700')} aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

    {/* Profile card at bottom (dynamic) */}
    <div className="mt-2">
            {/* primary (larger) profile removed to avoid duplication; keep compact profile below */}
            {/* top separator */}
            <div className="mt-2 -mx-6 border-t border-gray-300" />
            <div className="mt-3 px-4">
          <div className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#F6F0FF]/60 hover:bg-[#F6F0FF]/80 transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-white/60 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <Image src={user.avatar} alt={user.name} width={32} height={32} />
              ) : (
                <svg className="h-5 w-5 text-[#6B21A8]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM4 20c0-2.21 3.58-4 8-4s8 1.79 8 4"/></svg>
              )}
            </div>
            <div className="flex-1 min-w-0 w-full">
              <div className="text-sm font-medium text-[#6B21A8]">{user?.name ?? 'Your Name'}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email ?? 'you@example.com'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Link href="/dashboard/settings" className="flex-1 text-center p-2 rounded-md text-gray-700 hover:bg-background/50">
              <Settings className="w-4 h-4 mx-auto" />
            </Link>
            <button
              onClick={async () => { try { await logout(); if (onClose) onClose(); } catch (err) { console.error('Logout failed', err) } }}
              className="flex-1 text-center p-2 rounded-md text-red-500 hover:bg-red-50"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <X className="h-6 w-6 text-foreground" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
      </div>
    </>
  )
}
