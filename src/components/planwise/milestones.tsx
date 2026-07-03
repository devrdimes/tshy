"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore, type Milestone } from "@/lib/store"
import { MILESTONE_STATUSES, MILESTONE_CATEGORIES } from "@/lib/constants"
import { createMilestone, updateMilestone } from "@/lib/api"
import {
  Plus, CheckCircle2, Play, Calendar, Flag
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { EmptyState } from "./shared"

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border shadow-sm"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-emerald-600">{achieved}</p><p className="text-xs text-muted-foreground">Achieved</p></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-amber-600">{inProgress}</p><p className="text-xs text-muted-foreground">In Progress</p></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-muted-foreground">{milestones.length - achieved - inProgress}</p><p className="text-xs text-muted-foreground">Upcoming</p></CardContent></Card>
      </div>

      <div className="flex justify-between">
        <h3 className="text-lg font-semibold text-foreground">Milestones</h3>
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

      <div className="space-y-3">
        {milestones.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4"><Flag className="w-10 h-10 text-muted-foreground" /></div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No milestones yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Define key milestones to track your business progress</p>
            <Button onClick={() => setShowNew(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Add Milestone</Button>
          </div>
        ) : milestones.map(m => {
          const cat = MILESTONE_CATEGORIES[m.category as keyof typeof MILESTONE_CATEGORIES]
          const statusInfo = MILESTONE_STATUSES[m.status as keyof typeof MILESTONE_STATUSES]
          const progress = m.targetValue > 0 ? Math.min(100, Math.round((m.currentValue / m.targetValue) * 100)) : 0
          return (
            <Card key={m.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{cat?.label || m.category}</Badge>
                      <Badge className={cn("text-[10px]", statusInfo?.bg, statusInfo?.color)}>{statusInfo?.label}</Badge>
                      {m.targetDate && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(m.targetDate).toLocaleDateString()}</span>}
                    </div>
                    <h4 className="font-semibold text-foreground">{m.title}</h4>
                    {m.description && <p className="text-sm text-muted-foreground mt-0.5">{m.description}</p>}
                    {m.targetValue > 0 && <div className="mt-2"><div className="flex items-center justify-between text-xs text-muted-foreground mb-1"><span>{m.metric}: {m.currentValue.toLocaleString()} / {m.targetValue.toLocaleString()}</span><span>{progress}%</span></div><Progress value={progress} className="h-2" /></div>}
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
