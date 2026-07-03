"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { generateProjections } from "@/lib/api"
import {
  DollarSign, TrendingUp, BarChart3, Clock, Info, Sparkles, Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts"
import { cn } from "@/lib/utils"
import { EmptyState } from "./shared"

export function Financials() {
  const { refreshBusiness } = useAppStore()
  const [generating, setGenerating] = useState(false)
  const biz = useAppStore(s => s.currentBusiness)

  if (!biz) return <EmptyState icon={DollarSign} title="No Business Selected" description="Select a business to view financials" />

  const financials = biz.financials || []
  const actuals = financials.filter(f => !f.projection)
  const projections = financials.filter(f => f.projection)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await generateProjections(biz.id)
      await refreshBusiness()
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  const chartData = financials.map(f => ({
    name: f.period.replace("month-", "M").replace("Q", "Q"),
    Revenue: f.revenue,
    Expenses: f.expenses,
    Profit: f.profit,
    Customers: f.customers,
    BurnRate: f.burnRate,
    projection: f.projection
  })).sort((a, b) => {
    const numA = parseInt(a.name.replace(/\D/g, '')) || 0
    const numB = parseInt(b.name.replace(/\D/g, '')) || 0
    return numA - numB
  })

  const latestActual = actuals[actuals.length - 1]
  const totalRevenue = actuals.reduce((sum, f) => sum + f.revenue, 0)
  const totalExpenses = actuals.reduce((sum, f) => sum + f.expenses, 0)
  const runway = latestActual?.runway ?? 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-emerald-600" /><span className="text-xs text-muted-foreground">Total Revenue</span></div><p className="text-xl font-bold">${totalRevenue.toLocaleString()}</p></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-red-500" /><span className="text-xs text-muted-foreground">Total Expenses</span></div><p className="text-xl font-bold">${totalExpenses.toLocaleString()}</p></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><BarChart3 className="w-4 h-4 text-sky-600" /><span className="text-xs text-muted-foreground">Net Profit</span></div><p className={cn("text-xl font-bold", totalRevenue - totalExpenses >= 0 ? "text-emerald-600" : "text-red-600")}>${(totalRevenue - totalExpenses).toLocaleString()}</p></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-amber-600" /><span className="text-xs text-muted-foreground">Runway</span><Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="text-xs">Based on current burn rate</p></TooltipContent></Tooltip></div><p className="text-xl font-bold">{runway > 50 ? "50+" : runway} months</p></CardContent></Card>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader><CardTitle className="text-lg">Revenue vs Expenses</CardTitle><CardDescription>Actual and projected financial performance</CardDescription></CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-16"><div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4"><DollarSign className="w-10 h-10 text-muted-foreground" /></div><h3 className="text-lg font-semibold text-foreground mb-1">No financial data yet</h3><p className="text-sm text-muted-foreground">Generate AI projections to see your financial outlook</p></div>}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader><CardTitle className="text-lg">Profit Trend</CardTitle><CardDescription>Monthly profit trajectory with break-even reference</CardDescription></CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs><linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.05} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: "Break-even", position: "insideTopLeft", fontSize: 10, fill: "#94a3b8" }} />
                <Area type="monotone" dataKey="Profit" stroke="#10b981" fill="url(#profitGrad)" strokeWidth={2} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-8 text-muted-foreground"><TrendingUp className="w-8 h-8 mx-auto mb-2" /><p>Profit trend will appear here</p></div>}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={handleGenerate} disabled={generating} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md">
          {generating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating AI Projections...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate AI Projections</>}
        </Button>
      </div>
    </div>
  )
}
