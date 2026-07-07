"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/lib/store"
import { Download, ChevronRight, ChevronLeft, Presentation, Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n"

interface PitchSlide {
  slideNumber: number
  title: string
  content: string
  designNote?: string
}

export function PitchDeckView() {
  const { currentBusiness, language } = useAppStore()
  const { t } = useTranslation()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<PitchSlide[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const deckRef = useRef<HTMLDivElement>(null)

  // Reactively parse pitch deck from store whenever currentBusiness changes
  useEffect(() => {
    if (currentBusiness?.pitchDeck && currentBusiness.pitchDeck !== "[]") {
      try {
        const parsed = JSON.parse(currentBusiness.pitchDeck)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed)
          setCurrentSlide(0)
          setIsGenerating(false)
          setGenError(null)
        }
      } catch (e) {
        console.error("Failed to parse pitch deck", e)
      }
    }
  }, [currentBusiness?.pitchDeck])

  const generatePitchDeck = async () => {
    if (!currentBusiness?.id) return
    setIsGenerating(true)
    setGenError(null)
    const token = localStorage.getItem('tashyeed_token')
    try {
      const res = await fetch(`/api/business/${currentBusiness.id}/generate-pitch-deck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ language })
      })
      let data: any = {}
      try { data = await res.json() } catch { /* ignore */ }

      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}: Generation failed`)
      }
      const newSlides: PitchSlide[] = data.data?.slides || []
      if (newSlides.length === 0) throw new Error("AI returned no slides. Please try again.")
      
      // Inject directly into store
      useAppStore.setState((s) => ({
        currentBusiness: s.currentBusiness
          ? { ...s.currentBusiness, pitchDeck: JSON.stringify(newSlides) }
          : s.currentBusiness
      }))
      setSlides(newSlides)
      setCurrentSlide(0)
    } catch (err: any) {
      setGenError(err.message || "Generation failed. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!deckRef.current || slides.length === 0) return
    setIsDownloading(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const opt = {
        margin: 0,
        filename: `${currentBusiness?.name || 'Startup'}_PitchDeck.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: [13.33, 7.5] as [number, number], orientation: 'landscape' }
      }
      await html2pdf().set(opt).from(deckRef.current).save()
    } catch (e) {
      console.error(e)
      alert("Failed to download PDF. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const nextSlide = () => setCurrentSlide(p => Math.min(slides.length - 1, p + 1))
  const prevSlide = () => setCurrentSlide(p => Math.max(0, p - 1))

  const slide = slides[currentSlide]

  const accentColors = [
    { from: "#059669", to: "#0d9488" },
    { from: "#0284c7", to: "#0e7490" },
    { from: "#7c3aed", to: "#6d28d9" },
    { from: "#dc2626", to: "#b45309" },
    { from: "#065f46", to: "#047857" },
    { from: "#1e40af", to: "#1d4ed8" },
    { from: "#7e22ce", to: "#be185d" },
    { from: "#0f766e", to: "#0369a1" },
    { from: "#b45309", to: "#a16207" },
    { from: "#15803d", to: "#166534" },
  ]
  const accent = accentColors[currentSlide % accentColors.length]

  if (!currentBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground">No Business Selected</h2>
        <p className="text-muted-foreground mt-2 max-w-md">Please create or select a business to generate a pitch deck.</p>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[60vh]">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 flex items-center justify-center mb-6 shadow-lg">
          {isGenerating
            ? <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
            : <Presentation className="w-12 h-12 text-emerald-600" />
          }
        </div>

        {isGenerating ? (
          <>
            <h2 className="text-3xl font-bold text-foreground mb-3">Crafting Your Pitch Deck</h2>
            <p className="text-muted-foreground max-w-md mb-2 text-lg">
              Our AI is writing 10 professional investor slides tailored to your business.
            </p>
            <p className="text-sm text-muted-foreground">This takes about 20–40 seconds…</p>
          </>
        ) : genError ? (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-3">Generation Failed</h2>
            <p className="text-red-500 dark:text-red-400 max-w-md mb-6 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              {genError}
            </p>
            <Button
              onClick={generatePitchDeck}
              className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-base shadow-lg shadow-emerald-500/20"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-foreground mb-3">{t('pitchDeck.empty')}</h2>
            <p className="text-muted-foreground max-w-md mb-8 text-lg">
              {currentBusiness.planSteps?.length > 0
                ? "Your plan is ready. Generate a professional investor pitch deck now."
                : t('pitchDeck.emptyDesc')}
            </p>
            {currentBusiness.planSteps?.length > 0 ? (
              <Button
                onClick={generatePitchDeck}
                className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-base shadow-lg shadow-emerald-500/20"
                data-sanad-id="pitch-deck-generate"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Pitch Deck
              </Button>
            ) : (
              <Button
                onClick={() => useAppStore.getState().setActiveView('idea-validator')}
                className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-base shadow-lg shadow-emerald-500/20"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('pitchDeck.validate')}
              </Button>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Presentation className="w-5 h-5 text-white" />
            </div>
            {t('pitchDeck.title')}
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">
            {currentBusiness.name} · {slides.length} slides
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={generatePitchDeck}
            disabled={isGenerating}
            className="h-11 px-4"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-md h-11 px-6 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
          >
            {isDownloading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('pitchDeck.generating')}</>
              : <><Download className="w-4 h-4 mr-2" />{t('pitchDeck.download')}</>
            }
          </Button>
        </div>
      </div>

      {/* Slide Viewer */}
      <div className="relative bg-muted/30 rounded-2xl border border-border overflow-hidden shadow-xl">
        <div className="relative flex items-center justify-center p-4 sm:p-8" style={{ minHeight: '480px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.95, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-5xl"
            >
              <Card className="overflow-hidden border-0 shadow-2xl">
                <CardContent className="p-0">
                  <div className="flex" style={{ minHeight: '420px' }}>
                    <div
                      className="flex flex-col items-center justify-between py-8 px-4 shrink-0 w-20"
                      style={{ background: `linear-gradient(180deg, ${accent.from}, ${accent.to})` }}
                    >
                      <span className="text-white/60 text-xs font-semibold tracking-widest rotate-180" style={{ writingMode: 'vertical-rl' }}>
                        {currentBusiness.name.toUpperCase()}
                      </span>
                      <div className="text-white text-center">
                        <div className="text-3xl font-black">{slide?.slideNumber ?? currentSlide + 1}</div>
                        <div className="text-white/60 text-xs">/{slides.length}</div>
                      </div>
                    </div>

                    <div className="flex-1 p-8 sm:p-12 bg-card flex flex-col justify-center">
                      <div
                        className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-6 w-fit"
                        style={{ background: `${accent.from}18`, color: accent.from }}
                      >
                        Slide {slide?.slideNumber ?? currentSlide + 1}
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-8 leading-tight tracking-tight">
                        {slide?.title}
                      </h2>
                      <div className="space-y-3 text-muted-foreground text-base sm:text-lg leading-relaxed">
                        {slide?.content.split('\n').filter(Boolean).map((line, i) => {
                          const trimmed = line.trim()
                          if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                            return (
                              <div key={i} className="flex items-start gap-3">
                                <div
                                  className="w-2 h-2 rounded-full mt-2.5 shrink-0"
                                  style={{ backgroundColor: accent.from }}
                                />
                                <span>{trimmed.replace(/^[-•]\s*/, '')}</span>
                              </div>
                            )
                          }
                          return <p key={i}>{trimmed}</p>
                        })}
                      </div>
                    </div>
                  </div>

                  {slide?.designNote && (
                    <div className="border-t border-border bg-muted/50 px-8 py-3 flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{t('pitchDeck.designNote')}: </span>
                        {slide.designNote}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="border-t border-border bg-card/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
          <Button variant="outline" onClick={prevSlide} disabled={currentSlide === 0} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <div className="flex gap-1.5 items-center">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className="rounded-full transition-all duration-200 focus:outline-none"
                style={{
                  width: idx === currentSlide ? '24px' : '8px',
                  height: '8px',
                  backgroundColor: idx === currentSlide ? accent.from : undefined,
                  background: idx === currentSlide ? `linear-gradient(90deg, ${accent.from}, ${accent.to})` : undefined,
                }}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
          <Button variant="outline" onClick={nextSlide} disabled={currentSlide === slides.length - 1} className="gap-2">
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Slide Thumbnails Strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {slides.map((s, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`shrink-0 w-36 rounded-xl overflow-hidden border-2 transition-all duration-200 text-left ${
              idx === currentSlide
                ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105'
                : 'border-border hover:border-emerald-300 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accentColors[idx % accentColors.length].from}, ${accentColors[idx % accentColors.length].to})` }} />
            <div className="p-3 bg-card">
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Slide {s.slideNumber}</p>
              <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{s.title}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Hidden PDF export container */}
      <div className="sr-only" aria-hidden="true">
        <div ref={deckRef} style={{ width: '1280px', background: 'white', fontFamily: 'Arial, sans-serif' }}>
          {slides.map((s, idx) => {
            const a = accentColors[idx % accentColors.length]
            return (
              <div key={idx} style={{ display: 'flex', width: '1280px', height: '720px', pageBreakAfter: 'always', overflow: 'hidden' }}>
                <div style={{ width: '80px', background: `linear-gradient(180deg, ${a.from}, ${a.to})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '32px 12px' }}>
                  <div style={{ color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1 }}>{s.slideNumber}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>/{slides.length}</div>
                  </div>
                </div>
                <div style={{ flex: 1, padding: '56px 72px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: a.from, background: `${a.from}15`, borderRadius: '20px', padding: '4px 14px', marginBottom: '24px', width: 'fit-content' }}>
                    {currentBusiness.name} · Slide {s.slideNumber}
                  </div>
                  <div style={{ fontSize: '40px', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, marginBottom: '32px' }}>{s.title}</div>
                  <div style={{ fontSize: '18px', color: '#475569', lineHeight: 1.7 }}>
                    {s.content.split('\n').filter(Boolean).map((line, i) => {
                      const trimmed = line.trim()
                      if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: a.from, marginTop: '7px', flexShrink: 0 }} />
                            <span>{trimmed.replace(/^[-•]\s*/, '')}</span>
                          </div>
                        )
                      }
                      return <p key={i} style={{ marginBottom: '8px' }}>{trimmed}</p>
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
