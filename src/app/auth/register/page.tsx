"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { inputFocusBorder, inputFocusRing, statGradients, orbGradients, pageGradients, textAccentGradient } from '@/lib/dashboardTheme'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Target, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useToast } from '@/components/toast/ToastProvider'
import apiRequest from '@/lib/apiRequest'
import { useAuth } from '@/providers/AuthProvider'
import Header from '@/components/layout/Header'
import HomeLoading from '@/components/HomeLoading'
import Skeleton from '@/components/Skeleton'

function PasswordStrength({ password }: { password: string }) {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
  const passed = Object.values(checks).filter(Boolean).length
  const pct = Math.round((passed / Object.keys(checks).length) * 100)
  return (
    <div>
      <div className="w-full bg-gray-200 h-2 rounded overflow-hidden mb-2">
                        <div style={{ width: `${pct}%` }} className={`h-2 rounded bg-gradient-to-r from-green-400 to-lime-600`} />
          </div>
      <div className="text-xs text-gray-600">
        <div>Strength: {pct}%</div>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div className={checks.length ? 'text-green-600' : 'text-gray-400'}>≥8 chars</div>
          <div className={checks.upper ? 'text-green-600' : 'text-gray-400'}>Uppercase</div>
          <div className={checks.lower ? 'text-green-600' : 'text-gray-400'}>Lowercase</div>
          <div className={checks.number ? 'text-green-600' : 'text-gray-400'}>Number</div>
          <div className={checks.symbol ? 'text-green-600' : 'text-gray-400'}>Symbol</div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading: authLoading, refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; name?: string; password?: string; confirm?: string; global?: string }>({})

  const { show } = useToast()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // Show loading or redirect for authenticated users
  if (authLoading) {
    return <HomeLoading />
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
  // Client-side validation
  const newErrors: { email?: string; name?: string; password?: string; confirm?: string } = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.endsWith('@localhost') && !email.endsWith('@127.0.0.1')) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters'
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (confirm !== password) newErrors.confirm = 'Passwords do not match'
    setErrors(newErrors)
    if (Object.keys(newErrors).length) return
    
    setLoading(true)
    try {
      // Attempt to call backend register endpoint
      const res = await apiRequest({ method: 'post', url: '/auth/register', data: { email, name, password } })

      type RegisterResponse = { success?: boolean; data?: unknown; errors?: Array<{ path?: string; message?: string }>; error?: string }
      const resData = (res && (res.data as unknown)) as RegisterResponse | undefined

      if (res.ok && resData && resData.success) {
        // Mark that we should show a welcome toast once after auth refresh
        try {
          if (typeof window !== 'undefined') sessionStorage.setItem('xeno:show_welcome_toast', '1')
        } catch (e) {
          // ignore storage errors
        }

  // Inform user and then refresh auth context to get the updated user data
  show({ message: 'Account created successfully! Redirecting to dashboard...' })
        try {
          await refresh()
          router.push('/dashboard')
        } catch (refreshError) {
          // If refresh fails, still redirect but with a page reload to ensure auth state is updated
          window.location.href = '/dashboard'
        }
      } else {
        // Handle server-side validation errors and map them to inline fields
        const serverErrors = (resData && resData.errors) || (res.error ? [{ message: res.error }] : null)
        if (serverErrors) {
          const newErrors: Record<string, string> = {}
          for (const e of serverErrors) {
            // Map server `path` to our error state keys
            if (e.path) {
              // normalise common path names
              const key = e.path === 'global' ? 'global' : (e.path as keyof typeof newErrors)
              newErrors[key] = e.message || ''
            } else {
              newErrors.global = e.message || 'Registration failed'
            }
          }
          setErrors((prev) => ({ ...prev, ...newErrors }))
          // If there's a global message, show a toast with it
          if (newErrors.global) {
            show({ message: newErrors.global })
          } else {
            // Prefer field-specific message for toast if available
            const firstMsg = Object.values(newErrors).find(Boolean)
            if (firstMsg) show({ message: String(firstMsg) })
            else show({ message: 'Registration failed. Please check your input.' })
          }
        } else {
          show({ message: 'Registration failed. Please try again.' })
        }
      }
    } catch (err) {
      const { logError } = await import('@/lib/log')
  logError('Register error', err)
  show({ message: 'Registration failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
  <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${pageGradients.register}`}>
        {/* Enhanced animated background */}
        <div className="absolute inset-0">
          {/* Primary floating orbs */}
            <div className={`absolute top-1/4 left-1/6 w-72 h-72 bg-gradient-to-r ${orbGradients.primary} rounded-full blur-3xl animate-pulse`} />
            <div className={`absolute bottom-1/3 right-1/6 w-96 h-96 bg-gradient-to-r ${orbGradients.primaryAlt} rounded-full blur-3xl animate-pulse delay-1000`} />
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r ${orbGradients.center} rounded-full blur-3xl animate-pulse delay-500`} />
          
          {/* Secondary smaller orbs */}
            <div className={`absolute top-1/6 right-1/3 w-48 h-48 bg-gradient-to-r ${orbGradients.secondary1} rounded-full blur-2xl animate-pulse delay-300`} />
            <div className={`absolute bottom-1/6 left-1/3 w-56 h-56 bg-gradient-to-r ${orbGradients.secondary2} rounded-full blur-2xl animate-pulse delay-700`} />
          
          {/* Floating particles */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400/60 rounded-full animate-bounce delay-1000"></div>
            <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-400/60 rounded-full animate-bounce delay-1500"></div>
            <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-indigo-400/60 rounded-full animate-bounce delay-2000"></div>
          </div>
        </div>
        
        <div className="relative flex items-center justify-center min-h-screen p-4">
          {/* Two-column card with no gap */}
          <Card className="w-full max-w-4xl bg-white backdrop-blur-xl border-white/30 shadow-2xl rounded-2xl overflow-hidden hover:shadow-3xl transition-all duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[650px]">
              
              {/* Left Column - Branding */}
                <div className={`bg-gradient-to-br ${statGradients.indigo} p-8 flex flex-col justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">Xeno CRM</h1>
                      <div className="flex items-center gap-1 text-purple-100">
                        <Sparkles className="w-4 h-4 animate-bounce" />
                        <span className="text-sm">Professional Edition</span>
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-6 leading-tight">
                    Join thousands of
                    <span className={`block bg-gradient-to-r ${textAccentGradient} bg-clip-text text-transparent`}>
                      Success Stories
                    </span>
                  </h2>
                  
                  <p className="text-purple-100 text-base mb-6 leading-relaxed">
                    Create your account to manage customers, build intelligent segments, and launch campaigns with AI-powered insights and confidence.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-purple-100">
                      <div className={`w-2 h-2 bg-gradient-to-r ${orbGradients.dotYellow} rounded-full`} />
                      <span className="text-sm">AI-assisted message drafting & optimization</span>
                    </div>
                    <div className="flex items-center gap-3 text-purple-100">
                      <div className={`w-2 h-2 bg-gradient-to-r ${orbGradients.dotGreen} rounded-full`} />
                      <span className="text-sm">Real-time audience previews & segmentation</span>
                    </div>
                    <div className="flex items-center gap-3 text-purple-100">
                      <div className={`w-2 h-2 bg-gradient-to-r ${orbGradients.dotPurple} rounded-full`} />
                      <span className="text-sm">Advanced delivery tracking & analytics</span>
                    </div>
                  </div>
                </div>
                
                {/* Floating sparkles */}
                <div className="absolute top-6 right-6">
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-bounce delay-300" />
                </div>
                <div className="absolute bottom-6 left-6">
                  <Sparkles className="w-4 h-4 text-pink-300 animate-bounce delay-700" />
                </div>
              </div>

              {/* Right Column - Register Form */}
              <div className="bg-white p-8 flex flex-col justify-center">
                <div className="space-y-5">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Create an account</h2>
                    <p className="text-gray-600 text-sm">Secure account creation — your password is hashed and never transmitted in plain text.</p>
                  </div>
                  
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1 block">Full name</Label>
                      <Input 
                        id="name" 
                        aria-invalid={!!errors.name} 
                        aria-describedby={errors.name ? 'name-error' : undefined} 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                        className={`h-11 border-gray-200 ${inputFocusBorder} ${inputFocusRing} rounded-lg bg-background/50 transition-all duration-200`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && <p id="name-error" className="text-sm text-red-600 mt-1" role="alert">{errors.name}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1 block">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        aria-invalid={!!errors.email} 
                        aria-describedby={errors.email ? 'email-error' : undefined} 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        className={`h-11 border-gray-200 ${inputFocusBorder} ${inputFocusRing} rounded-lg bg-background/50 transition-all duration-200`}
                        placeholder="Enter your email address"
                      />
                      {errors.email && <p id="email-error" className="text-sm text-red-600 mt-1" role="alert">{errors.email}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1 block">Password</Label>
                      <div className="relative">
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"}
                          aria-invalid={!!errors.password} 
                          aria-describedby={errors.password ? 'password-error' : 'password-help'} 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          required 
                          className={`h-11 pr-10 border-gray-200 ${inputFocusBorder} ${inputFocusRing} rounded-lg bg-background/50 transition-all duration-200`}
                          placeholder="Create a strong password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                      {errors.password && <p id="password-error" className="text-sm text-red-600 mt-1" role="alert">{errors.password}</p>}
                      {!errors.password && <p id="password-help" className="sr-only">Password must be at least 8 characters and include mixed case, numbers, or symbols.</p>}
                      <div className="mt-2">
                        <PasswordStrength password={password} />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm" className="text-sm font-medium text-gray-700 mb-1 block">Confirm Password</Label>
                      <div className="relative">
                        <Input 
                          id="confirm" 
                          type={showConfirmPassword ? "text" : "password"}
                          aria-invalid={!!errors.confirm} 
                          aria-describedby={errors.confirm ? 'confirm-error' : undefined} 
                          value={confirm} 
                          onChange={(e) => setConfirm(e.target.value)} 
                          required 
                          className={`h-11 pr-10 border-gray-200 ${inputFocusBorder} ${inputFocusRing} rounded-lg bg-background/50 transition-all duration-200`}
                          placeholder="Confirm your password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {errors.global && <p className="text-sm text-red-600 mt-2" role="alert">{errors.global}</p>}
                    {errors.confirm && <p id="confirm-error" className="text-sm text-red-600 mt-2" role="alert">{errors.confirm}</p>}
                    
                    <Button 
                      type="submit"
                      disabled={loading}
                      variant="primary"
                      className="w-full h-11 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                    >
                      {loading ? (
                        <Skeleton width="w-16" height="h-4" className="bg-white/30" />
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </form>

                  {/* Navigation Links */}
                  <div className="text-center space-y-2 pt-2">
                    <Link href="/auth/login" className="text-sm text-purple-600 hover:text-blue-600 hover:underline font-medium transition-colors block">
                      Already have an account? Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
