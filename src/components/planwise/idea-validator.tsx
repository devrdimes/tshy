"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import {
  Lightbulb, ChevronRight, ChevronLeft, Send, RotateCcw,
  Sparkles, CheckCircle2, Brain, TrendingUp, Loader2,
  Download, Share2, ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"

// ── Questions ──────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: "idea",
    category: "The Idea",
    emoji: "💡",
    question: "Describe your business idea in 2-3 sentences. What does it do and who is it for?",
    placeholder: "e.g. A mobile app that connects freelance chefs with busy professionals who want home-cooked meals delivered. Targeting urban professionals aged 25-45 who value healthy eating but lack time to cook.",
    hint: "Be specific — the more detail you give, the more accurate your report will be."
  },
  {
    id: "problem",
    category: "The Problem",
    emoji: "🎯",
    question: "What exact problem are you solving? How painful is this problem for your target customer (scale 1-10)?",
    placeholder: "e.g. Busy professionals struggle to eat healthy home-cooked food (pain level: 8/10). Current options are expensive restaurants, unhealthy fast food, or time-consuming meal prep.",
    hint: "Think about how often they feel this pain and how much they currently spend trying to solve it."
  },
  {
    id: "solution",
    category: "Your Solution",
    emoji: "🔧",
    question: "How does your solution solve this problem? What makes it different from existing alternatives?",
    placeholder: "e.g. We enable home chefs to monetize their cooking skills while giving professionals access to affordable, healthy home-cooked meals. Unlike meal kit services, our food is fully cooked. Unlike restaurants, it's personal and cheaper.",
    hint: "Focus on what makes your approach uniquely better — not just different."
  },
  {
    id: "customers",
    category: "Target Customers",
    emoji: "👥",
    question: "Who exactly is your ideal customer? Describe them in detail (age, job, income, behavior, location).",
    placeholder: "e.g. Urban professionals aged 28-42, earning $60k+/year, living in major cities, who order food delivery 3+ times per week. They care about health and quality but are price-sensitive.",
    hint: "The more specific you are, the more targeted your go-to-market strategy will be."
  },
  {
    id: "revenue",
    category: "Business Model",
    emoji: "💰",
    question: "How will you make money? Describe your pricing model and how much you plan to charge.",
    placeholder: "e.g. We take a 20% commission on each meal order. Chefs set their own prices ($8-15 per portion). We also offer a $29/month subscription for customers that gives discounts. Target: 100 orders/day at avg $12 = $240 revenue/day.",
    hint: "Include your pricing, margins, and any recurring revenue streams."
  },
  {
    id: "competition",
    category: "Competition",
    emoji: "⚔️",
    question: "Who are your main competitors and why will customers choose you instead of them?",
    placeholder: "e.g. Direct: Shef, EatWith. Indirect: DoorDash, HelloFresh. We win on: price (30% cheaper than restaurants), authenticity (real home cooking), and community (build relationships with your chef). Our moat: network effects and chef reputation system.",
    hint: "Be honest about strong competitors — investors respect founders who know their landscape."
  },
  {
    id: "traction",
    category: "Progress & Traction",
    emoji: "🚀",
    question: "What have you done so far? Any customers, revenue, pilots, or validation? If nothing yet, what's your plan for the first 30 days?",
    placeholder: "e.g. We have 12 chefs signed up on our waitlist, conducted 50 customer interviews, and 3 people paid us $50 each for a pilot. OR: We have no traction yet. Plan: sign up 5 chefs and get 20 paying customers in 30 days through Facebook groups.",
    hint: "Early traction is the #1 signal of success. Even small proof matters."
  },
  {
    id: "team",
    category: "The Team",
    emoji: "🧠",
    question: "Who is working on this? What are your relevant skills and experience? Are you full-time or part-time?",
    placeholder: "e.g. I'm a former product manager at Uber Eats (4 years) and my co-founder is a senior engineer. We're both full-time. We understand logistics and marketplace dynamics deeply from prior experience.",
    hint: "Investors bet on teams as much as ideas. Relevant experience matters a lot."
  },
  {
    id: "resources",
    category: "Resources & Funding",
    emoji: "🏦",
    question: "How much money do you have to start? What's your monthly burn rate plan? Are you looking to raise funding?",
    placeholder: "e.g. We have $30,000 of our own savings. Monthly burn: ~$5,000 (2 part-time engineers, marketing). We plan to be profitable in 12 months without external funding, but open to raising $200k seed round if we hit 500 monthly orders.",
    hint: "Be realistic — most businesses take longer and cost more than expected."
  },
  {
    id: "vision",
    category: "Long-Term Vision",
    emoji: "🌍",
    question: "Where do you see this business in 3 years? What's the big vision?",
    placeholder: "e.g. In 3 years, we're the largest home chef marketplace in the US with 10,000 chefs across 20 cities, $50M ARR, and launching in Europe. Long-term: we become the global platform for artisan food, empowering 1M chefs worldwide.",
    hint: "Think big but stay grounded. Mention specific milestones and what 'winning' looks like."
  }
]

// ── Types ──────────────────────────────────────────────────────
type Phase = "intro" | "quiz" | "loading" | "report"

// ── Main Component ─────────────────────────────────────────────
export function IdeaValidatorView() {
  const [phase, setPhase] = useState<Phase>("intro")
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [report, setReport] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [successScore, setSuccessScore] = useState<number | null>(null)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (phase === "quiz" && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [currentQ, phase])

  useEffect(() => {
    if (reportRef.current && streaming) {
      reportRef.current.scrollTop = reportRef.current.scrollHeight
    }
  }, [report, streaming])

  const progress = ((currentQ + 1) / QUESTIONS.length) * 100
  const q = QUESTIONS[currentQ]

  const handleNext = () => {
    if (!currentAnswer.trim()) return
    const newAnswers = { ...answers, [q.question]: currentAnswer.trim() }
    setAnswers(newAnswers)
    setCurrentAnswer("")

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      runAnalysis(newAnswers)
    }
  }

  const handleBack = () => {
    if (currentQ > 0) {
      const prevQ = QUESTIONS[currentQ - 1]
      setCurrentAnswer(answers[prevQ.question] || "")
      setCurrentQ(currentQ - 1)
    }
  }

  const handleReset = () => {
    setPhase("intro")
    setCurrentQ(0)
    setAnswers({})
    setCurrentAnswer("")
    setReport("")
    setStreaming(false)
    setSuccessScore(null)
    setGeneratingPlan(false)
  }

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true)
    const { currentBusiness } = useAppStore.getState()
    if (!currentBusiness) {
      alert("No business context found. Please ensure you are logged in properly.")
      setGeneratingPlan(false)
      return
    }

    try {
      const token = localStorage.getItem('tashyeed_token')
      const res = await fetch(`/api/business/${currentBusiness.id}/generate-plan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!res.ok) throw new Error("Failed to generate plan")
      
      await useAppStore.getState().refreshBusiness()
      // Switch to the planner view to see the new plan!
      useAppStore.getState().setActiveView('planner')
    } catch (error) {
      console.error(error)
      alert("An error occurred while generating the plan.")
    } finally {
      setGeneratingPlan(false)
    }
  }

  const runAnalysis = async (finalAnswers: Record<string, string>) => {
    setPhase("loading")
    setReport("")

    try {
      const response = await fetch('/api/ai/idea-validator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers: finalAnswers,
          language: useAppStore.getState().language 
        }),
      })

      if (!response.ok) throw new Error('Failed')

      setPhase("report")
      setStreaming(true)

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullReport = ""

      if (reader) {
        let done = false
        while (!done) {
          const { value, done: doneReading } = await reader.read()
          done = doneReading
          if (value) {
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.slice(6))
                  const text = data.choices[0]?.delta?.content || ''
                  fullReport += text
                  setReport(fullReport)
                } catch {
                  // ignore partial json
                }
              }
            }
          }
        }
        // Extract success score once complete
        // Look for any line that contains '%', 'Overall Success', 'نجاح', 'Succès' and a number
        const scoreMatch = fullReport.match(/(?:Overall Success|نجاح|Succès|Probability).*?\|\s*(\d+)%/i) || fullReport.match(/(\d+)%/);
        if (scoreMatch && scoreMatch[1]) {
           setSuccessScore(parseInt(scoreMatch[1], 10))
        }
      }
      setStreaming(false)
    } catch {
      setPhase("report")
      setReport("# Error\n\nFailed to generate your report. Please check your API configuration and try again.")
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleNext()
    }
  }

  // ── Intro ────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full text-center"
        >
          {/* Icon */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-violet-500/30">
            <Brain className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-4">
            AI Idea Validator
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Answer <strong>{QUESTIONS.length} honest questions</strong> about your idea and get a{" "}
            <strong>professional VC-grade analysis</strong> — including your real success probability,
            market size, competitive position, and a brutally honest verdict.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { icon: TrendingUp, label: "Market Size", desc: "TAM/SAM/SOM" },
              { icon: Sparkles, label: "Success Rate", desc: "Honest % score" },
              { icon: Brain, label: "Expert Verdict", desc: "VC-grade analysis" }
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <Icon className="w-6 h-6 text-violet-500 mb-2 mx-auto" />
                <p className="font-semibold text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setPhase("quiz")}
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-10 py-6 text-lg rounded-2xl shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all"
          >
            Start Validation <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">Takes about 5-8 minutes · 100% honest · No fluff</p>
        </motion.div>
      </div>
    )
  }

  // ── Quiz ─────────────────────────────────────────────────────
  if (phase === "quiz") {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Progress header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Question {currentQ + 1} of {QUESTIONS.length}
              </span>
              <span className="text-sm font-bold text-violet-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-muted" />
            <div className="flex gap-1 mt-3">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-1 rounded-full transition-all",
                    i < currentQ ? "bg-violet-500" : i === currentQ ? "bg-violet-300" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border rounded-3xl p-8 shadow-lg"
            >
              {/* Category badge */}
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">{q.emoji}</span>
                <span className="text-sm font-medium text-violet-600 bg-violet-50 dark:bg-violet-950/30 px-3 py-1 rounded-full border border-violet-200 dark:border-violet-800">
                  {q.category}
                </span>
              </div>

              {/* Question */}
              <h2 className="text-xl font-bold text-foreground mb-6 leading-relaxed">
                {q.question}
              </h2>

              {/* Answer */}
              <Textarea
                ref={textareaRef}
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={q.placeholder}
                className="min-h-[140px] resize-none text-sm bg-background border-muted-foreground/20 focus-visible:ring-violet-500 rounded-xl"
              />

              {/* Hint */}
              <div className="flex items-start gap-2 mt-3 p-3 bg-muted/50 rounded-xl">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{q.hint}</p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentQ === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Ctrl+Enter to continue</span>
                  <Button
                    onClick={handleNext}
                    disabled={!currentAnswer.trim()}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 gap-2 rounded-xl shadow-lg shadow-violet-500/20"
                  >
                    {currentQ === QUESTIONS.length - 1 ? (
                      <><Sparkles className="w-4 h-4" /> Analyze My Idea</>
                    ) : (
                      <>Next <ChevronRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center">
              <Brain className="w-10 h-10 text-violet-600 animate-bounce" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Analyzing Your Idea...</h2>
          <p className="text-muted-foreground text-sm mb-6">Our AI is conducting a full VC-grade analysis of your startup. This may take 15-30 seconds.</p>
          <div className="space-y-3">
            {["Researching your market...", "Evaluating competitors...", "Calculating success probability...", "Writing your report..."].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.8 }}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <Loader2 className="w-4 h-4 animate-spin text-violet-500 shrink-0" />
                {step}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Report ────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      {/* Report Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-lg">Your Validation Report</h2>
            <p className="text-xs text-muted-foreground">Generated by GLM-5.2 · VC-grade analysis</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" /> New Idea
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <div
        ref={reportRef}
        className="bg-card border border-border rounded-3xl p-8 shadow-lg overflow-y-auto max-h-[calc(100vh-280px)] scroll-smooth"
      >
        {streaming && !report && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            <span className="text-sm">Generating your report...</span>
          </div>
        )}

        <div className="prose prose-sm dark:prose-invert max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted [&_th]:font-semibold [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-1.5 [&_strong]:font-bold [&_hr]:my-8 [&_hr]:border-border [&_blockquote]:border-l-4 [&_blockquote]:border-violet-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
          <ReactMarkdown>{report}</ReactMarkdown>
        </div>

        {streaming && (
          <div className="flex items-center gap-2 mt-4 text-violet-500">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}

        {!streaming && successScore !== null && successScore > 40 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-12 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-2xl p-6 text-center"
          >
            <div className="w-12 h-12 bg-violet-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-violet-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Congratulations!</h3>
            <p className="text-muted-foreground mb-6">
              Your idea scored <strong>{successScore}%</strong>, which means it has strong potential. 
              Would you like our AI to automatically generate a comprehensive 10-step execution plan for this business?
            </p>
            <Button 
              onClick={handleGeneratePlan} 
              disabled={generatingPlan}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-8"
            >
              {generatingPlan ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Plan...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Generate Step-by-Step Plan</>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
