"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore, type PlanStep, type Task } from "@/lib/store"
import { CATEGORIES, STEP_STATUSES } from "@/lib/constants"
import { updatePlanStep, generateAITasks } from "@/lib/api"
import {
  CheckCircle2, Circle, Lock, Clock, ChevronRight, Lightbulb, Sparkles,
  Play, SkipForward, Loader2, Rocket, Search, Target, DollarSign, Shield,
  Package, Zap, Settings, Users, ListTodo, GripVertical, Trophy
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { fadeIn, EmptyState } from "./shared"

// ─── Category config for colored borders & icons ─────────────────────────
const CATEGORY_STYLES: Record<string, { border: string; bg: string; icon: React.ElementType }> = {
  research:   { border: "border-l-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30", icon: Search },
  strategy:   { border: "border-l-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30", icon: Target },
  financial:  { border: "border-l-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: DollarSign },
  legal:      { border: "border-l-slate-500", bg: "bg-slate-50 dark:bg-slate-950/30", icon: Shield },
  product:    { border: "border-l-sky-500", bg: "bg-sky-50 dark:bg-sky-950/30", icon: Package },
  marketing:  { border: "border-l-pink-500", bg: "bg-pink-50 dark:bg-pink-950/30", icon: Zap },
  operations: { border: "border-l-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30", icon: Settings },
  team:       { border: "border-l-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30", icon: Users },
}

// ─── Enhanced Checklist ─────────────────────────────────────────────────
function StepChecklist({ step, businessId }: { step: PlanStep; businessId: string }) {
  const { refreshBusiness } = useAppStore()
  const items = JSON.parse(step.checklist || "[]") as string[]
  const checkedCount = items.filter(i => i.startsWith("✅")).length
  const total = items.length
  const checkProgress = total > 0 ? Math.round((checkedCount / total) * 100) : 0

  const toggleItem = async (idx: number) => {
    const newItems = [...items]
    const item = newItems[idx]
    newItems[idx] = item.startsWith("✅") ? item.replace("✅", "⬜") : item.startsWith("⬜") ? item.replace("⬜", "✅") : "✅ " + item
    try {
      await updatePlanStep(businessId, step.id, { checklist: newItems })
      await refreshBusiness()
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">Checklist</p>
        <span className="text-xs text-muted-foreground">{checkedCount}/{total} complete</span>
      </div>
      {/* Micro progress bar */}
      <div className="h-1.5 rounded-full bg-muted mb-3 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${checkProgress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const isChecked = item.startsWith("✅")
          return (
            <div
              key={idx}
              className="flex items-center gap-2 cursor-pointer group rounded-md px-1.5 py-1 hover:bg-muted/50 transition-colors"
              onClick={() => toggleItem(idx)}
            >
              <motion.div
                initial={false}
                animate={{ scale: isChecked ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                <Checkbox checked={isChecked} className="pointer-events-none" />
              </motion.div>
              <span className={cn(
                "text-sm transition-all duration-300",
                isChecked ? "line-through text-muted-foreground" : "text-foreground"
              )}>
                {item.replace(/^[✅⬜]\s*/, "")}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step Actions ─────────────────────────────────────────────────────────
function StepActions({ step, businessId, onCelebrate }: { step: PlanStep; businessId: string; onCelebrate?: () => void }) {
  const { refreshBusiness } = useAppStore()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (status: string) => {
    setLoading(true)
    try {
      await updatePlanStep(businessId, step.id, { status: status as PlanStep["status"] })
      await refreshBusiness()
      if (status === "completed") onCelebrate?.()
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {step.status === "locked" && <span className="text-sm text-muted-foreground flex items-center gap-1"><Lock className="w-4 h-4" /> Complete previous step to unlock</span>}
      {step.status === "current" && <Button size="sm" onClick={() => updateStatus("in_progress")} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}Start</Button>}
      {step.status === "in_progress" && <>
        <Button size="sm" onClick={() => updateStatus("completed")} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}Complete</Button>
        <Button size="sm" variant="outline" onClick={() => updateStatus("skipped")} disabled={loading}><SkipForward className="w-4 h-4 mr-1" />Skip</Button>
      </>}
      {step.status === "completed" && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>}
      {step.status === "skipped" && <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><SkipForward className="w-3 h-3 mr-1" />Skipped</Badge>}
    </div>
  )
}

// ─── Step Tasks Section (New Feature) ────────────────────────────────────
function StepTasksSection({ step, businessId }: { step: PlanStep; businessId: string }) {
  const { tasks, refreshTasks } = useAppStore()
  const [generating, setGenerating] = useState(false)

  const stepTasks = tasks.filter(t => t.planStepId === step.id)
  const completedStepTasks = stepTasks.filter(t => t.status === "completed").length

  const handleGenerateAITasks = async () => {
    setGenerating(true)
    try {
      await generateAITasks(businessId, step.id)
      await refreshTasks()
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  const handleToggleTask = async (task: Task) => {
    try {
      const { updateTask } = await import("@/lib/api")
      const newStatus = task.status === "completed" ? "pending" : "completed"
      await updateTask(task.id, { status: newStatus })
      await refreshTasks()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <ListTodo className="w-3.5 h-3.5" />
          Tasks for this step
        </p>
        {stepTasks.length > 0 && (
          <span className="text-xs text-muted-foreground">{completedStepTasks}/{stepTasks.length} done</span>
        )}
      </div>
      {stepTasks.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {stepTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleToggleTask(task)}
            >
              <motion.div initial={false} animate={{ scale: task.status === "completed" ? [1, 1.2, 1] : 1 }} transition={{ duration: 0.3 }}>
                {task.status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                )}
              </motion.div>
              <span className={cn("text-sm flex-1", task.status === "completed" && "line-through text-muted-foreground")}>
                {task.title}
              </span>
              {task.aiGenerated && <Sparkles className="w-3 h-3 text-violet-500" />}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-3">No tasks yet for this step.</p>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={handleGenerateAITasks}
        disabled={generating}
        className="w-full"
      >
        {generating ? (
          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating...</>
        ) : (
          <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Generate AI Tasks</>
        )}
      </Button>
    </div>
  )
}

// ─── Main Planner Component ────────────────────────────────────────────────
export function Planner({ onCelebrate }: { onCelebrate?: () => void }) {
  const { currentBusiness, tasks } = useAppStore()
  const [selectedStep, setSelectedStep] = useState<PlanStep | null>(null)

  const biz = currentBusiness
  if (!biz) return <EmptyState icon={Rocket} title="No Business Selected" description="Select or create a business to view your plan" />

  const steps = biz.planSteps || []
  const completedSteps = steps.filter(s => s.status === "completed").length
  const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0

  // Milestone positions (25%, 50%, 75%, 100%)
  const milestones = [25, 50, 75, 100]

  return (
    <div className="space-y-6">
      {/* ── Enhanced Progress Bar Card ─────────────────────────────── */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Plan Progress</h3>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{completedSteps}/{steps.length} steps &bull; {progress}%</span>
          </div>
          {/* Animated gradient progress bar */}
          <div className="relative h-4 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full relative"
              style={{
                background: "linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6, #f59e0b)",
                backgroundSize: "200% 100%",
                animation: "shimmer 3s ease infinite",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Percentage text inside the bar */}
              {progress > 15 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm">
                  {progress}%
                </span>
              )}
            </motion.div>
            {/* Milestone markers */}
            {milestones.map(m => (
              <div
                key={m}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${m}%`, transform: `translate(-50%, -50%) rotate(45deg)` }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "w-2.5 h-2.5 border-2 border-white shadow-sm",
                      progress >= m ? "bg-emerald-400" : "bg-muted-foreground/30"
                    )} />
                  </TooltipTrigger>
                  <TooltipContent>{m}% milestone{progress >= m ? " ✓" : ""}</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
          {/* Completion celebration text */}
          <AnimatePresence>
            {progress === 100 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 mt-3 text-emerald-600 dark:text-emerald-400"
              >
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-semibold">Congratulations! All steps completed! 🎉</span>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Step progress dots */}
          <div className="flex items-center gap-1 mt-3">
            {steps.map(s => (
              <Tooltip key={s.id}>
                <TooltipTrigger asChild>
                  <button onClick={() => setSelectedStep(s)} className={cn("h-2 flex-1 rounded-full transition-all", s.status === "completed" ? "bg-emerald-500" : s.status === "in_progress" || s.status === "current" ? "bg-amber-400" : "bg-muted")} />
                </TooltipTrigger>
                <TooltipContent>{s.title} — {STEP_STATUSES[s.status as keyof typeof STEP_STATUSES]?.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Enhanced Step Cards ─────────────────────────────────────── */}
      <div className="space-y-0">
        {steps.map((step, idx) => {
          const cat = CATEGORIES[step.category as keyof typeof CATEGORIES]
          const catStyle = CATEGORY_STYLES[step.category] || CATEGORY_STYLES.research
          const CatIcon = catStyle.icon
          const isSelected = selectedStep?.id === step.id
          const isLocked = step.status === "locked"
          const isActive = step.status === "in_progress" || step.status === "current"

          // Calculate estimated time remaining
          const timeRemaining = (() => {
            if (step.status === "completed" || step.status === "skipped") return null
            if (step.startedAt) {
              const started = new Date(step.startedAt)
              const elapsed = Math.floor((Date.now() - started.getTime()) / (1000 * 60 * 60 * 24))
              const remaining = step.estimatedDays - elapsed
              if (remaining > 0) return `${remaining} day${remaining > 1 ? "s" : ""} left`
              if (remaining === 0) return "Due today"
              return `${Math.abs(remaining)} day${Math.abs(remaining) > 1 ? "s" : ""} overdue`
            }
            return `${step.estimatedDays}d estimated`
          })()

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="relative"
            >
              {/* Step connection line between cards */}
              {idx < steps.length - 1 && (
                <div className={cn(
                  "absolute left-[23px] top-[56px] w-0.5 z-0",
                  step.status === "completed" ? "bg-emerald-300 dark:bg-emerald-700" : "bg-border"
                )} style={{ height: "16px" }} />
              )}
              <Card className={cn(
                "border shadow-sm transition-all cursor-pointer",
                // Colored left border by category
                "border-l-4",
                catStyle.border,
                isSelected
                  ? "border-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800 shadow-md"
                  : "border-border hover:shadow-md",
                isLocked && "opacity-60",
                // Hover glow effect on active steps
                isActive && !isSelected && "hover:shadow-emerald-100 dark:hover:shadow-emerald-950/30 hover:shadow-lg",
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Step number / status icon */}
                    <div className="relative shrink-0">
                      <motion.div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
                          step.status === "completed" ? "bg-emerald-500 text-white" :
                          step.status === "in_progress" || step.status === "current" ? "bg-amber-400 text-white" :
                          "bg-muted text-muted-foreground"
                        )}
                        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                        transition={isActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                      >
                        {step.status === "completed" ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-5 h-5" /> : step.stepNumber}
                      </motion.div>
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => !isLocked && setSelectedStep(isSelected ? null : step)}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{cat?.label || step.category}</Badge>
                        <Badge className={cn("text-[10px]", STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.bg, STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.color)}>
                          {STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]"><Clock className="w-3 h-3 mr-1" />{timeRemaining}</Badge>
                      </div>
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>

                      {/* Expanded step details */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-4 space-y-3">
                              {/* Enhanced Guidance box with gradient left border */}
                              {step.guidance && (
                                <div className="rounded-lg overflow-hidden border border-sky-200 dark:border-sky-800">
                                  <div className="flex items-start gap-2 bg-sky-50 dark:bg-sky-950/30 p-3 border-l-4 border-l-sky-500">
                                    <motion.div
                                      animate={{ scale: [1, 1.15, 1] }}
                                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                      <Lightbulb className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                                    </motion.div>
                                    <p className="text-sm text-sky-700 dark:text-sky-300">{step.guidance}</p>
                                  </div>
                                </div>
                              )}
                              {/* Enhanced AI Tips box with gradient left border */}
                              {step.aiTips && (
                                <div className="rounded-lg overflow-hidden border border-violet-200 dark:border-violet-800">
                                  <div className="flex items-start gap-2 bg-violet-50 dark:bg-violet-950/30 p-3 border-l-4 border-l-violet-500">
                                    <motion.div
                                      animate={{ scale: [1, 1.15, 1] }}
                                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                    >
                                      <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                                    </motion.div>
                                    <p className="text-sm text-violet-700 dark:text-violet-300">{step.aiTips}</p>
                                  </div>
                                </div>
                              )}
                              <StepChecklist step={step} businessId={biz.id} />
                              <StepTasksSection step={step} businessId={biz.id} />
                              <StepActions step={step} businessId={biz.id} onCelebrate={onCelebrate} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Category icon in top-right corner + chevron */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", catStyle.bg)}>
                        <CatIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isSelected && "rotate-90")} />
                    </div>
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
