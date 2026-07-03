"use client"

import { useTheme } from "next-themes"
import { useAppStore } from "@/lib/store"
import { getExportUrl } from "@/lib/api"
import {
  Bell, Sparkles, Download, Sun, Moon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export function Header() {
  const { activeView, currentBusiness, setChatOpen, unreadCount, setActiveView } = useAppStore()
  const { theme, setTheme } = useTheme()
  const viewTitles: Record<string, string> = { dashboard: "Dashboard", planner: "Step-by-Step Plan", tasks: "Tasks", financials: "Financial Projections", milestones: "Milestones", notifications: "Notifications", analysis: "AI Business Analysis", settings: "Settings" }
  const viewPaths: Record<string, string[]> = { dashboard: ["Home"], planner: ["Home", "Step-by-Step Plan"], tasks: ["Home", "Tasks"], financials: ["Home", "Financial Projections"], milestones: ["Home", "Milestones"], notifications: ["Home", "Notifications"], analysis: ["Home", "AI Analysis"], settings: ["Home", "Settings"] }

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4 ml-10 md:ml-0">
          <div>
            <h2 className="text-xl font-bold text-foreground">{viewTitles[activeView] || "Dashboard"}</h2>
            <Breadcrumb className="mt-0.5">
              <BreadcrumbList>
                {(viewPaths[activeView] || ["Home"]).map((path, i, arr) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {i === arr.length - 1 ? (
                        <BreadcrumbPage className="text-xs text-muted-foreground">{path}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink className="text-xs cursor-pointer" onClick={() => setActiveView("dashboard")}>{path}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {currentBusiness && activeView !== "settings" && (
            <Badge variant="secondary" className="hidden sm:flex bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
              {currentBusiness.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentBusiness && (
            <Button variant="outline" size="sm" className="hidden md:flex gap-2" onClick={() => window.open(getExportUrl(currentBusiness.id), '_blank')}>
              <Download className="w-4 h-4" /> Export Plan
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="w-5 h-5 dark:hidden" />
            <Moon className="w-5 h-5 hidden dark:block" />
          </Button>
          <Button variant="ghost" size="icon" className="relative" onClick={() => setActiveView("notifications")}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{unreadCount}</span>}
          </Button>
          <Button onClick={() => setChatOpen(true)} className="hidden sm:flex bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2 shadow-md">
            <Sparkles className="w-4 h-4" /> AI Advisor
          </Button>
        </div>
      </div>
    </header>
  )
}
