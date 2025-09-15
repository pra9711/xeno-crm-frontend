"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Target, Eye, EyeOff, Chrome, Sparkles } from "lucide-react";
import { useToast } from '@/components/toast/ToastProvider'
import { authService } from '@/lib/auth'
import { useAuth } from "@/providers/AuthProvider";
import Header from "@/components/layout/Header";
import HomeLoading from '@/components/HomeLoading'
import Skeleton from '@/components/Skeleton'
import { inputFocusBorder, inputFocusRing, statGradients, orbGradients, featureGradients, pageGradients, textAccentGradient, panelGradient } from '@/lib/dashboardTheme'

export default function LoginPage() {
	const router = useRouter();
	const { user, loading } = useAuth();

  const { show } = useToast()

	// Gate demo-only UI and shortcuts behind a single env flag so
	// deterministic demo behavior cannot accidentally ship to production.
	// Tests enable this flag via `frontend/test/jest.setup.ts`.
	const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
  
	useEffect(() => {
		if (!loading && user) {
			router.push("/dashboard");
		}
	}, [user, loading, router]);

	if (loading) {
		return <HomeLoading />
	}

	if (user) {
		return null;
	}

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setTimeout(() => {
			if (useMocks && email === "demo@xeno.com" && password === "demo123") {
				try { if (typeof window !== 'undefined') sessionStorage.setItem('xeno:show_welcome_toast', '1') } catch (e) {}
				show({ message: 'Login Successful!' })
				router.push("/dashboard");
			} else {
				show({ message: 'Invalid credentials' })
			}
			setIsLoading(false);
		}, 1500);
	};

	const handleGoogleLogin = () => {
		setIsLoading(true)
		try {
			try { if (typeof window !== 'undefined') sessionStorage.setItem('xeno:show_welcome_toast', '1') } catch (e) {}
			authService.loginWithGoogleRedirect()
		} catch (err) {
			console.error('Google sign-in error:', err)
			show({ message: 'Unable to sign in' })
			setIsLoading(false)
		}
	}

	return (
		<>
			<Header />
	<div className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${pageGradients.login}`}>
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
						<div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/60 rounded-full animate-bounce delay-1000"></div>
						<div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400/60 rounded-full animate-bounce delay-1500"></div>
						<div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-indigo-400/60 rounded-full animate-bounce delay-2000"></div>
					</div>
				</div>
        
				<div className="relative flex items-center justify-center min-h-screen p-4">
					{/* Two-column card with no gap */}
					<Card className="w-full max-w-4xl bg-white backdrop-blur-xl border-white/30 shadow-2xl rounded-2xl overflow-hidden hover:shadow-3xl transition-all duration-500">
						<div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
              
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
											<div className="flex items-center gap-1 text-blue-100">
												<Sparkles className="w-4 h-4 animate-bounce" />
												<span className="text-sm">Professional Edition</span>
											</div>
										</div>
									</div>
                  
									<h2 className="text-3xl font-bold text-white mb-6 leading-tight">
										Welcome to the future of
										<span className={`block bg-gradient-to-r ${textAccentGradient} bg-clip-text text-transparent`}>
											Customer Management
										</span>
									</h2>
                  
									<p className="text-blue-100 text-base mb-6 leading-relaxed">
										Create an account to manage customers, build intelligent segments, and launch campaigns with AI-powered insights and confidence.
									</p>
                  
									<div className="space-y-3">
										<div className="flex items-center gap-3 text-blue-100">
											<div className={`w-2 h-2 bg-gradient-to-r ${orbGradients.dotYellow} rounded-full`} />
											<span className="text-sm">AI-assisted message drafting & optimization</span>
										</div>
										<div className="flex items-center gap-3 text-blue-100">
											<div className={`w-2 h-2 bg-gradient-to-r ${orbGradients.dotGreen} rounded-full`} />
											<span className="text-sm">Real-time audience previews & segmentation</span>
										</div>
										<div className="flex items-center gap-3 text-blue-100">
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

							{/* Right Column - Login Form */}
							<div className="bg-white p-8 flex flex-col justify-center">
								<div className="space-y-6">
									<div className="text-center">
										<h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
										<p className="text-gray-600 text-sm">Sign in to your account to continue</p>
									</div>
                  
									{/* Google Sign In - Primary CTA */}
									<Button 
                                     variant="outline" 
                                     className="w-full h-11 border-2 border-gray-200 bg-white hover:bg-background/50 hover:border-gray-300 hover:scale-105 transition-all duration-200 shadow-sm" 
                                     onClick={handleGoogleLogin} 
                                     disabled={isLoading}
                                    >
  {/* Real Google logo SVG */}
  <span className="inline-block w-5 h-5 mr-3 align-middle">
    <svg viewBox="0 0 48 48" width="20" height="20">
      <g>
        <path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3c-1.5 4-5.5 6.9-10.3 6.9-6 0-10.9-4.9-10.9-10.9s4.9-10.9 10.9-10.9c2.5 0 4.7.8 6.5 2.2l6.5-6.5C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.3-3.5z"/>
        <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.3 15.9 18.8 13 24 13c2.5 0 4.7.8 6.5 2.2l6.5-6.5C34.3 6.1 29.4 4 24 4c-7.2 0-13.4 3.8-16.8 9.7z"/>
        <path fill="#FBBC05" d="M24 44c5.4 0 10.3-1.8 13.9-5.2l-6.4-5.3c-2 1.4-4.5 2.2-7.5 2.2-4.7 0-8.8-3-10.3-6.9l-6.6 5.1C10.6 40.2 16.6 44 24 44z"/>
        <path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-1.5 4-5.5 6.9-10.3 6.9-3 0-5.5-.8-7.5-2.2l-6.4 5.3C13.7 42.2 18.6 44 24 44c7.2 0 13.4-3.8 16.8-9.7z"/>
      </g>
    </svg>
  </span>
  {isLoading
    ? <Skeleton width="w-28" height="h-4" className="bg-white/30" />
    : <span className="font-medium text-gray-700">Continue with Google</span>
  }
</Button>


									<div className="relative">
										<div className="absolute inset-0 flex items-center">
											<span className="w-full border-t border-gray-200" />
										</div>
										<div className="relative flex justify-center text-xs uppercase">
											<span className="bg-white px-4 text-gray-500 font-medium">Or continue with email</span>
										</div>
									</div>

									{/* Email/Password Form */}
									<form onSubmit={handleLogin} className="space-y-4">
										<div>
											<Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1 block">Email Address</Label>
											<Input 
												id="email" 
												type="email" 
												value={email} 
												onChange={(e) => setEmail(e.target.value)} 
												required 
												className={`h-11 border-gray-200 ${inputFocusBorder} ${inputFocusRing} rounded-lg bg-background/50 transition-all duration-200`}
												placeholder="Enter your email"
											/>
										</div>
                    
										<div>
											<Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1 block">Password</Label>
											<div className="relative">
												<Input 
													id="password" 
													type={showPassword ? "text" : "password"}
													value={password} 
													onChange={(e) => setPassword(e.target.value)} 
													required 
													className={`h-11 pr-10 border-gray-200 ${inputFocusBorder} ${inputFocusRing} rounded-lg bg-background/50 transition-all duration-200`}
													placeholder="Enter your password"
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
										</div>
                    
										<Button 
											type="submit" 
											variant="primary"
											className={`w-full h-11 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200`} 
											disabled={isLoading}
										>
											{isLoading ? (
													<Skeleton width="w-16" height="h-4" className="bg-white/30" />
												) : (
													"Sign In"
												)}
										</Button>
									</form>

									{/* Demo Credentials Box */}
											{useMocks ? (
												<div className={`bg-gradient-to-r ${panelGradient} border border-amber-200 rounded-lg p-3`}>
													<div className="flex items-center gap-2 mb-1">
														<div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
														<span className="text-xs font-medium text-amber-800">Demo Account</span>
													</div>
													<div className="text-xs text-amber-700 space-y-0.5">
														<p><strong>Email:</strong> demo@xeno.com</p>
														<p><strong>Password:</strong> demo123</p>
													</div>
												</div>
											) : null}

									{/* Navigation Links */}
									<div className="text-center space-y-2">
										<Link href="/auth/register" className="text-sm text-blue-600 hover:text-purple-600 hover:underline font-medium transition-colors block">
											Don't have an account? Sign up
										</Link>
                    
										<Button variant="ghost" className="text-gray-500 hover:text-gray-700 transition-colors text-sm" asChild>
											<Link href="/">← Back to Home</Link>
										</Button>
									</div>
								</div>
							</div>
						</div>
					</Card>
				</div>
			</div>
		</>
	);
}
