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
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [questionError, setQuestionError] = useState("")
  const reportRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // All questions = the dynamic ones (idea is already captured before)
  const allQuestions = dynamicQuestions
  const totalQuestions = allQuestions.length
  const progress = totalQuestions > 0 ? ((currentQ + 1) / totalQuestions) * 100 : 0
  const q = allQuestions[currentQ]

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

      // 1. Generate Plan
      const resPlan = await fetch(`/api/business/${currentBusiness.id}/generate-plan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!resPlan.ok) throw new Error("Failed to generate plan")

      // 2. Generate Pitch Deck if score >= 40
      let generatedPitchDeck = false;
      if (successScore !== null && successScore >= 40) {
        const resPitch = await fetch(`/api/business/${currentBusiness.id}/generate-pitch-deck`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ language: useAppStore.getState().language })
        })
        if (resPitch.ok) generatedPitchDeck = true;
      }

      await useAppStore.getState().refreshBusiness()

      if (generatedPitchDeck) {
        useAppStore.getState().setActiveView('pitch-deck' as any)
      } else {
        useAppStore.getState().setActiveView('planner')
      }
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
          {/* Dual brain animation */}
          <div className="flex items-center justify-center gap-6 mb-10">
            {/* Brain 1 */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-xl shadow-red-500/30">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <span className="text-xs font-bold text-red-600 mt-2">GLM 5.2 (Skeptic)</span>
              <span className="text-[10px] text-muted-foreground">Finding flaws...</span>
            </motion.div>

            {/* Sync icon */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>

            {/* Brain 2 */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-600 mt-2">Kimi 2.6 (Optimist)</span>
              <span className="text-[10px] text-muted-foreground">Finding opportunities...</span>
            </motion.div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Two Brains Are Thinking...</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Your idea is being independently analyzed by two AI experts simultaneously, then synthesized into one powerful report.
          </p>

          <div className="bg-card border border-border rounded-2xl p-5 text-left space-y-4">
            {[
              { color: "text-red-500", label: "GLM 5.2 (Skeptic):", step: "Stress-testing your assumptions...", delay: 0 },
              { color: "text-emerald-500", label: "Kimi 2.6 (Optimist):", step: "Mapping your growth opportunities...", delay: 0.5 },
              { color: "text-violet-500", label: "Synthesis:", step: "Weighing both perspectives for final verdict...", delay: 1.2 },
              { color: "text-amber-500", label: "Report:", step: "Writing your dual-brain analysis...", delay: 2 },
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
          <div className="flex -space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg ring-2 ring-background">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg ring-2 ring-background">
              <Brain className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-foreground text-lg">Dual-Brain Validation Report</h2>
            <p className="text-xs text-muted-foreground">GLM 5.2 + Kimi 2.6 · Synthesized by AI</p>
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
            <h3 className="text-xl font-bold text-foreground mb-2">Congratulations! 🎉</h3>
            <p className="text-muted-foreground mb-6">
              Your idea scored <strong>{successScore}%</strong>, which means it has strong potential.
              Would you like our AI to automatically generate a comprehensive 10-step execution plan <strong>and</strong> a professional pitch deck?
            </p>
            <Button
              onClick={handleGeneratePlan}
              disabled={generatingPlan}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-8"
            >
              {generatingPlan ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Plan &amp; Pitch Deck...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Generate Plan &amp; Pitch Deck</>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
