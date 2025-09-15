'use client'

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";
import Header from "@/components/layout/Header";
import HomeLoading from '@/components/HomeLoading'
import {
  Target,
  Users,
  TrendingUp,
  Mail,
  Shield,
  Zap,
  Star,
  ArrowRight,
  BarChart3,
  Sparkles,
  Globe,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "react-tsparticles";

const featureCardVariants = {
  hidden: { y: 70, opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 340, damping: 18, delay: 0.12 + 0.08 * i }
  }),
};

const redefTextVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.8 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 18, delay: 0.61 }
  }
};

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) return <HomeLoading />;

  // Authenticated User Experience
  if (user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
          <div className="container mx-auto px-6 py-16">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                  Welcome back, <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 bg-clip-text text-transparent">{user.name}</span>!
                </h1>
                <p className="text-lg text-gray-600">
                  Ready to continue building amazing customer relationships?
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7 mb-16">
                {[
                  {
                    label: 'Dashboard',
                    desc: 'View analytics and insights',
                    icon: BarChart3,
                    bg: 'bg-blue-100', color: 'text-blue-600',
                    link: '/dashboard'
                  },
                  {
                    label: 'Customers', desc: 'Manage customer data',
                    icon: Users, bg: 'bg-green-100', color: 'text-green-600',
                    link: '/dashboard/customers',
                  },
                  {
                    label: 'Campaigns', desc: 'Create and launch campaigns',
                    icon: Target, bg: 'bg-purple-100', color: 'text-purple-600',
                    link: '/dashboard/campaigns'
                  }
                ].map(({ label, desc, icon: Icon, bg, color, link }) => (
                  <Card
                    key={label}
                    className="group border-0 shadow-lg bg-white/80 hover:-translate-y-1 hover:shadow-xl transition cursor-pointer"
                    onClick={() => router.push(link)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 ${bg} rounded-lg`}>
                          <Icon className={`h-6 w-6 ${color}`} />
                        </div>
                        <CardTitle className="text-lg">{label}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm">{desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center">
                <Button
                  size="lg"
                  variant="primary"
                  className="px-9 py-4 text-lg rounded-xl shadow"
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Public Experience
  const handleStartTrial = () => router.push("/auth/login");
  const handleViewDemo = () => router.push("/auth/login");

  const features = [
    {
      color: "from-[#d7e5fa] to-[#b8d0fc]",
      icon: Users,
      iconColor: "text-blue-600",
      title: "AI-Powered Segmentation",
      desc: "Build dynamic customer segments with our intelligent rule builder and real-time audience analytics."
    },
    {
      color: "from-[#ffe0f0] to-[#ffe8ee]",
      icon: Mail,
      iconColor: "text-pink-600",
      title: "Omnichannel Campaigns",
      desc: "Launch personalized campaigns across multiple channels with automated delivery optimization."
    },
    {
      color: "from-[#d2f6ef] to-[#d6f3fa]",
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      title: "Advanced Analytics",
      desc: "Get deep insights with interactive dashboards, conversion tracking, and predictive analytics."
    },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#f7faff] via-[#ebedfb] to-[#eaf5fa] relative overflow-x-hidden">
        {/* Particle background */}
        <Particles
          id="tsparticles"
          className="absolute inset-0 z-0"
          options={{
            fullScreen: { enable: false },
            background: { color: { value: "transparent" } },
            fpsLimit: 60,
            particles: {
              color: { value: "#7B61FF" },
              number: { value: 38, density: { enable: true, area: 800 } },
              opacity: { value: 0.135, random: { enable: true, minimumValue: 0.07 } },
              size: { value: 2.9, random: { enable: true, minimumValue: 1.2 } },
              move: { enable: true, speed: 0.85, direction: "none", outModes: { default: "out" } },
              links: {
                enable: true,
                distance: 140,
                color: "#8B5CF6",
                opacity: 0.11,
                width: 1.5
              }
            },
            detectRetina: true
          }}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <div className="h-20" />
        {/* Main hero */}
        <div className="container mx-auto px-6 pt-20 pb-8 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <Badge
              variant="secondary"
              className="px-4 py-2 text-base font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-8 rounded-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Professional CRM Solution
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gray-900 tracking-tight leading-tight">
              Customer Success{' '}
              <motion.span
                initial="hidden"
                animate="visible"
                variants={redefTextVariants}
                className="block bg-gradient-to-r from-blue-600 via-violet-600 to-purple-500 bg-clip-text text-transparent"
                style={{
                  textShadow: '0 3px 48px rgba(113,0,255,0.14)',
                  willChange: 'transform, opacity',
                }}
              >
                Redefined
              </motion.span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Build intelligent customer segments, launch personalized campaigns at scale,
              and unlock actionable insights with our enterprise-grade CRM platform.
            </p>
            <div className="flex flex-col md:flex-row gap-5 justify-center mb-16">
              <Button size="lg" className="text-lg px-10 py-4 h-14 bg-blue-600 hover:bg-blue-700 text-white shadow rounded-xl font-semibold transition" onClick={handleStartTrial}>
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-10 py-4 h-14 rounded-xl font-semibold border-2 hover:bg-blue-50" onClick={handleViewDemo}>
                View Demo
                <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10,8 16,12 10,16 10,8"/>
                </svg>
              </Button>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              {[
                { label: "Active Users", value: "10K+", icon: Users },
                { label: "Campaigns Sent", value: "2.5M+", icon: Mail },
                { label: "Success Rate", value: "94%", icon: TrendingUp },
                { label: "Data Points", value: "50M+", icon: BarChart3 },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label ?? `stat-${idx}`} className="text-center">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-gray-500 text-base font-medium">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* Features with animated entry */}
          <AnimatePresence>
            <div className="flex flex-col md:flex-row justify-center gap-8 mb-20">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    custom={i}
                    variants={featureCardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className={`flex-1 min-w-[270px] rounded-2xl px-8 py-9 mx-auto shadow-xl border border-slate-100 bg-gradient-to-br ${f.color} backdrop-blur-md`}
                    style={{
                      filter: "blur(0px)",
                      transition: "filter 0.5s",
                      boxShadow: '0 8px 40px 0 rgba(80,100,180,0.10)'
                    }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 1.2, delay: 0.2 + 0.07 * i, repeat: Infinity, repeatType: "reverse" }}
                      className="mb-5 w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center shadow"
                    >
                      <Icon className={`w-7 h-7 ${f.iconColor}`} />
                    </motion.div>
                    <div className="font-bold text-lg text-slate-900 mb-2">{f.title}</div>
                    <div className="text-gray-700 text-base font-medium">{f.desc}</div>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
          
          {/* Enterprise-Ready Section */}
          <div className="max-w-6xl mx-auto rounded-2xl border border-slate-300 bg-white/80 px-9 py-10 my-10 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold">Enterprise-Ready Platform</h2>
              <div className="text-lg text-gray-600 mt-2">
                Built for scale with enterprise-grade security, compliance, and performance.
              </div>
            </div>
            <div className="grid md:grid-cols-3 grid-cols-2 gap-x-10 gap-y-7 items-start">
              {[
                { icon: Shield, label: "Bank-Level Security", desc: "SOC 2 compliant with end-to-end encryption" },
                { icon: Zap, label: "Lightning Performance", desc: "Sub-second response times with 99.9% uptime" },
                { icon: Globe, label: "Global Infrastructure", desc: "Multi-region deployment with CDN optimization" },
                { icon: Lock, label: "Advanced Permissions", desc: "Role-based access with logs" },
                { icon: Target, label: "API Integration", desc: "RESTful APIs with documentation" },
                { icon: Star, label: "24/7 Support", desc: "Dedicated team and priority assistance" }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={item.label ?? idx} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{item.label}</div>
                      <div className="text-gray-600 text-sm">{item.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-14 mb-5 text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-3">Ready to Transform Your CRM?</h3>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of companies using Xeno CRM to drive customer success and business growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Button
                size="lg"
                variant="primary"
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 hover:to-blue-700 px-10 py-4 h-14 text-lg shadow font-semibold rounded-xl"
                onClick={handleStartTrial}
              >
                Start Your Free Trial
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-10 py-4 h-14 text-lg rounded-xl font-semibold border-2 border-slate-300 hover:bg-slate-100"
                onClick={handleViewDemo}
              >
                Schedule a Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
