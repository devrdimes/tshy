"use client"

/**
 * useSanadAutoTriggers — Automatically launches guides based on user state and routing.
 *
 * It checks the `completedGuides` registry in the guide store to ensure
 * it never spams the user with the same tour twice.
 */

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useSanadGuideStore } from '@/lib/sanad-guide-store'
import { ALL_GUIDES, type GuideId } from '@/lib/sanad-guides'
import { useAppStore } from '@/lib/store'

export function useSanadAutoTriggers() {
  const pathname = usePathname() ?? ''
  const { businesses, onboarded } = useAppStore()
  const { isGuideCompleted, startGuide, activeGuideId } = useSanadGuideStore()
  
  // Track if we've already checked this session to avoid React strict-mode double-fires
  const hasTriggeredRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    // If a guide is currently running, do not interrupt it with another trigger
    if (activeGuideId) return

    // Helper to safely launch a guide
    const trigger = (id: GuideId) => {
      if (!isGuideCompleted(id) && !hasTriggeredRef.current[id]) {
        hasTriggeredRef.current[id] = true
        // Slight delay so the page has time to render its target IDs
        setTimeout(() => {
          startGuide(id, ALL_GUIDES[id].steps)
        }, 800)
      }
    }

    // 1. Global Onboarding
    // If the user has no businesses and is on the dashboard, launch the massive onboarding tour
    if (businesses.length === 0 && pathname.endsWith('/dashboard')) {
      trigger('onboarding')
      return // Don't evaluate other page tours if onboarding is running
    }

    // 2. Page-specific mini-tours
    const slug = pathname.split('/').filter(Boolean).pop()

    switch (slug) {
      case 'dashboard':
        trigger('dashboard-tour')
        break
      case 'planner':
        trigger('planner-tour')
        break
      case 'tasks':
        trigger('tasks-tour')
        break
      case 'financials':
        trigger('financials-tour')
        break
      case 'milestones':
        trigger('milestones-tour')
        break
      case 'analysis':
        trigger('analysis-tour')
        break
      case 'idea-validator':
        trigger('idea-validator-tour')
        break
      case 'pitch-deck':
        trigger('pitch-deck-tour')
        break
    }
  }, [pathname, businesses.length, onboarded, activeGuideId, isGuideCompleted, startGuide])
}
