'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  Building2,
  ListTodo,
  BookOpen,
  CheckSquare,
  TrendingUp,
  Flag,
  BarChart3,
  ArrowRight,
  Menu,
  X,
  ChevronRight,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Check,
} from 'lucide-react'

import { APP_CONFIG } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'

// ─── Props ──────────────────────────────────────────────────────────────

interface LandingPageProps {
  onSignIn: () => void
  onSignUp: () => void
}

// ─── Animation Variants ─────────────────────────────────────────────────

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as any } },
}

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' as any } },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as any } },
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as any } },
}

// ─── Floating Particles Component ───────────────────────────────────────

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-[15%] left-[10%] w-20 h-20 rounded-full border border-emerald-500/10 dark:border-emerald-400/10"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute top-[60%] right-[8%] w-16 h-16 rounded-md border border-emerald-500/10 dark:border-emerald-400/10 rotate-45"
        animate={{
          y: [0, 15, 0],
          x: [0, -8, 0],
          rotate: [45, 135, 225],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute top-[30%] right-[20%] w-12 h-12 rounded-full border border-teal-500/10 dark:border-teal-400/10"
        animate={{
          y: [0, -25, 0],
          rotate: [0, -180, -360],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-[25%] left-[15%] w-14 h-14 rounded-sm border border-emerald-500/8 dark:border-emerald-400/8"
        animate={{
          y: [0, 12, 0],
          x: [0, -6, 0],
          rotate: [0, 90, 180],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      {/* Subtle dots */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-emerald-500/20 dark:bg-emerald-400/15"
          style={{
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
          }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Gradient Mesh Background ───────────────────────────────────────────

function GradientMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.04)_0%,transparent_70%)]" />
      <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.06)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.03)_0%,transparent_70%)]" />
      <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.04)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.02)_0%,transparent_60%)]" />
    </div>
  )
}

// ─── Navigation Bar ─────────────────────────────────────────────────────

function NavBar({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const scrollToSection = useCallback((id: string) => {
    setMobileOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const navLinks = [
    { label: 'Features', id: 'features' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Pricing', id: 'pricing' },
  ]

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 group"
          aria-label="Go to top"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-sm">
            <Building2 className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">
            {APP_CONFIG.name}
          </span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onSignIn} className="h-9">
            Sign In
          </Button>
          <Button
            size="sm"
            onClick={onSignUp}
            className="h-9 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
          >
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </nav>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center">
                <Building2 className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold">{APP_CONFIG.name}</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 mt-6">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
              >
                {link.label}
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-3 px-2">
            <Button variant="outline" onClick={() => { setMobileOpen(false); onSignIn() }} className="w-full">
              Sign In
            </Button>
            <Button
              onClick={() => { setMobileOpen(false); onSignUp() }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
            >
              Get Started
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </motion.header>
  )
}

// ─── Hero Section ───────────────────────────────────────────────────────

function HeroSection({ onSignUp }: { onSignUp: () => void }) {
  const scrollToHowItWorks = useCallback(() => {
    const el = document.getElementById('how-it-works')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <GradientMesh />
      <FloatingParticles />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={staggerItem} className="mb-6">
            <Badge
              variant="outline"
              className="px-3.5 py-1.5 text-xs font-medium border-emerald-500/30 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30"
            >
              Business Planning Platform
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={staggerItem}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08]"
          >
            Structure Your Vision.
            <br />
            <span className="text-emerald-600 dark:text-emerald-400">Build With Confidence.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={staggerItem}
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            {APP_CONFIG.description.replace('Tashyeed is a structured business planning platform that guides ', '').replace(' — with expert frameworks, task management, financial projections, and milestone tracking.', '.')}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={staggerItem} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={onSignUp}
              className="h-12 px-8 text-base bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
            >
              Start Building Free
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToHowItWorks}
              className="h-12 px-8 text-base"
            >
              See How It Works
            </Button>
          </motion.div>

          {/* Subtle stats */}
          <motion.div
            variants={staggerItem}
            className="mt-16 flex items-center justify-center gap-8 sm:gap-12 text-sm text-muted-foreground"
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">10</span>
              <span>Step Framework</span>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">500+</span>
              <span>Entrepreneurs</span>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">98%</span>
              <span>Satisfaction</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}

// ─── Social Proof / Trusted By ──────────────────────────────────────────

function SocialProof() {
  const companies = ['Meridian Capital', 'Vertex Partners', 'Atlas Ventures', 'Summit Group', 'Horizon Labs', 'Prism Analytics']

  return (
    <section className="py-16 border-y border-border/50 bg-muted/30">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <p className="text-sm font-medium text-muted-foreground mb-8 tracking-wide uppercase">
          Trusted by 500+ entrepreneurs worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {companies.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="text-muted-foreground/40 font-semibold text-lg tracking-tight select-none"
            >
              {name}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

// ─── Features Section ───────────────────────────────────────────────────

const features = [
  {
    icon: ListTodo,
    title: 'Structured 10-Step Plan',
    description: 'Follow a proven, step-by-step framework that takes you from market research to launch — with clear milestones along the way.',
  },
  {
    icon: BookOpen,
    title: 'Expert Frameworks',
    description: 'Leverage industry-standard frameworks like SWOT, Porter\'s Five Forces, and Business Model Canvas integrated directly into your workflow.',
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Break down each planning step into actionable tasks. Set priorities, deadlines, and track completion in real-time.',
  },
  {
    icon: TrendingUp,
    title: 'Financial Projections',
    description: 'Build revenue models, expense forecasts, and cash flow projections. Visualize break-even points and funding requirements.',
  },
  {
    icon: Flag,
    title: 'Milestone Tracking',
    description: 'Define key milestones, set target dates, and monitor progress. Stay accountable with clear markers of success.',
  },
  {
    icon: BarChart3,
    title: 'Business Analysis',
    description: 'Gain insights with competitive analysis, market sizing, and risk assessments — all structured and export-ready.',
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-16"
        >
          <motion.div variants={staggerItem}>
            <Badge variant="outline" className="mb-4 border-emerald-500/30 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30">
              Features
            </Badge>
          </motion.div>
          <motion.h2 variants={staggerItem} className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Everything you need to plan with precision
          </motion.h2>
          <motion.p variants={staggerItem} className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive toolkit designed for serious entrepreneurs who want structured, actionable business plans.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div key={feature.title} variants={staggerItem}>
                <Card className="h-full group hover:shadow-md hover:border-emerald-500/20 dark:hover:border-emerald-400/20 transition-all duration-300">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-center mb-2 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/80 transition-colors">
                      <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <CardTitle className="text-base font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="-mt-2">
                    <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ─── How It Works ───────────────────────────────────────────────────────

const steps = [
  {
    number: '01',
    title: 'Define Your Business',
    description: 'Set your industry, business stage, target market, and revenue model. Tashyeed tailors the framework to your specific context.',
  },
  {
    number: '02',
    title: 'Follow the Step-by-Step Plan',
    description: 'Work through a guided 10-step progression — from market research and competitive analysis to financial modeling and launch strategy.',
  },
  {
    number: '03',
    title: 'Track Progress & Execute',
    description: 'Monitor milestones, complete tasks, and refine financial projections. Stay on track with clear visibility into your progress.',
  },
]

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-muted/30 border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-16"
        >
          <motion.div variants={staggerItem}>
            <Badge variant="outline" className="mb-4 border-emerald-500/30 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30">
              How It Works
            </Badge>
          </motion.div>
          <motion.h2 variants={staggerItem} className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            From idea to execution in three phases
          </motion.h2>
          <motion.p variants={staggerItem} className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            A clear, structured process that transforms your business concept into a comprehensive, actionable plan.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6"
        >
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-border" aria-hidden="true" />

          {steps.map((step, index) => (
            <motion.div key={step.number} variants={staggerItem} className="relative flex flex-col items-center text-center">
              {/* Step number circle */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/20 ring-4 ring-background mb-6">
                {step.number}
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{step.description}</p>

              {/* Arrow connector (mobile only) */}
              {index < steps.length - 1 && (
                <div className="md:hidden mt-6 mb-2 text-muted-foreground/40" aria-hidden="true">
                  <ArrowRight className="w-5 h-5 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Pricing Section ────────────────────────────────────────────────────

const pricingTiers = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for exploring the platform and building your first plan.',
    features: [
      '1 business plan',
      'Basic 10-step framework',
      'Task management',
      'Milestone tracking',
      'Community support',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$29',
    period: '/mo',
    description: 'For serious entrepreneurs building multiple plans with financial modeling.',
    features: [
      'Unlimited business plans',
      'Financial projections & modeling',
      'Export to PDF & DOCX',
      'Priority support',
      'Advanced business analysis',
      'Custom frameworks',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For teams and organizations that need collaboration and scale.',
    features: [
      'Team collaboration',
      'API access',
      'Dedicated account manager',
      'Custom frameworks & branding',
      'SSO & advanced security',
      'Onboarding & training',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

function PricingSection({ onSignUp }: { onSignUp: () => void }) {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-16"
        >
          <motion.div variants={staggerItem}>
            <Badge variant="outline" className="mb-4 border-emerald-500/30 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30">
              Pricing
            </Badge>
          </motion.div>
          <motion.h2 variants={staggerItem} className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Simple, transparent pricing
          </motion.h2>
          <motion.p variants={staggerItem} className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as your business grows. No hidden fees, no surprises.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start"
        >
          {pricingTiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={staggerItem}
              className={tier.highlighted ? 'relative' : ''}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-emerald-600 dark:bg-emerald-500 text-white border-0 px-3 py-0.5 text-xs font-medium">
                    Most Popular
                  </Badge>
                </div>
              )}
              <Card
                className={`h-full relative ${
                  tier.highlighted
                    ? 'border-emerald-500/40 dark:border-emerald-400/40 shadow-lg shadow-emerald-500/5 bg-card'
                    : 'bg-card'
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">{tier.name}</CardTitle>
                  <CardDescription className="text-sm">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground tracking-tight">{tier.price}</span>
                    {tier.period && (
                      <span className="text-muted-foreground text-sm ml-1">{tier.period}</span>
                    )}
                  </div>

                  <Button
                    onClick={onSignUp}
                    className={`w-full mb-6 ${
                      tier.highlighted
                        ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white'
                        : ''
                    }`}
                    variant={tier.highlighted ? 'default' : 'outline'}
                  >
                    {tier.cta}
                  </Button>

                  <ul className="space-y-3" role="list">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── CTA Section ────────────────────────────────────────────────────────

function CTASection({ onSignUp }: { onSignUp: () => void }) {
  return (
    <section className="py-24 sm:py-32 bg-muted/30 border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center max-w-2xl mx-auto"
        >
          <motion.h2
            variants={staggerItem}
            className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight"
          >
            Ready to Build Your Business Plan?
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="mt-4 text-lg text-muted-foreground"
          >
            Start for free. No credit card required.
          </motion.p>
          <motion.div variants={staggerItem} className="mt-8">
            <Button
              size="lg"
              onClick={onSignUp}
              className="h-12 px-8 text-base bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────────

function FooterSection() {
  const footerLinks = {
    Product: ['Features', 'Pricing', 'Changelog', 'Integrations'],
    Company: ['About', 'Blog', 'Careers', 'Contact'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'],
    Support: ['Help Center', 'Documentation', 'Status', 'Community'],
  }

  const socialLinks = [
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
    { icon: Github, label: 'GitHub', href: '#' },
    { icon: Mail, label: 'Email', href: '#' },
  ]

  return (
    <footer className="py-16 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center">
                <Building2 className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight">
                {APP_CONFIG.name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {APP_CONFIG.tagline}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground mb-4">{category}</h3>
              <ul className="space-y-2.5" role="list">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2024 {APP_CONFIG.name}. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Built with precision for serious entrepreneurs.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Landing Page Component ────────────────────────────────────────

export function LandingPage({ onSignIn, onSignUp }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <NavBar onSignIn={onSignIn} onSignUp={onSignUp} />
      <main className="flex-1">
        <HeroSection onSignUp={onSignUp} />
        <SocialProof />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection onSignUp={onSignUp} />
        <CTASection onSignUp={onSignUp} />
      </main>
      <FooterSection />
    </div>
  )
}

export default LandingPage
