"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/lib/store"
import { chatWithAdvisor, saveChatMessage, clearChatMessages } from "@/lib/api"
import ReactMarkdown from "react-markdown"
import {
  Lightbulb, Send, X, Building2, Trash2, Clock, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function AIChatPanel() {
  const { chatOpen, setChatOpen, chatMessages, addChatMessage, setChatMessages, currentBusiness, currentStep, user, language } = useAppStore()
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
    const assistantMsgId = (Date.now() + 1).toString();
    const newAssistantMsg = { id: assistantMsgId, role: "assistant" as const, content: "", context: "", createdAt: new Date().toISOString() };
    addChatMessage(newAssistantMsg);

    try {
      const token = localStorage.getItem('tashyeed_token');
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message, businessId: currentBusiness?.id, stepId: currentStep?.id, language }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.reply) {
        throw new Error(data.error || 'Empty response from AI');
      }

      const assistantContent: string = data.reply;

      // Process workspace commands embedded in the reply
      const commandRegex = /\[COMMAND:\s*([A-Z_]+)(?:\s+({[^\]]+}))?\]/g;
      let match;
      const promises: Promise<Response>[] = [];
      while ((match = commandRegex.exec(assistantContent)) !== null) {
        const commandType = match[1];
        let payload: any = {};
        if (match[2]) {
           try { payload = JSON.parse(match[2]); } catch(e){}
        }
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
        if (commandType === 'CREATE_TASK' && currentBusiness?.id) {
           promises.push(fetch('/api/tasks', { method: 'POST', headers, body: JSON.stringify({...payload, businessId: currentBusiness.id}) }));
        } else if (commandType === 'CREATE_MILESTONE' && currentBusiness?.id) {
           promises.push(fetch(`/api/business/${currentBusiness.id}/milestones`, { method: 'POST', headers, body: JSON.stringify(payload) }));
        } else if (commandType === 'GENERATE_PLAN' && currentBusiness?.id) {
           promises.push(fetch(`/api/business/${currentBusiness.id}/generate-plan`, { method: 'POST', headers }));
        }
      }

      if (promises.length > 0) {
         await Promise.all(promises);
         await useAppStore.getState().refreshTasks();
         await useAppStore.getState().refreshBusiness();
      }

      // Strip command blocks and show clean reply instantly
      const finalDisplayContent = assistantContent.replace(/\[COMMAND:[\s\S]*?\]/g, '').trim();

      setChatMessages(useAppStore.getState().chatMessages.map(msg =>
        msg.id === assistantMsgId ? { ...msg, content: finalDisplayContent } : msg
      ));

      if (user?.id && finalDisplayContent) {
        saveChatMessage({ userId: user.id, role: "assistant", content: finalDisplayContent }).catch(() => {})
      }
    } catch (e: any) {
      const errorMsg = e?.message || 'Unknown error';
      setChatMessages(useAppStore.getState().chatMessages.map(msg =>
        msg.id === assistantMsgId ? { ...msg, content: `❌ **Error:** ${errorMsg}\n\nPlease try again.` } : msg
      ));
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

  const quickPromptsByLang = {
    en: [
      { icon: "🎯", text: "What should I focus on next?" },
      { icon: "📊", text: "Analyze my business strategy" },
      { icon: "💰", text: "Help me with financial planning" },
      { icon: "🚀", text: "How can I grow faster?" },
    ],
    ar: [
      { icon: "🎯", text: "ما الذي يجب أن أركز عليه الآن؟" },
      { icon: "📊", text: "حلل استراتيجية عملي" },
      { icon: "💰", text: "ساعدني في التخطيط المالي" },
      { icon: "🚀", text: "كيف يمكنني النمو بشكل أسرع؟" },
    ],
    fr: [
      { icon: "🎯", text: "Sur quoi dois-je me concentrer ?" },
      { icon: "📊", text: "Analyse ma stratégie d'entreprise" },
      { icon: "💰", text: "Aide-moi avec la planification financière" },
      { icon: "🚀", text: "Comment croître plus vite ?" },
    ],
  }
  const quickPrompts = quickPromptsByLang[language] ?? quickPromptsByLang.en

  return (
    <AnimatePresence>
      {chatOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={cn(
            "fixed bg-card shadow-2xl z-50 flex flex-col overflow-hidden", 
            expanded 
              ? "inset-4 sm:inset-10 rounded-2xl border border-border" 
              : "right-0 top-0 bottom-0 w-full sm:w-[420px] border-l border-border"
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-md">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Tashyeed Advisor</h3>
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
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 scroll-smooth bg-muted/10">
            {chatMessages.length === 0 && (
              <div className="text-center py-12 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Building2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-xl text-foreground mb-2">AI Business Advisor</h3>
                <p className="text-sm text-muted-foreground mb-8">Ask me anything about your business plan, market strategy, or financial model!</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quickPrompts.map(q => (
                    <button key={q.text} onClick={() => setInput(q.text)} className="flex flex-col items-start gap-2 w-full text-left p-4 rounded-xl text-sm bg-background border border-border shadow-sm hover:border-emerald-300 hover:shadow-md transition-all dark:hover:border-emerald-800">
                      <span className="text-xl">{q.icon}</span>
                      <span className="text-muted-foreground font-medium">{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className={cn("mx-auto space-y-6", expanded ? "max-w-4xl" : "")}>
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-md">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={cn("rounded-2xl px-5 py-3.5 max-w-[85%] text-sm shadow-sm", msg.role === "user" ? "bg-emerald-600 text-white rounded-br-sm" : "bg-card border border-border text-foreground rounded-bl-sm")}>
                    <div className="prose prose-sm max-w-none [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ol]:mb-3 [&_li]:mb-1 [&_strong]:font-semibold [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {sending && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3.5 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-md">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
                    <div className="flex gap-1.5 items-center h-full">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className={cn("mx-auto", expanded ? "max-w-4xl" : "")}>
              <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-3">
                <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask your AI advisor..." className="flex-1 h-12 rounded-xl bg-background border-muted-foreground/20 focus-visible:ring-emerald-500 shadow-sm" disabled={sending} />
                <Button type="submit" size="icon" disabled={sending || !input.trim()} className="h-12 w-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shrink-0 shadow-md"><Send className="w-5 h-5" /></Button>
              </form>
              <p className="text-[10px] text-muted-foreground text-center mt-2.5">AI may produce inaccurate information. Verify important details.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
