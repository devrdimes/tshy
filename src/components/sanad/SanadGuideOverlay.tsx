"use client"

/**
 * SanadGuideOverlay — The orchestrator for the interactive guide.
 *
 * It reads the active step from useSanadGuideStore, tracks the target element
 * using useSanadTarget, renders the Spotlight and TargetGlow, and positions
 * the Coachmark and AnimatedArrow relative to the target.
 */

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSanadGuideStore } from '@/lib/sanad-guide-store'
import { useSanadStore } from '@/lib/sanad-store'
import { useSanadTarget } from '@/hooks/useSanadTarget'
import { SpotlightMask } from './SpotlightMask'
import { TargetGlow } from './TargetGlow'
import { AnimatedArrow } from './AnimatedArrow'
import { SanadAvatar } from './SanadAvatar'
import { X, ChevronRight, Check } from 'lucide-react'
import { sanadBus } from '@/lib/sanad-bus'

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

  // Track the target element's position
  const { rect, element } = useSanadTarget(activeStep?.targetId ?? null)

  // Sync robot animation state to the main Sanad store when guide step changes
  useEffect(() => {
    if (activeStep) {
      setAnimationState(activeStep.robotState)
    }
  }, [activeStep, setAnimationState])

  // Event listener for auto-advancing steps based on user actions
  useEffect(() => {
    if (!activeStep || isPaused) return

    const handleAction = (payload?: unknown) => {
      markStepComplete(activeStep.stepId)
      if (isLastStep) {
        completeGuide()
      } else {
        nextStep()
      }
    }

    const eventName = `${activeStep.requiredAction}:${activeStep.targetId}`
    
    if (activeStep.requiredAction !== 'informational') {
      sanadBus.on(eventName, handleAction)
      
      // Also intercept native clicks on the element if it's a click_target
      const nativeClickHandler = (e: MouseEvent) => {
        // e.stopPropagation() // Optional: depends if we want to swallow the click
        handleAction()
      }
      
      if (activeStep.requiredAction === 'click_target' && element) {
        element.addEventListener('click', nativeClickHandler as EventListener)
      }

      return () => {
        sanadBus.off(eventName, handleAction)
        if (activeStep.requiredAction === 'click_target' && element) {
          element.removeEventListener('click', nativeClickHandler as EventListener)
        }
      }
    }
  }, [activeStep, isPaused, isLastStep, element, nextStep, completeGuide, markStepComplete])

  if (!activeGuideId || !activeStep || isPaused) return null

  // Calculate placement for the coachmark relative to the target
  const getCoachmarkStyle = (): React.CSSProperties => {
    if (!rect) {
      // Fallback: center screen if no target found
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9995,
      }
    }

    const style: React.CSSProperties = { position: 'fixed', zIndex: 9995 }
    const margin = 20
    const arrowMargin = 40 // space for arrow

    // Simplistic placement logic (can be refined to avoid screen edges)
    switch (activeStep.arrowDirection) {
      case 'up':
        // Coachmark goes BELOW target, pointing UP
        style.top = rect.top + rect.height + margin + arrowMargin
        style.left = rect.centerX
        style.transform = 'translateX(-50%)'
        break
      case 'down':
        // Coachmark goes ABOVE target, pointing DOWN
        style.top = rect.top - margin - arrowMargin
        style.left = rect.centerX
        style.transform = 'translate(-50%, -100%)'
        break
      case 'left':
        // Coachmark goes RIGHT of target, pointing LEFT
        style.left = rect.left + rect.width + margin + arrowMargin
        style.top = rect.centerY
        style.transform = 'translateY(-50%)'
        break
      case 'right':
        // Coachmark goes LEFT of target, pointing RIGHT
        style.left = rect.left - margin - arrowMargin
        style.top = rect.centerY
        style.transform = 'translate(-100%, -50%)'
        break
      case 'auto':
      default:
        // Default to below
        style.top = rect.top + rect.height + margin + arrowMargin
        style.left = rect.centerX
        style.transform = 'translateX(-50%)'
        break
    }
    return style
  }

  // Calculate arrow placement relative to the coachmark
  const getArrowStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {}
    switch (activeStep.arrowDirection) {
      case 'up':
        style.top = -32 // stick out top
        style.left = '50%'
        style.transform = 'translateX(-50%)'
        break
      case 'down':
        style.bottom = -32
        style.left = '50%'
        style.transform = 'translateX(-50%)'
        break
      case 'left':
        style.left = -32
        style.top = '50%'
        style.transform = 'translateY(-50%)'
        break
      case 'right':
        style.right = -32
        style.top = '50%'
        style.transform = 'translateY(-50%)'
        break
    }
    return style
  }

  const handleNextOrComplete = () => {
    markStepComplete(activeStep.stepId)
    if (isLastStep) {
      completeGuide()
      setAnimationState('idle')
    } else {
      nextStep()
    }
  }

  return (
    <>
      <SpotlightMask 
        rect={rect} 
        active={activeStep.spotlight} 
        reducedMotion={reducedMotion} 
        onEscape={exitGuide} 
      />
      
      <TargetGlow 
        rect={rect} 
        active={activeStep.glowTarget} 
        reducedMotion={reducedMotion} 
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep.stepId}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          style={getCoachmarkStyle()}
          className="w-[300px] bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {rect && activeStep.arrowDirection !== 'auto' && (
            <div style={getArrowStyle()} className="absolute pointer-events-none">
              <AnimatedArrow direction={activeStep.arrowDirection} reducedMotion={reducedMotion} />
            </div>
          )}

          <div className="p-4 flex gap-4">
            <div className="shrink-0 -mt-2">
              <SanadAvatar size="sm" overrideState={activeStep.robotState} />
            </div>
            <div className="flex-1">
              <p className="text-sm leading-relaxed">
                {isRtl ? activeStep.message.ar : activeStep.message.en}
              </p>
            </div>
            {activeStep.skippable && (
              <button 
                onClick={exitGuide}
                className="shrink-0 text-slate-400 hover:text-white self-start transition-colors"
                aria-label="Close guide"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="px-4 py-3 bg-slate-800/50 rounded-b-2xl border-t border-slate-700/50 flex items-center justify-between">
            <div className="text-[10px] font-medium text-slate-400 tracking-wider">
              {activeStepIndex + 1} / {steps.length}
            </div>
            
            {activeStep.requiredAction === 'informational' ? (
              <button
                onClick={handleNextOrComplete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {isLastStep ? (
                  <><Check className="w-3.5 h-3.5" /> {isRtl ? 'إنهاء' : 'Finish'}</>
                ) : (
                  <>{isRtl ? 'التالي' : 'Next'} <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} /></>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-violet-500/20 text-violet-300 text-[10px] rounded animate-pulse font-medium border border-violet-500/30">
                  {isRtl ? 'بانتظار الإجراء...' : 'Waiting for action...'}
                </div>
                {/* Fallback skip button for testing/stuck states */}
                {activeStep.skippable && (
                   <button onClick={handleNextOrComplete} className="text-[10px] text-slate-400 hover:text-white underline decoration-dotted underline-offset-2">
                     {isRtl ? 'تخطي' : 'Skip'}
                   </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
