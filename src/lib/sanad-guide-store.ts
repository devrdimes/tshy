// ============================================================
// Tashyeed — Sanad Guide Store
// State machine for the interactive guided tour engine
// ============================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GuideStep, GuideId } from './sanad-guides'

interface CompletedGuides {
  [guideId: string]: boolean
}

interface SanadGuideState {
  // ── Active Guide ─────────────────────────────────────────
  activeGuideId: GuideId | null
  activeStepIndex: number
  steps: GuideStep[]

  // ── Persistence ─────────────────────────────────────────
  completedGuides: CompletedGuides
  /** stepId → true when that step was completed */
  completedSteps: Record<string, boolean>

  // ── UI flags ─────────────────────────────────────────────
  isPaused: boolean
  isWaitingForAction: boolean

  // ── Actions ───────────────────────────────────────────────
  startGuide: (guideId: GuideId, steps: GuideStep[]) => void
  nextStep: () => void
  prevStep: () => void
  skipStep: () => void
  pauseGuide: () => void
  resumeGuide: () => void
  exitGuide: () => void
  completeGuide: () => void
  markStepComplete: (stepId: string) => void
  setWaitingForAction: (v: boolean) => void
  isGuideCompleted: (guideId: GuideId) => boolean
}

export const useSanadGuideStore = create<SanadGuideState>()(
  persist(
    (set, get) => ({
      activeGuideId: null,
      activeStepIndex: 0,
      steps: [],
      completedGuides: {},
      completedSteps: {},
      isPaused: false,
      isWaitingForAction: false,

      startGuide: (guideId, steps) =>
        set({
          activeGuideId: guideId,
          activeStepIndex: 0,
          steps,
          isPaused: false,
          isWaitingForAction: false,
        }),

      nextStep: () =>
        set((s) => {
          const next = s.activeStepIndex + 1
          if (next >= s.steps.length) return s // completed — call completeGuide instead
          return { activeStepIndex: next, isWaitingForAction: false }
        }),

      prevStep: () =>
        set((s) => ({
          activeStepIndex: Math.max(0, s.activeStepIndex - 1),
          isWaitingForAction: false,
        })),

      skipStep: () => {
        const { nextStep, steps, activeStepIndex } = get()
        if (activeStepIndex < steps.length - 1) nextStep()
      },

      pauseGuide: () => set({ isPaused: true }),
      resumeGuide: () => set({ isPaused: false }),

      exitGuide: () =>
        set({
          activeGuideId: null,
          activeStepIndex: 0,
          steps: [],
          isPaused: false,
          isWaitingForAction: false,
        }),

      completeGuide: () =>
        set((s) => ({
          completedGuides: s.activeGuideId
            ? { ...s.completedGuides, [s.activeGuideId]: true }
            : s.completedGuides,
          activeGuideId: null,
          activeStepIndex: 0,
          steps: [],
          isPaused: false,
          isWaitingForAction: false,
        })),

      markStepComplete: (stepId) =>
        set((s) => ({ completedSteps: { ...s.completedSteps, [stepId]: true } })),

      setWaitingForAction: (v) => set({ isWaitingForAction: v }),

      isGuideCompleted: (guideId) => !!get().completedGuides[guideId],
    }),
    {
      name: 'sanad-guide-state',
      partialize: (s) => ({
        completedGuides: s.completedGuides,
        completedSteps: s.completedSteps,
      }),
    }
  )
)
