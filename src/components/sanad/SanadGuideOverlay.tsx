"use client"

/**
 * SanadGuideOverlay — Premium interactive guide overlay.
 *
 * Rendering architecture:
 * ─────────────────────────────────────────────────────
 *  Layer z-[9990]  SpotlightMask  — full-screen dimmer with cutout
 *  Layer z-[9991]  TargetGlow     — pulsing violet ring on the element
 *  Layer z-[9992]  BIG ARROW      — standalone fixed arrow pointing AT target
 *  Layer z-[9993]  Coachmark      — message card, positioned near target
 *
 * The arrow is a STANDALONE fixed-position element — NOT a child of the card.
 * This is the key fix: the arrow is always visible, always pointing at the target.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSanadGuideStore } from '@/lib/sanad-guide-store'
import { useSanadStore } from '@/lib/sanad-store'
import { useSanadTarget } from '@/hooks/useSanadTarget'
import { SpotlightMask } from './SpotlightMask'
import { TargetGlow } from './TargetGlow'
import { SanadAvatar } from './SanadAvatar'
import { X, ChevronRight, Check, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { sanadBus } from '@/lib/sanad-bus'
import type { TargetRect } from '@/hooks/useSanadTarget'
import type { ArrowDirection } from '@/lib/sanad-guides'

// ── Standalone Big Arrow ─────────────────────────────────────────────────────
// Rendered as a fixed-position element pointing FROM the coachmark TO the target

interface BigArrowProps {
  rect: TargetRect
  direction: ArrowDirection
  reducedMotion: boolean
}

function BigArrow({ rect, direction, reducedMotion }: BigArrowProps) {
  // Place the arrow right at the edge of the target element
  const arrowSize = 48

  const getArrowStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9992,
      width: arrowSize,
      height: arrowSize,
      pointerEvents: 'none',
    }

    const GAP = 8 // gap between arrow tip and element edge

    switch (direction) {
      case 'down': // arrow below target, pointing up AT the target
        return {
          ...base,
          top: rect.top - arrowSize - GAP,
          left: rect.centerX - arrowSize / 2,
        }
      case 'up': // arrow above target, pointing down AT the target
        return {
          ...base,
          top: rect.top + rect.height + GAP,
          left: rect.centerX - arrowSize / 2,
        }
      case 'right': // arrow to right of target, pointing left AT the target
        return {
          ...base,
          top: rect.centerY - arrowSize / 2,
          left: rect.left + rect.width + GAP,
        }
      case 'left': // arrow to left of target, pointing right AT the target
        return {
          ...base,
          top: rect.centerY - arrowSize / 2,
          left: rect.left - arrowSize - GAP,
        }
      default:
        return {
          ...base,
          top: rect.top - arrowSize - GAP,
          left: rect.centerX - arrowSize / 2,
        }
    }
  }

  const getBounce = () => {
    if (reducedMotion) return {}
    switch (direction) {
      case 'down': return { y: [0, -6, 0] }
      case 'up':   return { y: [0, 6, 0] }
      case 'left': return { x: [0, 6, 0] }
      case 'right':return { x: [0, -6, 0] }
      default:     return { y: [0, -6, 0] }
    }
  }

  const ArrowIcon = () => {
    // Icon points TOWARD the target
    const cls = "w-12 h-12 drop-shadow-[0_0_12px_rgba(139,92,246,0.9)]"
    switch (direction) {
      case 'down':  return <ChevronUp    className={cls} />  // above target → points up at it
      case 'up':    return <ChevronDown  className={cls} />  // below target → points down at it
      case 'left':  return <ChevronRight className={cls} />  // left of target → points right at it
      case 'right': return <ChevronLeft  className={cls} />  // right of target → points left at it
      default:      return <ChevronUp    className={cls} />
    }
  }

  return (
    <motion.div
      style={getArrowStyle()}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1, ...getBounce() }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={reducedMotion
        ? { duration: 0 }
        : { opacity: { duration: 0.2 }, scale: { duration: 0.2 }, y: { repeat: Infinity, duration: 0.9, ease: 'easeInOut' }, x: { repeat: Infinity, duration: 0.9, ease: 'easeInOut' } }
      }
      className="text-violet-400 flex items-center justify-center filter"
    >
      <ArrowIcon />
      {/* Glowing halo behind the arrow */}
      <span className="absolute inset-0 rounded-full bg-violet-500/20 blur-md animate-pulse" />
    </motion.div>
  )
}

// ── Coachmark Placement ──────────────────────────────────────────────────────
// Places the message card on the OPPOSITE side of where the arrow is

function getCoachmarkStyle(rect: TargetRect | null, direction: ArrowDirection): React.CSSProperties {
  if (!rect) {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9993,
    }
  }

  const base: React.CSSProperties = { position: 'fixed', zIndex: 9993, width: 320 }
  const ARROW_SIZE = 56
  const MARGIN = 16

  switch (direction) {
    case 'down': // arrow is above target → card goes further above
      return { ...base, bottom: window.innerHeight - rect.top + ARROW_SIZE + MARGIN, left: Math.min(rect.centerX - 160, window.innerWidth - 340), }
    case 'up': // arrow is below target → card goes further below
      return { ...base, top: rect.top + rect.height + ARROW_SIZE + MARGIN, left: Math.min(rect.centerX - 160, window.innerWidth - 340), }
    case 'right': // arrow is to the right → card further right
      return { ...base, top: Math.max(16, rect.centerY - 80), left: rect.left + rect.width + ARROW_SIZE + MARGIN, }
    case 'left': // arrow is to the left → card further left
      return { ...base, top: Math.max(16, rect.centerY - 80), right: window.innerWidth - rect.left + ARROW_SIZE + MARGIN, }
    default:
      return { ...base, bottom: window.innerHeight - rect.top + ARROW_SIZE + MARGIN, left: Math.min(rect.centerX - 160, window.innerWidth - 340), }
  }
}


// ── Main Overlay Component ───────────────────────────────────────────────────

export function SanadGuideOverlay() {
  const {
    activeGuideId,
    activeStepIndex,
    steps,
    isPaused,
    nextStep,
    exitGuide,
    completeGuide,
    markStepComplete,
  } = useSanadGuideStore()

  const { reducedMotion, isRtl, setAnimationState } = useSanadStore()

  const activeStep = steps[activeStepIndex]
  const isLastStep = activeStepIndex === steps.length - 1

  const { rect, element } = useSanadTarget(activeStep?.targetId ?? null)

  // Sync robot animation state
  useEffect(() => {
    if (activeStep) setAnimationState(activeStep.robotState)
  }, [activeStep, setAnimationState])

  // Auto-advance on native element click
  useEffect(() => {
    if (!activeStep || isPaused) return

    const handleAction = () => {
      markStepComplete(activeStep.stepId)
      if (isLastStep) completeGuide()
      else nextStep()
    }

    const eventName = `${activeStep.requiredAction}:${activeStep.targetId}`

    if (activeStep.requiredAction !== 'informational') {
      sanadBus.on(eventName, handleAction)

      if (activeStep.requiredAction === 'click_target' && element) {
        element.addEventListener('click', handleAction as EventListener)
      }

      return () => {
        sanadBus.off(eventName, handleAction)
        if (activeStep.requiredAction === 'click_target' && element) {
          element.removeEventListener('click', handleAction as EventListener)
        }
      }
    }
  }, [activeStep, isPaused, isLastStep, element, nextStep, completeGuide, markStepComplete])

  const handleNextOrComplete = () => {
    markStepComplete(activeStep.stepId)
    if (isLastStep) {
      completeGuide()
      setAnimationState('idle')
    } else {
      nextStep()
    }
  }

  if (!activeGuideId || !activeStep || isPaused) return null

  const coachmarkStyle = getCoachmarkStyle(rect, activeStep.arrowDirection)

  return (
    <>
      {/* Layer 1: Spotlight dimmer */}
      <SpotlightMask
        rect={rect}
        active={activeStep.spotlight}
        reducedMotion={reducedMotion}
        onEscape={exitGuide}
      />

      {/* Layer 2: Glow ring on target */}
      <TargetGlow
        rect={rect}
        active={activeStep.glowTarget}
        reducedMotion={reducedMotion}
      />

      <AnimatePresence mode="wait">
        <React.Fragment key={activeStep.stepId}>

          {/* Layer 3: BIG STANDALONE ARROW — fixed position on screen */}
          {rect && activeStep.arrowDirection !== 'auto' && (
            <BigArrow
              rect={rect}
              direction={activeStep.arrowDirection}
              reducedMotion={reducedMotion}
            />
          )}

          {/* Layer 4: Coachmark card */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            style={coachmarkStyle}
            className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-violet-500/30 flex flex-col overflow-hidden"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Violet top accent line */}
            <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />

            <div className="p-4 flex gap-3">
              <div className="shrink-0">
                <SanadAvatar size="sm" overrideState={activeStep.robotState} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed text-slate-100">
                  {isRtl ? activeStep.message.ar : activeStep.message.en}
                </p>
              </div>
              {activeStep.skippable && (
                <button
                  onClick={exitGuide}
                  className="shrink-0 text-slate-500 hover:text-white self-start transition-colors mt-0.5"
                  aria-label="Close guide"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="px-4 py-3 bg-slate-800/60 border-t border-slate-700/50 flex items-center justify-between gap-3">
              <div className="text-[10px] font-semibold text-violet-400 tracking-widest uppercase">
                {activeStepIndex + 1} / {steps.length}
              </div>

              {activeStep.requiredAction === 'informational' ? (
                <button
                  onClick={handleNextOrComplete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-violet-900/40"
                >
                  {isLastStep ? (
                    <><Check className="w-3.5 h-3.5" /> {isRtl ? 'إنهاء' : 'Finish'}</>
                  ) : (
                    <>{isRtl ? 'التالي' : 'Next'} <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} /></>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-violet-500/20 text-violet-300 text-[10px] rounded-lg animate-pulse font-medium border border-violet-500/30">
                    {isRtl ? '← افعل ذلك' : 'Do it ↑'}
                  </div>
                  {activeStep.skippable && (
                    <button onClick={handleNextOrComplete} className="text-[10px] text-slate-400 hover:text-white underline decoration-dotted underline-offset-2">
                      {isRtl ? 'تخطي' : 'Skip'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </React.Fragment>
      </AnimatePresence>
    </>
  )
}
