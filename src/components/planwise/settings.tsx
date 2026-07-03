"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { STAGES } from "@/lib/constants"
import { updateUser } from "@/lib/api"
import {
  Plus, Building2, CheckCircle2, Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function SettingsView({ onAddBusiness }: { onAddBusiness?: () => void }) {
  const { user, businesses } = useAppStore()
  const [name, setName] = useState(user?.name || "")
  const [company, setCompany] = useState(user?.company || "")
  const [role, setRole] = useState(user?.role || "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
      <Card className="border-border shadow-sm">
        <CardHeader><CardTitle>Profile Settings</CardTitle><CardDescription>Update your personal information</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl">{name.charAt(0) || "E"}</AvatarFallback></Avatar>
            <div><p className="font-semibold text-lg">{name || "Entrepreneur"}</p><p className="text-sm text-muted-foreground">{role} {company ? `at ${company}` : ""}</p></div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Company</label>
            <Input value={company} onChange={e => setCompany(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role</label>
            <Input value={role} onChange={e => setRole(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : saved ? <><CheckCircle2 className="w-4 h-4 mr-2" />Saved!</> : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader><CardTitle>Your Businesses</CardTitle><CardDescription>Manage your business plans</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {businesses.map(b => {
              const stage = STAGES[b.stage as keyof typeof STAGES]
              const completed = b.planSteps?.filter(s => s.status === "completed").length ?? 0
              return (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-sm">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{completed}/{b.planSteps?.length || 10} steps &bull; {stage?.label || b.stage}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", stage?.color, stage?.bg)}>{stage?.label}</Badge>
                </div>
              )
            })}
          </div>
          <Button onClick={onAddBusiness} variant="outline" className="mt-4 w-full border-dashed gap-2">
            <Plus className="w-4 h-4" /> Add Business
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
