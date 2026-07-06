"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import {
  Lightbulb, ChevronRight, ChevronLeft, RotateCcw,
  Sparkles, CheckCircle2, Brain, TrendingUp, Loader2,
  ArrowRight, Wand2, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"

// ── Types ──────────────────────────────────────────────────────
type Phase = "intro" | "idea-input" | "generating-questions" | "quiz" | "loading" | "report"

interface DynamicQuestion {
  id: string
  category: string
  emoji: string
  question: string
  placeholder: string
  hint: string
}

// ── The fixed opening question ─────────────────────────────────
const IDEA_QUESTION: DynamicQuestion = {
  id: "idea",
  category: "Your Idea",
  emoji: "💡",
  question: "Describe your business idea in 2-3 sentences. What does it do and who is it for?",
  placeholder: "e.g. A mobile app that connects freelance chefs with busy professionals who want home-cooked meals delivered. Targeting urban professionals aged 25-45 who value healthy eating but lack time to cook.",
  hint: "Be specific — the more detail you give, the smarter and more tailored your follow-up questions will be."
}

// ── Main Component ─────────────────────────────────────────────
export function IdeaValidatorView() {
  const { language } = useAppStore()
  const [phase, setPhase] = useState<Phase>("intro")
  const [ideaText, setIdeaText] = useState("")
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicQuestion[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [report, setReport] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [successScore, setSuccessScore] = useState<number | null>(null)
  
  // Prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [planStep, setPlanStep] = useState<string>("") // which step of generation we're on
  const [questionError, setQuestionError] = useState("")
  const reportRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // All questions = the dynamic ones (idea is already captured before)
  const allQuestions = dynamicQuestions
  const totalQuestions = allQuestions.length
  const progress = totalQuestions > 0 ? ((currentQ + 1) / totalQuestions) * 100 : 0
  const q = allQuestions[currentQ]

  // Load state from localStorage on mount
  useEffect(() => {
    setIsMounted(true)
    const savedState = localStorage.getItem("tashyeed_idea_validator_state")
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        // Only load if it's not a loading/streaming phase to prevent getting stuck
        if (parsed.phase && parsed.phase !== "loading" && parsed.phase !== "generating-questions") {
          setPhase(parsed.phase)
          setIdeaText(parsed.ideaText || "")
          setDynamicQuestions(parsed.dynamicQuestions || [])
          setCurrentQ(parsed.currentQ || 0)
          setAnswers(parsed.answers || {})
          setReport(parsed.report || "")
          setSuccessScore(parsed.successScore || null)
        }
      } catch (e) {
        console.error("Failed to parse saved Idea Validator state", e)
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isMounted) return
    const stateToSave = {
      phase: streaming ? "loading" : phase, // don't save streaming state
      ideaText,
      dynamicQuestions,
      currentQ,
      answers,
      report,
      successScore
    }
    localStorage.setItem("tashyeed_idea_validator_state", JSON.stringify(stateToSave))
  }, [phase, ideaText, dynamicQuestions, currentQ, answers, report, successScore, streaming, isMounted])

  useEffect(() => {
    if ((phase === "quiz" || phase === "idea-input") && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [currentQ, phase])

  useEffect(() => {
    if (reportRef.current && streaming) {
      reportRef.current.scrollTop = reportRef.current.scrollHeight
    }
  }, [report, streaming])

  // ── Step 1: After user describes idea, AI generates tailored questions ──
  const handleGenerateQuestions = async () => {
    if (!ideaText.trim()) return
    setPhase("generating-questions")
    setQuestionError("")
    try {
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: ideaText.trim(), language })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed')

      const questions: DynamicQuestion[] = data.data.questions
      setDynamicQuestions(questions)
      setCurrentQ(0)
      setCurrentAnswer("")
      setPhase("quiz")
    } catch (e) {
      console.error(e)
      setQuestionError("Failed to generate questions. Please try again.")
      setPhase("idea-input")
    }
  }

  // ── Step 2: Navigate through AI-generated questions ──
  const handleNext = () => {
    if (!currentAnswer.trim() || !q) return
    const newAnswers = { ...answers, [q.question]: currentAnswer.trim() }
    setAnswers(newAnswers)
    setCurrentAnswer("")

    if (currentQ < totalQuestions - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      // All done — run analysis
      runAnalysis({ "What is your business idea?": ideaText.trim(), ...newAnswers })
    }
  }

  const handleBack = () => {
    if (currentQ > 0) {
      const prevQ = allQuestions[currentQ - 1]
      setCurrentAnswer(answers[prevQ.question] || "")
      setCurrentQ(currentQ - 1)
    } else {
      // Go back to the idea input
      setPhase("idea-input")
    }
  }

  const handleReset = () => {
    setPhase("intro")
    setIdeaText("")
    setDynamicQuestions([])
    setCurrentQ(0)
    setAnswers({})
    setCurrentAnswer("")
    setReport("")
    setStreaming(false)
    setSuccessScore(null)
    setGeneratingPlan(false)
    setQuestionError("")
    localStorage.removeItem("tashyeed_idea_validator_state")
  }

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true)
    setPlanStep("Saving your idea as a new business...")

    const token = localStorage.getItem('tashyeed_token')
    
    // Create a new business for this validated idea
    let targetBusinessId = ""
    try {
      const resCreate = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: ideaText.split(' ').slice(0, 5).join(' ') + '...',
          description: ideaText,
          industry: 'Technology',
          stage: 'idea',
        })
      });
      
      let createData: any = {}
      try { createData = await resCreate.json() } catch { /* empty response */ }
      
      if (!resCreate.ok || !createData.success) {
        const errMsg = createData.error || `HTTP ${resCreate.status}: Failed to save idea`
        throw new Error(errMsg)
      }
      targetBusinessId = createData.data?.id || createData.id
      if (!targetBusinessId) throw new Error('Business created but no ID returned')
      
      useAppStore.getState().setCurrentBusiness(createData.data)
    } catch (e: any) {
      setGeneratingPlan(false)
      setPlanStep("")
      alert(`❌ Setup Failed\n\n${e.message}\n\nPlease check you are logged in and try again.`)
      return
    }

    try {
      // ── Step 1: Generate execution plan ──────────────────────
      setPlanStep("Generating your 10-step execution plan...")
      
      let resPlan: Response
      try {
        resPlan = await fetch(`/api/business/${targetBusinessId}/generate-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        })
      } catch (networkErr: any) {
        throw new Error(`Network error calling generate-plan: ${networkErr.message}`)
      }

      let planData: any = {}
      try { planData = await resPlan.json() } catch { /* empty body */ }
      
      if (!resPlan.ok || !planData.success) {
        const errMsg = planData.error || `HTTP ${resPlan.status}: Plan generation failed`
        throw new Error(`Plan Generation Error: ${errMsg}`)
      }

      // ── Step 2: Generate pitch deck ───────────────────────────
      let generatedPitchDeck = false
      if (successScore !== null && successScore >= 40) {
        setPlanStep("Building your professional pitch deck...")
        try {
          const resPitch = await fetch(`/api/business/${targetBusinessId}/generate-pitch-deck`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ language: useAppStore.getState().language })
          })
          let pitchData: any = {}
          try { pitchData = await resPitch.json() } catch { /* empty body */ }
          
          if (resPitch.ok && pitchData.success) {
            generatedPitchDeck = true
          } else {
            // Don't throw — pitch deck failure is non-blocking, just navigate to planner
            console.warn('[pitch-deck] failed:', pitchData.error || `HTTP ${resPitch.status}`)
          }
        } catch (pitchErr: any) {
          console.warn('[pitch-deck] network error:', pitchErr.message)
        }
      }

      // ── Step 3: Refresh store and navigate ───────────────────
      setPlanStep("Opening your personalized planner...")
      
      // Force refresh the business from DB so planSteps are loaded
      await useAppStore.getState().refreshBusiness()
      
      // Small delay to ensure state is settled
      await new Promise(r => setTimeout(r, 500))

      useAppStore.getState().setActiveView('planner')
      
      // After navigation, also try to go to pitch deck tab if generated
      if (generatedPitchDeck) {
        setTimeout(() => {
          useAppStore.getState().setActiveView('pitch-deck' as any)
        }, 100)
      }
      
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      console.error('[handleGeneratePlan]', msg)
      alert(`❌ Generation Failed\n\n${msg}\n\nPlease check:\n• You are logged in\n• The NVIDIA API key is configured on Vercel\n• Try again in a few seconds`)
    } finally {
      setGeneratingPlan(false)
      setPlanStep("")
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
        const scoreMatch = fullReport.match(/(?:Overall Success|نجاح|Succès|Probability).*?\|\s*(\d+)%/i) || fullReport.match(/(\d+)%/)
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
      if (phase === "idea-input") handleGenerateQuestions()
      else handleNext()
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
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-violet-500/30">
            <Brain className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-4">AI Idea Validator</h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Tell us your idea in one sentence. Our AI will{" "}
            <strong>read it, understand it</strong>, then generate{" "}
            <strong>questions tailored specifically to your type of business</strong> —
            not a generic one-size-fits-all quiz.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { icon: Wand2, label: "Smart Questions", desc: "AI tailors every question to your idea" },
              { icon: Sparkles, label: "Success Score", desc: "Honest % probability" },
              { icon: Brain, label: "VC-Grade Report", desc: "McKinsey-level analysis" }
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <Icon className="w-6 h-6 text-violet-500 mb-2 mx-auto" />
                <p className="font-semibold text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setPhase("idea-input")}
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-10 py-6 text-lg rounded-2xl shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all"
          >
            Start Validation <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">9 total questions · Fully personalized · No fluff</p>
        </motion.div>
      </div>
    )
  }

  // ── Idea Input ────────────────────────────────────────────────
  if (phase === "idea-input") {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Step 1 of 2 — Your Idea</span>
              <span className="text-sm font-bold text-violet-600">Start here</span>
            </div>
            <Progress value={15} className="h-2 bg-muted" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key="idea-input"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border rounded-3xl p-8 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">{IDEA_QUESTION.emoji}</span>
                <span className="text-sm font-medium text-violet-600 bg-violet-50 dark:bg-violet-950/30 px-3 py-1 rounded-full border border-violet-200 dark:border-violet-800">
                  {IDEA_QUESTION.category}
                </span>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-2 leading-relaxed">
                {IDEA_QUESTION.question}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                After this, our AI will read your idea and craft <strong>8 smart questions</strong> specifically for your type of business.
              </p>

              <Textarea
                ref={textareaRef}
                value={ideaText}
                onChange={e => setIdeaText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={IDEA_QUESTION.placeholder}
                className="min-h-[160px] resize-none text-sm bg-background border-muted-foreground/20 focus-visible:ring-violet-500 rounded-xl"
              />

              {questionError && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400">{questionError}</p>
                </div>
              )}

              <div className="flex items-start gap-2 mt-3 p-3 bg-muted/50 rounded-xl">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{IDEA_QUESTION.hint}</p>
              </div>

              <div className="flex items-center justify-between mt-6">
                <Button variant="ghost" onClick={() => setPhase("intro")} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Ctrl+Enter to continue</span>
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={!ideaText.trim()}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 gap-2 rounded-xl shadow-lg shadow-violet-500/20"
                  >
                    <Wand2 className="w-4 h-4" /> Generate My Questions
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // ── Generating Questions Loading ──────────────────────────────
  if (phase === "generating-questions") {
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
              <Wand2 className="w-10 h-10 text-violet-600 animate-bounce" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Reading Your Idea...</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Our AI is analyzing what type of business this is and crafting the perfect questions for <em>your specific idea</em>.
          </p>
          <div className="space-y-3">
            {[
              "Identifying your business model...",
              "Detecting industry & market type...",
              "Crafting tailored questions...",
              "Finalizing your personalized quiz..."
            ].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.6 }}
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

  // ── Quiz (AI-Generated Questions) ────────────────────────────
  if (phase === "quiz" && q) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Progress header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Question {currentQ + 1} of {totalQuestions}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-violet-50 dark:bg-violet-950/30 text-violet-600 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800 font-medium">
                  AI-tailored for your idea
                </span>
                <span className="text-sm font-bold text-violet-600">{Math.round(progress)}%</span>
              </div>
            </div>
            <Progress value={progress} className="h-2 bg-muted" />
            <div className="flex gap-1 mt-3">
              {allQuestions.map((_, i) => (
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
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">{q.emoji}</span>
                <span className="text-sm font-medium text-violet-600 bg-violet-50 dark:bg-violet-950/30 px-3 py-1 rounded-full border border-violet-200 dark:border-violet-800">
                  {q.category}
                </span>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-6 leading-relaxed">
                {q.question}
              </h2>

              <Textarea
                ref={textareaRef}
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={q.placeholder}
                className="min-h-[140px] resize-none text-sm bg-background border-muted-foreground/20 focus-visible:ring-violet-500 rounded-xl"
              />

              <div className="flex items-start gap-2 mt-3 p-3 bg-muted/50 rounded-xl">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{q.hint}</p>
              </div>

              <div className="flex items-center justify-between mt-6">
                <Button variant="ghost" onClick={handleBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Ctrl+Enter to continue</span>
                  <Button
                    onClick={handleNext}
                    disabled={!currentAnswer.trim()}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 gap-2 rounded-xl shadow-lg shadow-violet-500/20"
                  >
                    {currentQ === totalQuestions - 1 ? (
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
          className="text-center max-w-lg w-full"
        >
          {/* Dual analysis animation */}
          <div className="flex items-center justify-center gap-6 mb-10">
            {/* Analyst 1 */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-xl shadow-slate-900/40">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <span className="text-xs font-bold text-slate-600 mt-2">Risk Analyst</span>
              <span className="text-[10px] text-muted-foreground">Stress-testing idea...</span>
            </motion.div>

            {/* Sync pulse */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>

            {/* Analyst 2 */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-violet-500/30">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <span className="text-xs font-bold text-violet-600 mt-2">Growth Analyst</span>
              <span className="text-[10px] text-muted-foreground">Finding opportunities...</span>
            </motion.div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Deep Analysis in Progress</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Our proprietary analysis engine is independently evaluating your idea from multiple expert perspectives, then synthesizing one definitive report.
          </p>

          <div className="bg-card border border-border rounded-2xl p-5 text-left space-y-4">
            {[
              { color: "text-slate-500", label: "Risk Assessment:", step: "Identifying vulnerabilities and competitive threats...", delay: 0 },
              { color: "text-violet-500", label: "Market Analysis:", step: "Mapping growth opportunities and market timing...", delay: 0.6 },
              { color: "text-indigo-500", label: "Synthesis:", step: "Calibrating final scores and writing the verdict...", delay: 1.4 },
              { color: "text-amber-500", label: "Report:", step: "Formatting your professional validation report...", delay: 2.2 },
            ].map(({ color, label, step, delay }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay }}
                className="flex items-center gap-3 text-sm"
              >
                <Loader2 className={`w-4 h-4 animate-spin shrink-0 ${color}`} />
                <span className={`font-semibold ${color}`}>{label}</span>
                <span className="text-muted-foreground">{step}</span>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-lg">VC Validation Report</h2>
            <p className="text-xs text-muted-foreground">Multi-perspective analysis · Synthesized by AI · VC-grade</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
          <RotateCcw className="w-4 h-4" /> New Idea
        </Button>
      </div>

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

        {!streaming && successScore !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className={`mt-12 border rounded-2xl p-6 text-center ${
              successScore >= 40 
                ? "bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border-violet-500/20" 
                : "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg ${
              generatingPlan ? "bg-violet-500 shadow-violet-500/30 animate-pulse"
              : successScore >= 40 ? "bg-violet-500 shadow-violet-500/30" : "bg-amber-500 shadow-amber-500/30"
            }`}>
              {generatingPlan ? <Loader2 className="w-6 h-6 animate-spin" /> : successScore >= 40 ? <Sparkles className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
            </div>
            
            {!generatingPlan && successScore >= 40 && (
              <>
                <h3 className="text-xl font-bold text-foreground mb-2">Congratulations! 🎉</h3>
                <p className="text-muted-foreground mb-6">
                  Your idea scored <strong>{successScore}%</strong>, which means it has strong potential.
                  Let our AI generate a comprehensive 10-step execution plan <strong>and</strong> a professional investor pitch deck.
                </p>
              </>
            )}

            {!generatingPlan && successScore < 40 && (
              <>
                <h3 className="text-xl font-bold text-foreground mb-2">Don&apos;t Give Up! 💡</h3>
                <p className="text-muted-foreground mb-6">
                  Your idea scored <strong>{successScore}%</strong>. Every great idea needs refinement.
                  We&apos;ll generate a 10-step plan to help you pivot, validate your assumptions, and strengthen the concept.
                </p>
              </>
            )}

            {generatingPlan ? (
              <div className="space-y-4">
                <p className="text-base font-semibold text-foreground">{planStep || "Working on it..."}</p>
                <div className="flex justify-center gap-2">
                  {[
                    { label: "Setup", done: true },
                    { label: "Plan", done: planStep.toLowerCase().includes("plan") || planStep.toLowerCase().includes("pitch") || planStep.toLowerCase().includes("final") },
                    { label: "Pitch Deck", done: planStep.toLowerCase().includes("pitch") || planStep.toLowerCase().includes("final") },
                    { label: "Done", done: planStep.toLowerCase().includes("final") },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${done ? "bg-violet-500 text-white shadow-md shadow-violet-500/30" : "bg-muted text-muted-foreground"}`}>
                        {done ? "✓" : "·"}
                      </div>
                      <span className={`text-[10px] font-medium ${done ? "text-violet-500" : "text-muted-foreground"}`}>{label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Please wait — this takes about 30-60 seconds</p>
              </div>
            ) : (
              <Button
                onClick={handleGeneratePlan}
                className={`${successScore >= 40 ? "bg-violet-600 hover:bg-violet-700" : "bg-amber-600 hover:bg-amber-700"} text-white font-medium px-8 gap-2`}
              >
                <CheckCircle2 className="w-4 h-4" /> Generate Plan &amp; Pitch Deck
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
