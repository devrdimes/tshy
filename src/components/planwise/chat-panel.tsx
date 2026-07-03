"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/lib/store"
import { chatWithAI, saveChatMessage, clearChatMessages } from "@/lib/api"
import ReactMarkdown from "react-markdown"
import {
  Sparkles, Send, X, Brain, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export function AIChatPanel() {
  const { chatOpen, setChatOpen, chatMessages, addChatMessage, setChatMessages, currentBusiness, currentStep, user } = useAppStore()
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [clearing, setClearing] = useState(false)
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

  return (
    <AnimatePresence>
      {chatOpen && (
        <motion.div initial={{ opacity: 0, x: 400 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 400 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b border-border bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><Sparkles className="w-5 h-5" /></div>
                <div><h3 className="font-semibold">PlanWise AI Advisor</h3><p className="text-[10px] text-emerald-100">Your business planning expert</p></div>
              </div>
              <div className="flex items-center gap-1">
                {chatMessages.length > 0 && (
                  <Button variant="ghost" size="icon" onClick={handleClearHistory} disabled={clearing} className="text-white hover:bg-white/20 h-7 w-7" title="Clear History"><Trash2 className="w-3.5 h-3.5" /></Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)} className="text-white hover:bg-white/20"><X className="w-5 h-5" /></Button>
              </div>
            </div>
            {currentBusiness && <p className="text-[10px] text-emerald-100 mt-1">Context: {currentBusiness.name} &bull; Step {currentBusiness.currentStep}/10</p>}
          </div>

          <ScrollArea className="flex-1 p-4">
            <div ref={scrollRef} className="space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">Ask me anything about your business plan!</p>
                  <div className="space-y-2">
                    {["What should I focus on next?", "Analyze my business strategy", "Help me with financial planning"].map(q => (
                      <button key={q} onClick={() => setInput(q)} className="block w-full text-left px-3 py-2 rounded-lg text-xs bg-muted hover:bg-emerald-50 text-muted-foreground hover:text-emerald-700 transition-colors dark:hover:bg-emerald-950/30">{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-emerald-600" /></div>}
                  <div className={`rounded-xl px-3 py-2 max-w-[85%] text-sm ${msg.role === "user" ? "bg-emerald-600 text-white" : "bg-muted text-foreground"}`}>
                    <div className="prose prose-sm max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-1 [&_strong]:font-semibold">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    <p className="text-[9px] mt-1 opacity-50">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-emerald-600" /></div>
                  <div className="bg-muted rounded-xl px-4 py-3"><div className="flex gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} /><div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} /><div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} /></div></div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border">
            <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask your AI advisor..." className="flex-1" disabled={sending} />
              <Button type="submit" size="icon" disabled={sending || !input.trim()} className="bg-emerald-600 hover:bg-emerald-700 shrink-0"><Send className="w-4 h-4" /></Button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
