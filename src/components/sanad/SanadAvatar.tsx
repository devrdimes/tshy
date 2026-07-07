"use client"

/**
 * SanadAvatar — The visual representation of the Sanad AI guide.
 *
 * Designed as a premium geometric 2.5D floating orb.
 * Each animation state maps to a distinct visual and motion treatment.
 * Respects prefers-reduced-motion via the store's `reducedMotion` flag.
 *
 * This component is intentionally decoupled from chat logic.
 * It only reads `animationState` and `reducedMotion` from the store.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useSanadStore, SanadAnimationState } from '@/lib/sanad-store'

// ── Colour mapping per state ────────────────────────────────────
const STATE_COLORS: Record<SanadAnimationState, string> = {
  idle:        'from-emerald-500 to-teal-700',
  walking:     'from-emerald-500 to-teal-700',
  pointing:    'from-teal-500 to-cyan-600',
  thinking:    'from-violet-600 to-indigo-700',
  waving:      'from-emerald-400 to-teal-600',
  celebrating: 'from-emerald-400 to-teal-500',
  alert:       'from-amber-500 to-orange-600',
  minimized:   'from-emerald-500 to-teal-700',
  hidden:      'from-emerald-500 to-teal-700',
}

const STATE_SHADOW: Record<SanadAnimationState, string> = {
  idle:        'shadow-emerald-500/30',
  walking:     'shadow-emerald-500/30',
  pointing:    'shadow-teal-500/40',
  thinking:    'shadow-violet-500/50',
  waving:      'shadow-emerald-400/40',
  celebrating: 'shadow-emerald-400/60',
  alert:       'shadow-amber-500/50',
  minimized:   'shadow-emerald-500/20',
  hidden:      'shadow-none',
}

// ── Size variants ───────────────────────────────────────────────
const SIZE_MAP = {
  sm: { wrapper: 'w-8 h-8', core: 'w-2.5 h-2.5' },
  md: { wrapper: 'w-12 h-12', core: 'w-4 h-4' },
  lg: { wrapper: 'w-14 h-14', core: 'w-5 h-5' },
}

interface SanadAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  /** Optionally override animation state (defaults to store value) */
  overrideState?: SanadAnimationState
}

export function SanadAvatar({ size = 'md', overrideState }: SanadAvatarProps) {
  const { animationState: storeState, reducedMotion } = useSanadStore()
  const state = overrideState ?? storeState
  const { wrapper, core } = SIZE_MAP[size]

  // ── Core floating animation per state ────────────────────────
  const floatAnim = reducedMotion
    ? {}
    : {
        idle:        { y: [0, -4, 0],          transition: { repeat: Infinity, duration: 4,   ease: 'easeInOut' as const } },
        walking:     { x: [0, 4, -4, 0], y: [0, -2, 0], transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' as const } },
        pointing:    { x: 4, scale: 1.05,      transition: { duration: 0.3 } },
        thinking:    { scale: [1, 1.04, 1],    transition: { repeat: Infinity, duration: 2,   ease: 'easeInOut' as const } },
        waving:      { rotate: [0, 14, -10, 14, 0], transition: { duration: 1.5, ease: 'easeInOut' as const } },
        celebrating: { scale: [1, 1.18, 1], rotate: [0, 8, -8, 0], transition: { duration: 0.8 } },
        alert:       { scale: [1, 1.1, 1],     transition: { repeat: Infinity, duration: 0.9, ease: 'easeInOut' as const } },
        minimized:   { scale: 1 },
        hidden:      { scale: 0, opacity: 0 },
      }

  const activeAnim = floatAnim[state as keyof typeof floatAnim] ?? floatAnim.idle

  // ── Inner glow animation ─────────────────────────────────────
  const glowAnim = reducedMotion
    ? {}
    : state === 'thinking'
    ? { opacity: [0.4, 0.9, 0.4], scale: [0.8, 1.3, 0.8] }
    : state === 'celebrating'
    ? { opacity: [0.3, 0.95, 0.3], scale: [1, 1.6, 1] }
    : state === 'alert'
    ? { opacity: [0.5, 1, 0.5] }
    : { opacity: 0.2 }

  return (
    <motion.div
      role="img"
      aria-label="Sanad AI Guide"
      animate={activeAnim as any}
      className={`
        relative rounded-2xl flex items-center justify-center shrink-0
        bg-gradient-to-br ${STATE_COLORS[state]} shadow-lg ${STATE_SHADOW[state]}
        border border-white/10 overflow-hidden
        ${wrapper}
      `}
    >
      {/* Glow ring */}
      <motion.div
        className="absolute inset-2 rounded-full bg-white/20 blur-sm"
        animate={glowAnim as any}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      />

      {/* Geometric core — the "face" of the robot */}
      <div
        className={`
          relative z-10 bg-white rotate-45 rounded-[3px]
          shadow-[0_0_12px_rgba(255,255,255,0.9)]
          ${core}
        `}
      />
    </motion.div>
  )
}
