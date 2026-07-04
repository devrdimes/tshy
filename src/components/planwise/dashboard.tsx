"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAppStore, type PlanStep, type Financial } from "@/lib/store"
import { STAGES, CATEGORIES, STEP_STATUSES, NOTIFICATION_TYPES } from "@/lib/constants"
import { updatePlanStep } from "@/lib/api"
import {
  LayoutDashboard, ListTodo, DollarSign, Flag, Bell, ChevronRight, Plus, CheckCircle2, Circle, Lock, Clock, AlertTriangle, TrendingUp, Rocket, Target, BarChart3, Play, Building2, Loader2, Activity, Flame, Zap, ArrowUpRight, Calendar, Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import { fadeIn, stagger, getIcon } from "./shared"

// ─── CIRCULAR PROGRESS RING ───────────────────────────────
function CircularProgress({ value, size = 120, strokeWidth = 8, label }: { value: number; size?: number; strokeWidth?: number; label?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const color = value >= 60 ? "#10b981" : value >= 30 ? "#f59e0b" : "#ef4444"

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease-in-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{value}%</span>
        {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  )
}

// ─── HEALTH SCORE WIDGET ──────────────────────────────────
function HealthScoreWidget({ progress, completedSteps, totalSteps, pendingTasks, achievedMilestones }: { progress: number; completedSteps: number; totalSteps: number; pendingTasks: number; achievedMilestones: number }) {
  const healthScore = Math.min(100, Math.round(
    (progress * 0.4) +
    (completedSteps > 0 ? 20 : 0) +
    (pendingTasks < 5 ? 15 : pendingTasks < 10 ? 10 : 5) +
    (achievedMilestones > 0 ? 15 : 5) +
    10
  ))
  const healthLabel = healthScore >= 75 ? "Excellent" : healthScore >= 50 ? "Good" : healthScore >= 30 ? "Fair" : "Needs Attention"
  const healthColor = healthScore >= 75 ? "text-emerald-600" : healthScore >= 50 ? "text-amber-600" : healthScore >= 30 ? "text-orange-600" : "text-red-600"

  return (
    <Card className="border-border shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-6">
          <CircularProgress value={healthScore} size={100} strokeWidth={7} label="Health" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">Business Health</h3>
              <Badge className={cn("text-[10px]", healthScore >= 75 ? "bg-emerald-100 text-emerald-700" : healthScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>{healthLabel}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Overall health based on progress, tasks, and milestones</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-bold text-foreground">{completedSteps}/{totalSteps}</p>
                <p className="text-[10px] text-muted-foreground">Steps</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-bold text-foreground">{pendingTasks}</p>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-bold text-foreground">{achievedMilestones}</p>
                <p className="text-[10px] text-muted-foreground">Won</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── STAT CARD ─────────────────────────────────────────
function StatCard({ icon: Icon, label, value, trend, color, delay, subtitle, sparkData }: { icon: React.ElementType; label: string; value: string; trend: "up" | "down" | "neutral"; color: string; delay: number; subtitle?: string; sparkData?: number[] }) {
  const colorClasses: Record<string, { bg: string; text: string; gradient: string; darkBg: string }> = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", gradient: "from-emerald-500 to-teal-600", darkBg: "dark:bg-emerald-950/50" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", gradient: "from-amber-500 to-orange-600", darkBg: "dark:bg-amber-950/50" },
    teal: { bg: "bg-teal-50", text: "text-teal-600", gradient: "from-teal-500 to-cyan-600", darkBg: "dark:bg-teal-950/50" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", gradient: "from-violet-500 to-purple-600", darkBg: "dark:bg-violet-950/50" },
  }
  const c = colorClasses[color] || colorClasses.emerald

  return (
    <motion.div variants={fadeIn} transition={{ delay }}>
      <Card className="border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
        <CardContent className="p-4 relative">
          <div className={cn("absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b", c.gradient)} />
          <div className="flex items-center justify-between mb-2">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-md", c.bg, c.darkBg)}>
              <Icon className={cn("w-5 h-5", c.text)} />
            </div>
            <div className="flex items-center gap-1">
              {trend === "up" && <div className="flex items-center gap-0.5 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full"><TrendingUp className="w-3 h-3" /><span className="text-[9px] font-semibold">UP</span></div>}
              {trend === "down" && <div className="flex items-center gap-0.5 text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" /><span className="text-[9px] font-semibold">ALERT</span></div>}
              {trend === "neutral" && <div className="flex items-center gap-0.5 text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full"><span className="text-[9px] font-medium">—</span></div>}
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          {subtitle && <p className="text-[10px] text-red-500 mt-0.5 font-medium">{subtitle}</p>}
          {sparkData && sparkData.length > 1 && (
            <div className="mt-2 flex items-end gap-[2px] h-6">
              {sparkData.map((v, i) => (
                <div key={i} className={cn("w-1.5 rounded-full transition-all", c.bg, c.darkBg)} style={{ height: `${Math.max(15, (v / Math.max(...sparkData)) * 100)}%` }} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── CURRENT STEP CARD ──────────────────────────────────
function CurrentStepCard({ step, businessId, onCelebrate }: { step: PlanStep | undefined; businessId: string; onCelebrate?: () => void }) {
  const { refreshBusiness } = useAppStore()
  const [updating, setUpdating] = useState(false)

  if (!step) return (
    <div className="text-center py-10">
      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <p className="font-medium text-foreground">All steps completed!</p>
      <p className="text-sm text-muted-foreground mt-1">Congratulations on your progress</p>
    </div>
  )

  const categoryColors: Record<string, string> = {
    research: "#6366f1", strategy: "#8b5cf6", financial: "#10b981", legal: "#64748b",
    product: "#0ea5e9", marketing: "#ec4899", operations: "#f97316", team: "#14b8a6"
  }
  const category = CATEGORIES[step.category as keyof typeof CATEGORIES]
  const checklistItems = JSON.parse(step.checklist || "[]") as string[]
  const completedItems = checklistItems.filter((i: string) => i.startsWith("✅")).length
  const checklistProgress = checklistItems.length > 0 ? Math.round((completedItems / checklistItems.length) * 100) : 0

  const handleStartStep = async () => {
    setUpdating(true)
    try {
      await updatePlanStep(businessId, step.id, { status: "in_progress" })
      await refreshBusiness()
    } catch (e) { console.error(e) }
    setUpdating(false)
  }

  const handleCompleteStep = async () => {
    setUpdating(true)
    try {
      await updatePlanStep(businessId, step.id, { status: "completed" })
      await refreshBusiness()
      onCelebrate?.()
    } catch (e) { console.error(e) }
    setUpdating(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg" style={{ backgroundColor: categoryColors[step.category] || "#14b8a6" }}>
          {step.stepNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="outline" className="text-[10px]">{category?.label || step.category}</Badge>
            <Badge className={cn("text-[10px]", STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.bg, STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.color)}>{STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.label || step.status}</Badge>
            <Badge variant="outline" className="text-[10px]"><Clock className="w-3 h-3 mr-1" />{step.estimatedDays}d est.</Badge>
          </div>
          <h3 className="font-semibold text-lg text-foreground">{step.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
        </div>
      </div>

      {step.guidance && (
        <div className="bg-sky-50 border-l-4 border-sky-400 rounded-r-lg p-3 dark:bg-sky-950/30 dark:border-sky-600">
          <div className="flex items-start gap-2"><Lightbulb className="w-4 h-4 text-sky-600 shrink-0 mt-0.5 animate-pulse" /><p className="text-sm text-sky-700 dark:text-sky-300">{step.guidance}</p></div>
        </div>
      )}
      {step.tips && (
        <div className="bg-violet-50 border-l-4 border-violet-400 rounded-r-lg p-3 dark:bg-violet-950/30 dark:border-violet-600">
          <div className="flex items-start gap-2"><Lightbulb className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" /><p className="text-sm text-violet-700 dark:text-violet-300">{step.tips}</p></div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">Checklist</p>
          <span className="text-xs text-muted-foreground">{completedItems}/{checklistItems.length} • {checklistProgress}%</span>
        </div>
        <Progress value={checklistProgress} className="h-1.5 mb-3" />
        <div className="space-y-1.5">
          {checklistItems.map((item: string, idx: number) => (
            <div key={idx} className={cn("flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg transition-colors", item.startsWith("✅") ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" : "text-muted-foreground bg-muted/50 hover:bg-muted")}>
              {item.startsWith("✅") ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Circle className="w-4 h-4 shrink-0" />}
              <span className={cn(item.startsWith("✅") && "line-through opacity-75")}>{item.replace(/^[✅⬜]\s*/, "")}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        {step.status === "current" && <Button onClick={handleStartStep} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all">{updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}Start Step</Button>}
        {(step.status === "in_progress" || step.status === "current") && <Button onClick={handleCompleteStep} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all">{updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}Complete Step</Button>}
      </div>
    </div>
  )
}

// ─── QUICK ACTION ───────────────────────────────────────
function QuickAction({ icon: Icon, label, description, onClick }: { icon: React.ElementType; label: string; description?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 transition-all text-left group border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800">
      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
        <Icon className="w-4 h-4 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium block">{label}</span>
        {description && <span className="text-[10px] text-muted-foreground block">{description}</span>}
      </div>
      <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
    </button>
  )
}

// ─── FINANCIAL MINI CHART ───────────────────────────────
function FinancialMiniChart({ financials }: { financials: Financial[] }) {
  const data = financials.map(f => ({ name: f.period.replace("month-", "M"), revenue: f.revenue, expenses: f.expenses, profit: f.profit, projection: f.projection }))
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/20 rounded-lg pointer-events-none" />
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.25} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" />
          <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={45} />
          <RechartsTooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border)' }} />
          <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revenueGrad)" strokeWidth={2.5} strokeDasharray="4 2" name="Revenue (proj)" />
          <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2.5} name="Expenses" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── RELATIVE TIME HELPER ──────────────────────────────────
function relativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// ─── ACTIVITY TIMELINE ──────────────────────────────────
function ActivityTimeline() {
  const { currentBusiness, tasks, notifications, setActiveView } = useAppStore()
  const biz = currentBusiness
  if (!biz) return null

  type Activity = { id: string; type: string; title: string; desc: string; time: string; icon: React.ElementType; color: string; darkColor: string }
  const activities: Activity[] = []

  biz.planSteps?.filter(s => s.status === "completed" && s.completedAt).forEach(s => {
    activities.push({ id: s.id, type: "step", title: `Completed: ${s.title}`, desc: `Step ${s.stepNumber} of your business plan`, time: s.completedAt!, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100", darkColor: "dark:text-emerald-400 dark:bg-emerald-950/50" })
  })

  biz.planSteps?.filter(s => (s.status === "in_progress" || s.status === "current") && s.startedAt).forEach(s => {
    activities.push({ id: `start-${s.id}`, type: "step", title: `Started: ${s.title}`, desc: `Currently working on step ${s.stepNumber}`, time: s.startedAt!, icon: Play, color: "text-amber-600 bg-amber-100", darkColor: "dark:text-amber-400 dark:bg-amber-950/50" })
  })

  tasks.filter(t => t.status === "completed").forEach(t => {
    activities.push({ id: t.id, type: "task", title: `Task done: ${t.title}`, desc: t.description || "Task completed", time: t.updatedAt || t.createdAt, icon: CheckCircle2, color: "text-sky-600 bg-sky-100", darkColor: "dark:text-sky-400 dark:bg-sky-950/50" })
  })

  notifications.filter(n => !n.dismissed).slice(0, 5).forEach(n => {
    activities.push({ id: n.id, type: "notif", title: n.title, desc: n.message, time: n.createdAt, icon: Bell, color: "text-violet-600 bg-violet-100", darkColor: "dark:text-violet-400 dark:bg-violet-950/50" })
  })

  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const recent = activities.slice(0, 8)

  if (recent.length === 0) return null

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px]">{recent.length} events</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0 max-h-80 overflow-y-auto pr-1">
          {recent.map((act, i) => (
            <div key={act.id} className="flex items-start gap-3 group">
              <div className="relative flex flex-col items-center">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", act.color, act.darkColor)}>
                  <act.icon className="w-3.5 h-3.5" />
                </div>
                {i < recent.length - 1 && <div className="w-0.5 flex-1 bg-gradient-to-b from-muted to-muted/30 my-1" style={{ minHeight: "24px" }} />}
              </div>
              <div className="flex-1 min-w-0 pb-3">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{act.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{act.desc}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{relativeTime(act.time)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── DASHBOARD ──────────────────────────────────────────
export function Dashboard({ onCelebrate }: { onCelebrate?: () => void }) {
  const { currentBusiness, user, tasks, notifications, setActiveView } = useAppStore()
  const biz = currentBusiness
  const stage = biz ? STAGES[biz.stage as keyof typeof STAGES] : null
  const completedSteps = biz?.planSteps?.filter(s => s.status === "completed").length ?? 0
  const totalSteps = biz?.planSteps?.length ?? 10
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed").length
  const unreadNotifs = notifications.filter(n => !n.read && !n.dismissed).length
  const achievedMilestones = biz?.milestones?.filter(m => m.status === "achieved").length ?? 0

  // Mock spark data for stat cards
  const progressSpark = [20, 25, 30, 28, 35, 40, progress]
  const taskSpark = [8, 6, 7, 5, 4, 5, pendingTasks]
  const milestoneSpark = [0, 1, 1, 2, 2, 3, achievedMilestones]
  const notifSpark = [2, 3, 1, 4, 2, 3, unreadNotifs]

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Welcome Banner */}
      <motion.div variants={fadeIn} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 md:p-8 text-white shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-emerald-300/10 rounded-full blur-2xl" />
        <div className="absolute top-10 left-1/3 w-2 h-2 bg-white/20 rounded-full animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-20 right-1/3 w-1.5 h-1.5 bg-emerald-200/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-12 left-1/2 w-2.5 h-2.5 bg-white/15 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-medium tracking-wide uppercase flex items-center gap-1.5">
              <Zap className="w-3 h-3" />{biz?.stage ? STAGES[biz.stage as keyof typeof STAGES]?.label : "Planning"}
            </div>
            {biz && <div className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-medium">{completedSteps}/{totalSteps} steps done</div>}
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[11px] font-medium flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-300" />5-day streak
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {user?.name || "Entrepreneur"}! 👋</h2>
          <p className="text-emerald-50/90 text-sm md:text-base max-w-2xl">
            {biz ? `Your "${biz.name}" business is ${progress}% complete. ${progress < 50 ? "Keep pushing — every step counts!" : progress < 100 ? "You're making great progress! Almost there." : "Congratulations! Your plan is complete!"}` : "Start building your business plan with guidance."}
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            {biz && <Button size="sm" variant="secondary" onClick={() => setActiveView("planner")} className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"><ListTodo className="w-4 h-4 mr-2" />Continue Planning</Button>}
            <Button size="sm" variant="secondary" onClick={() => useAppStore.getState().setChatOpen(true)} className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"><Lightbulb className="w-4 h-4 mr-2" />Ask Advisor</Button>
            {biz && <Button size="sm" variant="secondary" onClick={() => setActiveView("analysis")} className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm transition-all hover:-translate-y-0.5"><BarChart3 className="w-4 h-4 mr-2" />Run Business Analysis</Button>}
          </div>
        </div>
      </motion.div>

      {/* Health Score Widget */}
      <motion.div variants={fadeIn}>
        <HealthScoreWidget progress={progress} completedSteps={completedSteps} totalSteps={totalSteps} pendingTasks={pendingTasks} achievedMilestones={achievedMilestones} />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Plan Progress" value={`${progress}%`} trend={progress > 0 ? "up" : "neutral"} color="emerald" delay={0} sparkData={progressSpark} />
        <StatCard icon={ListTodo} label="Active Tasks" value={String(pendingTasks)} trend={overdueTasks > 0 ? "down" : "neutral"} color="amber" delay={0.05} subtitle={overdueTasks > 0 ? `${overdueTasks} overdue` : undefined} sparkData={taskSpark} />
        <StatCard icon={Flag} label="Milestones" value={String(achievedMilestones)} trend={achievedMilestones > 0 ? "up" : "neutral"} color="teal" delay={0.1} sparkData={milestoneSpark} />
        <StatCard icon={Bell} label="Notifications" value={String(unreadNotifs)} trend="neutral" color="violet" delay={0.15} sparkData={notifSpark} />
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div variants={fadeIn} className="md:col-span-2">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Current Step</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveView("planner")} className="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400">View All Steps <ArrowUpRight className="w-3.5 h-3.5 ml-1" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {biz?.planSteps ? (
                <CurrentStepCard step={biz.planSteps.find(s => s.status === "current" || s.status === "in_progress")} businessId={biz.id} onCelebrate={onCelebrate} />
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3"><Rocket className="w-8 h-8 text-muted-foreground" /></div>
                  <p className="font-medium text-foreground">No business plan yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Create one to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn} className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              <QuickAction icon={Lightbulb} label="Ask for Advice" description="Get personalized guidance" onClick={() => useAppStore.getState().setChatOpen(true)} />
              <QuickAction icon={Plus} label="Add New Task" description="Create a new action item" onClick={() => setActiveView("tasks")} />
              <QuickAction icon={BarChart3} label="View Financials" description="Check revenue projections" onClick={() => setActiveView("financials")} />
              <QuickAction icon={Flag} label="Check Milestones" description="Track key achievements" onClick={() => setActiveView("milestones")} />
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Alerts</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveView("notifications")} className="text-xs hover:text-emerald-600">See All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notifications.filter(n => !n.dismissed).slice(0, 4).map(n => (
                  <div key={n.id} className={cn("flex items-start gap-2.5 p-2.5 rounded-lg text-xs transition-colors hover:bg-muted/50", n.read ? "bg-muted/30" : "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900")}>
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0 mt-0.5">
                      {(() => { const IC = getIcon(NOTIFICATION_TYPES[n.type as keyof typeof NOTIFICATION_TYPES]?.icon || "Info"); return <IC className="w-3 h-3 text-emerald-600" /> })()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{n.title}</p>
                      <p className="text-muted-foreground line-clamp-1">{n.message}</p>
                    </div>
                  </div>
                ))}
                {notifications.filter(n => !n.dismissed).length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No notifications yet</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tasks & Financial Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Tasks</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setActiveView("tasks")} className="text-xs">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.filter(t => t.status !== "completed" && t.status !== "cancelled").slice(0, 5).map(t => (
                <TaskItemCompact key={t.id} task={t} />
              ))}
              {tasks.filter(t => t.status !== "completed").length === 0 && <p className="text-sm text-muted-foreground text-center py-6">All tasks completed! 🎉</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Financial Overview</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setActiveView("financials")} className="text-xs">Details</Button>
            </div>
          </CardHeader>
          <CardContent>
            {biz?.financials && biz.financials.length > 0 ? (
              <FinancialMiniChart financials={biz.financials} />
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3"><DollarSign className="w-8 h-8 text-muted-foreground" /></div>
                <p className="font-medium text-foreground">No financial data yet</p>
                <p className="text-sm text-muted-foreground mt-1">Generate projections to see your outlook</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ActivityTimeline />
    </motion.div>
  )
}

// Compact task item for dashboard
function TaskItemCompact({ task }: { task: { id: string; title: string; status: string; priority: string; dueDate: string | null } }) {
  const priorityColors: Record<string, string> = { low: "bg-slate-400", medium: "bg-amber-500", high: "bg-orange-500", urgent: "bg-red-500" }
  const PRIORITIES_MAP: Record<string, { label: string; bg: string; color: string }> = {
    low: { label: "Low", bg: "bg-slate-100", color: "text-slate-500" },
    medium: { label: "Medium", bg: "bg-amber-100", color: "text-amber-600" },
    high: { label: "High", bg: "bg-orange-100", color: "text-orange-600" },
    urgent: { label: "Urgent", bg: "bg-red-100", color: "text-red-600" },
  }
  const priority = PRIORITIES_MAP[task.priority] || PRIORITIES_MAP.medium
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"
  return (
    <div className={cn("flex items-center gap-3 p-2.5 rounded-lg text-sm transition-colors hover:bg-muted/50", task.status === "completed" ? "bg-muted/30 opacity-60" : isOverdue ? "bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900" : "bg-card")}>
      <div className={cn("w-1.5 h-6 rounded-full shrink-0", priorityColors[task.priority] || "bg-amber-500")} />
      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className={cn("flex-1 truncate", task.status === "completed" && "line-through text-muted-foreground")}>{task.title}</span>
      {task.dueDate && <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0"><Calendar className="w-3 h-3" />{new Date(task.dueDate).toLocaleDateString()}</span>}
      <Badge className={cn("text-[10px] shrink-0", priority.bg, priority.color)}>{priority.label}</Badge>
    </div>
  )
}
