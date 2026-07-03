// ============================================================
// PlanWise AI — Constants
// ============================================================

// ---- Business Stage --------------------------------------------------------

export const STAGES = {
  idea: {
    label: 'Idea',
    color: 'text-violet-600',
    bg: 'bg-violet-100',
    border: 'border-violet-300',
    dot: 'bg-violet-500',
    description: 'You have a concept — time to shape it.',
  },
  validation: {
    label: 'Validation',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
    description: 'Testing whether your idea solves a real problem.',
  },
  planning: {
    label: 'Planning',
    color: 'text-sky-600',
    bg: 'bg-sky-100',
    border: 'border-sky-300',
    dot: 'bg-sky-500',
    description: 'Building the roadmap and strategy.',
  },
  launch: {
    label: 'Launch',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
    description: 'Going live — your business meets the world.',
  },
  growth: {
    label: 'Growth',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    border: 'border-orange-300',
    dot: 'bg-orange-500',
    description: 'Scaling what works and optimising.',
  },
  scale: {
    label: 'Scale',
    color: 'text-rose-600',
    bg: 'bg-rose-100',
    border: 'border-rose-300',
    dot: 'bg-rose-500',
    description: 'Expanding into new markets and verticals.',
  },
} as const

export type StageKey = keyof typeof STAGES

// ---- Plan Step Category ----------------------------------------------------

export const CATEGORIES = {
  research: {
    label: 'Research',
    icon: 'Search',
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    border: 'border-indigo-300',
  },
  strategy: {
    label: 'Strategy',
    icon: 'Target',
    color: 'text-violet-600',
    bg: 'bg-violet-100',
    border: 'border-violet-300',
  },
  financial: {
    label: 'Financial',
    icon: 'DollarSign',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    border: 'border-emerald-300',
  },
  legal: {
    label: 'Legal',
    icon: 'Scale',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
  },
  product: {
    label: 'Product',
    icon: 'Package',
    color: 'text-sky-600',
    bg: 'bg-sky-100',
    border: 'border-sky-300',
  },
  marketing: {
    label: 'Marketing',
    icon: 'Megaphone',
    color: 'text-pink-600',
    bg: 'bg-pink-100',
    border: 'border-pink-300',
  },
  operations: {
    label: 'Operations',
    icon: 'Settings',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    border: 'border-orange-300',
  },
  team: {
    label: 'Team',
    icon: 'Users',
    color: 'text-teal-600',
    bg: 'bg-teal-100',
    border: 'border-teal-300',
  },
} as const

export type CategoryKey = keyof typeof CATEGORIES

// ---- Task Priority ---------------------------------------------------------

export const PRIORITIES = {
  low: {
    label: 'Low',
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
  },
  high: {
    label: 'High',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    border: 'border-orange-300',
    dot: 'bg-orange-500',
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-600',
    bg: 'bg-red-100',
    border: 'border-red-300',
    dot: 'bg-red-500',
  },
} as const

export type PriorityKey = keyof typeof PRIORITIES

// ---- Notification Type -----------------------------------------------------

export const NOTIFICATION_TYPES = {
  info: {
    label: 'Info',
    icon: 'Info',
    color: 'text-sky-600',
    bg: 'bg-sky-100',
  },
  warning: {
    label: 'Warning',
    icon: 'AlertTriangle',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  success: {
    label: 'Success',
    icon: 'CheckCircle',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
  urgent: {
    label: 'Urgent',
    icon: 'AlertOctagon',
    color: 'text-red-600',
    bg: 'bg-red-100',
  },
  ai_suggestion: {
    label: 'AI Suggestion',
    icon: 'Sparkles',
    color: 'text-violet-600',
    bg: 'bg-violet-100',
  },
  step_reminder: {
    label: 'Step Reminder',
    icon: 'Clock',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
  },
  milestone: {
    label: 'Milestone',
    icon: 'Flag',
    color: 'text-teal-600',
    bg: 'bg-teal-100',
  },
} as const

export type NotificationTypeKey = keyof typeof NOTIFICATION_TYPES

// ---- Task Status -----------------------------------------------------------

export const TASK_STATUSES = {
  pending: {
    label: 'Pending',
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    dot: 'bg-slate-400',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    dot: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-500',
    bg: 'bg-red-100',
    dot: 'bg-red-400',
  },
} as const

export type TaskStatusKey = keyof typeof TASK_STATUSES

// ---- Plan Step Status ------------------------------------------------------

export const STEP_STATUSES = {
  locked: {
    label: 'Locked',
    color: 'text-slate-400',
    bg: 'bg-slate-100',
    dot: 'bg-slate-300',
  },
  current: {
    label: 'Current',
    color: 'text-sky-600',
    bg: 'bg-sky-100',
    dot: 'bg-sky-500',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    dot: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    dot: 'bg-emerald-500',
  },
  skipped: {
    label: 'Skipped',
    color: 'text-slate-400',
    bg: 'bg-slate-50',
    dot: 'bg-slate-300',
  },
} as const

export type StepStatusKey = keyof typeof STEP_STATUSES

// ---- Milestone Status ------------------------------------------------------

export const MILESTONE_STATUSES = {
  upcoming: {
    label: 'Upcoming',
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    dot: 'bg-slate-400',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    dot: 'bg-amber-500',
  },
  achieved: {
    label: 'Achieved',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    dot: 'bg-emerald-500',
  },
  missed: {
    label: 'Missed',
    color: 'text-red-500',
    bg: 'bg-red-100',
    dot: 'bg-red-400',
  },
} as const

export type MilestoneStatusKey = keyof typeof MILESTONE_STATUSES

// ---- Milestone Category ----------------------------------------------------

export const MILESTONE_CATEGORIES = {
  revenue: { label: 'Revenue', icon: 'DollarSign', color: 'text-emerald-600' },
  users: { label: 'Users', icon: 'Users', color: 'text-sky-600' },
  product: { label: 'Product', icon: 'Package', color: 'text-violet-600' },
  team: { label: 'Team', icon: 'UserPlus', color: 'text-teal-600' },
  funding: { label: 'Funding', icon: 'Landmark', color: 'text-orange-600' },
} as const

export type MilestoneCategoryKey = keyof typeof MILESTONE_CATEGORIES

// ---- Industry List (for dropdowns) -----------------------------------------

export const INDUSTRIES = [
  'Technology / SaaS',
  'E-Commerce / Retail',
  'Healthcare / Biotech',
  'FinTech / Financial Services',
  'EdTech / Education',
  'Real Estate / PropTech',
  'Food & Beverage',
  'Manufacturing / Industrial',
  'Media / Entertainment',
  'Travel / Hospitality',
  'Logistics / Supply Chain',
  'Clean Energy / Sustainability',
  'Agriculture / AgTech',
  'Legal / Compliance',
  'Marketing / Advertising',
  'Sports / Fitness',
  'Automotive / Mobility',
  'Construction / Infrastructure',
  'Non-Profit / Social Impact',
  'Other',
] as const

// ---- Revenue Models (for dropdowns) ----------------------------------------

export const REVENUE_MODELS = [
  'Subscription (SaaS)',
  'Freemium + Premium',
  'Marketplace / Commission',
  'Advertising',
  'Licensing / Enterprise',
  'Pay-per-use / Usage-based',
  'Transaction Fees',
  'Consulting / Services',
  'Product Sales (Direct)',
  'Affiliate / Referral',
  'Data / API Access',
  'Hybrid (Multiple)',
] as const

// ---- Target Markets (for dropdowns) ----------------------------------------

export const TARGET_MARKETS = [
  'B2B Enterprise',
  'B2B SMB',
  'B2C Consumers',
  'B2B2C Marketplace',
  'Government / Public Sector',
  'Developers / Technical',
  'Healthcare Professionals',
  'Educators / Students',
  'Creators / Influencers',
  'Small Business Owners',
  'Other',
] as const

// ---- Default App Config ----------------------------------------------------

export const APP_CONFIG = {
  name: 'PlanWise AI',
  tagline: 'Your AI-Powered Business Planning Partner',
  description:
    'PlanWise AI guides entrepreneurs through a structured 10-step business planning process with AI-powered insights, task management, and financial projections.',
  version: '1.0.0',
  totalPlanSteps: 10,
  defaultStepStatus: 'locked' as const,
} as const
