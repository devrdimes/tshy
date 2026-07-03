"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAppStore, type Notification } from "@/lib/store"
import { NOTIFICATION_TYPES } from "@/lib/constants"
import { markNotificationRead, markAllNotificationsRead, dismissNotification, generateNotifications, fetchNotifications } from "@/lib/api"
import {
  Bell, Eye, X, CheckCheck, Sparkles, Loader2, Filter, Clock
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { getIcon, fadeIn } from "./shared"

export function NotificationsView() {
  const { notifications, setNotifications, setUnreadCount } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

  const activeNotifications = notifications.filter(n => !n.dismissed)
  const unread = activeNotifications.filter(n => !n.read)
  const read = activeNotifications.filter(n => n.read)

  const filteredNotifications = filter === "unread" ? unread : filter === "read" ? read : activeNotifications

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      const data = await fetchNotifications()
      const notifs = data?.notifications ?? data ?? []
      setNotifications(Array.isArray(notifs) ? notifs : [])
      setUnreadCount(Array.isArray(notifs) ? notifs.filter((n: Notification) => !n.read && !n.dismissed).length : 0)
    } catch (e) { console.error(e) }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      const data = await fetchNotifications()
      const notifs = data?.notifications ?? data ?? []
      setNotifications(Array.isArray(notifs) ? notifs : [])
      setUnreadCount(0)
    } catch (e) { console.error(e) }
  }

  const handleDismiss = async (id: string) => {
    try {
      await dismissNotification(id)
      const data = await fetchNotifications()
      const notifs = data?.notifications ?? data ?? []
      setNotifications(Array.isArray(notifs) ? notifs : [])
      setUnreadCount(Array.isArray(notifs) ? notifs.filter((n: Notification) => !n.read && !n.dismissed).length : 0)
    } catch (e) { console.error(e) }
  }

  const handleGenerate = async () => {
    const { user, currentBusiness } = useAppStore.getState()
    if (!user || !currentBusiness) return
    setLoading(true)
    try {
      await generateNotifications(user.id, currentBusiness.id)
      const data = await fetchNotifications()
      const notifs = data?.notifications ?? data ?? []
      setNotifications(Array.isArray(notifs) ? notifs : [])
      setUnreadCount(Array.isArray(notifs) ? notifs.filter((n: Notification) => !n.read && !n.dismissed).length : 0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const typeColors: Record<string, { border: string; bg: string }> = {
    info: { border: "border-sky-200 dark:border-sky-800", bg: "bg-sky-50 dark:bg-sky-950/30" },
    warning: { border: "border-amber-200 dark:border-amber-800", bg: "bg-amber-50 dark:bg-amber-950/30" },
    success: { border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    urgent: { border: "border-red-200 dark:border-red-800", bg: "bg-red-50 dark:bg-red-950/30" },
    ai_suggestion: { border: "border-violet-200 dark:border-violet-800", bg: "bg-violet-50 dark:bg-violet-950/30" },
    step_reminder: { border: "border-orange-200 dark:border-orange-800", bg: "bg-orange-50 dark:bg-orange-950/30" },
    milestone: { border: "border-teal-200 dark:border-teal-800", bg: "bg-teal-50 dark:bg-teal-950/30" },
  }

  return (
    <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.05 } } }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
          <p className="text-sm text-muted-foreground">{unread.length} unread • {activeNotifications.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={unread.length === 0} className="hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400">
            <CheckCheck className="w-4 h-4 mr-1" />Mark All Read
          </Button>
          <Button size="sm" onClick={handleGenerate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 shadow-md">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}Generate AI Alerts
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All ({activeNotifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
          <TabsTrigger value="read">Read ({read.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notification List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 animate-float">
              <Bell className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No {filter === "unread" ? "unread " : filter === "read" ? "read " : ""}notifications</h3>
            <p className="text-sm text-muted-foreground">You're all caught up! New alerts will appear here.</p>
          </div>
        ) : filteredNotifications.map(n => {
          const typeInfo = NOTIFICATION_TYPES[n.type as keyof typeof NOTIFICATION_TYPES]
          const TypeIcon = getIcon(typeInfo?.icon || "Info")
          const colors = typeColors[n.type] || typeColors.info
          return (
            <motion.div key={n.id} variants={fadeIn}>
              <Card className={cn("border shadow-sm transition-all hover:shadow-md overflow-hidden", !n.read ? colors.border : "border-border", !n.read ? colors.bg : "bg-card")}>
                <div className={cn("h-1", typeInfo?.bg?.replace("bg-", "bg-") || "bg-sky-500")} style={{ backgroundColor: n.type === "info" ? "#0ea5e9" : n.type === "warning" ? "#f59e0b" : n.type === "success" ? "#10b981" : n.type === "urgent" ? "#ef4444" : n.type === "ai_suggestion" ? "#8b5cf6" : n.type === "step_reminder" ? "#f97316" : "#14b8a6" }} />
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", typeInfo?.bg || "bg-sky-100")}>
                      <TypeIcon className={cn("w-5 h-5", typeInfo?.color || "text-sky-600")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-sm text-foreground">{n.title}</h4>
                        <Badge variant="outline" className="text-[10px]">{typeInfo?.label || n.type}</Badge>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!n.read && <Button size="sm" variant="ghost" onClick={() => handleMarkRead(n.id)} className="hover:bg-emerald-50 hover:text-emerald-600"><Eye className="w-4 h-4" /></Button>}
                      <Button size="sm" variant="ghost" onClick={() => handleDismiss(n.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><X className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
