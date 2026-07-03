"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/lib/store"
import { chatWithAI, saveChatMessage, clearChatMessages } from "@/lib/api"
import ReactMarkdown from "react-markdown"
import {
  Sparkles, Send, X, Brain, Trash2, Clock, Maximize2, Minimize2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function AIChatPanel() {
  const { chatOpen, setChatOpen, chatMessages, addChatMessage, setChatMessages, currentBusiness, currentStep, user } = useAppStore()
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [chatMessages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const message = input.trim()
    setInput("")
    const userMsg = { id: Date.now().toString(), role: "user" as const, content: message, context: "", createdAt: new Date().toISOString() }
    addChatMessage(userMsg)
    if (user?.id) {
      saveChatMessage({ userId: user.id, role: "user", content: message }).catch(() => {})
    }
    setSending(true)
    try {
      const response = await chatWithAI(message, currentBusiness?.id, currentStep?.id)
      const assistantMsg = { id: (Date.now() + 1).toString(), role: "assistant" as const, content: response.content, context: "", createdAt: response.timestamp || new Date().toISOString() }
      addChatMessage(assistantMsg)
      if (user?.id) {
        saveChatMessage({ userId: user.id, role: "assistant", content: response.content }).catch(() => {})
      }
    } catch (e) {
      addChatMessage({ id: (Date.now() + 1).toString(), role: "assistant", content: "I apologize, but I encountered an error. Please try again.", context: "", createdAt: new Date().toISOString() })
    }
    setSending(false)
  }

  const handleClearHistory = async () => {
    if (!user?.id) return
    setClearing(true)
    try {
      await clearChatMessages(user.id)
      setChatMessages([])
    } catch (e) { console.error(e) }
    setClearing(false)
  }

  const quickPrompts = [
    { icon: "🎯", text: "What should I focus on next?" },
    { icon: "📊", text: "Analyze my business strategy" },
    { icon: "💰", text: "Help me with financial planning" },
    { icon: "🚀", text: "How can I grow faster?" },
  ]

  return (
    <AnimatePresence>
      {chatOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={cn("fixed right-0 top-0 bottom-0 bg-card border-l border-border shadow-2xl z-50 flex flex-col", expanded ? "w-full" : "w-full sm:w-[420px]")}
        >
          {/* Header */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">PlanWise AI Advisor</h3>
                  <p className="text-[10px] text-emerald-100 flex items-center gap-1"><Clock className="w-3 h-3" />Online • Ready to help</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {chatMessages.length > 0 && (
                  <Button variant="ghost" size="icon" onClick={handleClearHistory} disabled={clearing} className="text-white hover:bg-white/20 h-8 w-8" title="Clear History"><Trash2 className="w-3.5 h-3.5" /></Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)} className="text-white hover:bg-white/20 h-8 w-8 hidden sm:flex" title={expanded ? "Minimize" : "Expand"}>
                  {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)} className="text-white hover:bg-white/20 h-8 w-8"><X className="w-5 h-5" /></Button>
              </div>
            </div>
            {currentBusiness && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/15 text-white text-[10px] backdrop-blur-sm">{currentBusiness.name}</Badge>
                <Badge className="bg-white/15 text-white text-[10px] backdrop-blur-sm">Step {currentBusiness.currentStep}/10</Badge>
              </div>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div ref={scrollRef} className="space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">AI Business Advisor</h3>
                  <p className="text-sm text-muted-foreground mb-4">Ask me anything about your business plan!</p>
                  <div className="space-y-2">
                    {quickPrompts.map(q => (
                      <button key={q.text} onClick={() => setInput(q.text)} className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm bg-muted hover:bg-emerald-50 hover:text-emerald-700 text-muted-foreground transition-all border border-transparent hover:border-emerald-200 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 dark:hover:border-emerald-800">
                        <span className="text-base">{q.icon}</span>
                        <span>{q.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}
                  <div className={cn("rounded-2xl px-4 py-2.5 max-w-[85%] text-sm shadow-sm", msg.role === "user" ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white" : "bg-muted text-foreground")}>
                    <div className="prose prose-sm max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-1 [&_strong]:font-semibold [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    <p className={cn("text-[9px] mt-1.5", msg.role === "user" ? "text-emerald-100" : "text-muted-foreground/50")}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border bg-muted/30">
            <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask your AI advisor..." className="flex-1 bg-background focus:ring-emerald-500" disabled={sending} />
              <Button type="submit" size="icon" disabled={sending || !input.trim()} className="bg-emerald-600 hover:bg-emerald-700 shrink-0 shadow-md"><Send className="w-4 h-4" /></Button>
            </form>
            <p className="text-[9px] text-muted-foreground text-center mt-1.5">AI may produce inaccurate information. Verify important details.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
