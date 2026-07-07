"use client"

/**
 * SpotlightMask — Dims the entire page except the target element.
 *
 * Uses an SVG with an evenodd fill rule to punch a "window"
 * around the target. The cutout has rounded corners.
 * Clicking outside the target does not advance the guide —
 * but pressing Escape exits it.
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TargetRect } from '@/hooks/useSanadTarget'

const PADDING = 10
const RADIUS  = 10

interface SpotlightMaskProps {
  rect: TargetRect | null
  active: boolean
  reducedMotion: boolean
  onEscape: () => void
}

export function SpotlightMask({ rect, active, reducedMotion, onEscape }: SpotlightMaskProps) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onEscape])

  const buildPath = (r: TargetRect): string => {
    const x = r.left   - PADDING
    const y = r.top    - PADDING
    const w = r.width  + PADDING * 2
    const h = r.height + PADDING * 2
    const rd = RADIUS

    // Outer rect (fills whole viewport) + inner rounded rect (the cutout)
    return [
      'M 0 0 H 10000 V 10000 H 0 Z',
      `M ${x + rd} ${y}`,
      `H ${x + w - rd} Q ${x + w} ${y} ${x + w} ${y + rd}`,
      `V ${y + h - rd} Q ${x + w} ${y + h} ${x + w - rd} ${y + h}`,
      `H ${x + rd} Q ${x} ${y + h} ${x} ${y + h - rd}`,
      `V ${y + rd} Q ${x} ${y} ${x + rd} ${y} Z`,
    ].join(' ')
  }

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="spotlight"
          className="fixed inset-0 z-[9990] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25 }}
          aria-hidden="true"
        >
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ fillRule: 'evenodd' }}
          >
            <motion.path
              fill="rgba(0,0,0,0.55)"
              animate={{ d: rect ? buildPath(rect) : 'M 0 0 H 10000 V 10000 H 0 Z' }}
              transition={{ duration: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
