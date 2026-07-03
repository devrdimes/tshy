"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { AnimatePresence, motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useAppStore } from "@/lib/store"
import { TooltipProvider } from "@/components/ui/tooltip"

// Landing page & auth - eager
import { LandingPage } from "@/components/tashyeed/landing-page"
import { AuthModal } from "@/components/tashyeed/auth-modal"

// Eager imports - small and always needed
import { LoadingScreen, Footer, CelebrationOverlay, fadeIn } from "@/components/planwise/shared"
import { Sidebar, NewBusinessDialog } from "@/components/planwise/sidebar"
import { Header } from "@/components/planwise/header"
import { OnboardingFlow } from "@/components/planwise/onboarding"

// Lazy imports - loaded only when needed
const Dashboard = dynamic(() => import("@/components/planwise/dashboard").then(m => ({ default: m.Dashboard })), { ssr: false })
const Planner = dynamic(() => import("@/components/planwise/planner").then(m => ({ default: m.Planner })), { ssr: false })
const TasksView = dynamic(() => import("@/components/planwise/tasks").then(m => ({ default: m.TasksView })), { ssr: false })
const Financials = dynamic(() => import("@/components/planwise/financials").then(m => ({ default: m.Financials })), { ssr: false })
const MilestonesView = dynamic(() => import("@/components/planwise/milestones").then(m => ({ default: m.MilestonesView })), { ssr: false })
const NotificationsView = dynamic(() => import("@/components/planwise/notifications").then(m => ({ default: m.NotificationsView })), { ssr: false })
const AnalysisView = dynamic(() => import("@/components/planwise/analysis").then(m => ({ default: m.AIAnalysisView })), { ssr: false })
const SettingsView = dynamic(() => import("@/components/planwise/settings").then(m => ({ default: m.SettingsView })), { ssr: false })
const ChatPanel = dynamic(() => import("@/components/planwise/chat-panel").then(m => ({ default: m.AIChatPanel })), { ssr: false })

// ─── MAIN APP ──────────────────────────────────────────
export default function TashyeedApp() {
  const {
    initialize, isLoading, activeView, setActiveView,
    chatOpen, setChatOpen, isAuthenticated, setAuth, clearAuth,
  } = useAppStore()
  const [celebrating, setCelebrating] = useState(false)
  const [newBizOpen, setNewBizOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const { theme, setTheme } = useTheme()

  // Initialize on mount
  useEffect(() => { initialize() }, [initialize])

  // Listen for unauthorized events
  useEffect(() => {
    const handler = () => { clearAuth() }
    window.addEventListener('tashyeed:unauthorized', handler)
    return () => window.removeEventListener('tashyeed:unauthorized', handler)
  }, [clearAuth])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey) {
        const views = ['dashboard', 'planner', 'tasks', 'financials', 'milestones', 'analysis', 'notifications', 'settings'] as const
        const num = parseInt(e.key)
        if (num >= 1 && num <= 8) {
          e.preventDefault()
          setActiveView(views[num - 1])
        }
        if (e.key === 'c') {
          e.preventDefault()
          setChatOpen(!chatOpen)
        }
        if (e.key === 'd') {
          e.preventDefault()
          setTheme(theme === 'dark' ? 'light' : 'dark')
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setActiveView, chatOpen, setChatOpen, theme, setTheme])

  // Auth handlers
  const handleSignIn = useCallback(() => {
    setAuthMode("signin")
    setAuthOpen(true)
  }, [])

  const handleSignUp = useCallback(() => {
    setAuthMode("signup")
    setAuthOpen(true)
  }, [])

  const handleAuthSuccess = useCallback(async (data: { user: any; token: string }) => {
    setAuth(data.token, data.user)
    setAuthOpen(false)
    // Initialize app data after auth
    await initialize()
  }, [setAuth, initialize])

  const handleSignOut = useCallback(async () => {
    try {
      const { signout } = await import('@/lib/api')
      await signout()
    } catch {
      // Ignore signout API errors
    }
    clearAuth()
  }, [clearAuth])

  // Loading screen
  if (isLoading) return <LoadingScreen />

  // Landing page (unauthenticated)
  if (!isAuthenticated || activeView === "landing") {
    return (
      <TooltipProvider delayDuration={200}>
        <LandingPage onSignIn={handleSignIn} onSignUp={handleSignUp} />
        <AuthModal
          open={authOpen}
          onOpenChange={setAuthOpen}
          onSuccess={handleAuthSuccess}
          defaultTab={authMode}
        />
      </TooltipProvider>
    )
  }

  // Onboarding flow
  if (activeView === "onboarding") return <OnboardingFlow />

  // Main app (authenticated)
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted">
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-1">
          <Sidebar newBizOpen={newBizOpen} setNewBizOpen={setNewBizOpen} />
          <main className="flex-1 flex flex-col min-h-screen">
            <Header onSignOut={handleSignOut} />
            <div className="flex-1 p-4 md:p-6 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div key={activeView} {...fadeIn} transition={{ duration: 0.2 }}>
                  {activeView === "dashboard" && <Dashboard onCelebrate={() => setCelebrating(true)} />}
                  {activeView === "planner" && <Planner onCelebrate={() => setCelebrating(true)} />}
                  {activeView === "tasks" && <TasksView />}
                  {activeView === "financials" && <Financials />}
                  {activeView === "milestones" && <MilestonesView onCelebrate={() => setCelebrating(true)} />}
                  {activeView === "notifications" && <NotificationsView />}
                  {activeView === "analysis" && <AnalysisView />}
                  {activeView === "settings" && <SettingsView onAddBusiness={() => setNewBizOpen(true)} onSignOut={handleSignOut} />}
                </motion.div>
              </AnimatePresence>
            </div>
            <Footer />
          </main>
        </div>
        <ChatPanel />
        <CelebrationOverlay show={celebrating} onComplete={() => setCelebrating(false)} />
        <NewBusinessDialog open={newBizOpen} onOpenChange={setNewBizOpen} />
      </TooltipProvider>
    </div>
  )
}
