// ============================================================
// Tashyeed — Zustand Store
// ============================================================

import { create } from 'zustand'
import {
  fetchUser,
  fetchBusinesses,
  fetchBusiness,
  fetchTasks,
  fetchNotifications,
  fetchChatMessages,
  initializeDemo,
} from './api'

// ── Types ─────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  company: string
  role: string
  onboarded: boolean
}

export interface Business {
  id: string
  name: string
  description: string
  industry: string
  stage: string
  targetMarket: string
  revenueModel: string
  initialCapital: number
  monthlyBurnRate: number
  currentStep: number
  totalSteps: number
  completed: boolean
  createdAt: string
  planSteps: PlanStep[]
  milestones: Milestone[]
  financials: Financial[]
  tasks: Task[]
}

export interface PlanStep {
  id: string
  stepNumber: number
  title: string
  description: string
  category: string
  status: 'locked' | 'current' | 'in_progress' | 'completed' | 'skipped'
  guidance: string
  tips: string
  checklist: string // JSON array
  resources: string // JSON array
  estimatedDays: number
  startedAt: string | null
  completedAt: string | null
}

export interface Task {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  dueDate: string | null
  reminderAt: string | null
  systemGenerated: boolean
  suggestion: string
  businessId: string | null
  planStepId: string | null
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  type:
    | 'info'
    | 'warning'
    | 'success'
    | 'urgent'
    | 'advisor_tip'
    | 'step_reminder'
    | 'milestone'
  title: string
  message: string
  actionUrl: string
  read: boolean
  dismissed: boolean
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
}

export interface Milestone {
  id: string
  title: string
  description: string
  targetDate: string | null
  achievedDate: string | null
  status: 'upcoming' | 'in_progress' | 'achieved' | 'missed'
  category: string
  metric: string
  targetValue: number
  currentValue: number
}

export interface Financial {
  id: string
  period: string
  revenue: number
  expenses: number
  profit: number
  customers: number
  burnRate: number
  runway: number
  projection: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  context: string
  createdAt: string
}

// ── App State Interface ───────────────────────────────────────

interface AppState {
  // Auth
  isAuthenticated: boolean
  authToken: string | null
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  checkAuth: () => Promise<boolean>

  // User
  user: User | null
  setUser: (user: User) => void

  // Business
  businesses: Business[]
  currentBusiness: Business | null
  setBusinesses: (businesses: Business[]) => void
  setCurrentBusiness: (business: Business | null) => Promise<void>
  refreshBusiness: () => Promise<void>
  // Plan Steps
  currentStep: PlanStep | null
  setCurrentStep: (step: PlanStep | null) => void

  // Tasks
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  refreshTasks: () => Promise<void>

  // Notifications
  notifications: Notification[]
  setNotifications: (notifications: Notification[]) => void
  unreadCount: number
  setUnreadCount: (count: number) => void

  // Chat
  chatMessages: ChatMessage[]
  setChatMessages: (messages: ChatMessage[]) => void
  addChatMessage: (message: ChatMessage) => void

  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activeView:
    | 'dashboard'
    | 'planner'
    | 'tasks'
    | 'financials'
    | 'milestones'
    | 'notifications'
    | 'analysis'
    | 'idea-validator'
    | 'settings'
    | 'onboarding'
    | 'landing'
  setActiveView: (view: AppState['activeView']) => void
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  language: 'en' | 'ar' | 'fr'
  setLanguage: (lang: 'en' | 'ar' | 'fr') => void

  // Initialize
  initialize: () => Promise<void>
}

// ── Store ─────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  isAuthenticated: false,
  authToken: null,
  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tashyeed_token', token)
    }
    set({ authToken: token, user, isAuthenticated: true })
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tashyeed_token')
    }
    set({
      authToken: null,
      user: null,
      isAuthenticated: false,
      businesses: [],
      currentBusiness: null,
      tasks: [],
      notifications: [],
      chatMessages: [],
      currentStep: null,
      activeView: 'landing',
    })
  },
  checkAuth: async () => {
    if (typeof window === 'undefined') return false
    const token = localStorage.getItem('tashyeed_token')
    if (!token) {
      set({ isAuthenticated: false, activeView: 'landing' })
      return false
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        localStorage.removeItem('tashyeed_token')
        set({ isAuthenticated: false, authToken: null, activeView: 'landing' })
        return false
      }
      const data = await res.json()
      if (data.success && data.user) {
        set({ authToken: token, user: data.user, isAuthenticated: true })
        return true
      }
      localStorage.removeItem('tashyeed_token')
      set({ isAuthenticated: false, authToken: null, activeView: 'landing' })
      return false
    } catch {
      set({ isAuthenticated: false, activeView: 'landing' })
      return false
    }
  },

  // User
  user: null,
  setUser: (user) => set({ user }),

  // Business
  businesses: [],
  currentBusiness: null,
  setBusinesses: (businesses) => {
    set({ businesses })
    // Keep currentBusiness in sync if it still exists
    const current = get().currentBusiness
    if (current) {
      const updated = businesses.find((b) => b.id === current.id) ?? null
      set({ currentBusiness: updated })
    }
  },
  setCurrentBusiness: async (business) => {
    set({ currentBusiness: business })
    // Also set current step based on the business
    if (business && business.planSteps?.length > 0) {
      const activeStep =
        business.planSteps.find(
          (s) => s.status === 'current' || s.status === 'in_progress',
        ) ?? null
      set({ currentStep: activeStep })
    } else {
      set({ currentStep: null })
    }
    // Fetch full business details in background (financials, milestones)
    if (business?.id) {
      try {
        const { fetchBusiness } = await import('./api')
        const fullBiz = await fetchBusiness(business.id)
        // Only update if still the selected business
        if (get().currentBusiness?.id === business.id) {
          set({ currentBusiness: fullBiz })
          if (fullBiz.planSteps?.length > 0) {
            const activeStep =
              fullBiz.planSteps.find(
                (s) => s.status === 'current' || s.status === 'in_progress',
              ) ?? null
            set({ currentStep: activeStep })
          }
        }
      } catch {
        // Silently fail - partial data is fine
      }
    }
  },

  // Plan Steps
  currentStep: null,
  setCurrentStep: (step) => set({ currentStep: step }),

  // Tasks
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  refreshTasks: async () => {
    try {
      const { fetchTasks } = await import('./api')
      const bizId = get().currentBusiness?.id
      const taskData = await fetchTasks(bizId)
      const taskList = Array.isArray(taskData) ? taskData : taskData?.tasks ?? []
      set({ tasks: taskList })
    } catch (e) {
      console.error('Failed to refresh tasks:', e)
    }
  },
  refreshBusiness: async () => {
    const biz = get().currentBusiness
    if (!biz?.id) return
    try {
      const fullBiz = await fetchBusiness(biz.id)
      set({ currentBusiness: fullBiz })
      if (fullBiz.planSteps?.length > 0) {
        const activeStep =
          fullBiz.planSteps.find(
            (s) => s.status === 'current' || s.status === 'in_progress',
          ) ?? null
        set({ currentStep: activeStep })
      }
      // Also refresh businesses list
      const businesses = await fetchBusinesses()
      set({ businesses })
    } catch (e) {
      console.error('Failed to refresh business:', e)
    }
  },

  // Notifications
  notifications: [],
  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.read && !n.dismissed).length
    set({ notifications, unreadCount })
  },
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),

  // Chat
  chatMessages: [],
  setChatMessages: (messages) => set({ chatMessages: messages }),
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),

  // UI State
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeView: 'landing',
  setActiveView: (view) => set({ activeView: view }),
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  language: (typeof window !== 'undefined' ? (localStorage.getItem('tashyeed_lang') as 'en'|'ar'|'fr' || 'en') : 'en'),
  setLanguage: (lang) => {
    if (typeof window !== 'undefined') localStorage.setItem('tashyeed_lang', lang)
    set({ language: lang })
  },

  // Initialize
  initialize: async () => {
    set({ isLoading: true })
    try {
      // 1. Check authentication
      const isAuth = await get().checkAuth()
      if (!isAuth) {
        set({ isLoading: false, activeView: 'landing' })
        return
      }

      // 2. Init demo data (creates if not exists, no-ops if exists)
      await initializeDemo()

      // 3. Load all data in parallel
      const [user, businesses, notifData] = await Promise.all([
        fetchUser(),
        fetchBusinesses(),
        fetchNotifications(),
      ])

      // Load tasks separately
      let tasks: Task[] = []
      try {
        const taskData = await fetchTasks()
        tasks = Array.isArray(taskData) ? taskData : (taskData?.tasks ?? [])
      } catch {
        // Tasks might not exist yet
      }

      // Load chat history
      let chatHistory: ChatMessage[] = []
      try {
        chatHistory = await fetchChatMessages(user.id)
      } catch {
        // Chat history might not exist yet
      }

      const notifications = notifData?.notifications ?? notifData ?? []
      const unreadCount = Array.isArray(notifications)
        ? notifications.filter((n: Notification) => !n.read && !n.dismissed).length
        : 0

      set({
        user,
        businesses,
        tasks,
        chatMessages: chatHistory,
        notifications: Array.isArray(notifications) ? notifications : [],
        unreadCount,
      })

      // Auto-select first business with full details
      if (businesses.length > 0) {
        const firstBizId = businesses[0].id
        try {
          const fullBiz = await fetchBusiness(firstBizId)
          set({ currentBusiness: fullBiz })
          if (fullBiz.planSteps?.length > 0) {
            const activeStep =
              fullBiz.planSteps.find(
                (s: PlanStep) =>
                  s.status === 'current' || s.status === 'in_progress',
              ) ?? null
            set({ currentStep: activeStep })
          }
        } catch {
          // Fallback to list data
          set({ currentBusiness: businesses[0] })
        }
      }

      // Set initial view based on onboarding status
      set({
        activeView: user.onboarded ? 'dashboard' : 'onboarding',
      })
    } catch (error) {
      console.error('Failed to initialize app:', error)
      set({ activeView: 'landing' })
    } finally {
      set({ isLoading: false })
    }
  },
}))
