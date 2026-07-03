"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/lib/store"
import { APP_CONFIG, INDUSTRIES, STAGES, REVENUE_MODELS, TARGET_MARKETS } from "@/lib/constants"
import { createBusiness } from "@/lib/api"
import {
  LayoutDashboard, ListTodo, DollarSign, Flag, Bell, Settings, ChevronRight, ChevronLeft, Plus, Sparkles, Brain, Building2, Menu, Gauge, CheckCircle2, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

function NewBusinessDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [bizName, setBizName] = useState("")
  const [bizDescription, setBizDescription] = useState("")
  const [bizIndustry, setBizIndustry] = useState("")
  const [bizStage, setBizStage] = useState("idea")
  const [bizTargetMarket, setBizTargetMarket] = useState("")
  const [bizRevenueModel, setBizRevenueModel] = useState("")
  const [bizCapital, setBizCapital] = useState("")
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!bizName) return
    setCreating(true)
    try {
      await createBusiness({ name: bizName, description: bizDescription, industry: bizIndustry, stage: bizStage, targetMarket: bizTargetMarket, revenueModel: bizRevenueModel, initialCapital: Number(bizCapital) || 0 })
      await useAppStore.getState().initialize()
      onOpenChange(false)
      setBizName(""); setBizDescription(""); setBizIndustry(""); setBizStage("idea"); setBizTargetMarket(""); setBizRevenueModel(""); setBizCapital("")
    } catch (e) { console.error(e) }
    setCreating(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Add New Business</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div><label className="text-sm font-medium mb-1 block">Business Name *</label><Input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="e.g. TechFlow SaaS" /></div>
          <div><label className="text-sm font-medium mb-1 block">Description</label><Textarea value={bizDescription} onChange={e => setBizDescription(e.target.value)} placeholder="What does your business do?" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1 block">Industry</label><Select value={bizIndustry} onValueChange={setBizIndustry}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium mb-1 block">Stage</label><Select value={bizStage} onValueChange={setBizStage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STAGES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1 block">Target Market</label><Select value={bizTargetMarket} onValueChange={setBizTargetMarket}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{TARGET_MARKETS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium mb-1 block">Revenue Model</label><Select value={bizRevenueModel} onValueChange={setBizRevenueModel}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{REVENUE_MODELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><label className="text-sm font-medium mb-1 block">Initial Capital ($)</label><Input type="number" value={bizCapital} onChange={e => setBizCapital(e.target.value)} placeholder="e.g. 100000" /></div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleCreate} disabled={creating || !bizName} className="flex-1 bg-emerald-600 hover:bg-emerald-700">{creating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : "Create Business"}</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { NewBusinessDialog }

function SidebarContent({ navItems, bizOpen, setBizOpen, setNewBizOpen }: { navItems: { id: string; label: string; icon: React.ElementType; badge?: number }[]; bizOpen: boolean; setBizOpen: (v: boolean) => void; setNewBizOpen: (v: boolean) => void }) {
  const { sidebarOpen, setSidebarOpen, activeView, setActiveView, currentBusiness, businesses, setCurrentBusiness, user, unreadCount } = useAppStore()

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0"><Brain className="w-5 h-5 text-white" /></div>
          {sidebarOpen !== false && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{APP_CONFIG.name}</h1>
              <p className="text-[10px] text-muted-foreground -mt-1">AI Business Planning</p>
            </motion.div>
          )}
        </div>
      </div>

      <div className="px-3 py-3">
        <button onClick={() => setBizOpen(!bizOpen)} className={cn("w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors", "bg-muted hover:bg-accent border border-border")}>
          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {sidebarOpen !== false ? (
            <>
              <span className="truncate flex-1 text-left text-foreground">{currentBusiness?.name || "Select Business"}</span>
              <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", bizOpen && "rotate-90")} />
            </>
          ) : null}
        </button>
        <AnimatePresence>
          {bizOpen && sidebarOpen !== false && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-1 space-y-1">
                {businesses.map((b) => (
                  <button key={b.id} onClick={() => { setCurrentBusiness(b); setBizOpen(false) }} className={cn("w-full text-left px-3 py-2 rounded-md text-sm transition-colors", currentBusiness?.id === b.id ? "bg-emerald-50 text-emerald-700 font-medium dark:bg-emerald-950 dark:text-emerald-400" : "hover:bg-accent text-muted-foreground")}>{b.name}</button>
                ))}
                <button onClick={() => { setBizOpen(false); setNewBizOpen(true) }} className="w-full text-left px-3 py-2 rounded-md text-sm text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Business
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button onClick={() => setActiveView(item.id as typeof activeView)} className={cn("w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", isActive ? "bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950 dark:text-emerald-400" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
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

      <div className="px-3 pb-3">
        <button onClick={() => useAppStore.getState().setChatOpen(true)} className={cn("w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md pulse-glow")}>
          <Sparkles className="w-5 h-5 shrink-0" />
          {sidebarOpen !== false && <span>AI Advisor</span>}
        </button>
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{user?.name?.charAt(0) || "E"}</AvatarFallback></Avatar>
          {sidebarOpen !== false && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">{user?.name || "Entrepreneur"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.role || "CEO"}</p>
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

export function Sidebar({ newBizOpen, setNewBizOpen }: { newBizOpen: boolean; setNewBizOpen: (v: boolean) => void }) {
  const { sidebarOpen, unreadCount } = useAppStore()
  const [bizOpen, setBizOpen] = useState(false)

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "planner", label: "Step-by-Step Plan", icon: ListTodo },
    { id: "tasks", label: "Tasks", icon: CheckCircle2 },
    { id: "financials", label: "Financial Projections", icon: DollarSign },
    { id: "milestones", label: "Milestones", icon: Flag },
    { id: "analysis", label: "AI Analysis", icon: Gauge },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-3 left-3 z-50"><Menu className="w-5 h-5" /></Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent navItems={navItems} bizOpen={bizOpen} setBizOpen={setBizOpen} setNewBizOpen={setNewBizOpen} />
        </SheetContent>
      </Sheet>

      <motion.aside initial={false} animate={{ width: sidebarOpen ? 280 : 72 }} transition={{ duration: 0.2 }} className={cn("hidden md:flex flex-col border-r border-border bg-card/80 backdrop-blur-sm shrink-0 overflow-hidden")}>
        <SidebarContent navItems={navItems} bizOpen={bizOpen} setBizOpen={setBizOpen} setNewBizOpen={setNewBizOpen} />
      </motion.aside>
    </>
  )
}
