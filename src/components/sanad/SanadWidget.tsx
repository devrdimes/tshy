"use client"

/**
 * SanadWidget — Root floating container for the Sanad AI guide.
 *
 * Responsibilities:
 * 1. Detect user's reduced-motion preference and sync to store.
 * 2. Detect RTL from the existing app language store and sync.
 * 3. Detect current route and expose to child components.
 * 4. Gate visibility: never shows on /admin, /login, /signup.
 * 5. Render floating avatar + speech bubble (when closed).
 * 6. Render the chat panel (when open).
 * 7. Handle mock AI responses for Phase 1 (real GLM in Phase 5).
 *
 * Positioning:
 * - Desktop: bottom-right (or bottom-left in RTL)
 * - Mobile:  above the native bottom bar (bottom-20 to clear system UI)
 */

import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useSanadStore } from '@/lib/sanad-store'
import { useSanadGuideStore } from '@/lib/sanad-guide-store'
import { ONBOARDING_GUIDE } from '@/lib/sanad-guides'
import { useAppStore } from '@/lib/store'
import { useSanadAutoTriggers } from '@/hooks/useSanadAutoTriggers'
import { SanadAvatar } from './SanadAvatar'
import { SanadChatPanel } from './SanadChatPanel'
import { SanadSpeechBubble } from './SanadSpeechBubble'

// ── Pages where Sanad should never appear ────────────────────────
const HIDDEN_ROUTES = ['/admin', '/login', '/signup', '/reset-password']

// ── Page-specific context messages (Phase 1 mock) ───────────────
const PAGE_CONTEXT: Record<string, { en: string; ar: string }> = {
  dashboard:       { en: 'Your business overview is here. Where would you like to start?', ar: 'نظرة عامة على أعمالك هنا. من أين تريد البدء؟' },
  planner:         { en: 'This is your business roadmap. Let\'s work through it together.', ar: 'هذه خارطة طريق عملك. لنعمل عليها معاً.' },
  tasks:           { en: 'Tasks turn your plan into daily action. What needs doing today?', ar: 'المهام تحوّل خطتك إلى عمل يومي. ما الذي يجب إنجازه اليوم؟' },
  financials:      { en: 'Let\'s understand your costs, pricing, and runway together.', ar: 'لنفهم تكاليفك وتسعيرك ومدة تشغيلك معاً.' },
  milestones:      { en: 'Milestones keep your business moving toward meaningful goals.', ar: 'المعالم تُبقي عملك يتجه نحو أهداف ذات معنى.' },
  analysis:        { en: 'Business analysis shows what is strong and what needs attention.', ar: 'تحليل الأعمال يُظهر ما هو قوي وما يحتاج اهتماماً.' },
  'idea-validator':{ en: 'Let\'s validate your idea before investing time or money.', ar: 'لنتحقق من صحة فكرتك قبل استثمار الوقت أو المال.' },
  'pitch-deck':    { en: 'Create a professional pitch deck from the work you\'ve saved here.', ar: 'أنشئ عرضاً تقديمياً احترافياً من العمل الذي حفظته هنا.' },
  notifications:   { en: 'Stay on top of your business updates and reminders.', ar: 'ابقَ على اطلاع بآخر تحديثات وتذكيرات عملك.' },
  settings:        { en: 'Customise your Tashyeed workspace from here.', ar: 'خصّص مساحة عمل تشييد من هنا.' },
}

// ── Mock Phase 1 AI response ─────────────────────────────────────
function getMockResponse(
  userText: string,
  page: string,
  businessName: string | null,
  isRtl: boolean
): string {
  const lower = userText.toLowerCase()
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('مرحبا') || lower.includes('السلام')) {
    return isRtl
      ? `مرحباً! أنا سند، مساعدك في التخطيط للأعمال. كيف يمكنني مساعدتك في ${businessName || 'عملك'} اليوم؟`
      : `Hello! I am Sanad, your business planning guide. How can I help with ${businessName || 'your business'} today?`
  }
  if (lower.includes('help') || lower.includes('مساعدة') || lower.includes('ساعد')) {
    return isRtl
      ? `يسعدني مساعدتك. أنت حالياً في صفحة ${page}. ما الذي تريد إنجازه؟`
      : `I am here to help. You are currently on the ${page} page. What would you like to accomplish?`
  }
  const ctx = PAGE_CONTEXT[page]
  return ctx
    ? isRtl ? ctx.ar : ctx.en
    : isRtl ? 'كيف يمكنني مساعدتك في عملك اليوم؟' : 'How can I assist with your business today?'
}

// ── Component ────────────────────────────────────────────────────
export function SanadWidget() {
  const {
    isOpen, isMinimized, hasUnread, isRtl, reducedMotion,
    messages, open, toggle, markRead, minimize,
    addMessage, setThinking, setAnimationState,
    setReducedMotion, setIsRtl,
  } = useSanadStore()

  const { startGuide } = useSanadGuideStore()
  const { language, currentBusiness } = useAppStore()
  const pathname = usePathname() ?? ''

  // Fire auto-triggers
  useSanadAutoTriggers()

  // ── Sync reduced-motion preference ──────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [setReducedMotion])

  // ── Sync language → RTL ──────────────────────────────────────
  useEffect(() => {
    setIsRtl(language === 'ar')
  }, [language, setIsRtl])

  // ── Dismiss speech bubble ────────────────────────────────────
  const [bubbleDismissed, setBubbleDismissed] = useState(false)

  // ── Gate: hide on restricted routes ─────────────────────────
  const isHiddenRoute = HIDDEN_ROUTES.some((r) => pathname.startsWith(r))
  if (isHiddenRoute) return null

  // ── Derive current page slug ─────────────────────────────────
  const pageSlug = pathname.split('/').filter(Boolean).pop() ?? 'dashboard'

  // ── Derive latest assistant message for speech bubble ────────
  const latestAssistant = messages.filter((m) => m.role === 'assistant').pop()

  // ── Phase 1 mock AI handler ──────────────────────────────────
  const handleUserMessage = (text: string) => {
    addMessage({ role: 'user', content: text })
    
    // Developer backdoor to test Phase 2
    if (text.trim().toLowerCase() === '/tour') {
      minimize()
      startGuide('onboarding', ONBOARDING_GUIDE.steps)
      return
    }

    setThinking(true)
    setAnimationState('thinking')

    setTimeout(() => {
      const reply = getMockResponse(text, pageSlug, currentBusiness?.name ?? null, isRtl)
      addMessage({ role: 'assistant', content: reply })
      setThinking(false)
      setAnimationState('idle')
    }, 1200)
  }

  // ── Positioning classes (RTL-aware) ──────────────────────────
  const positionClass = isRtl
    ? 'left-4 md:left-6'
    : 'right-4 md:right-6'

  return (
    <div
      className={`fixed z-[9998] flex flex-col items-end bottom-20 md:bottom-6 ${positionClass} pointer-events-none`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── Chat panel ─────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <SanadChatPanel onUserMessage={handleUserMessage} />
        )}
      </AnimatePresence>

      {/* ── Floating avatar row ─────────────────────────────── */}
      <div className={`flex items-end gap-3 pointer-events-auto ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Speech bubble — visible when panel is closed and there's an unread message */}
        <AnimatePresence>
          {(!isOpen || isMinimized) && hasUnread && latestAssistant && !bubbleDismissed && (
            <SanadSpeechBubble
              message={isRtl && PAGE_CONTEXT[pageSlug] ? PAGE_CONTEXT[pageSlug].ar : latestAssistant.content}
              onOpen={() => { open(); setBubbleDismissed(false) }}
              onDismiss={() => { setBubbleDismissed(true); markRead() }}
            />
          )}
        </AnimatePresence>

        {/* Floating avatar button */}
        <AnimatePresence mode="wait">
          {(!isOpen || isMinimized) && (
            <motion.button
              key="sanad-fab"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2, type: 'spring', stiffness: 320, damping: 22 }}
              onClick={() => { toggle(); setBubbleDismissed(false) }}
              className="
                relative flex items-center justify-center
                focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/40
                rounded-2xl transition-transform hover:scale-105 active:scale-95
                shadow-xl shadow-emerald-600/20
              "
              aria-label="Open Sanad AI Guide"
              data-sanad-id="sanad-robot-button"
            >
              {/* Unread indicator */}
              {hasUnread && !bubbleDismissed && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-background rounded-full z-10 animate-pulse" aria-label="Unread message" />
              )}
              <SanadAvatar size="lg" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
