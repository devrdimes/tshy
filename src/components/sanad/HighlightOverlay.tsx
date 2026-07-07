"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function HighlightOverlay({ activeElementId, onClose }: { activeElementId: string | null, onClose: () => void }) {
  const [coords, setCoords] = useState<{ x: number, y: number, w: number, h: number } | null>(null)

  useEffect(() => {
    if (!activeElementId) {
      setCoords(null)
      return
    }

    const updateCoords = () => {
      const el = document.getElementById(activeElementId)
      if (el) {
        const rect = el.getBoundingClientRect()
        setCoords({
          x: rect.left,
          y: rect.top,
          w: rect.width,
          h: rect.height
        })
        // Scroll element into view smoothly if not visible
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    updateCoords()
    window.addEventListener('resize', updateCoords)
    window.addEventListener('scroll', updateCoords)
    
    // Auto-close highlight after 5 seconds
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => {
      window.removeEventListener('resize', updateCoords)
      window.removeEventListener('scroll', updateCoords)
      clearTimeout(timer)
    }
  }, [activeElementId, onClose])

  return (
    <AnimatePresence>
      {coords && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[40] pointer-events-none"
        >
          {/* Dark overlay with cutout */}
          <svg className="absolute inset-0 w-full h-full" style={{ fillRule: "evenodd", clipRule: "evenodd" }}>
            <path
              fill="rgba(15, 23, 42, 0.6)"
              d={`M0,0 H10000 V10000 H0 Z M${coords.x - 8},${coords.y - 8} h${coords.w + 16} v${coords.h + 16} h-${coords.w + 16} Z`}
            />
          </svg>
          
          {/* Glowing border around cutout */}
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute border-2 border-violet-500 rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            style={{
              left: coords.x - 8,
              top: coords.y - 8,
              width: coords.w + 16,
              height: coords.h + 16,
            }}
          >
            {/* Pulsing indicator */}
            <div className="absolute -top-3 -right-3 w-6 h-6 bg-violet-600 rounded-full animate-ping opacity-75" />
            <div className="absolute -top-3 -right-3 w-6 h-6 bg-violet-600 rounded-full border-2 border-background" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
