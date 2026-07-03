"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore, type PlanStep } from "@/lib/store"
import { CATEGORIES, STEP_STATUSES } from "@/lib/constants"
import { updatePlanStep } from "@/lib/api"
import {
  CheckCircle2, Circle, Lock, Clock, ChevronRight, Lightbulb, Sparkles, Play, SkipForward, Loader2, Rocket
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { fadeIn, EmptyState } from "./shared"

function StepChecklist({ step, businessId }: { step: PlanStep; businessId: string }) {
  const { refreshBusiness } = useAppStore()
  const items = JSON.parse(step.checklist || "[]") as string[]

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
      <p className="text-sm font-medium text-muted-foreground mb-2">Checklist</p>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 cursor-pointer group" onClick={() => toggleItem(idx)}>
            <Checkbox checked={item.startsWith("✅")} className="pointer-events-none" />
            <span className={cn("text-sm", item.startsWith("✅") ? "line-through text-muted-foreground" : "text-foreground")}>{item.replace(/^[✅⬜]\s*/, "")}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

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
      {step.status === "completed" && <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>}
    </div>
  )
}

export function Planner({ onCelebrate }: { onCelebrate?: () => void }) {
  const { currentBusiness } = useAppStore()
  const [selectedStep, setSelectedStep] = useState<PlanStep | null>(null)

  const biz = currentBusiness
  if (!biz) return <EmptyState icon={Rocket} title="No Business Selected" description="Select or create a business to view your plan" />

  const steps = biz.planSteps || []
  const completedSteps = steps.filter(s => s.status === "completed").length
  const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Plan Progress</h3>
            <span className="text-sm font-medium text-emerald-600">{completedSteps}/{steps.length} steps &bull; {progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
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

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const cat = CATEGORIES[step.category as keyof typeof CATEGORIES]
          const isSelected = selectedStep?.id === step.id
          const isLocked = step.status === "locked"
          return (
            <motion.div key={step.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Card className={cn("border shadow-sm transition-all cursor-pointer hover:shadow-md", isSelected ? "border-emerald-300 ring-1 ring-emerald-200" : "border-border", isLocked && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm", step.status === "completed" ? "bg-emerald-500 text-white" : step.status === "in_progress" || step.status === "current" ? "bg-amber-400 text-white" : "bg-muted text-muted-foreground")}>
                        {step.status === "completed" ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-5 h-5" /> : step.stepNumber}
                      </div>
                      {idx < steps.length - 1 && <div className={cn("absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-4", step.status === "completed" ? "bg-emerald-300" : "bg-muted")} />}
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => !isLocked && setSelectedStep(step)}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">{cat?.label || step.category}</Badge>
                        <Badge className={cn("text-[10px]", STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.bg, STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.color)}>{STEP_STATUSES[step.status as keyof typeof STEP_STATUSES]?.label}</Badge>
                        <Badge variant="outline" className="text-[10px]"><Clock className="w-3 h-3 mr-1" />{step.estimatedDays}d</Badge>
                      </div>
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-4 space-y-3">
                              {step.guidance && <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 dark:bg-sky-950/30 dark:border-sky-800"><div className="flex items-start gap-2"><Lightbulb className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" /><p className="text-sm text-sky-700 dark:text-sky-300">{step.guidance}</p></div></div>}
                              {step.aiTips && <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 dark:bg-violet-950/30 dark:border-violet-800"><div className="flex items-start gap-2"><Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" /><p className="text-sm text-violet-700 dark:text-violet-300">{step.aiTips}</p></div></div>}
                              <StepChecklist step={step} businessId={biz.id} />
                              <StepActions step={step} businessId={biz.id} onCelebrate={onCelebrate} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <ChevronRight className={cn("w-5 h-5 text-muted-foreground shrink-0 transition-transform", isSelected && "rotate-90")} />
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
