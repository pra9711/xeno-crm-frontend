'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { Menu, Transition } from '@headlessui/react'
import {
  Menu as MenuIcon,
  ChevronDown,
  User
} from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/providers/AuthProvider'

interface HeaderProps {
  onMenuClick?: () => void
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 flex h-20 items-center px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Mobile sidebar button */}
      <button
        type="button"
        className="lg:hidden rounded-md p-2 text-slate-500 hover:bg-slate-100 focus:bg-slate-100 transition-colors"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <MenuIcon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* App Logo / Brand */}
      <Link href="/" className="flex items-center gap-3 ml-2">
        <div className="h-10 w-10 rounded-lg overflow-hidden shadow bg-white">
          <Image src="/logo-default.svg" alt="Xeno CRM" width={40} height={40} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold text-slate-900 tracking-tight">Xeno CRM</span>
          <span className="text-xs text-blue-600 font-medium">Professional Edition</span>
        </div>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-x-4">
        {/* Profile / Auth Controls */}
        {user ? (
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 rounded-full px-1.5 py-1.5 hover:bg-slate-100 transition">
              <span className="sr-only">Open user menu</span>
              {user.avatar ? (
                <div className="relative h-9 w-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                  <Image src={user.avatar} alt={user.name} fill sizes="36px" />
                </div>
              ) : (
                <User className="h-8 w-8 text-slate-400" />
              )}
              <span className="hidden lg:flex flex-col items-start ml-2">
                <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                <span className="text-xs text-slate-500">My Account</span>
              </span>
              <ChevronDown className="ml-1 h-4 w-4 text-slate-400 hidden lg:inline" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-20 mt-3 w-56 origin-top-right rounded-xl bg-white border border-slate-200 shadow-2xl ring-1 ring-black/5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link href="/dashboard/profile" className={classNames('block px-4 py-2 text-sm rounded-lg', active ? 'bg-slate-100' : '')}>
                      Your profile
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link href="/dashboard/settings" className={classNames('block px-4 py-2 text-sm rounded-lg', active ? 'bg-slate-100' : '')}>
                      Settings
                    </Link>
                  )}
                </Menu.Item>
                <div className="border-t border-slate-100 my-2" />
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={classNames('block w-full text-left px-4 py-2 text-sm rounded-lg', active ? 'bg-slate-100' : '')}>
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        ) : (
          <Link
            href="/auth/login"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2 shadow transition font-semibold text-sm"
          >
            <span>Get Started</span>
            <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Link>
        )}
      </div>
    </header>
  )
}
