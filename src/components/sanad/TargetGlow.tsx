"use client"

/**
 * TargetGlow — Adds a premium pulsing ring around the target element.
 * Positioned absolutely based on live TargetRect from useSanadTarget.
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TargetRect } from '@/hooks/useSanadTarget'

const PADDING = 10
const RADIUS  = 10

interface TargetGlowProps {
  rect: TargetRect | null
  active: boolean
  reducedMotion: boolean
}

export function TargetGlow({ rect, active, reducedMotion }: TargetGlowProps) {
  if (!rect) return null

  const style: React.CSSProperties = {
    position: 'fixed',
    left:   rect.left   - PADDING,
    top:    rect.top    - PADDING,
    width:  rect.width  + PADDING * 2,
    height: rect.height + PADDING * 2,
    borderRadius: RADIUS,
    pointerEvents: 'none',
    zIndex: 9992,
  }

  return (
    <AnimatePresence>
      {active && rect && (
        <motion.div
          key="target-glow"
          style={style}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={
            reducedMotion
              ? { opacity: 1, scale: 1 }
              : { opacity: [0.6, 1, 0.6], scale: [1.02, 1, 1.02] }
          }
          exit={{ opacity: 0, scale: 1.04 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }
          className="border-2 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5),inset_0_0_10px_rgba(139,92,246,0.1)]"
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  )
}
