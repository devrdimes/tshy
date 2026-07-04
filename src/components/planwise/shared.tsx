"use client"

import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Circle, Shield, Rocket, Zap, Clock, Flag, AlertTriangle, Users, Info, Lightbulb, AlertOctagon, Heart, Target, DollarSign, Settings, Search, Twitter, Github, Linkedin, Building2 } from "lucide-react"
import { APP_CONFIG } from "@/lib/constants"
import { cn } from "@/lib/utils"

// ─── ICON MAP ──────────────────────────────────────────────
export const iconMap: Record<string, React.ElementType> = {
  Search, Target, DollarSign, Scale: Shield, Package: Rocket, Megaphone: Zap, Settings, Users, Info, AlertTriangle, CheckCircle2, Lightbulb, Clock: Clock, Flag, AlertOctagon: AlertTriangle, UserPlus: Users, Landmark: DollarSign, Building2
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
const SHAPES = ["circle", "square", "star", "diamond"] as const
const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316", "#14b8a6"]

interface Particle {
  id: number
  shape: typeof SHAPES[number]
  color: string
  left: number
  delay: number
  duration: number
  rotation: number
  size: number
  drift: number
}

function StarShape({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function DiamondShape({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L22 12L12 22L2 12L12 2Z" />
    </svg>
  )
}

export function CelebrationOverlay({ show, onComplete }: { show: boolean; onComplete: () => void }) {
  const [flashVisible, setFlashVisible] = useState(false)

  const particles = useMemo<Particle[]>(() => (
    Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      shape: SHAPES[i % SHAPES.length],
      color: COLORS[i % COLORS.length],
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 2,
      rotation: Math.random() * 360,
      size: 6 + Math.random() * 10,
      drift: -30 + Math.random() * 60,
    }))
  ), [])

  useEffect(() => {
    if (show) {
      setFlashVisible(true)
      const flashTimer = setTimeout(() => setFlashVisible(false), 200)
      const timer = setTimeout(onComplete, 3000)
      return () => {
        clearTimeout(flashTimer)
        clearTimeout(timer)
      }
    }
  }, [show, onComplete])

  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {/* Flash overlay */}
      <AnimatePresence>
        {flashVisible && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-transparent to-cyan-400/20"
          />
        )}
      </AnimatePresence>

      {/* Particles with gravity-like fall */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          <motion.div
            initial={{
              y: -20,
              x: 0,
              rotate: p.rotation,
              opacity: 1,
            }}
            animate={{
              y: typeof window !== "undefined" ? window.innerHeight + 40 : 1000,
              x: p.drift,
              rotate: p.rotation + 720,
              opacity: 0,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {p.shape === "circle" && (
              <div
                className="rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                }}
              />
            )}
            {p.shape === "square" && (
              <div
                className="rounded-sm"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                }}
              />
            )}
            {p.shape === "star" && <StarShape color={p.color} size={p.size} />}
            {p.shape === "diamond" && <DiamondShape color={p.color} size={p.size} />}
          </motion.div>
        </div>
      ))}
    </div>
  )
}

// ─── LOADING SCREEN ────────────────────────────────────
function ParticleBackground() {
  const dots = useMemo(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 3,
      opacity: 0.1 + Math.random() * 0.2,
    }))
  , [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full bg-emerald-400"
          style={{
            width: d.size,
            height: d.size,
            left: `${d.x}%`,
            top: `${d.y}%`,
            opacity: d.opacity,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [d.opacity, d.opacity * 1.5, d.opacity],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

function ProgressDots() {
  return (
    <div className="flex items-center gap-1.5 mt-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-emerald-400"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1,
            delay: i * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <ParticleBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center relative z-10"
      >
        {/* Animated logo with pulse ring */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Pulse ring effect */}
          <motion.div
            className="absolute w-24 h-24 rounded-full border-2 border-emerald-400/30"
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          <motion.div
            className="absolute w-20 h-20 rounded-full border border-emerald-500/20"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              delay: 0.3,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />

          {/* Spinning border */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full"
          />

          {/* Building2 icon with pulse */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute"
          >
            <Building2 className="w-8 h-8 text-emerald-400" />
          </motion.div>
        </div>

        {/* Gradient text app name */}
        <h1 className="text-3xl font-bold mb-2 text-gradient">{APP_CONFIG.name}</h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm mb-1">Initializing your workspace...</p>

        {/* Progress dots */}
        <div className="flex justify-center">
          <ProgressDots />
        </div>
      </motion.div>
    </div>
  )
}

// ─── FOOTER ─────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="relative mt-auto">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="bg-card/60 px-4 md:px-6 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {/* Left: App info */}
          <div className="flex items-center gap-3">
            <span className="font-medium">{APP_CONFIG.name} v{APP_CONFIG.version}</span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for entrepreneurs
            </span>
          </div>

          {/* Center: Social links (decorative) */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-border mr-1">·</span>
            <button className="p-1 rounded-md hover:bg-accent transition-colors" aria-label="Twitter">
              <Twitter className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 rounded-md hover:bg-accent transition-colors" aria-label="GitHub">
              <Github className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 rounded-md hover:bg-accent transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Keyboard shortcuts hint */}
          <div className="hidden md:flex items-center gap-2 text-[10px] text-muted-foreground/70">
            <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">Alt+1-8</kbd>
            <span>Navigate</span>
            <span className="text-border">·</span>
            <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">Alt+C</kbd>
            <span>Chat</span>
            <span className="text-border">·</span>
            <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">Alt+D</kbd>
            <span>Theme</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── EMPTY STATE ────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="text-center py-16">
      {/* Icon circle with floating animation, gradient background, and decorative ring */}
      <div className="relative mx-auto mb-6 w-24 h-24">
        {/* Decorative outer ring */}
        <div className="absolute inset-0 rounded-full animate-pulse-ring border-2 border-emerald-400/20" />

        {/* Floating icon container with gradient background */}
        <motion.div
          className="relative w-24 h-24 rounded-full flex items-center justify-center animate-float"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)",
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10" />
          <Icon className="w-10 h-10 text-emerald-500 relative z-10" />
        </motion.div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">{description}</p>
    </div>
  )
}
