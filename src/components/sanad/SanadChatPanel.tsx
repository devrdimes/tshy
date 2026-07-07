"use client"

/**
 * SanadChatPanel — The slide-up chat panel attached to the floating robot.
 *
 * Features:
 * - Scrollable message list with auto-scroll on new messages
 * - Animated typing indicator (three pulsing dots)
 * - RTL-aware bubble tails and input positioning
 * - Accessible: ARIA labels, keyboard send (Enter), focus management
 * - Mobile: fills full inset when open; desktop: fixed-width panel
 * - Reduced-motion: entry transition is instant
 */

import React, { useEffect, useRef, useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { X, Minimize2, Send } from 'lucide-react'
import { useSanadStore, SanadMessage } from '@/lib/sanad-store'
import { SanadAvatar } from './SanadAvatar'

// ── Typing indicator ─────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 0.18, 0.36].map((delay, i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-violet-400"
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 0.7, delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ── Message bubble ───────────────────────────────────────────────
function MessageBubble({ msg, isRtl }: { msg: SanadMessage; isRtl: boolean }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
          ${isUser
            ? `bg-violet-600 text-white ${isRtl ? 'rounded-bl-sm' : 'rounded-br-sm'}`
            : `bg-white dark:bg-slate-900 border border-border text-foreground shadow-sm ${isRtl ? 'rounded-br-sm' : 'rounded-bl-sm'}`
          }
        `}
      >
        {msg.content}
      </div>
      <time
        className="text-[10px] text-muted-foreground mt-1 px-1"
        dateTime={msg.timestamp}
      >
        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </time>
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────────
interface SanadChatPanelProps {
  /**
   * Called when the user submits a message from this panel.
   * The parent is responsible for responding (mock or AI).
   */
  onUserMessage: (text: string) => void
}

export function SanadChatPanel({ onUserMessage }: SanadChatPanelProps) {
  const {
    isOpen, isMinimized, reducedMotion, isRtl,
    messages, isThinking,
    close, minimize,
  } = useSanadStore()

  const [inputText, setInputText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, isMinimized])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const text = inputText.trim()
    if (!text) return
    setInputText('')
    onUserMessage(text)
  }

  const panelVariants = {
    hidden:  { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0,  scale: 1     },
  }

  const isVisible = isOpen && !isMinimized

  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      transition={{ duration: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
      aria-hidden={!isVisible}
      // Full inset on mobile, fixed size on desktop
      className={`
        pointer-events-${isVisible ? 'auto' : 'none'}
        bg-card border border-border shadow-2xl flex flex-col overflow-hidden
        rounded-2xl mb-4

        /* mobile: fixed to avoid being inside a scroll container */
        fixed inset-x-4 bottom-24 z-50

        /* desktop: relative, fixed dimensions */
        md:relative md:inset-auto md:bottom-auto md:w-[380px] md:h-[520px] md:z-auto

        /* mobile height */
        h-[60vh] max-h-[80vh]
      `}
      role="dialog"
      aria-label="Sanad AI Guide chat"
      aria-modal="false"
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <SanadAvatar size="sm" />
          <div>
            <p className="font-bold text-white text-sm leading-none">Sanad</p>
            <p className="text-[10px] text-emerald-400 font-medium tracking-widest uppercase mt-0.5">
              AI Co-Founder
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={minimize}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Minimize Sanad"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={close}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close Sanad"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50"
        role="log"
        aria-live="polite"
        aria-label="Sanad conversation"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isRtl={isRtl} />
        ))}

        {isThinking && (
          <div className="flex items-start">
            <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl rounded-bl-sm shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* ── Input ───────────────────────────────────────────── */}
      <div className="p-3 bg-card border-t border-border shrink-0">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center gap-2"
          aria-label="Send message to Sanad"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isRtl ? 'اسأل سند للمساعدة...' : 'Ask Sanad for guidance…'}
            dir={isRtl ? 'rtl' : 'ltr'}
            className="
              flex-1 bg-muted/50 border border-border rounded-xl
              px-4 py-3 text-sm
              focus:outline-none focus:ring-2 focus:ring-violet-500/50
              transition-all placeholder:text-muted-foreground
            "
            aria-label="Message input"
            disabled={isThinking}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="
              shrink-0 p-2.5 bg-violet-600 text-white rounded-xl
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:bg-violet-700 active:scale-95
              transition-all shadow-md shadow-violet-600/20
            "
            aria-label="Send message"
          >
            <Send className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </form>
      </div>
    </motion.div>
  )
}
