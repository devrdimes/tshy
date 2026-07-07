"use client"

/**
 * AnimatedArrow — Points from the coachmark to the target element.
 * Uses Framer Motion for a smooth, premium bounce effect.
 *
 * The direction determines which way the arrow points.
 * Automatically aligns to the target rect via SanadGuideOverlay.
 */

import React from 'react'
import { motion } from 'framer-motion'
import type { ArrowDirection } from '@/lib/sanad-guides'

interface AnimatedArrowProps {
  direction: ArrowDirection
  reducedMotion: boolean
  className?: string
}

export function AnimatedArrow({ direction, reducedMotion, className = '' }: AnimatedArrowProps) {
  // SVG path for a sleek, rounded arrow head
  const arrowPath = "M4 4l8 8 8-8"

  const getRotation = (dir: ArrowDirection) => {
    switch (dir) {
      case 'up': return 180
      case 'down': return 0
      case 'left': return 90
      case 'right': return -90
      case 'auto': return 0 // fallback
    }
  }

  const getBounceAnimation = (dir: ArrowDirection) => {
    if (reducedMotion) return {}
    switch (dir) {
      case 'up': return { y: [0, -8, 0] }
      case 'down': return { y: [0, 8, 0] }
      case 'left': return { x: [0, -8, 0] }
      case 'right': return { x: [0, 8, 0] }
      case 'auto': return { y: [0, 8, 0] }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className={`absolute w-8 h-8 flex items-center justify-center text-violet-500 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] ${className}`}
      style={{ rotate: getRotation(direction) }}
    >
      <motion.svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={getBounceAnimation(direction)}
        transition={reducedMotion ? {} : { repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      >
        <path d={arrowPath} />
        {/* Shaft */}
        <line x1="12" y1="4" x2="12" y2="20" strokeWidth="3" />
      </motion.svg>
    </motion.div>
  )
}
