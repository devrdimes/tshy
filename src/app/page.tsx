"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore, type Business, type PlanStep, type Task, type Notification, type Milestone, type Financial, type ChatMessage, type User } from "@/lib/store"
import { STAGES, CATEGORIES, PRIORITIES, NOTIFICATION_TYPES, TASK_STATUSES, STEP_STATUSES, MILESTONE_STATUSES, MILESTONE_CATEGORIES, INDUSTRIES, REVENUE_MODELS, TARGET_MARKETS, APP_CONFIG } from "@/lib/constants"
import { fetchBusiness, updateBusiness, updatePlanStep, createTask, updateTask, deleteTask, chatWithAI, generateAITasks, getBusinessAnalysis, markNotificationRead, markAllNotificationsRead, dismissNotification, generateNotifications, generateProjections, createMilestone, updateMilestone, updateUser } from "@/lib/api"
import ReactMarkdown from "react-markdown"
import {
  LayoutDashboard, ListTodo, DollarSign, Flag, Bell, Settings, Bot, ChevronRight, ChevronLeft, Plus, Sparkles, CheckCircle2, Circle, Lock, Clock, AlertTriangle, TrendingUp, Users, Target, Rocket, Building2, Calendar, ArrowUpRight, ArrowDownRight, Search, MessageSquare, Send, X, Eye, Trash2, ChevronDown, Play, Pause, SkipForward, BarChart3, PieChart, Lightbulb, BookOpen, ExternalLink, Star, Zap, Heart, Shield, Award, Brain, Loader2, Menu, CheckCheck, MoreVertical, Info
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Area, AreaChart, ReferenceLine } from "recharts"
import { cn } from "@/lib/utils"

// ─── ICON MAP ──────────────────────────────────────────────
const iconMap: Record<string, React.ElementType> = {
  Search, Target, DollarSign, Scale: Shield, Package: Rocket, Megaphone: Zap, Settings, Users, Info, AlertTriangle, CheckCircle2, Sparkles, Clock: Clock, Flag, AlertOctagon: AlertTriangle, UserPlus: Users, Landmark: DollarSign, Brain
}

function getIcon(name: string) {
  return iconMap[name] || Circle
}

// ─── ANIMATION VARIANTS ──────────────────────────────────
const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } }
const slideIn = { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } }
const scaleIn = { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

// ─── MAIN APP ────────────────────────────────────────────
export default function PlanWiseApp() {
  const { initialize, isLoading, user, activeView, setActiveView, sidebarOpen, setSidebarOpen, chatOpen, setChatOpen, currentBusiness, businesses, setCurrentBusiness, notifications, unreadCount, tasks, setTasks, setNotifications, setUnreadCount } = useAppStore()

  useEffect(() => { initialize() }, [initialize])

  if (isLoading) return <LoadingScreen />

  if (activeView === "onboarding") return <OnboardingFlow />

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-1">
          {/* Sidebar */}
          <Sidebar />
          {/* Main Content */}
          <main className="flex-1 flex flex-col min-h-screen">
            <Header />
            <div className="flex-1 p-4 md:p-6 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div key={activeView} {...fadeIn} transition={{ duration: 0.2 }}>
                  {activeView === "dashboard" && <Dashboard />}
                  {activeView === "planner" && <Planner />}
                  {activeView === "tasks" && <TasksView />}
                  {activeView === "financials" && <Financials />}
                  {activeView === "milestones" && <MilestonesView />}
                  {activeView === "notifications" && <NotificationsView />}
                  {activeView === "settings" && <SettingsView />}
                </motion.div>
              </AnimatePresence>
            </div>
            <Footer />
          </main>
        </div>
        {/* AI Chat Panel */}
        <AIChatPanel />
      </TooltipProvider>
    </div>
  )
}

// ─── LOADING SCREEN ────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="relative mb-6">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto" />
          <Brain className="w-8 h-8 text-emerald-400 absolute top-4 left-1/2 -translate-x-1/2" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{APP_CONFIG.name}</h1>
        <p className="text-slate-400">Initializing your AI business advisor...</p>
      </motion.div>
    </div>
  )
}

// ─── SIDEBAR ───────────────────────────────────────────
function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activeView, setActiveView, currentBusiness, businesses, setCurrentBusiness, user, unreadCount } = useAppStore()
  const [bizOpen, setBizOpen] = useState(false)

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "planner", label: "Step-by-Step Plan", icon: ListTodo },
    { id: "tasks", label: "Tasks", icon: CheckCircle2 },
    { id: "financials", label: "Financial Projections", icon: DollarSign },
    { id: "milestones", label: "Milestones", icon: Flag },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-3 left-3 z-50">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent navItems={navItems} bizOpen={bizOpen} setBizOpen={setBizOpen} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <motion.aside initial={false} animate={{ width: sidebarOpen ? 280 : 72 }} transition={{ duration: 0.2 }} className={cn("hidden md:flex flex-col border-r border-slate-200 bg-white/80 backdrop-blur-sm shrink-0 overflow-hidden")}>
        <SidebarContent navItems={navItems} bizOpen={bizOpen} setBizOpen={setBizOpen} />
      </motion.aside>
    </>
  )
}

function SidebarContent({ navItems, bizOpen, setBizOpen }: { navItems: { id: string; label: string; icon: React.ElementType; badge?: number }[]; bizOpen: boolean; setBizOpen: (v: boolean) => void }) {
  const { sidebarOpen, setSidebarOpen, activeView, setActiveView, currentBusiness, businesses, setCurrentBusiness, user, unreadCount } = useAppStore()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen !== false && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{APP_CONFIG.name}</h1>
              <p className="text-[10px] text-slate-400 -mt-1">AI Business Planning</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Business selector */}
      <div className="px-3 py-3">
        <button onClick={() => setBizOpen(!bizOpen)} className={cn("w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors", "bg-slate-50 hover:bg-slate-100 border border-slate-200")}>
          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {sidebarOpen !== false ? (
            <>
              <span className="truncate flex-1 text-left">{currentBusiness?.name || "Select Business"}</span>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", bizOpen && "rotate-180")} />
            </>
          ) : null}
        </button>
        <AnimatePresence>
          {bizOpen && sidebarOpen !== false && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-1 space-y-1">
                {businesses.map((b) => (
                  <button key={b.id} onClick={() => { setCurrentBusiness(b); setBizOpen(false) }} className={cn("w-full text-left px-3 py-2 rounded-md text-sm transition-colors", currentBusiness?.id === b.id ? "bg-emerald-50 text-emerald-700 font-medium" : "hover:bg-slate-50 text-slate-600")}>
                    {b.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button onClick={() => setActiveView(item.id as typeof activeView)} className={cn("w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", isActive ? "bg-emerald-50 text-emerald-700 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700")}>
                  <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-emerald-600")} />
                  {sidebarOpen !== false && <span className="truncate">{item.label}</span>}
                  {item.badge && item.badge > 0 ? <Badge className="ml-auto bg-red-500 text-white text-[10px] h-5 min-w-5 flex items-center justify-center px-1.5">{item.badge}</Badge> : null}
                </button>
              </TooltipTrigger>
              {sidebarOpen === false && <TooltipContent side="right">{item.label}</TooltipContent>}
            </Tooltip>
          )
        })}
      </nav>

      {/* AI Chat button */}
      <div className="px-3 pb-3">
        <button onClick={() => useAppStore.getState().setChatOpen(true)} className={cn("w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md")}>
          <Sparkles className="w-5 h-5 shrink-0" />
          {sidebarOpen !== false && <span>AI Advisor</span>}
        </button>
      </div>

      {/* User & Collapse */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{user?.name?.charAt(0) || "E"}</AvatarFallback>
          </Avatar>
          {sidebarOpen !== false && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "Entrepreneur"}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.role || "CEO"}</p>
            </div>
          )}
          <Button variant="ghost" size="icon" className="hidden md:flex h-7 w-7 shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── HEADER ──────────────────────────────────────────────
function Header() {
  const { activeView, currentBusiness, user, setChatOpen, unreadCount, setActiveView } = useAppStore()
  const viewTitles: Record<string, string> = { dashboard: "Dashboard", planner: "Step-by-Step Plan", tasks: "Tasks", financials: "Financial Projections", milestones: "Milestones", notifications: "Notifications", settings: "Settings" }

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 md:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4 ml-10 md:ml-0">
          <h2 className="text-xl font-bold text-slate-800">{viewTitles[activeView] || "Dashboard"}</h2>
          {currentBusiness && activeView !== "settings" && (
            <Badge variant="secondary" className="hidden sm:flex bg-emerald-50 text-emerald-700 border-emerald-200">
              {currentBusiness.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" onClick={() => setActiveView("notifications")}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{unreadCount}</span>}
          </Button>
          <Button onClick={() => setChatOpen(true)} className="hidden sm:flex bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2 shadow-md">
            <Sparkles className="w-4 h-4" /> AI Advisor
          </Button>
        </div>
      </div>
    </header>
  )
}

// ─── FOOTER ─────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white/60 px-4 md:px-6 py-3 mt-auto">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{APP_CONFIG.name} v{APP_CONFIG.version}</span>
        <span className="flex items-center gap-1">Made with <Heart className="w-3 h-3 text-red-400" /> for entrepreneurs</span>
      </div>
    </footer>
  )
}

// ─── DASHBOARD ──────────────────────────────────────────
function Dashboard() {
  const { currentBusiness, user, tasks, notifications, setActiveView } = useAppStore()
  const biz = currentBusiness
  const stage = biz ? STAGES[biz.stage as keyof typeof STAGES] : null
  const completedSteps = biz?.planSteps?.filter(s => s.status === "completed").length ?? 0
  const totalSteps = biz?.planSteps?.length ?? 10
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed").length
  const unreadNotifs = notifications.filter(n => !n.read && !n.dismissed).length

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Welcome Banner */}
      <motion.div variants={fadeIn} className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 md:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {user?.name || "Entrepreneur"}! 👋</h2>
          <p className="text-emerald-100 text-sm md:text-base max-w-2xl">
            {biz ? `Your "${biz.name}" business is ${progress}% complete. ${progress < 50 ? "Keep pushing — every step counts!" : progress < 100 ? "You're making great progress! Almost there." : "Congratulations! Your plan is complete!"}` : "Start building your business plan with AI-powered guidance."}
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {biz && <Button size="sm" variant="secondary" onClick={() => setActiveView("planner")} className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              <ListTodo className="w-4 h-4 mr-2" /> Continue Planning
            </Button>}
            <Button size="sm" variant="secondary" onClick={() => useAppStore.getState().setChatOpen(true)} className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              <Sparkles className="w-4 h-4 mr-2" /> Ask AI Advisor
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Plan Progress" value={`${progress}%`} trend={progress > 0 ? "up" : "neutral"} color="emerald" delay={0} />
        <StatCard icon={ListTodo} label="Active Tasks" value={String(pendingTasks)} trend={overdueTasks > 0 ? "down" : "neutral"} color="amber" delay={0.05} subtitle={overdueTasks > 0 ? `${overdueTasks} overdue` : undefined} />
        <StatCard icon={Flag} label="Milestones" value={String(biz?.milestones?.filter(m => m.status === "achieved").length ?? 0)} trend="neutral" color="teal" delay={0.1} />
        <StatCard icon={Bell} label="Notifications" value={String(unreadNotifs)} trend="neutral" color="violet" delay={0.15} />
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Current Step Card */}
        <motion.div variants={fadeIn} className="md:col-span-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Current Step</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveView("planner")}>View All Steps <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {biz?.planSteps ? (
                <CurrentStepCard step={biz.planSteps.find(s => s.status === "current" || s.status === "in_progress")} businessId={biz.id} />
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Rocket className="w-10 h-10 mx-auto mb-2" />
                  <p>No business plan yet. Create one to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions & Recent Notifications */}
        <motion.div variants={fadeIn} className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickAction icon={Sparkles} label="Ask AI for Advice" onClick={() => useAppStore.getState().setChatOpen(true)} />
              <QuickAction icon={Plus} label="Add New Task" onClick={() => setActiveView("tasks")} />
              <QuickAction icon={BarChart3} label="View Financials" onClick={() => setActiveView("financials")} />
              <QuickAction icon={Flag} label="Check Milestones" onClick={() => setActiveView("milestones")} />
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Alerts</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveView("notifications")}>See All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notifications.filter(n => !n.dismissed).slice(0, 4).map(n => (
                  <div key={n.id} className={cn("flex items-start gap-2 p-2 rounded-lg text-xs", n.read ? "bg-slate-50" : "bg-emerald-50")}>
                    {(() => { const IC = getIcon(NOTIFICATION_TYPES[n.type as keyof typeof NOTIFICATION_TYPES]?.icon || "Info"); return <IC className="w-4 h-4 shrink-0 mt-0.5" /> })()}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{n.title}</p>
                      <p className="text-slate-500 line-clamp-1">{n.message}</p>
                    </div>
                  </div>
                ))}
                {notifications.filter(n => !n.dismissed).length === 0 && <p className="text-xs text-slate-400 text-center py-4">No notifications</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tasks & Financial Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Tasks</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setActiveView("tasks")}>View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.filter(t => t.status !== "completed" && t.status !== "cancelled").slice(0, 5).map(t => (
                <TaskItem key={t.id} task={t} compact />
              ))}
              {tasks.filter(t => t.status !== "completed").length === 0 && <p className="text-sm text-slate-400 text-center py-4">All tasks completed! 🎉</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Financial Overview</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setActiveView("financials")}>Details</Button>
            </div>
          </CardHeader>
          <CardContent>
            {biz?.financials && biz.financials.length > 0 ? (
              <FinancialMiniChart financials={biz.financials} />
            ) : (
              <div className="text-center py-8 text-slate-400">
                <DollarSign className="w-10 h-10 mx-auto mb-2" />
                <p>Set up financial projections</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

function StatCard({ icon: Icon, label, value, trend, color, delay, subtitle }: { icon: React.ElementType; label: string; value: string; trend: "up" | "down" | "neutral"; color: string; delay: number; subtitle?: string }) {
  return (
    <motion.div variants={fadeIn} transition={{ delay }}>
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", `bg-${color}-100`)}>
              <Icon className={cn("w-5 h-5", `text-${color}-600`)} />
            </div>
            {trend === "up" && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
            {trend === "down" && <ArrowDownRight className="w-4 h-4 text-red-500" />}
          </div>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
          {subtitle && <p className="text-xs text-red-500 mt-0.5">{subtitle}</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function CurrentStepCard({ step, businessId }: { step: PlanStep | undefined; businessId: string }) {
  const { setCurrentBusiness, currentBusiness } = useAppStore()
  const [updating, setUpdating] = useState(false)

  if (!step) return <div className="text-center py-8 text-slate-400"><CheckCircle2 className="w-10 h-10 mx-auto mb-2" /><p>All steps completed or no active step!</p></div>

  const category = CATEGORIES[step.category as keyof typeof CATEGORIES]
  const checklistItems = JSON.parse(step.checklist || "[]") as string[]
  const completedItems = checklistItems.filter(i => i.startsWith("✅") || i.startsWith("⬜") === false).length

  const handleStartStep = async () => {
    setUpdating(true)
    try {
      await updatePlanStep(businessId, step.id, { status: "in_progress" })
      const updatedBiz = await fetchBusiness(businessId)
      setCurrentBusiness(updatedBiz)
    } catch (e) { console.error(e) }
    setUpdating(false)
  }

  const handleCompleteStep = async () => {
    setUpdating(true)
    try {
      await updatePlanStep(businessId, step.id, { status: "completed" })
      const updatedBiz = await fetchBusiness(businessId)
      setCurrentBusiness(updatedBiz)
    } catch (e) { console.error(e) }
    setUpdating(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0", category?.bg || "bg-sky-100", category?.color?.replace("text-", "bg-").replace(/-\d+/, "-500") || "bg-sky-500")} style={{ backgroundColor: step.category === "research" ? "#6366f1" : step.category === "strategy" ? "#8b5cf6" : step.category === "financial" ? "#10b981" : step.category === "legal" ? "#64748b" : step.category === "product" ? "#0ea5e9" : step.category === "marketing" ? "#ec4899" : step.category === "operations" ? "#f97316" : "#14b8a6" }}>
          {step.stepNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px]">{category?.label || step.category}</Badge>
            <Badge className={cn("text-[10px]", STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.bg, STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.color)}>{STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.label || step.status}</Badge>
          </div>
          <h3 className="font-semibold text-lg text-slate-800">{step.title}</h3>
          <p className="text-sm text-slate-500 mt-1">{step.description}</p>
        </div>
      </div>
      {step.guidance && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p className="text-sm text-sky-700">{step.guidance}</p>
          </div>
        </div>
      )}
      {step.aiTips && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
            <p className="text-sm text-violet-700">{step.aiTips}</p>
          </div>
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">Checklist ({completedItems}/{checklistItems.length})</p>
        <div className="space-y-1.5">
          {checklistItems.map((item, idx) => (
            <div key={idx} className={cn("flex items-center gap-2 text-sm py-1 px-2 rounded", item.startsWith("✅") ? "text-emerald-600 bg-emerald-50" : item.startsWith("⬜") ? "text-slate-500 bg-slate-50" : "text-slate-600")}>
              {item.startsWith("✅") ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              <span>{item.replace(/^[✅⬜]\s*/, "")}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        {step.status === "current" && <Button onClick={handleStartStep} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700">{updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}Start Step</Button>}
        {(step.status === "in_progress" || step.status === "current") && <Button onClick={handleCompleteStep} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700">{updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}Complete Step</Button>}
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-left">
      <Icon className="w-4 h-4 text-emerald-600" />
      <span>{label}</span>
      <ChevronRight className="w-4 h-4 ml-auto text-slate-300" />
    </button>
  )
}

function FinancialMiniChart({ financials }: { financials: Financial[] }) {
  const data = financials.map(f => ({ name: f.period.replace("month-", "M"), revenue: f.revenue, expenses: f.expenses, profit: f.profit, projection: f.projection }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <RechartsTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
        <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revenueGrad)" strokeWidth={2} strokeDasharray="4 2" name="Revenue (proj)" />
        <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} name="Expenses" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── PLANNER (Step-by-Step) ─────────────────────────────
function Planner() {
  const { currentBusiness, setCurrentBusiness } = useAppStore()
  const [selectedStep, setSelectedStep] = useState<PlanStep | null>(null)
  const [generatingTasks, setGeneratingTasks] = useState(false)

  const biz = currentBusiness
  if (!biz) return <EmptyState icon={Rocket} title="No Business Selected" description="Select or create a business to view your plan" />

  const steps = biz.planSteps || []
  const completedSteps = steps.filter(s => s.status === "completed").length
  const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-800">Plan Progress</h3>
            <span className="text-sm font-medium text-emerald-600">{completedSteps}/{steps.length} steps • {progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex items-center gap-1 mt-3">
            {steps.map(s => (
              <Tooltip key={s.id}>
                <TooltipTrigger asChild>
                  <button onClick={() => setSelectedStep(s)} className={cn("h-2 flex-1 rounded-full transition-all", s.status === "completed" ? "bg-emerald-500" : s.status === "in_progress" || s.status === "current" ? "bg-amber-400" : "bg-slate-200")} />
                </TooltipTrigger>
                <TooltipContent>{s.title} — {STEP_STATUSES[s.status as keyof typeof STEP_STATUSES]?.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Steps Timeline */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const cat = CATEGORIES[step.category as keyof typeof CATEGORIES]
          const isSelected = selectedStep?.id === step.id
          const isLocked = step.status === "locked"
          return (
            <motion.div key={step.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Card className={cn("border shadow-sm transition-all cursor-pointer hover:shadow-md", isSelected ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200", isLocked && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Step number / status icon */}
                    <div className="relative shrink-0">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm", step.status === "completed" ? "bg-emerald-500 text-white" : step.status === "in_progress" || step.status === "current" ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-400")}>
                        {step.status === "completed" ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-5 h-5" /> : step.stepNumber}
                      </div>
                      {idx < steps.length - 1 && <div className={cn("absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-4", step.status === "completed" ? "bg-emerald-300" : "bg-slate-200")} />}
                    </div>
                    {/* Step content */}
                    <div className="flex-1 min-w-0" onClick={() => !isLocked && setSelectedStep(step)}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">{cat?.label || step.category}</Badge>
                        <Badge className={cn("text-[10px]", STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.bg, STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.color)}>{STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.label}</Badge>
                        <Badge variant="outline" className="text-[10px]"><Clock className="w-3 h-3 mr-1" />{step.estimatedDays}d</Badge>
                      </div>
                      <h4 className="font-semibold text-slate-800">{step.title}</h4>
                      <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-4 space-y-3">
                              {step.guidance && <div className="bg-sky-50 border border-sky-200 rounded-lg p-3"><div className="flex items-start gap-2"><Lightbulb className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" /><p className="text-sm text-sky-700">{step.guidance}</p></div></div>}
                              {step.aiTips && <div className="bg-violet-50 border border-violet-200 rounded-lg p-3"><div className="flex items-start gap-2"><Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" /><p className="text-sm text-violet-700">{step.aiTips}</p></div></div>}
                              <StepChecklist step={step} businessId={biz.id} />
                              <StepActions step={step} businessId={biz.id} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <ChevronRight className={cn("w-5 h-5 text-slate-300 shrink-0 transition-transform", isSelected && "rotate-90")} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function StepChecklist({ step, businessId }: { step: PlanStep; businessId: string }) {
  const { setCurrentBusiness } = useAppStore()
  const items = JSON.parse(step.checklist || "[]") as string[]

  const toggleItem = async (idx: number) => {
    const newItems = [...items]
    const item = newItems[idx]
    newItems[idx] = item.startsWith("✅") ? item.replace("✅", "⬜") : item.startsWith("⬜") ? item.replace("⬜", "✅") : "✅ " + item
    try {
      await updatePlanStep(businessId, step.id, { checklist: newItems })
      const updatedBiz = await fetchBusiness(businessId)
      setCurrentBusiness(updatedBiz)
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-600 mb-2">Checklist</p>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 cursor-pointer group" onClick={() => toggleItem(idx)}>
            <Checkbox checked={item.startsWith("✅")} className="pointer-events-none" />
            <span className={cn("text-sm", item.startsWith("✅") ? "line-through text-slate-400" : "text-slate-700")}>{item.replace(/^[✅⬜]\s*/, "")}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepActions({ step, businessId }: { step: PlanStep; businessId: string }) {
  const { setCurrentBusiness } = useAppStore()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (status: string) => {
    setLoading(true)
    try {
      await updatePlanStep(businessId, step.id, { status: status as PlanStep["status"] })
      const updatedBiz = await fetchBusiness(businessId)
      setCurrentBusiness(updatedBiz)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {step.status === "locked" && <span className="text-sm text-slate-400 flex items-center gap-1"><Lock className="w-4 h-4" /> Complete previous step to unlock</span>}
      {step.status === "current" && <Button size="sm" onClick={() => updateStatus("in_progress")} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}Start</Button>}
      {step.status === "in_progress" && <>
        <Button size="sm" onClick={() => updateStatus("completed")} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}Complete</Button>
        <Button size="sm" variant="outline" onClick={() => updateStatus("skipped")} disabled={loading}><SkipForward className="w-4 h-4 mr-1" />Skip</Button>
      </>}
      {step.status === "completed" && <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>}
    </div>
  )
}

// ─── TASKS VIEW ─────────────────────────────────────────
function TasksView() {
  const { tasks, setTasks, currentBusiness } = useAppStore()
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all")
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")
  const [newDueDate, setNewDueDate] = useState("")

  const filteredTasks = tasks.filter(t => filter === "all" || t.status === filter)
  const pending = tasks.filter(t => t.status === "pending").length
  const inProgress = tasks.filter(t => t.status === "in_progress").length
  const completed = tasks.filter(t => t.status === "completed").length
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed").length

  const handleCreateTask = async () => {
    if (!newTitle) return
    try {
      await createTask({ title: newTitle, description: newDesc, priority: newPriority, dueDate: newDueDate || null, businessId: currentBusiness?.id || null })
      const taskData = await fetchTasks(currentBusiness?.id)
      const taskList = Array.isArray(taskData) ? taskData : taskData?.tasks ?? []
      setTasks(taskList)
      setNewTitle(""); setNewDesc(""); setShowNewTask(false)
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-6">
      {/* Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{pending}</p><p className="text-xs text-slate-500">Pending</p></div></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><Loader2 className="w-5 h-5 text-sky-600" /></div><div><p className="text-2xl font-bold">{inProgress}</p><p className="text-xs text-slate-500">In Progress</p></div></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{completed}</p><p className="text-xs text-slate-500">Completed</p></div></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div><div><p className="text-2xl font-bold">{overdue}</p><p className="text-xs text-slate-500">Overdue</p></div></CardContent></Card>
      </div>

      {/* Filter & Add */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setShowNewTask(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> New Task
        </Button>
      </div>

      {/* New Task Form */}
      <AnimatePresence>
        {showNewTask && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card className="border-emerald-200 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <Input placeholder="Task title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <Textarea placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} />
                <div className="flex gap-3">
                  <Select value={newPriority} onValueChange={v => setNewPriority(v as typeof newPriority)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(PRIORITIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="w-44" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateTask} disabled={!newTitle} className="bg-emerald-600 hover:bg-emerald-700">Create Task</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNewTask(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-400"><CheckCircle2 className="w-12 h-12 mx-auto mb-3" /><p className="text-lg">No tasks {filter !== "all" ? `with status "${filter}"` : "yet"}</p></div>
        ) : filteredTasks.map(task => <TaskItem key={task.id} task={task} />)}
      </div>
    </div>
  )
}

function TaskItem({ task, compact = false }: { task: Task; compact?: boolean }) {
  const { setTasks, currentBusiness } = useAppStore()
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (status: Task["status"]) => {
    setLoading(true)
    try {
      await updateTask(task.id, { status })
      const taskData = await fetchTasks(currentBusiness?.id)
      const taskList = Array.isArray(taskData) ? taskData : taskData?.tasks ?? []
      setTasks(taskList)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteTask(task.id)
      const taskData = await fetchTasks(currentBusiness?.id)
      const taskList = Array.isArray(taskData) ? taskData : taskData?.tasks ?? []
      setTasks(taskList)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const priority = PRIORITIES[task.priority as keyof typeof PRIORITIES]
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 p-2 rounded-lg text-sm", task.status === "completed" ? "bg-slate-50 opacity-60" : isOverdue ? "bg-red-50" : "bg-white border border-slate-100")}>
        <button onClick={() => task.status !== "completed" && handleStatusChange("completed")} className="shrink-0">
          {task.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300 hover:text-emerald-400" />}
        </button>
        <span className={cn("flex-1 truncate", task.status === "completed" && "line-through text-slate-400")}>{task.title}</span>
        <Badge className={cn("text-[10px]", priority?.bg, priority?.color)}>{priority?.label}</Badge>
      </div>
    )
  }

  return (
    <Card className={cn("border shadow-sm transition-all hover:shadow-md", isOverdue && "border-red-200 bg-red-50/50")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button onClick={() => task.status === "pending" ? handleStatusChange("in_progress") : task.status === "in_progress" ? handleStatusChange("completed") : null} className="shrink-0 mt-0.5" disabled={task.status === "completed"}>
            {task.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : task.status === "in_progress" ? <Loader2 className="w-5 h-5 text-sky-500" /> : <Circle className="w-5 h-5 text-slate-300 hover:text-emerald-400" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={cn("font-medium text-sm", task.status === "completed" && "line-through text-slate-400")}>{task.title}</h4>
              <Badge className={cn("text-[10px]", priority?.bg, priority?.color)}>{priority?.label}</Badge>
              {task.aiGenerated && <Badge className="text-[10px] bg-violet-100 text-violet-700"><Sparkles className="w-3 h-3 mr-1" />AI</Badge>}
              {isOverdue && <Badge className="text-[10px] bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>}
            </div>
            {task.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>}
            {task.aiSuggestion && <div className="bg-violet-50 border border-violet-200 rounded-md p-2 mt-2 text-xs text-violet-700"><Sparkles className="w-3 h-3 inline mr-1" />{task.aiSuggestion}</div>}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              {task.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(task.dueDate).toLocaleDateString()}</span>}
              <Badge variant="outline" className="text-[10px]">{TASK_STATUSES[task.status as keyof typeof TASK_STATUSES]?.label}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {task.status === "pending" && <Button size="sm" variant="ghost" onClick={() => handleStatusChange("in_progress")}><Play className="w-4 h-4" /></Button>}
            {task.status === "in_progress" && <Button size="sm" variant="ghost" onClick={() => handleStatusChange("completed")}><CheckCircle2 className="w-4 h-4" /></Button>}
            <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── FINANCIALS VIEW ────────────────────────────────────
function Financials() {
  const { currentBusiness, setCurrentBusiness } = useAppStore()
  const [generating, setGenerating] = useState(false)
  const biz = currentBusiness

  if (!biz) return <EmptyState icon={DollarSign} title="No Business Selected" description="Select a business to view financials" />

  const financials = biz.financials || []
  const actuals = financials.filter(f => !f.projection)
  const projections = financials.filter(f => f.projection)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await generateProjections(biz.id)
      const updatedBiz = await fetchBusiness(biz.id)
      setCurrentBusiness(updatedBiz)
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  const chartData = financials.map(f => ({
    name: f.period.replace("month-", "M").replace("Q", "Q"),
    Revenue: f.revenue,
    Expenses: f.expenses,
    Profit: f.profit,
    Customers: f.customers,
    BurnRate: f.burnRate,
    projection: f.projection
  })).sort((a, b) => {
    const numA = parseInt(a.name.replace(/\D/g, '')) || 0
    const numB = parseInt(b.name.replace(/\D/g, '')) || 0
    return numA - numB
  })

  const latestActual = actuals[actuals.length - 1]
  const totalRevenue = actuals.reduce((sum, f) => sum + f.revenue, 0)
  const totalExpenses = actuals.reduce((sum, f) => sum + f.expenses, 0)
  const runway = latestActual?.runway ?? 0

  return (
    <div className="space-y-6">
      {/* Financial Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-emerald-600" /><span className="text-xs text-slate-500">Total Revenue</span></div><p className="text-xl font-bold">${totalRevenue.toLocaleString()}</p></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-red-500" /><span className="text-xs text-slate-500">Total Expenses</span></div><p className="text-xl font-bold">${totalExpenses.toLocaleString()}</p></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><BarChart3 className="w-4 h-4 text-sky-600" /><span className="text-xs text-slate-500">Net Profit</span></div><p className={cn("text-xl font-bold", totalRevenue - totalExpenses >= 0 ? "text-emerald-600" : "text-red-600")}>${(totalRevenue - totalExpenses).toLocaleString()}</p></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-amber-600" /><span className="text-xs text-slate-500">Runway</span></div><p className="text-xl font-bold">{runway > 50 ? "50+" : runway} months</p></CardContent></Card>
      </div>

      {/* Revenue vs Expenses Chart */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Revenue vs Expenses</CardTitle><CardDescription>Actual and projected financial performance</CardDescription></CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-12 text-slate-400"><DollarSign className="w-12 h-12 mx-auto mb-3" /><p>No financial data yet</p></div>}
        </CardContent>
      </Card>

      {/* Profit Trend */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Profit Trend</CardTitle><CardDescription>Monthly profit trajectory with break-even reference</CardDescription></CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.05} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: "Break-even", position: "insideTopLeft", fontSize: 10, fill: "#94a3b8" }} />
                <Area type="monotone" dataKey="Profit" stroke="#10b981" fill="url(#profitGrad)" strokeWidth={2} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-8 text-slate-400"><TrendingUp className="w-8 h-8 mx-auto mb-2" /><p>Profit trend will appear here</p></div>}
        </CardContent>
      </Card>

      {/* Generate projections button */}
      <div className="flex justify-center">
        <Button onClick={handleGenerate} disabled={generating} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md">
          {generating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating AI Projections...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate AI Projections</>}
        </Button>
      </div>
    </div>
  )
}

// ─── MILESTONES VIEW ────────────────────────────────────
function MilestonesView() {
  const { currentBusiness, setCurrentBusiness } = useAppStore()
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newCategory, setNewCategory] = useState("product")
  const [newTargetDate, setNewTargetDate] = useState("")
  const [newTargetValue, setNewTargetValue] = useState("")
  const [newMetric, setNewMetric] = useState("")
  const biz = currentBusiness

  if (!biz) return <EmptyState icon={Flag} title="No Business Selected" description="Select a business to track milestones" />

  const milestones = biz.milestones || []
  const achieved = milestones.filter(m => m.status === "achieved").length
  const inProgress = milestones.filter(m => m.status === "in_progress").length

  const handleCreate = async () => {
    if (!newTitle) return
    try {
      await createMilestone(biz.id, { title: newTitle, category: newCategory, targetDate: newTargetDate || null, targetValue: Number(newTargetValue) || 0, metric: newMetric, status: "upcoming" })
      const updatedBiz = await fetchBusiness(biz.id)
      setCurrentBusiness(updatedBiz)
      setShowNew(false); setNewTitle(""); setNewMetric(""); setNewTargetValue("")
    } catch (e) { console.error(e) }
  }

  const handleUpdateStatus = async (milestoneId: string, status: string) => {
    try {
      await updateMilestone(biz.id, milestoneId, { status: status as Milestone["status"], achievedDate: status === "achieved" ? new Date().toISOString() : undefined })
      const updatedBiz = await fetchBusiness(biz.id)
      setCurrentBusiness(updatedBiz)
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-emerald-600">{achieved}</p><p className="text-xs text-slate-500">Achieved</p></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-amber-600">{inProgress}</p><p className="text-xs text-slate-500">In Progress</p></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-slate-600">{milestones.length - achieved - inProgress}</p><p className="text-xs text-slate-500">Upcoming</p></CardContent></Card>
      </div>

      {/* Add milestone */}
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Milestones</h3>
        <Button onClick={() => setShowNew(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" />Add Milestone</Button>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card className="border-emerald-200"><CardContent className="p-4 space-y-3">
              <Input placeholder="Milestone title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <div className="flex gap-3">
                <Select value={newCategory} onValueChange={setNewCategory}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(MILESTONE_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select>
                <Input type="date" value={newTargetDate} onChange={e => setNewTargetDate(e.target.value)} className="w-44" />
              </div>
              <div className="flex gap-3">
                <Input placeholder="Metric (e.g. MRR, Users)" value={newMetric} onChange={e => setNewMetric(e.target.value)} className="flex-1" />
                <Input type="number" placeholder="Target value" value={newTargetValue} onChange={e => setNewTargetValue(e.target.value)} className="w-32" />
              </div>
              <div className="flex gap-2"><Button size="sm" onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">Create</Button><Button size="sm" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button></div>
            </CardContent></Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestones List */}
      <div className="space-y-3">
        {milestones.length === 0 ? (
          <div className="text-center py-12 text-slate-400"><Flag className="w-12 h-12 mx-auto mb-3" /><p>No milestones yet</p></div>
        ) : milestones.map(m => {
          const cat = MILESTONE_CATEGORIES[m.category as keyof typeof MILESTONE_CATEGORIES]
          const statusInfo = MILESTONE_STATUSES[m.status as keyof typeof MILESTONE_STATUSES]
          const progress = m.targetValue > 0 ? Math.min(100, Math.round((m.currentValue / m.targetValue) * 100)) : 0
          return (
            <Card key={m.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{cat?.label || m.category}</Badge>
                      <Badge className={cn("text-[10px]", statusInfo?.bg, statusInfo?.color)}>{statusInfo?.label}</Badge>
                      {m.targetDate && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(m.targetDate).toLocaleDateString()}</span>}
                    </div>
                    <h4 className="font-semibold text-slate-800">{m.title}</h4>
                    {m.description && <p className="text-sm text-slate-500 mt-0.5">{m.description}</p>}
                    {m.targetValue > 0 && <div className="mt-2"><div className="flex items-center justify-between text-xs text-slate-500 mb-1"><span>{m.metric}: {m.currentValue.toLocaleString()} / {m.targetValue.toLocaleString()}</span><span>{progress}%</span></div><Progress value={progress} className="h-2" /></div>}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-3">
                    {m.status === "upcoming" && <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(m.id, "in_progress")}><Play className="w-4 h-4" /></Button>}
                    {m.status === "in_progress" && <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(m.id, "achieved")}><CheckCircle2 className="w-4 h-4 text-emerald-600" /></Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── NOTIFICATIONS VIEW ─────────────────────────────────
function NotificationsView() {
  const { notifications, setNotifications, setUnreadCount } = useAppStore()
  const [loading, setLoading] = useState(false)

  const activeNotifications = notifications.filter(n => !n.dismissed)
  const unread = activeNotifications.filter(n => !n.read)

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      const data = await fetchNotifications()
      const notifs = data?.notifications ?? data ?? []
      setNotifications(Array.isArray(notifs) ? notifs : [])
      setUnreadCount(Array.isArray(notifs) ? notifs.filter((n: Notification) => !n.read && !n.dismissed).length : 0)
    } catch (e) { console.error(e) }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      const data = await fetchNotifications()
      const notifs = data?.notifications ?? data ?? []
      setNotifications(Array.isArray(notifs) ? notifs : [])
      setUnreadCount(0)
    } catch (e) { console.error(e) }
  }

  const handleDismiss = async (id: string) => {
    try {
      await dismissNotification(id)
      const data = await fetchNotifications()
      const notifs = data?.notifications ?? data ?? []
      setNotifications(Array.isArray(notifs) ? notifs : [])
      setUnreadCount(Array.isArray(notifs) ? notifs.filter((n: Notification) => !n.read && !n.dismissed).length : 0)
    } catch (e) { console.error(e) }
  }

  const handleGenerate = async () => {
    const { user, currentBusiness } = useAppStore.getState()
    if (!user || !currentBusiness) return
    setLoading(true)
    try {
      await generateNotifications(user.id, currentBusiness.id)
      const data = await fetchNotifications()
      const notifs = data?.notifications ?? data ?? []
      setNotifications(Array.isArray(notifs) ? notifs : [])
      setUnreadCount(Array.isArray(notifs) ? notifs.filter((n: Notification) => !n.read && !n.dismissed).length : 0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Notifications</h3>
          <p className="text-sm text-slate-500">{unread.length} unread notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={unread.length === 0}><CheckCheck className="w-4 h-4 mr-1" />Mark All Read</Button>
          <Button size="sm" onClick={handleGenerate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}Generate AI Alerts</Button>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {activeNotifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400"><Bell className="w-12 h-12 mx-auto mb-3" /><p>No notifications</p></div>
        ) : activeNotifications.map(n => {
          const typeInfo = NOTIFICATION_TYPES[n.type as keyof typeof NOTIFICATION_TYPES]
          const TypeIcon = getIcon(typeInfo?.icon || "Info")
          return (
            <Card key={n.id} className={cn("border shadow-sm transition-all", n.read ? "border-slate-200 bg-white" : "border-emerald-200 bg-emerald-50/50")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", typeInfo?.bg || "bg-sky-100")}>
                    <TypeIcon className={cn("w-5 h-5", typeInfo?.color || "text-sky-600")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-medium text-sm text-slate-800">{n.title}</h4>
                      <Badge variant="outline" className="text-[10px]">{typeInfo?.label || n.type}</Badge>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                    <p className="text-sm text-slate-600">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!n.read && <Button size="sm" variant="ghost" onClick={() => handleMarkRead(n.id)}><Eye className="w-4 h-4" /></Button>}
                    <Button size="sm" variant="ghost" onClick={() => handleDismiss(n.id)} className="text-red-400"><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── SETTINGS VIEW ──────────────────────────────────────
function SettingsView() {
  const { user, businesses } = useAppStore()
  const [name, setName] = useState(user?.name || "")
  const [company, setCompany] = useState(user?.company || "")
  const [role, setRole] = useState(user?.role || "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateUser({ name, company, role, onboarded: true })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader><CardTitle>Profile Settings</CardTitle><CardDescription>Update your personal information</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl">{name.charAt(0) || "E"}</AvatarFallback></Avatar>
            <div><p className="font-semibold text-lg">{name || "Entrepreneur"}</p><p className="text-sm text-slate-500">{role} {company ? `at ${company}` : ""}</p></div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Company</label>
            <Input value={company} onChange={e => setCompany(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <Input value={role} onChange={e => setRole(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : saved ? <><CheckCircle2 className="w-4 h-4 mr-2" />Saved!</> : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader><CardTitle>Your Businesses</CardTitle><CardDescription>Manage your business plans</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {businesses.map(b => {
              const stage = STAGES[b.stage as keyof typeof STAGES]
              const completed = b.planSteps?.filter(s => s.status === "completed").length ?? 0
              return (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-sm">{b.name}</p>
                      <p className="text-xs text-slate-500">{completed}/{b.planSteps?.length || 10} steps • {stage?.label || b.stage}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", stage?.color, stage?.bg)}>{stage?.label}</Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── AI CHAT PANEL ──────────────────────────────────────
function AIChatPanel() {
  const { chatOpen, setChatOpen, chatMessages, addChatMessage, currentBusiness, currentStep } = useAppStore()
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [chatMessages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const message = input.trim()
    setInput("")
    addChatMessage({ id: Date.now().toString(), role: "user", content: message, context: "", createdAt: new Date().toISOString() })
    setSending(true)
    try {
      const response = await chatWithAI(message, currentBusiness?.id, currentStep?.id)
      addChatMessage({ id: (Date.now() + 1).toString(), role: "assistant", content: response.content, context: "", createdAt: response.timestamp || new Date().toISOString() })
    } catch (e) {
      addChatMessage({ id: (Date.now() + 1).toString(), role: "assistant", content: "I apologize, but I encountered an error. Please try again.", context: "", createdAt: new Date().toISOString() })
    }
    setSending(false)
  }

  return (
    <AnimatePresence>
      {chatOpen && (
        <motion.div initial={{ opacity: 0, x: 400 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 400 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><Sparkles className="w-5 h-5" /></div>
                <div><h3 className="font-semibold">PlanWise AI Advisor</h3><p className="text-[10px] text-emerald-100">Your business planning expert</p></div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)} className="text-white hover:bg-white/20"><X className="w-5 h-5" /></Button>
            </div>
            {currentBusiness && <p className="text-[10px] text-emerald-100 mt-1">Context: {currentBusiness.name} • Step {currentBusiness.currentStep}/10</p>}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div ref={scrollRef} className="space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 mb-3">Ask me anything about your business plan!</p>
                  <div className="space-y-2">
                    {["What should I focus on next?", "Analyze my business strategy", "Help me with financial planning"].map(q => (
                      <button key={q} onClick={() => setInput(q)} className="block w-full text-left px-3 py-2 rounded-lg text-xs bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors">{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-emerald-600" /></div>}
                  <div className={cn("rounded-xl px-3 py-2 max-w-[85%] text-sm", msg.role === "user" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-800")}>
                    <div className="prose prose-sm max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-1 [&_strong]:font-semibold">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    <p className="text-[9px] mt-1 opacity-50">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-emerald-600" /></div>
                  <div className="bg-slate-100 rounded-xl px-4 py-3"><div className="flex gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} /><div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} /><div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} /></div></div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-slate-200">
            <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask your AI advisor..." className="flex-1" disabled={sending} />
              <Button type="submit" size="icon" disabled={sending || !input.trim()} className="bg-emerald-600 hover:bg-emerald-700 shrink-0"><Send className="w-4 h-4" /></Button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── ONBOARDING FLOW ────────────────────────────────────
function OnboardingFlow() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [bizName, setBizName] = useState("")
  const [bizIndustry, setBizIndustry] = useState("")
  const [bizDescription, setBizDescription] = useState("")
  const [bizStage, setBizStage] = useState("idea")
  const [bizTargetMarket, setBizTargetMarket] = useState("")
  const [bizRevenueModel, setBizRevenueModel] = useState("")
  const [bizCapital, setBizCapital] = useState("")
  const [creating, setCreating] = useState(false)

  const handleFinish = async () => {
    setCreating(true)
    try {
      await updateUser({ name, company, role, onboarded: true })
      if (bizName) {
        const { createBusiness } = await import("@/lib/api")
        await createBusiness({ name: bizName, description: bizDescription, industry: bizIndustry, stage: bizStage, targetMarket: bizTargetMarket, revenueModel: bizRevenueModel, initialCapital: Number(bizCapital) || 0 })
      }
      // Reload the app
      await useAppStore.getState().initialize()
    } catch (e) { console.error(e) }
    setCreating(false)
  }

  const steps = [
    // Step 0: Welcome
    <motion.div key="welcome" {...scaleIn} className="text-center max-w-lg mx-auto">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6"><Brain className="w-10 h-10 text-white" /></div>
      <h1 className="text-3xl font-bold text-slate-800 mb-3">Welcome to {APP_CONFIG.name}</h1>
      <p className="text-slate-500 mb-8">{APP_CONFIG.description}</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[{ icon: ListTodo, label: "10-Step Plan", desc: "Guided business planning" }, { icon: Sparkles, label: "AI Advisor", desc: "Expert guidance 24/7" }, { icon: TrendingUp, label: "Track Progress", desc: "Milestones & financials" }].map((f, i) => (
          <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100"><f.icon className="w-6 h-6 text-emerald-600 mx-auto mb-2" /><p className="font-medium text-sm">{f.label}</p><p className="text-[10px] text-slate-400">{f.desc}</p></div>
        ))}
      </div>
      <Button onClick={() => setStep(1)} size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg w-full">Get Started <ChevronRight className="w-5 h-5 ml-1" /></Button>
    </motion.div>,

    // Step 1: Personal Info
    <motion.div key="personal" {...scaleIn} className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Tell us about yourself</h2>
      <p className="text-slate-500 mb-6">We'll personalize your experience</p>
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-slate-700 mb-1 block">Your Name</label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah Chen" /></div>
        <div><label className="text-sm font-medium text-slate-700 mb-1 block">Company</label><Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Startup Labs" /></div>
        <div><label className="text-sm font-medium text-slate-700 mb-1 block">Your Role</label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Founder & CEO" /></div>
      </div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={() => setStep(0)}>Back</Button><Button onClick={() => setStep(2)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Continue</Button></div>
    </motion.div>,

    // Step 2: Business Info
    <motion.div key="business" {...scaleIn} className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">About your business</h2>
      <p className="text-slate-500 mb-6">This helps us create a tailored plan</p>
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-slate-700 mb-1 block">Business Name *</label><Input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="e.g. TechFlow SaaS" /></div>
        <div><label className="text-sm font-medium text-slate-700 mb-1 block">Description</label><Textarea value={bizDescription} onChange={e => setBizDescription(e.target.value)} placeholder="What does your business do?" rows={3} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-slate-700 mb-1 block">Industry</label><Select value={bizIndustry} onValueChange={setBizIndustry}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
          <div><label className="text-sm font-medium text-slate-700 mb-1 block">Stage</label><Select value={bizStage} onValueChange={setBizStage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STAGES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-slate-700 mb-1 block">Target Market</label><Select value={bizTargetMarket} onValueChange={setBizTargetMarket}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{TARGET_MARKETS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          <div><label className="text-sm font-medium text-slate-700 mb-1 block">Revenue Model</label><Select value={bizRevenueModel} onValueChange={setBizRevenueModel}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{REVENUE_MODELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div><label className="text-sm font-medium text-slate-700 mb-1 block">Initial Capital ($)</label><Input type="number" value={bizCapital} onChange={e => setBizCapital(e.target.value)} placeholder="e.g. 100000" /></div>
      </div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={() => setStep(1)}>Back</Button><Button onClick={handleFinish} disabled={creating || !bizName} className="flex-1 bg-emerald-600 hover:bg-emerald-700">{creating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : <><Rocket className="w-4 h-4 mr-2" />Launch My Plan</>}</Button></div>
    </motion.div>,
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map(i => <div key={i} className={cn("w-2.5 h-2.5 rounded-full transition-colors", step >= i ? "bg-emerald-500" : "bg-slate-300")} />)}
        </div>
        <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
      </div>
    </div>
  )
}

// ─── EMPTY STATE ────────────────────────────────────────
function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="text-center py-16 text-slate-400">
      <Icon className="w-16 h-16 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p>{description}</p>
    </div>
  )
}
