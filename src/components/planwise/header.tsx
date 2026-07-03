"use client"

import { useTheme } from "next-themes"
import { useAppStore } from "@/lib/store"
import { getExportUrl } from "@/lib/api"
import {
  Bell, Sparkles, Download, Sun, Moon, Building2, Search, Keyboard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function Header() {
  const { activeView, currentBusiness, setChatOpen, unreadCount, setActiveView, user } = useAppStore()
  const { theme, setTheme } = useTheme()
  const viewTitles: Record<string, string> = { dashboard: "Dashboard", planner: "Step-by-Step Plan", tasks: "Tasks", financials: "Financial Projections", milestones: "Milestones", notifications: "Notifications", analysis: "AI Business Analysis", settings: "Settings" }
  const viewIcons: Record<string, string> = { dashboard: "📊", planner: "📋", tasks: "✅", financials: "💰", milestones: "🎯", notifications: "🔔", analysis: "🤖", settings: "⚙️" }
  const viewPaths: Record<string, string[]> = { dashboard: ["Home"], planner: ["Home", "Step-by-Step Plan"], tasks: ["Home", "Tasks"], financials: ["Home", "Financial Projections"], milestones: ["Home", "Milestones"], notifications: ["Home", "Notifications"], analysis: ["Home", "AI Analysis"], settings: ["Home", "Settings"] }

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md px-4 md:px-6 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4 ml-10 md:ml-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{viewIcons[activeView] || "📊"}</span>
              <h2 className="text-xl font-bold text-foreground">{viewTitles[activeView] || "Dashboard"}</h2>
            </div>
            <Breadcrumb className="mt-0.5">
              <BreadcrumbList>
                {(viewPaths[activeView] || ["Home"]).map((path, i, arr) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {i === arr.length - 1 ? (
                        <BreadcrumbPage className="text-xs text-muted-foreground">{path}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink className="text-xs cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => setActiveView("dashboard")}>{path}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {currentBusiness && activeView !== "settings" && (
            <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
              <Building2 className="w-3 h-3" />{currentBusiness.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Quick Search (decorative) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="hidden lg:flex gap-2 text-muted-foreground w-48 justify-start">
                <Search className="w-3.5 h-3.5" />
                <span className="text-xs">Search...</span>
                <kbd className="ml-auto text-[9px] bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quick search coming soon</TooltipContent>
          </Tooltip>

          {currentBusiness && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden md:flex gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400">
                  <Download className="w-4 h-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.open(getExportUrl(currentBusiness.id), '_blank')}>
                  <Download className="w-4 h-4 mr-2" />Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Download className="w-4 h-4 mr-2" />PDF (coming soon)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400">
                <Sun className="w-5 h-5 dark:hidden" />
                <Moon className="w-5 h-5 hidden dark:block" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle theme (Alt+D)</TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400" onClick={() => setActiveView("notifications")}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center px-1 animate-pulse">{unreadCount}</span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{unreadCount > 0 ? `${unreadCount} unread notifications` : "No new notifications"}</TooltipContent>
          </Tooltip>

          {/* AI Advisor */}
          <Button onClick={() => setChatOpen(true)} className="hidden sm:flex bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
            <Sparkles className="w-4 h-4" /> AI Advisor
          </Button>
        </div>
      </div>
    </header>
  )
}
