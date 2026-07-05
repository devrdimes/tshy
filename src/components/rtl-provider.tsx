'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

export function RtlProvider({ children }: { children: React.ReactNode }) {
  const language = useAppStore(state => state.language)

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  return <>{children}</>
}
