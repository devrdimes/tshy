"use client"

import { motion } from "framer-motion"
import { useSanadStore } from "@/lib/sanad-store"

export function SanadAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { animationState, reducedMotion } = useSanadStore()
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  }
  
  const currentSize = sizeClasses[size]
  
  // Base visual styles - premium teal/emerald with violet when thinking
  const baseColors = animationState === 'think' 
    ? "from-violet-600 to-indigo-700 shadow-violet-500/50" 
    : animationState === 'alert'
    ? "from-amber-500 to-orange-600 shadow-amber-500/50"
    : "from-emerald-500 to-teal-700 shadow-emerald-500/30"

  // Animation variants
  const variants = {
    idle: { y: reducedMotion ? 0 : [0, -4, 0], transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } },
    think: { scale: reducedMotion ? 1 : [1, 1.05, 1], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
    alert: { scale: reducedMotion ? 1 : [1, 1.1, 1], transition: { repeat: Infinity, duration: 1, ease: "easeInOut" } },
    hidden: { scale: 0, opacity: 0 }
  }

  // Use current animation state or default to idle if not specifically mapped above
  const activeVariant = variants[animationState as keyof typeof variants] ? animationState : 'idle'

  return (
    <motion.div 
      className={`relative rounded-2xl bg-gradient-to-br ${baseColors} flex items-center justify-center shadow-lg ${currentSize} shrink-0 border border-white/10 overflow-hidden`}
      variants={variants}
      animate={activeVariant}
      initial="idle"
    >
      {/* Inner geometric core representing AI */}
      <motion.div 
        className="absolute inset-2 bg-white/20 rounded-full blur-sm"
        animate={{ 
          opacity: animationState === 'think' ? [0.4, 0.8, 0.4] : 0.2,
          scale: animationState === 'think' ? [0.8, 1.2, 0.8] : 1
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
      <div className="relative z-10 w-1/3 h-1/3 bg-white rounded-sm rotate-45 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
    </motion.div>
  )
}
