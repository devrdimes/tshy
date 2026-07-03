"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { getBusinessAnalysis } from "@/lib/api"
import ReactMarkdown from "react-markdown"
import {
  Gauge, Sparkles, Loader2, AlertTriangle, TrendingUp, ThumbsUp, Lightbulb, Clock, Zap
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import { EmptyState } from "./shared"

function SWOTCard({ title, icon: Icon, color, items }: { title: string; icon: React.ElementType; color: string; items: { title: string; desc: string; tag: string }[] }) {
  const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-500" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-500" },
    sky: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", icon: "text-sky-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-500" },
  }
  const c = colorMap[color] || colorMap.emerald
  return (
    <Card className={cn("border shadow-sm", c.border)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Icon className={cn("w-5 h-5", c.icon)} />{title} <Badge variant="outline" className="text-[10px] ml-auto">{items.length}</Badge></CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No items identified</p> : (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className={cn("p-2.5 rounded-lg", c.bg)}>
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-medium text-sm text-foreground flex-1">{item.title}</h4>
                  <Badge variant="outline" className={cn("text-[10px] capitalize", c.text)}>{item.tag}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AIAnalysisView() {
  const currentBusiness = useAppStore(s => s.currentBusiness)
  const [analysis, setAnalysis] = useState<Awaited<ReturnType<typeof getBusinessAnalysis>> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const biz = currentBusiness

  const runAnalysis = async () => {
    if (!biz) return
    setLoading(true)
    setError("")
    try {
      const result = await getBusinessAnalysis(biz.id)
      setAnalysis(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze business")
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!biz) return
    let cancelled = false
    const analyze = async () => {
      setLoading(true)
      setError("")
      try {
        const result = await getBusinessAnalysis(biz.id)
        if (!cancelled) setAnalysis(result)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to analyze business")
      }
      if (!cancelled) setLoading(false)
    }
    void analyze()
    return () => { cancelled = true }
  }, [biz?.id])

  if (!biz) return <EmptyState icon={Gauge} title="No Business Selected" description="Select a business to run AI analysis" />

  const a = analysis?.analysis

  const radarData = a ? [
    { metric: "Market Fit", value: a.scores.marketFit, fullMark: 100 },
    { metric: "Financial", value: a.scores.financialHealth, fullMark: 100 },
    { metric: "Execution", value: a.scores.execution, fullMark: 100 },
    { metric: "Competition", value: a.scores.competition, fullMark: 100 },
    { metric: "Risk Mgmt", value: a.scores.risk, fullMark: 100 },
  ] : []

  const scoreColor = (score: number) => score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600"
  const scoreBg = (score: number) => score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1"><Gauge className="w-5 h-5 text-emerald-400" /><h3 className="text-lg font-semibold">AI Business Analysis</h3></div>
              <p className="text-sm text-slate-400">Comprehensive SWOT analysis powered by AI</p>
            </div>
            <Button onClick={runAnalysis} disabled={loading} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing...</> : <><Sparkles className="w-4 h-4 mr-2" />Re-run Analysis</>}
            </Button>
          </div>
          {a && (
            <div className="mt-4 flex items-center gap-6">
              <div className="text-center">
                <div className={cn("text-5xl font-bold", a.overallScore >= 75 ? "text-emerald-400" : a.overallScore >= 50 ? "text-amber-400" : "text-red-400")}>{a.overallScore}</div>
                <p className="text-xs text-slate-400">Overall Score</p>
              </div>
              <div className="flex-1 grid grid-cols-5 gap-2">
                {Object.entries(a.scores).map(([key, val]) => (
                  <div key={key} className="text-center">
                    <div className={cn("text-2xl font-bold", scoreColor(val))}>{val}</div>
                    <p className="text-[10px] text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <div className="h-1.5 rounded-full bg-white/10 mt-1 overflow-hidden"><div className={cn("h-full rounded-full", scoreBg(val))} style={{ width: `${val}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {loading && !a && (
        <Card className="border-border"><CardContent className="p-12 text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">AI is analyzing your business... This may take 10-15 seconds.</p>
        </CardContent></Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/30"><CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-700"><AlertTriangle className="w-5 h-5" /><p className="text-sm">{error}</p></div>
        </CardContent></Card>
      )}

      {a && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle className="text-base">Performance Radar</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                    <Radar name="Score" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle className="text-base">Executive Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-muted-foreground [&_p]:mb-2">
                  <ReactMarkdown>{a.summary}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <SWOTCard title="Strengths" icon={ThumbsUp} color="emerald" items={a.strengths.map(s => ({ title: s.title, desc: s.description, tag: s.impact }))} />
            <SWOTCard title="Weaknesses" icon={AlertTriangle} color="red" items={a.weaknesses.map(s => ({ title: s.title, desc: s.description, tag: s.severity }))} />
            <SWOTCard title="Opportunities" icon={TrendingUp} color="sky" items={a.opportunities.map(s => ({ title: s.title, desc: s.description, tag: s.potential }))} />
            <SWOTCard title="Threats" icon={AlertTriangle} color="amber" items={a.threats.map(s => ({ title: s.title, desc: s.description, tag: s.likelihood }))} />
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" />Strategic Recommendations</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {a.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-medium text-sm text-foreground">{r.title}</h4>
                        <Badge className={cn("text-[10px]", r.priority === "urgent" ? "bg-red-100 text-red-700" : r.priority === "high" ? "bg-orange-100 text-orange-700" : r.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground")}>{r.priority}</Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{r.category}</Badge>
                        <Badge variant="outline" className="text-[10px]"><Clock className="w-3 h-3 mr-1" />{r.timeline}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {a.quickWins.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" />Quick Wins</CardTitle><CardDescription>Low-effort, high-impact actions you can take today</CardDescription></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-3">
                  {a.quickWins.map((q, i) => (
                    <div key={i} className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4 text-amber-500" /><Badge className="text-[10px] bg-amber-100 text-amber-700 capitalize">{q.effort} effort</Badge></div>
                      <h4 className="font-medium text-sm text-foreground">{q.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{q.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
