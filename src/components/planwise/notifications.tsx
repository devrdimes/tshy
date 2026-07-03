"use client"

import { useState } from "react"
import { useAppStore, type Notification } from "@/lib/store"
import { NOTIFICATION_TYPES } from "@/lib/constants"
import { markNotificationRead, markAllNotificationsRead, dismissNotification, generateNotifications, fetchNotifications } from "@/lib/api"
import {
  Bell, Eye, X, CheckCheck, Sparkles, Loader2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getIcon } from "./shared"

export function NotificationsView() {
  const { notifications, setNotifications, setUnreadCount } = useAppStore()
  const [loading, setLoading] = useState(false)

  const activeNotifications = notifications.filter(n => !n.dismissed)
  const unread = activeNotifications.filter(n => !n.read)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Notifications</h3>
          <p className="text-sm text-muted-foreground">{unread.length} unread notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={unread.length === 0}><CheckCheck className="w-4 h-4 mr-1" />Mark All Read</Button>
          <Button size="sm" onClick={handleGenerate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}Generate AI Alerts</Button>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {activeNotifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4"><Bell className="w-10 h-10 text-muted-foreground" /></div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No notifications</h3>
            <p className="text-sm text-muted-foreground">You're all caught up! New alerts will appear here.</p>
          </div>
        ) : activeNotifications.map(n => {
          const typeInfo = NOTIFICATION_TYPES[n.type as keyof typeof NOTIFICATION_TYPES]
          const TypeIcon = getIcon(typeInfo?.icon || "Info")
          return (
            <Card key={n.id} className={cn("border shadow-sm transition-all", n.read ? "border-border bg-card" : "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", typeInfo?.bg || "bg-sky-100")}>
                    <TypeIcon className={cn("w-5 h-5", typeInfo?.color || "text-sky-600")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-medium text-sm text-foreground">{n.title}</h4>
                      <Badge variant="outline" className="text-[10px]">{typeInfo?.label || n.type}</Badge>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!n.read && <Button size="sm" variant="ghost" onClick={() => handleMarkRead(n.id)}><Eye className="w-4 h-4" /></Button>}
                    <Button size="sm" variant="ghost" onClick={() => handleDismiss(n.id)} className="text-red-400"><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
