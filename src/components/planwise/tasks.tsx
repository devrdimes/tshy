"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore, type Task } from "@/lib/store"
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants"
import { createTask, updateTask, deleteTask } from "@/lib/api"
import {
  Plus, CheckCircle2, Circle, Clock, Loader2, AlertTriangle, Calendar, Sparkles, Trash2, Play
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

function TaskItem({ task, compact = false }: { task: Task; compact?: boolean }) {
  const { refreshTasks } = useAppStore()
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (status: Task["status"]) => {
    setLoading(true)
    try {
      await updateTask(task.id, { status })
      await refreshTasks()
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteTask(task.id)
      await refreshTasks()
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const priority = PRIORITIES[task.priority as keyof typeof PRIORITIES]
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 p-2 rounded-lg text-sm", task.status === "completed" ? "bg-muted opacity-60" : isOverdue ? "bg-red-50 dark:bg-red-950/30" : "bg-card")}>
        <button onClick={() => task.status !== "completed" && handleStatusChange("completed")} className="shrink-0">
          {task.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-emerald-400" />}
        </button>
        <span className={cn("flex-1 truncate", task.status === "completed" && "line-through text-muted-foreground")}>{task.title}</span>
        <Badge className={cn("text-[10px]", priority?.bg, priority?.color)}>{priority?.label}</Badge>
      </div>
    )
  }

  return (
    <Card className={cn("border shadow-sm transition-all hover:shadow-md", isOverdue && "border-red-200 bg-red-50/50 dark:bg-red-950/20")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button onClick={() => task.status === "pending" ? handleStatusChange("in_progress") : task.status === "in_progress" ? handleStatusChange("completed") : null} className="shrink-0 mt-0.5" disabled={task.status === "completed"}>
            {task.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : task.status === "in_progress" ? <Loader2 className="w-5 h-5 text-sky-500" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-emerald-400" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={cn("font-medium text-sm", task.status === "completed" && "line-through text-muted-foreground")}>{task.title}</h4>
              <Badge className={cn("text-[10px]", priority?.bg, priority?.color)}>{priority?.label}</Badge>
              {task.aiGenerated && <Badge className="text-[10px] bg-violet-100 text-violet-700"><Sparkles className="w-3 h-3 mr-1" />AI</Badge>}
              {isOverdue && <Badge className="text-[10px] bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>}
            </div>
            {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
            {task.aiSuggestion && <div className="bg-violet-50 border border-violet-200 rounded-md p-2 mt-2 text-xs text-violet-700 dark:bg-violet-950/30 dark:border-violet-800 dark:text-violet-300"><Sparkles className="w-3 h-3 inline mr-1" />{task.aiSuggestion}</div>}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
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

export function TasksView() {
  const { tasks, currentBusiness, refreshTasks } = useAppStore()
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
      await refreshTasks()
      setNewTitle(""); setNewDesc(""); setShowNewTask(false)
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{pending}</p><p className="text-xs text-muted-foreground">Pending</p></div></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><Loader2 className="w-5 h-5 text-sky-600" /></div><div><p className="text-2xl font-bold">{inProgress}</p><p className="text-xs text-muted-foreground">In Progress</p></div></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{completed}</p><p className="text-xs text-muted-foreground">Completed</p></div></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div><div><p className="text-2xl font-bold">{overdue}</p><p className="text-xs text-muted-foreground">Overdue</p></div></CardContent></Card>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setShowNewTask(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"><Plus className="w-4 h-4 mr-2" />New Task</Button>
      </div>

      <AnimatePresence>
        {showNewTask && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card className="border-emerald-200 shadow-sm"><CardContent className="p-4 space-y-3">
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
            </CardContent></Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-10 h-10 text-muted-foreground" /></div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No tasks {filter !== "all" ? `with status "${filter}"` : "yet"}</h3>
            <p className="text-sm text-muted-foreground mb-4">{filter === "all" ? "Create your first task to start tracking your progress" : "Try a different filter to see tasks"}</p>
            {filter === "all" && <Button onClick={() => setShowNewTask(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Create Task</Button>}
          </div>
        ) : filteredTasks.map(task => <TaskItem key={task.id} task={task} />)}
      </div>
    </div>
  )
}
