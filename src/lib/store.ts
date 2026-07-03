// ============================================================
// PlanWise AI — Zustand Store
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
  aiTips: string
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
  aiGenerated: boolean
  aiSuggestion: string
  businessId: string | null
  planStepId: string | null
}

export interface Notification {
  id: string
  type:
    | 'info'
    | 'warning'
    | 'success'
    | 'urgent'
    | 'ai_suggestion'
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
    | 'settings'
    | 'onboarding'
  setActiveView: (view: AppState['activeView']) => void
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Initialize
  initialize: () => Promise<void>
}

// ── Store ─────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
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
  activeView: 'onboarding',
  setActiveView: (view) => set({ activeView: view }),
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Initialize
  initialize: async () => {
    set({ isLoading: true })
    try {
      // 1. Try to init demo data (creates if not exists, no-ops if exists)
      await initializeDemo()

      // 2. Load all data in parallel
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
      set({ activeView: 'onboarding' })
    } finally {
      set({ isLoading: false })
    }
  },
}))
