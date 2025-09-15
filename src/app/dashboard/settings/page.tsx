'use client'

 import React, { useEffect, useState } from 'react'
 import Link from 'next/link'
 import { User, Settings, Bell, Monitor } from 'lucide-react'
 import { useForm } from 'react-hook-form'
 import { Button } from '@/components/ui/button'
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
 import { Input } from '@/components/ui/input'
 import { Label } from '@/components/ui/label'
 import { Separator } from '@/components/ui/separator'
 import { ModeToggle } from '@/components/mode-toggle'
 import apiRequest from '@/lib/apiRequest'
 import { authService } from '@/lib/auth'
 import { useRouter } from 'next/navigation'
 // ...existing imports
import { useAuth } from '@/providers/AuthProvider'
import ChangePasswordModal from '@/components/ChangePasswordModal'
import HomeLoading from '@/components/HomeLoading'

 type ProfileForm = {
   name: string
   email: string
   company?: string
 }

 export default function SettingsPage() {
   const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileForm>({ defaultValues: { name: '', email: '', company: '' } })
   const [saving, setSaving] = useState(false)
   const [message, setMessage] = useState<string | null>(null)
   const [loading, setLoading] = useState(true)
   const router = useRouter()

   // route-level guard: redirect to login if not authenticated
   useEffect(() => {
     let mounted = true
     ;(async () => {
       const user = await authService.getCurrentUser()
       if (!mounted) return
       if (!user) {
         router.push('/auth/login')
         return
       }
  // Route-level guard: redirect unauthenticated users; prefill form from `authService`
  // to avoid an extra network roundtrip on initial client mount (keeps UX snappy).
  // prefill form with user profile where available
  const maybeCompany = (() => {
    const u = user as unknown
    if (typeof u === 'object' && u !== null && 'company' in u) {
      const comp = (u as { company?: unknown }).company
      return typeof comp === 'string' ? comp : ''
    }
    return ''
  })()
  reset({ name: user?.name ?? '', email: user?.email ?? '', company: maybeCompany })
       setLoading(false)
     })()
     return () => { mounted = false }
   }, [router, reset])

  const auth = useAuth()
  const [isOauthUser, setIsOauthUser] = useState(false)

  useEffect(() => {
    setIsOauthUser(!!auth.user?.googleId)
  }, [auth.user])

   const onSubmit = async (data: ProfileForm) => {
     try {
       setSaving(true)
       setMessage(null)
    const resp = await apiRequest<{ success: boolean; data?: unknown }>({ method: 'put', url: '/users/me', data })
       if (!resp.ok) throw new Error(resp.error || 'Failed to save')
       setMessage('Settings saved')
     } catch (err) {
       console.error('Failed to save settings', err)
       setMessage('Failed to save settings')
     } finally {
       setSaving(false)
     }
   }

   const handleChangePassword = () => {
    // open the change-password modal
    setShowChangePassword(true)
   }

  // Password modal: open an in-page modal for password updates. Disabled for OAuth users
  // because their credential management is handled by the provider (e.g., Google).

   const handleManage2FA = () => {
     router.push('/dashboard/settings#account')
   }

  const [showChangePassword, setShowChangePassword] = useState(false)

  if (loading) return <HomeLoading />

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-600 text-sm lg:text-base max-w-2xl">
              Manage your account preferences, security settings, and application configuration
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Auto-save enabled
            </div>
            <Button variant="outline" asChild className="bg-white border-gray-200 hover:bg-gray-50">
              <Link href="/dashboard">← Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Enhanced Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <a className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-gray-900 bg-blue-50 border border-blue-200" href="#profile">
                    <div className="p-1.5 bg-blue-100 rounded-md">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>Profile Information</span>
                  </a>
                  <a className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150" href="#account">
                    <div className="p-1.5 bg-gray-100 rounded-md">
                      <Settings className="h-4 w-4 text-gray-600" />
                    </div>
                    <span>Account Security</span>
                  </a>
                  <a className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150" href="#notifications">
                    <div className="p-1.5 bg-gray-100 rounded-md">
                      <Bell className="h-4 w-4 text-gray-600" />
                    </div>
                    <span>Notifications</span>
                  </a>
                  <a className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150" href="#appearance">
                    <div className="p-1.5 bg-gray-100 rounded-md">
                      <Monitor className="h-4 w-4 text-gray-600" />
                    </div>
                    <span>Appearance</span>
                  </a>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Enhanced Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {/* Enhanced Profile Section */}
            <Card id="profile" className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 text-gray-900">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  Profile Information
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Update your personal information and contact details</p>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                      <Input 
                        id="name" 
                        {...register('name', { required: 'Name is required' })} 
                        className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your full name"
                      />
                      {errors.name && <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.name.message}
                      </p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        {...register('email', { required: 'Email is required' })} 
                        className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your email address"
                      />
                      {errors.email && <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.email.message}
                      </p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium text-gray-700">Company (Optional)</Label>
                    <Input 
                      id="company" 
                      {...register('company')} 
                      className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter your company name"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {message && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700">{message}</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    >
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving profile...
                        </div>
                      ) : (
                        'Save profile'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Enhanced Account Security Section */}
            <Card id="account" className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 text-gray-900">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Settings className="h-5 w-5 text-green-600" />
                  </div>
                  Account Security
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Manage your password and two-factor authentication settings</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Settings className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Password Management</div>
                        <div className="text-xs text-gray-600">Update your account password</div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleChangePassword} 
                      disabled={isOauthUser}
                      className="w-full bg-white border-gray-200 hover:bg-gray-50"
                    >
                      Change Password
                    </Button>
                    {isOauthUser && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="text-xs text-yellow-800 flex items-center gap-1">
                          <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                          Signed in with Google — password change is not available
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Settings className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Two-Factor Authentication</div>
                        <div className="text-xs text-gray-600">Add an extra layer of security</div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleManage2FA}
                      className="w-full bg-white border-gray-200 hover:bg-gray-50"
                    >
                      Manage 2FA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Notifications Section */}
            <Card id="notifications" className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 text-gray-900">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Bell className="h-5 w-5 text-orange-600" />
                  </div>
                  Notification Preferences
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Choose what notifications you want to receive</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Campaign Reports</div>
                        <div className="text-xs text-gray-600">Receive detailed campaign performance reports via email</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Bell className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Delivery Failures</div>
                        <div className="text-xs text-gray-600">Get notified immediately when message delivery fails</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Bell className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">System Updates</div>
                        <div className="text-xs text-gray-600">Receive notifications about new features and updates</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Appearance Section */}
            <Card id="appearance" className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 text-gray-900">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Monitor className="h-5 w-5 text-purple-600" />
                  </div>
                  Appearance Settings
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Customize the look and feel of your dashboard</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Monitor className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Theme Preference</div>
                        <div className="text-xs text-gray-600">Choose between light and dark mode for your account</div>
                      </div>
                    </div>
                    <ModeToggle />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                      <div className="text-sm font-medium text-gray-900 mb-2">Light Mode</div>
                      <div className="text-xs text-gray-600 mb-3">Clean and bright interface</div>
                      <div className="w-full h-8 bg-white rounded border flex items-center px-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <div className="text-xs text-gray-600">Preview</div>
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900">
                      <div className="text-sm font-medium text-white mb-2">Dark Mode</div>
                      <div className="text-xs text-gray-300 mb-3">Easy on the eyes for extended use</div>
                      <div className="w-full h-8 bg-gray-700 rounded border border-gray-600 flex items-center px-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                        <div className="text-xs text-gray-300">Preview</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>

        <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />
      </div>
    </div>
  )
}