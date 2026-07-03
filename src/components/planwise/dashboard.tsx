"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAppStore, type PlanStep, type Financial } from "@/lib/store"
import { STAGES, CATEGORIES, STEP_STATUSES, NOTIFICATION_TYPES } from "@/lib/constants"
import { updatePlanStep } from "@/lib/api"
import {
  LayoutDashboard, ListTodo, DollarSign, Flag, Bell, ChevronRight, Plus, Sparkles, CheckCircle2, Circle, Lock, Clock, AlertTriangle, TrendingUp, Rocket, Target, BarChart3, Play, Lightbulb, Brain, Loader2, Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import { fadeIn, stagger, getIcon } from "./shared"

// ─── STAT CARD ─────────────────────────────────────────
function StatCard({ icon: Icon, label, value, trend, color, delay, subtitle }: { icon: React.ElementType; label: string; value: string; trend: "up" | "down" | "neutral"; color: string; delay: number; subtitle?: string }) {
  const colorClasses: Record<string, { bg: string; text: string; gradient: string }> = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", gradient: "from-emerald-500 to-teal-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", gradient: "from-amber-500 to-orange-600" },
    teal: { bg: "bg-teal-50", text: "text-teal-600", gradient: "from-teal-500 to-cyan-600" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", gradient: "from-violet-500 to-purple-600" },
  }
  const c = colorClasses[color] || colorClasses.emerald
  return (
    <motion.div variants={fadeIn} transition={{ delay }}>
      <Card className="border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden group">
        <CardContent className="p-4 relative">
          <div className={cn("absolute top-0 left-0 w-1 h-full bg-gradient-to-b opacity-80", c.gradient)} />
          <div className="flex items-center justify-between mb-2">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", c.bg)}>
              <Icon className={cn("w-5 h-5", c.text)} />
            </div>
            {trend === "up" && <div className="flex items-center gap-0.5 text-emerald-500"><TrendingUp className="w-3.5 h-3.5" /><span className="text-[10px] font-medium">up</span></div>}
            {trend === "down" && <div className="flex items-center gap-0.5 text-red-500"><AlertTriangle className="w-3.5 h-3.5" /><span className="text-[10px] font-medium">alert</span></div>}
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {subtitle && <p className="text-xs text-red-500 mt-0.5 font-medium">{subtitle}</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── CURRENT STEP CARD ──────────────────────────────────
function CurrentStepCard({ step, businessId, onCelebrate }: { step: PlanStep | undefined; businessId: string; onCelebrate?: () => void }) {
  const { refreshBusiness } = useAppStore()
  const [updating, setUpdating] = useState(false)

  if (!step) return <div className="text-center py-8 text-muted-foreground"><CheckCircle2 className="w-10 h-10 mx-auto mb-2" /><p>All steps completed or no active step!</p></div>

  const category = CATEGORIES[step.category as keyof typeof CATEGORIES]
  const checklistItems = JSON.parse(step.checklist || "[]") as string[]
  const completedItems = checklistItems.filter((i: string) => i.startsWith("✅") || i.startsWith("⬜") === false).length

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
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ backgroundColor: step.category === "research" ? "#6366f1" : step.category === "strategy" ? "#8b5cf6" : step.category === "financial" ? "#10b981" : step.category === "legal" ? "#64748b" : step.category === "product" ? "#0ea5e9" : step.category === "marketing" ? "#ec4899" : step.category === "operations" ? "#f97316" : "#14b8a6" }}>
          {step.stepNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px]">{category?.label || step.category}</Badge>
            <Badge className={cn("text-[10px]", STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.bg, STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.color)}>{STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.label || step.status}</Badge>
          </div>
          <h3 className="font-semibold text-lg text-foreground">{step.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
        </div>
      </div>
      {step.guidance && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 dark:bg-sky-950/30 dark:border-sky-800">
          <div className="flex items-start gap-2"><Lightbulb className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" /><p className="text-sm text-sky-700 dark:text-sky-300">{step.guidance}</p></div>
        </div>
      )}
      {step.aiTips && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 dark:bg-violet-950/30 dark:border-violet-800">
          <div className="flex items-start gap-2"><Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" /><p className="text-sm text-violet-700 dark:text-violet-300">{step.aiTips}</p></div>
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">Checklist ({completedItems}/{checklistItems.length})</p>
        <div className="space-y-1.5">
          {checklistItems.map((item: string, idx: number) => (
            <div key={idx} className={cn("flex items-center gap-2 text-sm py-1 px-2 rounded", item.startsWith("✅") ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" : item.startsWith("⬜") ? "text-muted-foreground bg-muted" : "text-muted-foreground")}>
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

// ─── QUICK ACTION ───────────────────────────────────────
function QuickAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left">
      <Icon className="w-4 h-4 text-emerald-600" />
      <span>{label}</span>
      <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
    </button>
  )
}

// ─── FINANCIAL MINI CHART ───────────────────────────────
function FinancialMiniChart({ financials }: { financials: Financial[] }) {
  const data = financials.map(f => ({ name: f.period.replace("month-", "M"), revenue: f.revenue, expenses: f.expenses, profit: f.profit, projection: f.projection }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <RechartsTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
        <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revenueGrad)" strokeWidth={2} strokeDasharray="4 2" name="Revenue (proj)" />
        <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} name="Expenses" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── ACTIVITY TIMELINE ──────────────────────────────────
function ActivityTimeline() {
  const { currentBusiness, tasks, notifications } = useAppStore()
  const biz = currentBusiness
  if (!biz) return null

  type Activity = { id: string; type: string; title: string; desc: string; time: string; icon: React.ElementType; color: string }
  const activities: Activity[] = []

  biz.planSteps?.filter(s => s.status === "completed" && s.completedAt).forEach(s => {
    activities.push({ id: s.id, type: "step", title: `Completed: ${s.title}`, desc: `Step ${s.stepNumber} of your business plan`, time: s.completedAt!, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100" })
  })

  biz.planSteps?.filter(s => (s.status === "in_progress" || s.status === "current") && s.startedAt).forEach(s => {
    activities.push({ id: `start-${s.id}`, type: "step", title: `Started: ${s.title}`, desc: `Currently working on step ${s.stepNumber}`, time: s.startedAt!, icon: Play, color: "text-amber-600 bg-amber-100" })
  })

  tasks.filter(t => t.status === "completed").forEach(t => {
    activities.push({ id: t.id, type: "task", title: `Task done: ${t.title}`, desc: t.description || "Task completed", time: t.updatedAt || t.createdAt, icon: CheckCircle2, color: "text-sky-600 bg-sky-100" })
  })

  notifications.filter(n => !n.dismissed).slice(0, 5).forEach(n => {
    activities.push({ id: n.id, type: "notif", title: n.title, desc: n.message, time: n.createdAt, icon: Bell, color: "text-violet-600 bg-violet-100" })
  })

  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const recent = activities.slice(0, 8)

  if (recent.length === 0) return null

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {recent.map((act, i) => (
            <div key={act.id} className="flex items-start gap-3">
              <div className="relative flex flex-col items-center">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", act.color)}>
                  <act.icon className="w-3.5 h-3.5" />
                </div>
                {i < recent.length - 1 && <div className="w-0.5 flex-1 bg-muted my-1" style={{ minHeight: "20px" }} />}
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <p className="text-sm font-medium text-foreground truncate">{act.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{act.desc}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(act.time).toLocaleDateString()} at {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Welcome Banner */}
      <motion.div variants={fadeIn} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-emerald-300/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-medium tracking-wide uppercase">{biz?.stage ? STAGES[biz.stage as keyof typeof STAGES]?.label : "Planning"}</div>
            {biz && <div className="px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-medium">{completedSteps}/{totalSteps} steps done</div>}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {user?.name || "Entrepreneur"}! 👋</h2>
          <p className="text-emerald-50/90 text-sm md:text-base max-w-2xl">
            {biz ? `Your "${biz.name}" business is ${progress}% complete. ${progress < 50 ? "Keep pushing — every step counts!" : progress < 100 ? "You're making great progress! Almost there." : "Congratulations! Your plan is complete!"}` : "Start building your business plan with AI-powered guidance."}
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {biz && <Button size="sm" variant="secondary" onClick={() => setActiveView("planner")} className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm"><ListTodo className="w-4 h-4 mr-2" />Continue Planning</Button>}
            <Button size="sm" variant="secondary" onClick={() => useAppStore.getState().setChatOpen(true)} className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm"><Sparkles className="w-4 h-4 mr-2" />Ask AI Advisor</Button>
            {biz && <Button size="sm" variant="secondary" onClick={() => setActiveView("analysis")} className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"><BarChart3 className="w-4 h-4 mr-2" />Run AI Analysis</Button>}
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
        <motion.div variants={fadeIn} className="md:col-span-2">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Current Step</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveView("planner")}>View All Steps <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {biz?.planSteps ? (
                <CurrentStepCard step={biz.planSteps.find(s => s.status === "current" || s.status === "in_progress")} businessId={biz.id} onCelebrate={onCelebrate} />
              ) : (
                <div className="text-center py-8 text-muted-foreground"><Rocket className="w-10 h-10 mx-auto mb-2" /><p>No business plan yet. Create one to get started!</p></div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn} className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <QuickAction icon={Sparkles} label="Ask AI for Advice" onClick={() => useAppStore.getState().setChatOpen(true)} />
              <QuickAction icon={Plus} label="Add New Task" onClick={() => setActiveView("tasks")} />
              <QuickAction icon={BarChart3} label="View Financials" onClick={() => setActiveView("financials")} />
              <QuickAction icon={Flag} label="Check Milestones" onClick={() => setActiveView("milestones")} />
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Alerts</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveView("notifications")}>See All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notifications.filter(n => !n.dismissed).slice(0, 4).map(n => (
                  <div key={n.id} className={cn("flex items-start gap-2 p-2 rounded-lg text-xs", n.read ? "bg-muted" : "bg-emerald-50 dark:bg-emerald-950/30")}>
                    {(() => { const IC = getIcon(NOTIFICATION_TYPES[n.type as keyof typeof NOTIFICATION_TYPES]?.icon || "Info"); return <IC className="w-4 h-4 shrink-0 mt-0.5" /> })()}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{n.title}</p>
                      <p className="text-muted-foreground line-clamp-1">{n.message}</p>
                    </div>
                  </div>
                ))}
                {notifications.filter(n => !n.dismissed).length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No notifications</p>}
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
              <Button variant="outline" size="sm" onClick={() => setActiveView("tasks")}>View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.filter(t => t.status !== "completed" && t.status !== "cancelled").slice(0, 5).map(t => (
                <TaskItemCompact key={t.id} task={t} />
              ))}
              {tasks.filter(t => t.status !== "completed").length === 0 && <p className="text-sm text-muted-foreground text-center py-4">All tasks completed! 🎉</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
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
              <div className="text-center py-8 text-muted-foreground"><DollarSign className="w-10 h-10 mx-auto mb-2" /><p>Set up financial projections</p></div>
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
  const { refreshTasks } = useAppStore()
  const PRIORITIES_MAP: Record<string, { label: string; bg: string; color: string }> = {
    low: { label: "Low", bg: "bg-slate-100", color: "text-slate-500" },
    medium: { label: "Medium", bg: "bg-amber-100", color: "text-amber-600" },
    high: { label: "High", bg: "bg-orange-100", color: "text-orange-600" },
    urgent: { label: "Urgent", bg: "bg-red-100", color: "text-red-600" },
  }
  const priority = PRIORITIES_MAP[task.priority] || PRIORITIES_MAP.medium
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"
  return (
    <div className={cn("flex items-center gap-3 p-2 rounded-lg text-sm", task.status === "completed" ? "bg-muted opacity-60" : isOverdue ? "bg-red-50 dark:bg-red-950/30" : "bg-card")}>
      <Circle className="w-5 h-5 text-muted-foreground" />
      <span className={cn("flex-1 truncate", task.status === "completed" && "line-through text-muted-foreground")}>{task.title}</span>
      <Badge className={cn("text-[10px]", priority.bg, priority.color)}>{priority.label}</Badge>
    </div>
  )
}
