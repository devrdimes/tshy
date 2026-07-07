"use client"

/**
 * useSanadTarget — Resolves a data-sanad-id element and tracks its position.
 *
 * Features:
 * - Retries with MutationObserver until element appears (max 3s)
 * - Updates rect on resize, scroll, and route changes
 * - Returns null safely when target is not found
 * - Scrolls target into view when resolved
 */

import { useEffect, useRef, useState, useCallback } from 'react'

export interface TargetRect {
  top: number
  left: number
  width: number
  height: number
  centerX: number
  centerY: number
}

function getRect(el: Element): TargetRect {
  const r = el.getBoundingClientRect()
  return {
    top: r.top,
    left: r.left,
    width: r.width,
    height: r.height,
    centerX: r.left + r.width / 2,
    centerY: r.top + r.height / 2,
  }
}

export function useSanadTarget(targetId: string | null) {
  const [rect, setRect] = useState<TargetRect | null>(null)
  const [element, setElement] = useState<Element | null>(null)
  const observerRef = useRef<MutationObserver | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  const findAndTrack = useCallback(() => {
    if (!targetId) {
      setRect(null)
      setElement(null)
      return
    }

    const el = document.querySelector(`[data-sanad-id="${targetId}"]`)

    if (el) {
      setElement(el)
      setRect(getRect(el))
      // Scroll into view if not fully visible
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      return
    }

    // Target not in DOM yet — retry if within 3s window
    const elapsed = Date.now() - startTimeRef.current
    if (elapsed < 3000) {
      retryTimerRef.current = setTimeout(findAndTrack, 150)
    } else {
      // Give up — step will render without highlight
      setRect(null)
      setElement(null)
    }
  }, [targetId])

  useEffect(() => {
    startTimeRef.current = Date.now()
    findAndTrack()

    // Watch for DOM mutations (lazy-rendered elements)
    observerRef.current = new MutationObserver(findAndTrack)
    observerRef.current.observe(document.body, { childList: true, subtree: true })

    // Track layout changes
    const handleResize = () => {
      const el = targetId
        ? document.querySelector(`[data-sanad-id="${targetId}"]`)
        : null
      if (el) setRect(getRect(el))
    }

    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('scroll', handleResize, { passive: true, capture: true })

    return () => {
      observerRef.current?.disconnect()
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [targetId, findAndTrack])

  return { rect, element }
}
