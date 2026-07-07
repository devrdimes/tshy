"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSanadStore } from "@/lib/sanad-store"
import { SanadAvatar } from "./SanadAvatar"
import { X, Maximize2, Minimize2, Send, Paperclip } from "lucide-react"
import { usePathname } from "next/navigation"
import { useSanadContext } from "@/hooks/useSanadContext"
import { HighlightOverlay } from "./HighlightOverlay"

export function SanadWidget() {
  const { 
    isOpen, isMinimized, reducedMotion, messages, isThinking, hasUnread, 
    setOpen, setMinimized, addMessage, setThinking, markRead, setAnimationState
  } = useSanadStore()
  
  const [inputText, setInputText] = useState("")
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  
  // Activate context engine
  const sanadContext = useSanadContext()

  // Don't show Sanad on the admin panel or auth pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login') || pathname?.startsWith('/signup')) {
    return null
  }

  // Auto-scroll chat
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen, isThinking])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    // Add user message
    addMessage({
      role: 'user',
      content: inputText.trim()
    })
    
    setInputText("")
    setThinking(true)
    setAnimationState('think')

    // PHASE 2 Mock response with Context Awareness:
    setTimeout(() => {
      setThinking(false)
      setAnimationState('idle')
      
      let response = `I understand. You are currently on the **${sanadContext.page}** page.`
      if (sanadContext.businessName) {
        response += ` We are working on **${sanadContext.businessName}**.`
      }
      
      if (inputText.toLowerCase().includes('highlight') || inputText.toLowerCase().includes('where')) {
        response += ` Let me point that out for you on the screen.`
        setAnimationState('point')
        // Mock highlighting the first major card or button
        setHighlightId('main-content-area')
      } else {
        response += ` My recommendation is: ${sanadContext.suggestedAction}`
      }

      addMessage({
        role: 'assistant',
        content: response
      })
    }, 1500)
  }

  // Animation variants
  const panelVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95, pointerEvents: "none" as const },
    visible: { opacity: 1, y: 0, scale: 1, pointerEvents: "auto" as const }
  }

  return (
    <>
      <HighlightOverlay activeElementId={highlightId} onClose={() => { setHighlightId(null); setAnimationState('idle') }} />
      
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
        
        {/* Chat Panel */}
        <AnimatePresence>
          {isOpen && !isMinimized && (
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              className="pointer-events-auto bg-card border border-border rounded-2xl shadow-2xl w-[350px] sm:w-[400px] h-[500px] max-h-[calc(100vh-100px)] flex flex-col overflow-hidden mb-4"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SanadAvatar size="sm" />
                  <div>
                    <h3 className="font-bold text-white text-sm">Sanad</h3>
                    <p className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">AI Co-Founder</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setMinimized(true)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-violet-600 text-white rounded-br-sm' 
                        : 'bg-white dark:bg-slate-900 border border-border text-foreground rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                
                {isThinking && (
                  <div className="flex items-start">
                    <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-violet-500" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, delay: 0 }} />
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-violet-500" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, delay: 0.2 }} />
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-violet-500" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, delay: 0.4 }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 bg-card border-t border-border">
                <form onSubmit={handleSend} className="relative flex items-center">
                  <button type="button" className="absolute left-3 text-muted-foreground hover:text-foreground">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask Sanad for guidance..."
                    className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!inputText.trim() || isThinking}
                    className="absolute right-2 p-1.5 bg-violet-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button / Avatar */}
        <AnimatePresence>
          {(!isOpen || isMinimized) && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => { setOpen(true); setMinimized(false); markRead(); }}
              className="pointer-events-auto relative group flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-2xl"
            >
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-background rounded-full z-10" />
              )}
              
              <SanadAvatar size="lg" />
              
              {/* Hover Tooltip */}
              <div className="absolute right-full mr-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
                Need guidance?
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
