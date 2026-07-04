"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore, type Task } from "@/lib/store"
import { PRIORITIES, TASK_STATUSES, CATEGORIES } from "@/lib/constants"
import { createTask, updateTask, deleteTask, chatWithAdvisor } from "@/lib/api"
import {
  Plus, CheckCircle2, Circle, Clock, Loader2, AlertTriangle, Calendar,
  Trash2, Play, Search, ArrowUpDown, TrendingUp, TrendingDown, GripVertical,
  User, ListChecks, Rocket, Inbox, Lightbulb } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { EmptyState } from "./shared"

// ─── Priority indicator colors ──────────────────────────────────────────
const PRIORITY_INDICATOR: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-amber-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
}

// ─── Helper: relative time ──────────────────────────────────────────────
function relativeTime(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo ago`
}

// ─── Assignee initials ──────────────────────────────────────────────────
function getInitials(title: string): string {
  const words = title.split(" ").filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return title.slice(0, 2).toUpperCase()
}

// ─── Sort options ───────────────────────────────────────────────────────
type SortOption = "priority" | "dueDate" | "createdDate"

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

// ─── Enhanced Task Item ─────────────────────────────────────────────────
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
    <Card className={cn(
      "border shadow-sm transition-all hover:shadow-md group relative overflow-hidden",
      isOverdue && "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800"
    )}>
      {/* Priority indicator bar on left */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", PRIORITY_INDICATOR[task.priority] || "bg-slate-400")} />
      <CardContent className="p-4 pl-5">
        <div className="flex items-start gap-3">
          {/* Drag handle (visual only) */}
          <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1 cursor-grab" />

          {/* Status button */}
          <button
            onClick={() => task.status === "pending" ? handleStatusChange("in_progress") : task.status === "in_progress" ? handleStatusChange("completed") : null}
            className="shrink-0 mt-0.5"
            disabled={task.status === "completed"}
          >
            <motion.div
              initial={false}
              animate={task.status === "completed" ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {task.status === "completed" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : task.status === "in_progress" ? (
                <Loader2 className="w-5 h-5 text-sky-500 animate-spin" style={{ animationDuration: "3s" }} />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground hover:text-emerald-400 transition-colors" />
              )}
            </motion.div>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={cn("font-medium text-sm", task.status === "completed" && "line-through text-muted-foreground")}>{task.title}</h4>
              <Badge className={cn("text-[10px]", priority?.bg, priority?.color)}>{priority?.label}</Badge>
              {task.systemGenerated && (
                <Badge className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                  <motion.span
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-flex"
                  >
                    <Lightbulb className="w-3 h-3 mr-1" />
                  </motion.span>
                  AI
                </Badge>
              )}
              {isOverdue && <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>}
            </div>
            {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}

            {/* Advisor Tip with animated sparkles */}
            {task.suggestion && (
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 dark:from-violet-950/30 dark:to-purple-950/30 dark:border-violet-800 rounded-md p-2 mt-2 text-xs text-violet-700 dark:text-violet-300">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mr-1"
                >
                  <Lightbulb className="w-3 h-3 inline" />
                </motion.span>
                {task.suggestion}
              </div>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {task.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(task.dueDate).toLocaleDateString()}</span>}
              <Badge variant="outline" className="text-[10px]">{TASK_STATUSES[task.status as keyof typeof TASK_STATUSES]?.label}</Badge>
              {/* Time tracking display */}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Created {relativeTime(task.id) || "recently"}</span>
            </div>
          </div>

          {/* Assignee placeholder + actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Assignee avatar placeholder */}
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center" title="Assignee">
              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">{getInitials(task.title)}</span>
            </div>
            <div className="flex items-center gap-1">
              {task.status === "pending" && <Button size="sm" variant="ghost" onClick={() => handleStatusChange("in_progress")}><Play className="w-4 h-4" /></Button>}
              {task.status === "in_progress" && <Button size="sm" variant="ghost" onClick={() => handleStatusChange("completed")}><CheckCircle2 className="w-4 h-4" /></Button>}
              <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Tasks View ─────────────────────────────────────────────────────
export function TasksView() {
  const { tasks, currentBusiness, refreshTasks } = useAppStore()
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all")
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")
  const [newDueDate, setNewDueDate] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newEstimatedTime, setNewEstimatedTime] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("priority")
  const [aiSuggesting, setAiSuggesting] = useState(false)

  const pending = tasks.filter(t => t.status === "pending").length
  const inProgress = tasks.filter(t => t.status === "in_progress").length
  const completed = tasks.filter(t => t.status === "completed").length
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed").length

  // Filtered + sorted tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => filter === "all" || t.status === filter)

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      )
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === "priority") {
        return (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
      }
      if (sortBy === "dueDate") {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      // createdDate — approximate by id (cuid is time-sortable)
      return a.id.localeCompare(b.id)
    })

    return result
  }, [tasks, filter, searchQuery, sortBy])

  const handleCreateTask = async () => {
    if (!newTitle) return
    try {
      await createTask({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        dueDate: newDueDate || null,
        businessId: currentBusiness?.id || null,
      })
      await refreshTasks()
      setNewTitle("")
      setNewDesc("")
      setNewPriority("medium")
      setNewDueDate("")
      setNewCategory("")
      setNewEstimatedTime("")
      setShowNewTask(false)
    } catch (e) { console.error(e) }
  }

  const handleAISuggest = async () => {
    if (!newTitle) return
    setAiSuggesting(true)
    try {
      const res = await chatWithAdvisor(
        `Generate a detailed task description for: "${newTitle}". Priority: ${newPriority}. Just give me the description text, nothing else.`,
        currentBusiness?.id
      )
      if (res.content) {
        setNewDesc(res.content)
      }
    } catch (e) { console.error(e) }
    setAiSuggesting(false)
  }

  // Trend calculation (compare pending vs completed)
  const trendDir = completed > pending ? "up" : pending > completed ? "down" : "neutral"

  return (
    <div className="space-y-6">
      {/* ── Enhanced Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-border shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold tabular-nums">{pending}</p>
                  {trendDir === "down" && <TrendingDown className="w-3.5 h-3.5 text-amber-500" />}
                </div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-sky-400 to-sky-500" />
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold tabular-nums">{inProgress}</p>
                </div>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-500" />
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold tabular-nums">{completed}</p>
                  {trendDir === "up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                </div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-red-400 to-red-500" />
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold tabular-nums">{overdue}</p>
                  {overdue > 0 && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                </div>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Filter Bar with Search + Sort ────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{tasks.length}</Badge></TabsTrigger>
            <TabsTrigger value="pending">Pending <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{pending}</Badge></TabsTrigger>
            <TabsTrigger value="in_progress">In Progress <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{inProgress}</Badge></TabsTrigger>
            <TabsTrigger value="completed">Completed <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{completed}</Badge></TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 w-48 h-9 text-sm"
            />
          </div>
          <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="createdDate">Created</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNewTask(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
            <Plus className="w-4 h-4 mr-2" />New Task
          </Button>
        </div>
      </div>

      {/* ── Enhanced New Task Form ────────────────────────────────────── */}
      <AnimatePresence>
        {showNewTask && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-emerald-200 dark:border-emerald-800 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Create New Task
                </h4>

                {/* Title + AI Suggest */}
                <div className="flex gap-2">
                  <Input placeholder="Task title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="flex-1" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAISuggest}
                    disabled={!newTitle || aiSuggesting}
                    className="shrink-0"
                  >
                    {aiSuggesting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Lightbulb className="w-4 h-4 mr-1.5" />}
                    AI Suggest
                  </Button>
                </div>

                {/* Description */}
                <Textarea placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} />

                {/* Fields row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                    <Select value={newPriority} onValueChange={v => setNewPriority(v as typeof newPriority)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(PRIORITIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                    <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                    <Select value={newCategory} onValueChange={v => setNewCategory(v)}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Est. Time</label>
                    <Input
                      placeholder="e.g., 2h, 3d"
                      value={newEstimatedTime}
                      onChange={e => setNewEstimatedTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={handleCreateTask} disabled={!newTitle} className="bg-emerald-600 hover:bg-emerald-700">Create Task</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNewTask(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Task List / Empty State ───────────────────────────────────── */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="relative inline-block mb-6">
              {/* Animated illustration */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 dark:from-emerald-900/30 dark:to-sky-900/30 flex items-center justify-center mx-auto">
                  {filter === "completed" ? (
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  ) : filter === "in_progress" ? (
                    <Loader2 className="w-12 h-12 text-sky-500" />
                  ) : filter === "pending" ? (
                    <Inbox className="w-12 h-12 text-amber-500" />
                  ) : (
                    <ListChecks className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
              </motion.div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No tasks {filter !== "all" ? `with status "${TASK_STATUSES[filter as keyof typeof TASK_STATUSES]?.label || filter}"` : "yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              {filter === "all"
                ? "Create your first task to start tracking your progress"
                : searchQuery
                  ? "Try adjusting your search query or filter"
                  : "Try a different filter to see tasks"
              }
            </p>
            {filter === "all" && !searchQuery && (
              <Button onClick={() => setShowNewTask(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
                <Plus className="w-4 h-4 mr-2" />Create Task
              </Button>
            )}
          </motion.div>
        ) : (
          filteredTasks.map(task => <TaskItem key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
}
