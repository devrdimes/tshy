"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { AnimatePresence, motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useAppStore } from "@/lib/store"
import { TooltipProvider } from "@/components/ui/tooltip"

// Eager imports - small and always needed
import { LoadingScreen, Footer, CelebrationOverlay, fadeIn } from "@/components/planwise/shared"
import { Sidebar, NewBusinessDialog } from "@/components/planwise/sidebar"
import { Header } from "@/components/planwise/header"
import { OnboardingFlow } from "@/components/planwise/onboarding"

// Lazy imports - loaded only when needed to reduce initial compilation memory
const Dashboard = dynamic(() => import("@/components/planwise/dashboard").then(m => ({ default: m.Dashboard })), { ssr: false })
const Planner = dynamic(() => import("@/components/planwise/planner").then(m => ({ default: m.Planner })), { ssr: false })
const TasksView = dynamic(() => import("@/components/planwise/tasks").then(m => ({ default: m.TasksView })), { ssr: false })
const Financials = dynamic(() => import("@/components/planwise/financials").then(m => ({ default: m.Financials })), { ssr: false })
const MilestonesView = dynamic(() => import("@/components/planwise/milestones").then(m => ({ default: m.MilestonesView })), { ssr: false })
const NotificationsView = dynamic(() => import("@/components/planwise/notifications").then(m => ({ default: m.NotificationsView })), { ssr: false })
const AIAnalysisView = dynamic(() => import("@/components/planwise/analysis").then(m => ({ default: m.AIAnalysisView })), { ssr: false })
const SettingsView = dynamic(() => import("@/components/planwise/settings").then(m => ({ default: m.SettingsView })), { ssr: false })
const AIChatPanel = dynamic(() => import("@/components/planwise/chat-panel").then(m => ({ default: m.AIChatPanel })), { ssr: false })

// ─── MAIN APP ──────────────────────────────────────────
export default function PlanWiseApp() {
  const { initialize, isLoading, activeView, setActiveView, chatOpen, setChatOpen } = useAppStore()
  const [celebrating, setCelebrating] = useState(false)
  const [newBizOpen, setNewBizOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => { initialize() }, [initialize])

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

  if (isLoading) return <LoadingScreen />

  if (activeView === "onboarding") return <OnboardingFlow />

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted">
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-1">
          <Sidebar newBizOpen={newBizOpen} setNewBizOpen={setNewBizOpen} />
          <main className="flex-1 flex flex-col min-h-screen">
            <Header />
            <div className="flex-1 p-4 md:p-6 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div key={activeView} {...fadeIn} transition={{ duration: 0.2 }}>
                  {activeView === "dashboard" && <Dashboard onCelebrate={() => setCelebrating(true)} />}
                  {activeView === "planner" && <Planner onCelebrate={() => setCelebrating(true)} />}
                  {activeView === "tasks" && <TasksView />}
                  {activeView === "financials" && <Financials />}
                  {activeView === "milestones" && <MilestonesView onCelebrate={() => setCelebrating(true)} />}
                  {activeView === "notifications" && <NotificationsView />}
                  {activeView === "analysis" && <AIAnalysisView />}
                  {activeView === "settings" && <SettingsView onAddBusiness={() => setNewBizOpen(true)} />}
                </motion.div>
              </AnimatePresence>
            </div>
            <Footer />
          </main>
        </div>
        <AIChatPanel />
        <CelebrationOverlay show={celebrating} onComplete={() => setCelebrating(false)} />
        <NewBusinessDialog open={newBizOpen} onOpenChange={setNewBizOpen} />
      </TooltipProvider>
    </div>
  )
}
