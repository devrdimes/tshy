// ============================================================
// PlanWise AI — Typed API Helper
// ============================================================

import type {
  User,
  Business,
  PlanStep,
  Task,
  Notification,
  Milestone,
  Financial,
  ChatMessage,
} from './store'

// ── Generic fetch wrapper ──────────────────────────────────────

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const method = options.method || 'GET'
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Prevent caching for GET requests to ensure fresh data
      cache: method === 'GET' ? 'no-store' : undefined,
      ...options,
    })

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'Unknown error')
      throw new Error(`API ${res.status}: ${res.statusText} — ${errorBody}`)
    }

    const json = await res.json()
    // Unwrap { success, data } format from our API routes
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T
    }
    return json as T
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Network error — please check your connection.')
    }
    throw err
  }
}

// ── User ───────────────────────────────────────────────────────

export async function fetchUser(): Promise<User> {
  return apiRequest<User>('/api/user')
}

export async function updateUser(data: Partial<User>): Promise<User> {
  return apiRequest<User>('/api/user', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ── Business ───────────────────────────────────────────────────

export async function fetchBusinesses(): Promise<Business[]> {
  return apiRequest<Business[]>('/api/business')
}

export async function createBusiness(data: Partial<Business>): Promise<Business> {
  return apiRequest<Business>('/api/business', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchBusiness(id: string): Promise<Business> {
  return apiRequest<Business>(`/api/business/${id}`)
}

export async function updateBusiness(id: string, data: Partial<Business>): Promise<Business> {
  return apiRequest<Business>(`/api/business/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteBusiness(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/business/${id}`, {
    method: 'DELETE',
  })
}

// ── Plan Steps ─────────────────────────────────────────────────

export async function generateBusinessPlan(businessId: string): Promise<PlanStep[]> {
  return apiRequest<PlanStep[]>(`/api/business/${businessId}/generate-plan`, {
    method: 'POST',
  })
}

export async function fetchPlanSteps(businessId: string): Promise<PlanStep[]> {
  return apiRequest<PlanStep[]>(`/api/business/${businessId}/steps`)
}

export async function updatePlanStep(
  businessId: string,
  stepId: string,
  data: Partial<PlanStep>,
): Promise<PlanStep> {
  return apiRequest<PlanStep>(`/api/business/${businessId}/steps`, {
    method: 'PUT',
    body: JSON.stringify({ stepId, ...data }),
  })
}

// ── Financials ─────────────────────────────────────────────────

export async function fetchFinancials(businessId: string): Promise<Financial[]> {
  return apiRequest<Financial[]>(`/api/business/${businessId}/financials`)
}

export async function createFinancial(
  businessId: string,
  data: Partial<Financial>,
): Promise<Financial> {
  return apiRequest<Financial>(`/api/business/${businessId}/financials`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function generateProjections(businessId: string): Promise<Financial[]> {
  return apiRequest<Financial[]>(
    `/api/business/${businessId}/financials?action=generate-projections`,
    { method: 'POST' },
  )
}

// ── Milestones ─────────────────────────────────────────────────

export async function fetchMilestones(businessId: string): Promise<Milestone[]> {
  return apiRequest<Milestone[]>(`/api/business/${businessId}/milestones`)
}

export async function createMilestone(
  businessId: string,
  data: Partial<Milestone>,
): Promise<Milestone> {
  return apiRequest<Milestone>(`/api/business/${businessId}/milestones`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateMilestone(
  businessId: string,
  milestoneId: string,
  data: Partial<Milestone>,
): Promise<Milestone> {
  return apiRequest<Milestone>(`/api/business/${businessId}/milestones`, {
    method: 'PUT',
    body: JSON.stringify({ milestoneId, ...data }),
  })
}

// ── Tasks ──────────────────────────────────────────────────────

export async function fetchTasks(businessId?: string): Promise<{ tasks: Task[]; summary: { pending: number; inProgress: number; completed: number; overdue: number; total: number } }> {
  const url = businessId ? `/api/tasks?businessId=${businessId}` : '/api/tasks'
  return apiRequest(url)
}

export async function createTask(data: Partial<Task>): Promise<Task> {
  return apiRequest<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteTask(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/tasks/${id}`, {
    method: 'DELETE',
  })
}

// ── Notifications ──────────────────────────────────────────────

export async function fetchNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
  return apiRequest<{ notifications: Notification[]; unreadCount: number }>('/api/notifications')
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  return apiRequest<Notification>('/api/notifications', {
    method: 'PUT',
    body: JSON.stringify({ notificationId }),
  })
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/notifications', {
    method: 'PUT',
    body: JSON.stringify({ markAll: true }),
  })
}

export async function dismissNotification(notificationId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/notifications', {
    method: 'DELETE',
    body: JSON.stringify({ notificationId }),
  })
}

export async function generateNotifications(userId: string, businessId: string): Promise<Notification[]> {
  return apiRequest<Notification[]>('/api/notifications/generate', {
    method: 'POST',
    body: JSON.stringify({ userId, businessId }),
  })
}

// ── AI / Chat ─────────────────────────────────────────────────

export async function chatWithAI(
  message: string,
  businessId?: string,
  stepId?: string,
): Promise<{ role: string; content: string; timestamp: string }> {
  return apiRequest('/api/ai', {
    method: 'POST',
    body: JSON.stringify({ message, businessId, stepId }),
  })
}

export async function generateAITasks(
  businessId: string,
  stepId?: string,
): Promise<Task[]> {
  return apiRequest<Task[]>('/api/ai/generate-tasks', {
    method: 'POST',
    body: JSON.stringify({ businessId, stepId }),
  })
}

export async function getBusinessAnalysis(businessId: string): Promise<{
  analysis: {
    overallScore: number
    scores: {
      marketFit: number
      financialHealth: number
      execution: number
      competition: number
      risk: number
    }
    strengths: { title: string; description: string; impact: string }[]
    weaknesses: { title: string; description: string; severity: string }[]
    opportunities: { title: string; description: string; potential: string }[]
    threats: { title: string; description: string; likelihood: string }[]
    recommendations: { title: string; description: string; priority: string; category: string; timeline: string }[]
    quickWins: { title: string; description: string; effort: string }[]
    summary: string
  }
  businessId: string
  generatedAt: string
}> {
  return apiRequest('/api/ai/business-analysis', {
    method: 'POST',
    body: JSON.stringify({ businessId }),
  })
}

// ── Export ────────────────────────────────────────────────────

export function getExportUrl(businessId: string): string {
  return `/api/business/${businessId}/export`
}

export async function exportBusinessPlan(businessId: string): Promise<string> {
  const res = await fetch(getExportUrl(businessId), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to export business plan')
  return res.text()
}

// ── Demo / Init ────────────────────────────────────────────────

export async function initializeDemo(): Promise<{
  message: string
  userId: string
  businessId: string
  summary: Record<string, number>
}> {
  return apiRequest('/api/init', { method: 'POST' })
}
