"use client"

/**
 * SanadSpeechBubble — The proactive message bubble shown while the
 * chat panel is closed. Clicking it opens the full chat panel.
 *
 * Appears beside the floating avatar with a CSS tail.
 * Supports RTL layout automatically.
 * Hidden on mobile (chat panel covers that use case).
 */

import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useSanadStore } from '@/lib/sanad-store'

interface SanadSpeechBubbleProps {
  message: string
  onOpen: () => void
  onDismiss: () => void
}

export function SanadSpeechBubble({ message, onOpen, onDismiss }: SanadSpeechBubbleProps) {
  const { isRtl, reducedMotion } = useSanadStore()

  const enterVariants = {
    hidden: { opacity: 0, scale: 0.92, x: isRtl ? -10 : 10 },
    visible: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.88 },
  }

  return (
    <motion.div
      variants={enterVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
      className={`
        hidden md:block relative
        bg-slate-900 dark:bg-slate-800
        text-white rounded-2xl shadow-xl
        max-w-[230px] cursor-pointer
        ${isRtl ? 'rounded-bl-none mr-3' : 'rounded-br-none ml-3'}
      `}
      onClick={onOpen}
      role="button"
      aria-label="Open Sanad chat"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      {/* Dismiss button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss() }}
        className="absolute -top-2 -right-2 w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
        aria-label="Dismiss message"
      >
        <X className="w-3 h-3 text-white" />
      </button>

      <p className="text-xs leading-relaxed px-4 py-3 line-clamp-3 select-none">
        {message}
      </p>

      {/* Speech bubble tail */}
      <div
        className={`
          absolute bottom-4 w-0 h-0
          border-t-[8px] border-t-transparent
          border-b-[8px] border-b-transparent
          ${isRtl
            ? 'left-full border-r-[10px] border-r-slate-900 dark:border-r-slate-800'
            : 'right-full border-l-[10px] border-l-slate-900 dark:border-l-slate-800'
          }
        `}
      />
    </motion.div>
  )
}
