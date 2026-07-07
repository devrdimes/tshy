"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore, type Milestone } from "@/lib/store"
import { MILESTONE_STATUSES, MILESTONE_CATEGORIES } from "@/lib/constants"
import { createMilestone, updateMilestone } from "@/lib/api"
import {
  Plus, CheckCircle2, Play, Calendar, Flag, Trophy, Clock, TrendingUp
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { EmptyState, fadeIn } from "./shared"

export function MilestonesView({ onCelebrate }: { onCelebrate?: () => void }) {
  const { refreshBusiness } = useAppStore()
  const currentBusiness = useAppStore(s => s.currentBusiness)
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
  const upcoming = milestones.length - achieved - inProgress

  const handleCreate = async () => {
    if (!newTitle) return
    try {
      await createMilestone(biz.id, { title: newTitle, category: newCategory, targetDate: newTargetDate || null, targetValue: Number(newTargetValue) || 0, metric: newMetric, status: "upcoming" })
      await refreshBusiness()
      setShowNew(false); setNewTitle(""); setNewMetric(""); setNewTargetValue("")
    } catch (e) { console.error(e) }
  }

  const handleUpdateStatus = async (milestoneId: string, status: string) => {
    try {
      await updateMilestone(biz.id, milestoneId, { status: status as Milestone["status"], achievedDate: status === "achieved" ? new Date().toISOString() : undefined })
      await refreshBusiness()
      if (status === "achieved") onCelebrate?.()
    } catch (e) { console.error(e) }
  }

  const categoryColors: Record<string, string> = {
    revenue: "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
    users: "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30",
    product: "border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30",
    team: "border-teal-300 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/30",
    funding: "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30",
  }

  return (
    <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.05 } } }} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div variants={fadeIn}>
          <Card className="border-border shadow-sm overflow-hidden">
            <div className="h-1 bg-emerald-500" />
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <p className="text-3xl font-bold text-emerald-600">{achieved}</p>
              <p className="text-xs text-muted-foreground font-medium">Achieved</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeIn}>
          <Card className="border-border shadow-sm overflow-hidden">
            <div className="h-1 bg-amber-500" />
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-amber-600 mx-auto mb-1" />
              <p className="text-3xl font-bold text-amber-600">{inProgress}</p>
              <p className="text-xs text-muted-foreground font-medium">In Progress</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeIn}>
          <Card className="border-border shadow-sm overflow-hidden">
            <div className="h-1 bg-slate-300" />
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-3xl font-bold text-muted-foreground">{upcoming}</p>
              <p className="text-xs text-muted-foreground font-medium">Upcoming</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Milestones</h3>
        <Button onClick={() => setShowNew(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-md" data-sanad-id="milestones-add"><Plus className="w-4 h-4 mr-1" />Add Milestone</Button>
      </div>

      {/* New Milestone Form */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card className="border-emerald-200 dark:border-emerald-800 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <Input placeholder="Milestone title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="focus:ring-emerald-500" />
                <div className="flex gap-3">
                  <Select value={newCategory} onValueChange={setNewCategory}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(MILESTONE_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select>
                  <Input type="date" value={newTargetDate} onChange={e => setNewTargetDate(e.target.value)} className="w-44" />
                </div>
                <div className="flex gap-3">
                  <Input placeholder="Metric (e.g. MRR, Users)" value={newMetric} onChange={e => setNewMetric(e.target.value)} className="flex-1" />
                  <Input type="number" placeholder="Target value" value={newTargetValue} onChange={e => setNewTargetValue(e.target.value)} className="w-32" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">Create</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestone List */}
      <div className="space-y-3">
        {milestones.length === 0 ? (
          <EmptyState icon={Flag} title="No milestones yet" description="Define key milestones to track your business progress" />
        ) : milestones.map(m => {
          const cat = MILESTONE_CATEGORIES[m.category as keyof typeof MILESTONE_CATEGORIES]
          const statusInfo = MILESTONE_STATUSES[m.status as keyof typeof MILESTONE_STATUSES]
          const progress = m.targetValue > 0 ? Math.min(100, Math.round((m.currentValue / m.targetValue) * 100)) : 0
          return (
            <motion.div key={m.id} variants={fadeIn}>
              <Card className={cn("border shadow-sm hover:shadow-md transition-all overflow-hidden", m.status === "achieved" ? "border-emerald-200 dark:border-emerald-800" : "border-border")}>
                <div className={cn("h-1", m.status === "achieved" ? "bg-emerald-500" : m.status === "in_progress" ? "bg-amber-500" : "bg-muted")} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{cat?.label || m.category}</Badge>
                        <Badge className={cn("text-[10px]", statusInfo?.bg, statusInfo?.color)}>{statusInfo?.label}</Badge>
                        {m.targetDate && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(m.targetDate).toLocaleDateString()}</span>}
                        {m.status === "achieved" && <Trophy className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                      <h4 className={cn("font-semibold text-foreground", m.status === "achieved" && "text-emerald-600 dark:text-emerald-400")}>{m.title}</h4>
                      {m.targetValue > 0 && (
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                            <span>{m.metric}: <span className="font-semibold text-foreground">{m.currentValue.toLocaleString()}</span> / {m.targetValue.toLocaleString()}</span>
                            <span className={cn("font-bold", progress >= 100 ? "text-emerald-600" : "text-amber-600")}>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-3">
                      {m.status === "upcoming" && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(m.id, "in_progress")} className="hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 dark:hover:bg-amber-950/30"><Play className="w-4 h-4" /></Button>}
                      {m.status === "in_progress" && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(m.id, "achieved")} className="hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-950/30"><CheckCircle2 className="w-4 h-4" /></Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
