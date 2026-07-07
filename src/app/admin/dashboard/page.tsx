"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield, Users, Building2, BarChart3, TrendingUp, Activity,
  LogOut, Search, Trash2, MoreVertical, ChevronDown, RefreshCw,
  Eye, UserX, CheckCircle2, XCircle, Clock, Loader2, Bell,
  FileText, Zap, Globe, Database, AlertTriangle, Menu, X,
  ArrowUpRight, ArrowDownRight, Minus, Layout, Settings,
  BriefcaseIcon, Target, DollarSign
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts"

// ── Types ─────────────────────────────────────────────────
interface AdminStats {
  totalUsers: number
  totalBusinesses: number
  totalPlanSteps: number
  activeSessions: number
  newUsersToday: number
  newBusinessesToday: number
  pitchDecksGenerated: number
  signupsPerDay: { date: string; count: number }[]
  bizPerDay: { date: string; count: number }[]
  industryBreakdown: { name: string; value: number }[]
}

interface AdminUser {
  id: string
  name: string
  email: string
  company: string
  role: string
  onboarded: boolean
  avatar: string
  created_at: string
  businessCount: number
}

interface AdminBusiness {
  id: string
  name: string
  description: string
  industry: string
  stage: string
  user_id: string
  user: { name: string; email: string; avatar: string } | null
  planSteps: { total: number; completed: number }
  hasPitchDeck: boolean
  created_at: string
}

// ── Colours ───────────────────────────────────────────────
const INDUSTRY_COLORS = [
  "#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444",
  "#ec4899","#6366f1","#14b8a6"
]

type ViewType = "overview" | "users" | "businesses" | "analytics"

// ── Stat Card ─────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, trend, color, delay
}: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; trend?: "up" | "down" | "neutral"; color: string; delay: number
}) {
  const colors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    violet: { bg: "from-violet-500/10 to-violet-600/5", border: "border-violet-500/20", text: "text-violet-400", glow: "shadow-violet-500/10" },
    emerald: { bg: "from-emerald-500/10 to-emerald-600/5", border: "border-emerald-500/20", text: "text-emerald-400", glow: "shadow-emerald-500/10" },
    sky: { bg: "from-sky-500/10 to-sky-600/5", border: "border-sky-500/20", text: "text-sky-400", glow: "shadow-sky-500/10" },
    amber: { bg: "from-amber-500/10 to-amber-600/5", border: "border-amber-500/20", text: "text-amber-400", glow: "shadow-amber-500/10" },
    pink: { bg: "from-pink-500/10 to-pink-600/5", border: "border-pink-500/20", text: "text-pink-400", glow: "shadow-pink-500/10" },
    indigo: { bg: "from-indigo-500/10 to-indigo-600/5", border: "border-indigo-500/20", text: "text-indigo-400", glow: "shadow-indigo-500/10" },
    teal: { bg: "from-teal-500/10 to-teal-600/5", border: "border-teal-500/20", text: "text-teal-400", glow: "shadow-teal-500/10" },
    orange: { bg: "from-orange-500/10 to-orange-600/5", border: "border-orange-500/20", text: "text-orange-400", glow: "shadow-orange-500/10" },
  }
  const c = colors[color] || colors.violet

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-5 shadow-lg ${c.glow} hover:scale-[1.02] transition-all duration-200 group overflow-hidden`}
    >
      <div className="absolute inset-0 bg-slate-900/40 rounded-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.bg} border ${c.border} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trend === "up" ? "bg-emerald-500/10 text-emerald-400" :
              trend === "down" ? "bg-red-500/10 text-red-400" : "bg-slate-700 text-slate-400"
            }`}>
              {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> :
               trend === "down" ? <ArrowDownRight className="w-3 h-3" /> :
               <Minus className="w-3 h-3" />}
              {sub}
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-sm text-slate-400 mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

// ── Main Dashboard ────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ViewType>("overview")
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingBiz, setLoadingBiz] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [bizSearch, setBizSearch] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: "user" | "business"; id: string; name: string } | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

  // Auth check
  useEffect(() => {
    const t = localStorage.getItem("tashyeed_admin_token")
    if (!t) { router.replace("/admin"); return }
    setToken(t)
  }, [router])

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const authHeaders = useCallback((t: string) => ({
    Authorization: `Bearer ${t}`,
    "Content-Type": "application/json",
  }), [])

  // Load stats
  const loadStats = useCallback(async (t: string) => {
    setLoadingStats(true)
    try {
      const res = await fetch("/api/admin/stats", { headers: authHeaders(t) })
      if (!res.ok) { router.replace("/admin"); return }
      const json = await res.json()
      if (json.success) setStats(json.data)
    } catch { showToast("Failed to load stats", "error") }
    setLoadingStats(false)
  }, [authHeaders, router])

  // Load users
  const loadUsers = useCallback(async (t: string) => {
    setLoadingUsers(true)
    try {
      const res = await fetch("/api/admin/users", { headers: authHeaders(t) })
      const json = await res.json()
      if (json.success) setUsers(json.data)
    } catch { showToast("Failed to load users", "error") }
    setLoadingUsers(false)
  }, [authHeaders])

  // Load businesses
  const loadBusinesses = useCallback(async (t: string) => {
    setLoadingBiz(true)
    try {
      const res = await fetch("/api/admin/businesses", { headers: authHeaders(t) })
      const json = await res.json()
      if (json.success) setBusinesses(json.data)
    } catch { showToast("Failed to load businesses", "error") }
    setLoadingBiz(false)
  }, [authHeaders])

  useEffect(() => {
    if (!token) return
    loadStats(token)
    loadUsers(token)
    loadBusinesses(token)
  }, [token, loadStats, loadUsers, loadBusinesses])

  const handleDeleteUser = async (id: string) => {
    if (!token) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers: authHeaders(token) })
      const json = await res.json()
      if (json.success) {
        setUsers(u => u.filter(x => x.id !== id))
        showToast("User deleted successfully", "success")
        loadStats(token)
      } else {
        showToast(json.error || "Delete failed", "error")
      }
    } catch { showToast("Delete failed", "error") }
    setDeletingId(null)
    setConfirmDelete(null)
  }

  const handleDeleteBusiness = async (id: string) => {
    if (!token) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, { method: "DELETE", headers: authHeaders(token) })
      const json = await res.json()
      if (json.success) {
        setBusinesses(b => b.filter(x => x.id !== id))
        showToast("Business deleted successfully", "success")
        loadStats(token)
      } else {
        showToast(json.error || "Delete failed", "error")
      }
    } catch { showToast("Delete failed", "error") }
    setDeletingId(null)
    setConfirmDelete(null)
  }

  const handleLogout = () => {
    localStorage.removeItem("tashyeed_admin_token")
    router.replace("/admin")
  }

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.company?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredBusinesses = businesses.filter(b =>
    b.name?.toLowerCase().includes(bizSearch.toLowerCase()) ||
    b.industry?.toLowerCase().includes(bizSearch.toLowerCase()) ||
    b.user?.name?.toLowerCase().includes(bizSearch.toLowerCase()) ||
    b.user?.email?.toLowerCase().includes(bizSearch.toLowerCase())
  )

  const navItems: { id: ViewType; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: Layout },
    { id: "users", label: "Users", icon: Users, badge: stats?.totalUsers },
    { id: "businesses", label: "Businesses", icon: Building2, badge: stats?.totalBusinesses },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ]

  if (!token) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 flex text-white font-sans">

      {/* ── Sidebar ───────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="relative shrink-0 bg-slate-900/60 backdrop-blur-sm border-r border-slate-800 flex flex-col h-screen sticky top-0 overflow-hidden z-10"
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <p className="font-bold text-white text-sm">Super Admin</p>
              <p className="text-[10px] text-slate-500">Tashyeed Platform</p>
            </motion.div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
                activeView === item.id
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 shrink-0 ${activeView === item.id ? "text-violet-400" : ""}`} />
              {sidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium flex-1 text-left">
                  {item.label}
                </motion.span>
              )}
              {sidebarOpen && item.badge !== undefined && (
                <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Main Content ──────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h2 className="font-bold text-white text-lg capitalize">{activeView}</h2>
              <p className="text-xs text-slate-500">Tashyeed Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => token && (loadStats(token), loadUsers(token), loadBusinesses(token))}
              className="flex items-center gap-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 rounded-lg text-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-violet-300 font-medium">Admin Session Active</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-auto">

          {/* ═══ OVERVIEW ═══════════════════════════ */}
          {activeView === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {loadingStats ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-3" />
                    <p className="text-slate-400">Loading platform stats...</p>
                  </div>
                </div>
              ) : stats ? (
                <>
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Users} label="Total Users" value={stats.totalUsers} sub={`+${stats.newUsersToday} today`} trend="up" color="violet" delay={0} />
                    <StatCard icon={Building2} label="Total Businesses" value={stats.totalBusinesses} sub={`+${stats.newBusinessesToday} today`} trend="up" color="emerald" delay={0.05} />
                    <StatCard icon={Target} label="Plan Steps Generated" value={stats.totalPlanSteps} color="sky" delay={0.1} />
                    <StatCard icon={FileText} label="Pitch Decks Created" value={stats.pitchDecksGenerated} color="amber" delay={0.15} />
                    <StatCard icon={Activity} label="Active Sessions" value={stats.activeSessions} color="pink" delay={0.2} />
                    <StatCard icon={TrendingUp} label="New Users Today" value={stats.newUsersToday} trend={stats.newUsersToday > 0 ? "up" : "neutral"} color="indigo" delay={0.25} />
                    <StatCard icon={Zap} label="New Businesses Today" value={stats.newBusinessesToday} trend={stats.newBusinessesToday > 0 ? "up" : "neutral"} color="teal" delay={0.3} />
                    <StatCard icon={Database} label="Total Plan Steps" value={stats.totalPlanSteps} color="orange" delay={0.35} />
                  </div>

                  {/* Charts row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Signups chart */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                      className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-white">User Signups</h3>
                          <p className="text-xs text-slate-500">Last 14 days</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-violet-400 rounded-full" /> Users</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full" /> Businesses</span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={stats.signupsPerDay.map((d, i) => ({
                          date: d.date.slice(5),
                          users: d.count,
                          businesses: stats.bizPerDay[i]?.count || 0
                        }))}>
                          <defs>
                            <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gBiz" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, color: "#fff", fontSize: 12 }} />
                          <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="url(#gUsers)" strokeWidth={2} dot={false} />
                          <Area type="monotone" dataKey="businesses" stroke="#10b981" fill="url(#gBiz)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Industry breakdown */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                      className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5"
                    >
                      <h3 className="font-semibold text-white mb-1">Top Industries</h3>
                      <p className="text-xs text-slate-500 mb-4">By businesses created</p>
                      {stats.industryBreakdown.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height={140}>
                            <PieChart>
                              <Pie
                                data={stats.industryBreakdown}
                                cx="50%" cy="50%"
                                innerRadius={40} outerRadius={65}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {stats.industryBreakdown.map((_, i) => (
                                  <Cell key={i} fill={INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff", fontSize: 11 }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="space-y-1.5 mt-2">
                            {stats.industryBreakdown.slice(0, 4).map((item, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ background: INDUSTRY_COLORS[i] }} />
                                  <span className="text-xs text-slate-400 truncate max-w-[120px]">{item.name.split('/')[0].trim()}</span>
                                </div>
                                <span className="text-xs font-semibold text-white">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-slate-600 text-sm">No data yet</div>
                      )}
                    </motion.div>
                  </div>

                  {/* Recent users & businesses */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Recent users */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                      className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white">Recent Signups</h3>
                        <button onClick={() => setActiveView("users")} className="text-xs text-violet-400 hover:text-violet-300">View all →</button>
                      </div>
                      <div className="space-y-3">
                        {users.slice(0, 5).map((user) => (
                          <div key={user.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {user.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{user.name}</p>
                              <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                            <span className="text-xs text-slate-600 shrink-0">{new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                        {users.length === 0 && <p className="text-slate-600 text-sm text-center py-4">No users yet</p>}
                      </div>
                    </motion.div>

                    {/* Recent businesses */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                      className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white">Recent Businesses</h3>
                        <button onClick={() => setActiveView("businesses")} className="text-xs text-violet-400 hover:text-violet-300">View all →</button>
                      </div>
                      <div className="space-y-3">
                        {businesses.slice(0, 5).map((biz) => (
                          <div key={biz.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{biz.name}</p>
                              <p className="text-xs text-slate-500 truncate">{biz.user?.name} · {biz.industry?.split('/')[0].trim()}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {biz.hasPitchDeck && <span title="Has Pitch Deck"><FileText className="w-3 h-3 text-amber-400" /></span>}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                biz.stage === 'launch' ? 'bg-emerald-500/10 text-emerald-400' :
                                biz.stage === 'growth' ? 'bg-sky-500/10 text-sky-400' :
                                'bg-slate-700 text-slate-400'
                              }`}>{biz.stage}</span>
                            </div>
                          </div>
                        ))}
                        {businesses.length === 0 && <p className="text-slate-600 text-sm text-center py-4">No businesses yet</p>}
                      </div>
                    </motion.div>
                  </div>
                </>
              ) : null}
            </motion.div>
          )}

          {/* ═══ USERS ═══════════════════════════════ */}
          {activeView === "users" && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">All Users</h3>
                  <p className="text-sm text-slate-500">{users.length} total customers</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 w-64"
                  />
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">User</th>
                      <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Company</th>
                      <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Businesses</th>
                      <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Role</th>
                      <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Joined</th>
                      <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Status</th>
                      <th className="text-right text-xs text-slate-500 font-semibold px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr><td colSpan={7} className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-violet-400 mx-auto" /></td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-slate-500 text-sm">No users found</td></tr>
                    ) : filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {user.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">{user.company || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-white">{user.businessCount}</span>
                          <span className="text-xs text-slate-500 ml-1">biz</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                            user.role === 'admin' ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-700 text-slate-400'
                          }`}>{user.role || "user"}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${user.onboarded ? "bg-emerald-400" : "bg-amber-400"}`} />
                            <span className="text-xs text-slate-400">{user.onboarded ? "Onboarded" : "Pending"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setConfirmDelete({ type: "user", id: user.id, name: user.name })}
                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ═══ BUSINESSES ══════════════════════════ */}
          {activeView === "businesses" && (
            <motion.div key="businesses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">All Businesses</h3>
                  <p className="text-sm text-slate-500">{businesses.length} businesses across all users</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={bizSearch}
                    onChange={e => setBizSearch(e.target.value)}
                    placeholder="Search businesses..."
                    className="bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 w-64"
                  />
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Business</th>
                      <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Owner</th>
                      <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Industry</th>
                      <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Stage</th>
                      <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Progress</th>
                      <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Created</th>
                      <th className="text-right text-xs text-slate-500 font-semibold px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingBiz ? (
                      <tr><td colSpan={7} className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-violet-400 mx-auto" /></td></tr>
                    ) : filteredBusinesses.length === 0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-slate-500 text-sm">No businesses found</td></tr>
                    ) : filteredBusinesses.map((biz) => {
                      const progress = biz.planSteps.total > 0
                        ? Math.round((biz.planSteps.completed / biz.planSteps.total) * 100) : 0
                      return (
                        <tr key={biz.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{biz.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {biz.hasPitchDeck && (
                                    <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-semibold">DECK</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-300">{biz.user?.name || "Unknown"}</p>
                            <p className="text-xs text-slate-500">{biz.user?.email}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 max-w-[120px] truncate">{biz.industry?.split('/')[0].trim() || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                              biz.stage === 'launch' ? 'bg-emerald-500/10 text-emerald-400' :
                              biz.stage === 'growth' ? 'bg-sky-500/10 text-sky-400' :
                              biz.stage === 'scale' ? 'bg-violet-500/10 text-violet-400' :
                              'bg-slate-700 text-slate-400'
                            }`}>{biz.stage}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden w-20">
                                <div
                                  className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 shrink-0">{progress}%</span>
                            </div>
                            <p className="text-[10px] text-slate-600 mt-0.5">{biz.planSteps.completed}/{biz.planSteps.total} steps</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">{new Date(biz.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setConfirmDelete({ type: "business", id: biz.id, name: biz.name })}
                              className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete business"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ═══ ANALYTICS ═══════════════════════════ */}
          {activeView === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Platform Analytics</h3>
                <p className="text-sm text-slate-500">Detailed insights over the last 14 days</p>
              </div>

              {stats ? (
                <>
                  {/* Bar chart - signups per day */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                    <h4 className="font-semibold text-white mb-1">Daily Signups (Last 14 Days)</h4>
                    <p className="text-xs text-slate-500 mb-4">New user registrations per day</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stats.signupsPerDay.map(d => ({ date: d.date.slice(5), count: d.count }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, color: "#fff", fontSize: 12 }} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Signups" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bar chart - businesses per day */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                    <h4 className="font-semibold text-white mb-1">Daily Business Creations (Last 14 Days)</h4>
                    <p className="text-xs text-slate-500 mb-4">New business plans created per day</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stats.bizPerDay.map(d => ({ date: d.date.slice(5), count: d.count }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, color: "#fff", fontSize: 12 }} />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Businesses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Industry breakdown full */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                    <h4 className="font-semibold text-white mb-1">Industry Breakdown</h4>
                    <p className="text-xs text-slate-500 mb-4">Distribution of businesses by industry</p>
                    {stats.industryBreakdown.length > 0 ? (
                      <div className="space-y-3">
                        {stats.industryBreakdown.map((item, i) => {
                          const max = stats.industryBreakdown[0].value
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length] }} />
                              <span className="text-sm text-slate-400 w-48 truncate">{item.name}</span>
                              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${(item.value / max) * 100}%`,
                                    background: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]
                                  }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-white w-6 text-right">{item.value}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-600">No data yet</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
              )}
            </motion.div>
          )}

        </main>
      </div>

      {/* ── Delete Confirmation Modal ─────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Confirm Delete</h3>
                  <p className="text-sm text-slate-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm mb-6">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-white">"{confirmDelete.name}"</span>?
                {confirmDelete.type === "user" && " All their businesses, plan steps, and data will be deleted."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDelete.type === "user"
                    ? handleDeleteUser(confirmDelete.id)
                    : handleDeleteBusiness(confirmDelete.id)
                  }
                  disabled={deletingId === confirmDelete.id}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingId === confirmDelete.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ─────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 ${
              toast.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
