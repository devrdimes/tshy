"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { STAGES } from "@/lib/constants"
import { updateUser } from "@/lib/api"
import {
  Plus, Building2, CheckCircle2, Loader2, User, Mail, Briefcase, Shield, Trash2, Palette, Bell as BellIcon, Globe, LogOut
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export function SettingsView({ onAddBusiness, onSignOut }: { onAddBusiness?: () => void; onSignOut?: () => void }) {
  const { user, businesses } = useAppStore()
  const [name, setName] = useState(user?.name || "")
  const [company, setCompany] = useState(user?.company || "")
  const [role, setRole] = useState(user?.role || "")
  const [email, setEmail] = useState(user?.email || "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Settings state (decorative/local)
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateUser({ name, company, role, onboarded: true })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Card */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-emerald-600" />Profile Settings</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20 ring-4 ring-emerald-100 dark:ring-emerald-900">
              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-2xl font-bold">{name.charAt(0) || "E"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-xl text-foreground">{name || "Entrepreneur"}</p>
              <p className="text-sm text-muted-foreground">{role} {company ? `at ${company}` : ""}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-muted-foreground" />Full Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} className="focus:ring-emerald-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />Email</label>
              <Input value={email} onChange={e => setEmail(e.target.value)} className="focus:ring-emerald-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-muted-foreground" />Company</label>
              <Input value={company} onChange={e => setCompany(e.target.value)} className="focus:ring-emerald-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-muted-foreground" />Role</label>
              <Input value={role} onChange={e => setRole(e.target.value)} className="focus:ring-emerald-500" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : saved ? <><CheckCircle2 className="w-4 h-4 mr-2" />Saved!</> : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BellIcon className="w-5 h-5 text-emerald-600" />Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
            </div>
            <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <BellIcon className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Browser push notifications</p>
              </div>
            </div>
            <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Weekly Digest</Label>
                <p className="text-xs text-muted-foreground">AI-generated weekly progress summary</p>
              </div>
            </div>
            <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
          </div>
        </CardContent>
      </Card>

      {/* Businesses */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-emerald-600" />Your Businesses</CardTitle>
          <CardDescription>Manage your business plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {businesses.map(b => {
              const stage = STAGES[b.stage as keyof typeof STAGES]
              const completed = b.planSteps?.filter(s => s.status === "completed").length ?? 0
              const total = b.planSteps?.length || 10
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0
              return (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">{b.name.charAt(0)}</div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{completed}/{total} steps • {progress}% complete</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", stage?.color, stage?.bg)}>{stage?.label}</Badge>
                </div>
              )
            })}
          </div>
          <Button onClick={onAddBusiness} variant="outline" className="mt-4 w-full border-dashed gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 dark:hover:border-emerald-800 transition-colors">
            <Plus className="w-4 h-4" /> Add Business
          </Button>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-600" />Keyboard Shortcuts</CardTitle>
          <CardDescription>Navigate faster with keyboard shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { keys: "Alt + 1-8", desc: "Navigate views" },
              { keys: "Alt + C", desc: "Toggle Advisor Chat" },
              { keys: "Alt + D", desc: "Toggle dark mode" },
              { keys: "Esc", desc: "Close dialogs" },
            ].map(shortcut => (
              <div key={shortcut.keys} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <kbd className="px-2 py-1 rounded bg-background border border-border text-xs font-mono">{shortcut.keys}</kbd>
                <span className="text-xs text-muted-foreground">{shortcut.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LogOut className="w-5 h-5 text-red-500" />Account</CardTitle>
          <CardDescription>Manage your account and session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Sign Out</p>
              <p className="text-xs text-muted-foreground">Sign out of your Tashyeed account</p>
            </div>
            <Button variant="outline" onClick={onSignOut} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:hover:bg-red-950/30 dark:border-red-800">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
