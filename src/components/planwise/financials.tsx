"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAppStore } from "@/lib/store"
import { generateProjections } from "@/lib/api"
import {
  DollarSign, TrendingUp, BarChart3, Clock, Info, Loader2, ArrowUpRight, ArrowDownRight, Target, Lightbulb } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts"
import { cn } from "@/lib/utils"
import { EmptyState, fadeIn } from "./shared"

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
  const netProfit = totalRevenue - totalExpenses
  const runway = latestActual?.runway ?? 0
  const revenueTrend = actuals.length >= 2 ? actuals[actuals.length - 1].revenue > actuals[actuals.length - 2].revenue : false

  const financialStats = [
    { icon: DollarSign, label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, color: "emerald", trend: revenueTrend ? "up" as const : "neutral" as const },
    { icon: TrendingUp, label: "Total Expenses", value: `$${totalExpenses.toLocaleString()}`, color: "red", trend: "neutral" as const },
    { icon: BarChart3, label: "Net Profit", value: `$${netProfit.toLocaleString()}`, color: netProfit >= 0 ? "emerald" : "red", trend: netProfit >= 0 ? "up" as const : "down" as const },
    { icon: Clock, label: "Runway", value: `${runway > 50 ? "50+" : runway} mo`, color: "amber", trend: "neutral" as const },
  ]

  return (
    <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.05 } } }} className="space-y-6">
      {/* Financial Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {financialStats.map((stat, i) => (
          <motion.div key={i} variants={fadeIn}>
            <Card className="border-border shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <CardContent className="p-4 relative">
                <div className={cn("absolute top-0 left-0 w-1.5 h-full", stat.color === "emerald" ? "bg-emerald-500" : stat.color === "red" ? "bg-red-500" : "bg-amber-500")} />
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.color === "emerald" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50" : stat.color === "red" ? "bg-red-50 text-red-600 dark:bg-red-950/50" : "bg-amber-50 text-amber-600 dark:bg-amber-950/50")}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  {stat.trend === "up" && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                  {stat.trend === "down" && <ArrowDownRight className="w-4 h-4 text-red-500" />}
                </div>
                <p className={cn("text-xl font-bold", stat.color === "emerald" ? "text-emerald-600" : stat.color === "red" ? "text-red-600" : "text-foreground")}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                {stat.label === "Runway" && (
                  <Tooltip>
                    <TooltipTrigger asChild><Info className="w-3 h-3 text-muted-foreground cursor-help absolute top-3 right-3" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">Based on current burn rate</p></TooltipContent>
                  </Tooltip>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue vs Expenses Chart */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
              <CardDescription>Actual and projected financial performance</CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px]">{chartData.length} periods</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border)' }} />
                <Legend />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={DollarSign} title="No financial data yet" description="Generate projections to see your financial outlook" />}
        </CardContent>
      </Card>

      {/* Profit Trend */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Profit Trend</CardTitle>
              <CardDescription>Monthly profit trajectory with break-even reference</CardDescription>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="w-3 h-3" />Break-even at $0
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border)' }} />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: "Break-even", position: "insideTopLeft", fontSize: 10, fill: "#94a3b8" }} />
                <Area type="monotone" dataKey="Profit" stroke="#10b981" fill="url(#profitGrad)" strokeWidth={2.5} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={TrendingUp} title="Profit trend will appear here" description="Generate projections to see the trend" />}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button onClick={handleGenerate} disabled={generating} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 px-8">
          {generating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating Projections...</> : <><Lightbulb className="w-4 h-4 mr-2" />Generate Projections</>}
        </Button>
      </div>
    </motion.div>
  )
}

// Need to import Badge
import { Badge } from "@/components/ui/badge"
