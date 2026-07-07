// ============================================================
// Tashyeed — Sanad AI Guide Store
// State machine for the floating AI guide robot
// ============================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ──────────────────────────────────────────────────────

/** All animation states the robot can be in */
export type SanadAnimationState =
  | 'idle'
  | 'walking'
  | 'pointing'
  | 'thinking'
  | 'waving'
  | 'celebrating'
  | 'alert'
  | 'minimized'
  | 'hidden'

/** A single message in the chat history */
export interface SanadMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

interface SanadState {
  // ── Visibility & Panel UI ──────────────────────────────────
  isOpen: boolean
  isMinimized: boolean
  hasUnread: boolean

  // ── Animation State Machine ────────────────────────────────
  animationState: SanadAnimationState

  // ── Accessibility ──────────────────────────────────────────
  reducedMotion: boolean

  // ── Language ───────────────────────────────────────────────
  /** True when the app is in Arabic mode (drives RTL layout) */
  isRtl: boolean

  // ── Chat ───────────────────────────────────────────────────
  messages: SanadMessage[]
  isThinking: boolean

  // ── Actions ────────────────────────────────────────────────
  open: () => void
  close: () => void
  minimize: () => void
  unminimize: () => void
  toggle: () => void
  markRead: () => void

  setAnimationState: (state: SanadAnimationState) => void
  setReducedMotion: (v: boolean) => void
  setIsRtl: (v: boolean) => void

  addMessage: (msg: Omit<SanadMessage, 'id' | 'timestamp'>) => void
  setThinking: (v: boolean) => void
  clearMessages: () => void
}

// ── Store ──────────────────────────────────────────────────────

export const useSanadStore = create<SanadState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isMinimized: false,
      hasUnread: true,
      animationState: 'idle',
      reducedMotion: false,
      isRtl: false,
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hello. I am Sanad, your AI Co-Founder. I am here to guide you through building your business. Ask me anything or click a feature to get started.',
          timestamp: new Date().toISOString(),
        },
      ],
      isThinking: false,

      open: () => set({ isOpen: true, isMinimized: false, hasUnread: false }),
      close: () => set({ isOpen: false }),
      minimize: () => set({ isMinimized: true }),
      unminimize: () => set({ isMinimized: false }),
      toggle: () => {
        const { isOpen, isMinimized } = get()
        if (isOpen && !isMinimized) {
          set({ isOpen: false })
        } else {
          set({ isOpen: true, isMinimized: false, hasUnread: false })
        }
      },
      markRead: () => set({ hasUnread: false }),

      setAnimationState: (state) => set({ animationState: state }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
      setIsRtl: (v) => set({ isRtl: v }),

      addMessage: (msg) =>
        set((s) => ({
          messages: [
            ...s.messages,
            {
              ...msg,
              id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              timestamp: new Date().toISOString(),
            },
          ],
          hasUnread: !s.isOpen,
        })),

      setThinking: (v) => set({ isThinking: v }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'sanad-ui-state',
      // Only persist minimization preference, not transient UI state
      partialize: (s) => ({
        isMinimized: s.isMinimized,
      }),
    }
  )
)
