"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Brain, CheckCircle2, Circle, Shield, Rocket, Zap, Clock, Flag, AlertTriangle, Users, Info, Sparkles, AlertOctagon, Heart, Target, DollarSign, Settings, Search } from "lucide-react"
import { APP_CONFIG } from "@/lib/constants"
import { cn } from "@/lib/utils"

// ─── ICON MAP ──────────────────────────────────────────────
export const iconMap: Record<string, React.ElementType> = {
  Search, Target, DollarSign, Scale: Shield, Package: Rocket, Megaphone: Zap, Settings, Users, Info, AlertTriangle, CheckCircle2, Sparkles, Clock: Clock, Flag, AlertOctagon: AlertTriangle, UserPlus: Users, Landmark: DollarSign, Brain
}

export function getIcon(name: string) {
  return iconMap[name] || Circle
}

// ─── ANIMATION VARIANTS ──────────────────────────────────
export const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } }
export const slideIn = { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } }
export const scaleIn = { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } }
export const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

// ─── CELEBRATION OVERLAY ──────────────────────────────────
export function CelebrationOverlay({ show, onComplete }: { show: boolean; onComplete: () => void }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])
  if (!show) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'][i % 6],
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── LOADING SCREEN ────────────────────────────────────
export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="relative mb-6">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto" />
          <Brain className="w-8 h-8 text-emerald-400 absolute top-4 left-1/2 -translate-x-1/2" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{APP_CONFIG.name}</h1>
        <p className="text-slate-400">Initializing your AI business advisor...</p>
      </motion.div>
    </div>
  )
}

// ─── FOOTER ─────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="border-t border-border bg-card/60 px-4 md:px-6 py-3 mt-auto">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{APP_CONFIG.name} v{APP_CONFIG.version}</span>
        <span className="flex items-center gap-1">Made with <Heart className="w-3 h-3 text-red-400" /> for entrepreneurs</span>
      </div>
    </footer>
  )
}

// ─── EMPTY STATE ────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
