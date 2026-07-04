"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/lib/store"
import { APP_CONFIG, STAGES, INDUSTRIES, REVENUE_MODELS, TARGET_MARKETS } from "@/lib/constants"
import { updateUser, createBusiness } from "@/lib/api"
import {
  Building2, ListTodo, MessageSquare, TrendingUp, ChevronRight, Rocket, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { scaleIn } from "./shared"

export function OnboardingFlow() {
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
        await createBusiness({ name: bizName, description: bizDescription, industry: bizIndustry, stage: bizStage, targetMarket: bizTargetMarket, revenueModel: bizRevenueModel, initialCapital: Number(bizCapital) || 0 })
      }
      await useAppStore.getState().initialize()
    } catch (e) { console.error(e) }
    setCreating(false)
  }

  const steps = [
    <motion.div key="welcome" {...scaleIn} className="text-center max-w-lg mx-auto">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6"><Building2 className="w-10 h-10 text-white" /></div>
      <h1 className="text-3xl font-bold text-foreground mb-3">Welcome to {APP_CONFIG.name}</h1>
      <p className="text-muted-foreground mb-8">{APP_CONFIG.description}</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[{ icon: ListTodo, label: "10-Step Plan", desc: "Guided business planning" }, { icon: MessageSquare, label: "Advisor", desc: "Expert frameworks & guidance" }, { icon: TrendingUp, label: "Track Progress", desc: "Milestones & financials" }].map((f, i) => (
          <div key={i} className="p-3 rounded-lg bg-muted border border-border"><f.icon className="w-6 h-6 text-emerald-600 mx-auto mb-2" /><p className="font-medium text-sm">{f.label}</p><p className="text-[10px] text-muted-foreground">{f.desc}</p></div>
        ))}
      </div>
      <Button onClick={() => setStep(1)} size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg w-full">Get Started <ChevronRight className="w-5 h-5 ml-1" /></Button>
    </motion.div>,

    <motion.div key="personal" {...scaleIn} className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-2">Tell us about yourself</h2>
      <p className="text-muted-foreground mb-6">We'll personalize your experience</p>
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-foreground mb-1 block">Your Name</label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah Chen" /></div>
        <div><label className="text-sm font-medium text-foreground mb-1 block">Company</label><Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Startup Labs" /></div>
        <div><label className="text-sm font-medium text-foreground mb-1 block">Your Role</label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Founder & CEO" /></div>
      </div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={() => setStep(0)}>Back</Button><Button onClick={() => setStep(2)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Continue</Button></div>
    </motion.div>,

    <motion.div key="business" {...scaleIn} className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-2">About your business</h2>
      <p className="text-muted-foreground mb-6">This helps us create a tailored plan</p>
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-foreground mb-1 block">Business Name *</label><Input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="e.g. TechFlow SaaS" /></div>
        <div><label className="text-sm font-medium text-foreground mb-1 block">Description</label><Textarea value={bizDescription} onChange={e => setBizDescription(e.target.value)} placeholder="What does your business do?" rows={3} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-foreground mb-1 block">Industry</label><Select value={bizIndustry} onValueChange={setBizIndustry}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
          <div><label className="text-sm font-medium text-foreground mb-1 block">Stage</label><Select value={bizStage} onValueChange={setBizStage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STAGES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-foreground mb-1 block">Target Market</label><Select value={bizTargetMarket} onValueChange={setBizTargetMarket}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{TARGET_MARKETS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          <div><label className="text-sm font-medium text-foreground mb-1 block">Revenue Model</label><Select value={bizRevenueModel} onValueChange={setBizRevenueModel}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{REVENUE_MODELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div><label className="text-sm font-medium text-foreground mb-1 block">Initial Capital ($)</label><Input type="number" value={bizCapital} onChange={e => setBizCapital(e.target.value)} placeholder="e.g. 100000" /></div>
      </div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={() => setStep(1)}>Back</Button><Button onClick={handleFinish} disabled={creating || !bizName} className="flex-1 bg-emerald-600 hover:bg-emerald-700">{creating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : <><Rocket className="w-4 h-4 mr-2" />Launch My Plan</>}</Button></div>
    </motion.div>,
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-6">
      <div className="w-full max-w-lg">
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map(i => <div key={i} className={cn("w-2.5 h-2.5 rounded-full transition-colors", step >= i ? "bg-emerald-500" : "bg-muted")} />)}
        </div>
        <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
      </div>
    </div>
  )
}
